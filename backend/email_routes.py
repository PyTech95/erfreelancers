import asyncio
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr

from auth import get_current_admin
from email_service import cipher, send_sync, safe_error
from rate_limit import limiter
from store import db, NO_ID, now_iso, rand_id

router = APIRouter(prefix='/api/admin/email', dependencies=[Depends(get_current_admin)])


class EmailSettingsBody(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    gmailAddress: EmailStr
    notificationEmail: Optional[EmailStr] = None
    senderName: str = Field(default='ER Freelancer', min_length=1, max_length=80, pattern=r'^[^\r\n<>]+$')
    appPassword: Optional[SecretStr] = None
    enabled: bool = True


class EmailSettingsResponse(BaseModel):
    gmailAddress: str = ''
    notificationEmail: str = ''
    senderName: str = 'ER Freelancer'
    enabled: bool = False
    passwordSet: bool = False
    lastTestAt: Optional[str] = None
    lastTestSuccess: Optional[bool] = None


class EmailActionResponse(BaseModel):
    success: bool
    message: str


def public(config):
    config = config or {}
    return EmailSettingsResponse(**{k: config[k] for k in EmailSettingsResponse.model_fields if k in config},
                                 passwordSet=bool(config.get('passwordCiphertext')))


@router.get('/settings', response_model=EmailSettingsResponse)
async def get_settings():
    return public(await db.integration_settings.find_one({'id': 'gmail'}, NO_ID))


@router.put('/settings', response_model=EmailSettingsResponse)
async def save_settings(body: EmailSettingsBody):
    old = await db.integration_settings.find_one({'id': 'gmail'}, NO_ID) or {}
    password = re.sub(r'\s+', '', body.appPassword.get_secret_value()) if body.appPassword else ''
    if password and not re.fullmatch(r'[a-zA-Z]{16}', password):
        raise HTTPException(400, 'Enter the 16-letter Google App Password, not your Google account password.')
    if not password and (not old.get('passwordCiphertext') or old.get('gmailAddress') != str(body.gmailAddress)):
        raise HTTPException(400, 'A Google App Password is required for this Gmail address.')
    update = body.model_dump(exclude={'appPassword'})
    update['notificationEmail'] = str(body.notificationEmail) if body.notificationEmail else ''
    if password:
        update['passwordCiphertext'] = cipher.encrypt(password.encode()).decode()
        update.update(lastTestAt=None, lastTestSuccess=None)
    update['updatedAt'] = now_iso()
    await db.integration_settings.update_one({'id': 'gmail'}, {'$set': update}, upsert=True)
    return public(await db.integration_settings.find_one({'id': 'gmail'}, NO_ID))


@router.post('/test', response_model=EmailActionResponse)
@limiter.limit('3/minute')
async def test_email(request: Request):
    config = await db.integration_settings.find_one({'id': 'gmail'}, NO_ID)
    if not config or not config.get('passwordCiphertext'):
        raise HTTPException(400, 'Save your Gmail settings first.')
    row = {'id': rand_id('smtp-test'), 'recipient': config.get('notificationEmail') or config['gmailAddress'],
           'subject': 'ER Freelancer — Gmail connection test',
           'body': 'Your ER Freelancer Gmail connection is working. Inquiry notifications will be sent to this address.'}
    try:
        await asyncio.wait_for(asyncio.to_thread(send_sync, config, row, 5), timeout=18)
    except Exception as exc:
        await db.integration_settings.update_one({'id': 'gmail'}, {'$set': {'lastTestAt': now_iso(), 'lastTestSuccess': False}})
        detail = 'The Gmail test timed out. Delivery could not be confirmed; check the inbox before testing again.' if isinstance(exc, TimeoutError) else safe_error(exc)
        raise HTTPException(502, detail) from None
    await db.integration_settings.update_one({'id': 'gmail'}, {'$set': {'lastTestAt': now_iso(), 'lastTestSuccess': True}})
    return EmailActionResponse(success=True, message=f"Test email accepted by Gmail for {row['recipient']}. Check your inbox and spam folder.")


@router.post('/outbox/{mail_id}/retry', response_model=EmailActionResponse)
async def retry_email(mail_id: str):
    config = await db.integration_settings.find_one({'id': 'gmail'}, NO_ID) or {}
    if not config.get('enabled') or not config.get('passwordCiphertext'):
        raise HTTPException(400, 'Configure and enable Gmail delivery in Settings first.')
    result = await db.outbox.update_one({'id': mail_id, 'status': {'$in': ['failed', 'pending_setup', 'pending']}},
        {'$set': {'status': 'pending', 'attempts': 0, 'nextAttemptAt': now_iso(), 'lastError': None}})
    if not result.matched_count:
        raise HTTPException(409, 'Only unsent, retryable email messages can be queued again.')
    return EmailActionResponse(success=True, message='Email queued for delivery.')