"""Gmail SMTP delivery with a MongoDB outbox and restart-safe reconciliation."""
import asyncio
import logging
import os
import smtplib
import ssl
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from cryptography.fernet import Fernet
from email_validator import validate_email, EmailNotValidError
from pymongo import ReturnDocument

from store import db, NO_ID, now_iso, SERVICES_BY_ID

logger = logging.getLogger(__name__)
cipher = Fernet(os.environ['SMTP_ENCRYPTION_KEY'].encode())
SMTP_HOST = os.environ['SMTP_HOST']
SMTP_PORT = int(os.environ['SMTP_PORT'])


def valid_email(value):
    try:
        return validate_email(value or '', check_deliverability=False).normalized
    except EmailNotValidError:
        return None


def safe_error(exc):
    if isinstance(exc, smtplib.SMTPAuthenticationError):
        return 'Gmail rejected the credentials. Check the Gmail address and Google App Password.'
    if isinstance(exc, smtplib.SMTPRecipientsRefused):
        return 'The receiving address was rejected by Gmail.'
    if isinstance(exc, (TimeoutError, OSError)):
        return 'Could not reach Gmail. Delivery will be retried.'
    return 'Email could not be sent. Check the saved Gmail settings and try again.'


def send_sync(config, row, timeout=20):
    message = EmailMessage()
    message['From'] = f"{config['senderName']} <{config['gmailAddress']}>"
    message['To'] = row['recipient']
    message['Subject'] = row['subject']
    message['Reply-To'] = row.get('replyTo') or config['gmailAddress']
    message['Message-ID'] = f"<{row['id']}@{config['gmailAddress'].split('@')[1]}>"
    message.set_content(row['body'])
    password = cipher.decrypt(config['passwordCiphertext'].encode()).decode()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ssl.create_default_context(), timeout=timeout) as smtp:
        smtp.login(config['gmailAddress'], password)
        smtp.send_message(message)


async def enqueue_lead_emails(lead):
    config = await db.integration_settings.find_one({'id': 'gmail'}, NO_ID) or {}
    email = valid_email(lead.get('contactValue'))
    service = SERVICES_BY_ID.get(lead.get('serviceId'), {}).get('title', lead.get('serviceId', 'Project'))
    admin_body = (f"New inquiry — ER Freelancer\n\nReference: {lead['id']}\n"
                  f"Name: {lead.get('clientName', '')}\nContact: {lead.get('contactValue', '')}\n"
                  f"Service: {service}\nLocation: {lead.get('locationName', '')}\n"
                  f"Budget: {lead.get('budgetRange', '')}\nTimeline: {lead.get('timeline') or 'Flexible'}\n\n"
                  f"{lead.get('projectDescription', '')}")
    confirmation = (f"Hi {lead.get('clientName') or 'there'},\n\n"
                    "Thank you for contacting ER Freelancer. We have received your project inquiry "
                    "and our team will be in touch soon.\n\n"
                    f"Reference: {lead['id']}\nService: {service}\n\n"
                    "If you have anything to add, just reply to this email.\n\nER Freelancer")
    now = now_iso()
    for kind, recipient, subject, body in [
        ('admin_notification', config.get('notificationEmail') or config.get('gmailAddress', ''),
         f"New project inquiry · {lead['id']}", admin_body),
        ('confirmation', email or '', 'Thank you for your inquiry — ER Freelancer', confirmation),
    ]:
        row = {'id': f"email-{lead['id']}-{kind}", 'leadId': lead['id'], 'kind': kind,
               'recipient': recipient, 'subject': subject, 'body': body, 'channel': 'email',
               'status': 'pending_setup', 'attempts': 0, 'createdAt': now, 'nextAttemptAt': now,
               'replyTo': email if kind == 'admin_notification' else None, 'lastError': None}
        if kind == 'confirmation' and not email:
            row.update(status='skipped', lastError='No email address supplied; inquiry used phone or WhatsApp.')
        await db.outbox.update_one({'id': row['id']}, {'$setOnInsert': row}, upsert=True)
    await db.leads.update_one({'id': lead['id']}, {'$set': {'emailQueued': True}})


async def init_email():
    await db.outbox.create_index('id', unique=True)
    await db.outbox.create_index([('status', 1), ('nextAttemptAt', 1)])
    # Historical preview messages were never sent; do not deliver them retroactively.
    await db.outbox.update_many({'kind': {'$exists': False}, 'status': 'delivered'},
        {'$set': {'status': 'simulated', 'attempts': 0}, '$unset': {'deliveredAt': ''}})


async def process_outbox():
    # The inquiry's emailQueued flag is the durable intent on standalone MongoDB.
    # A crash between saving the inquiry and creating either message is recoverable.
    async for lead in db.leads.find({'emailQueued': False}, NO_ID).limit(50):
        await enqueue_lead_emails(lead)
    config = await db.integration_settings.find_one({'id': 'gmail'}, NO_ID)
    if not config or not config.get('enabled') or not config.get('passwordCiphertext'):
        return
    now = now_iso()
    await db.outbox.update_many({'status': 'sending', 'leaseUntil': {'$lt': now}},
                               {'$set': {'status': 'pending', 'nextAttemptAt': now}})
    lease = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    for _ in range(10):
        row = await db.outbox.find_one_and_update(
            {'kind': {'$in': ['admin_notification', 'confirmation']},
             'status': {'$in': ['pending', 'pending_setup']}, 'nextAttemptAt': {'$lte': now}},
            {'$set': {'status': 'sending', 'leaseUntil': lease}, '$inc': {'attempts': 1}},
            projection=NO_ID, sort=[('createdAt', 1)], return_document=ReturnDocument.AFTER)
        if not row:
            break
        if row['kind'] == 'admin_notification':
            row['recipient'] = config.get('notificationEmail') or config['gmailAddress']
        try:
            await asyncio.to_thread(send_sync, config, row)
            update = {'status': 'sent', 'sentAt': now_iso(), 'lastError': None, 'recipient': row['recipient']}
        except Exception as exc:
            logger.warning('Email delivery failed: %s (%s)', row['id'], type(exc).__name__)
            update = {'status': 'failed' if row['attempts'] >= 3 else 'pending', 'lastError': safe_error(exc),
                      'nextAttemptAt': (datetime.now(timezone.utc) + timedelta(seconds=30 * 2 ** min(row['attempts'], 6))).isoformat()}
        await db.outbox.update_one({'id': row['id'], 'status': 'sending'}, {'$set': update, '$unset': {'leaseUntil': ''}})


async def email_worker():
    while True:
        try:
            await process_outbox()
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.warning('Email worker will retry (%s)', type(exc).__name__)
        await asyncio.sleep(5)