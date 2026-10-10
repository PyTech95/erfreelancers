from datetime import datetime, timedelta, timezone
import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from pydantic import BaseModel

from auth import get_current_admin
from store import db, NO_ID, now_iso

router = APIRouter(prefix='/api/admin', dependencies=[Depends(get_current_admin)])


class OverviewResponse(BaseModel):
    metrics: dict[str, int]
    trend: list[dict]
    statuses: list[dict]
    recentLeads: list[dict]
    generatedAt: str


@router.get('/overview', response_model=OverviewResponse)
async def overview(days: int = Query(30, ge=7, le=90)):
    today = datetime.now(timezone.utc).date()
    start = (today - timedelta(days=days - 1)).isoformat()
    grouped = await db.leads.aggregate([
        {'$match': {'createdAt': {'$gte': start}}},
        {'$group': {'_id': {'$substrBytes': ['$createdAt', 0, 10]}, 'count': {'$sum': 1}}},
        {'$project': {'_id': 0, 'date': '$_id', 'count': 1}},
    ]).to_list(100)
    counts = {item['date']: item['count'] for item in grouped}
    statuses = await db.leads.aggregate([
        {'$group': {'_id': '$status', 'count': {'$sum': 1}}},
        {'$project': {'_id': 0, 'status': '$_id', 'count': 1}}, {'$sort': {'count': -1}},
    ]).to_list(100)
    metrics = {
        'inquiries': await db.leads.count_documents({}),
        'newInquiries': await db.leads.count_documents({'status': 'new'}),
        'freelancers': await db.freelancers.count_documents({'profileState': 'approved'}),
        'publishedPosts': await db.blog_posts.count_documents({'status': 'published'}),
        'confirmationsSent': await db.outbox.count_documents({'kind': 'confirmation', 'status': 'sent'}),
        'emailAttention': await db.outbox.count_documents({'kind': {'$exists': True}, 'status': {'$in': ['failed', 'pending_setup']}}),
    }
    trend = [{'date': (today - timedelta(days=i)).isoformat(),
              'inquiries': counts.get((today - timedelta(days=i)).isoformat(), 0)} for i in reversed(range(days))]
    recent = await db.leads.find({}, {'_id': 0, 'id': 1, 'clientName': 1, 'serviceId': 1, 'status': 1, 'createdAt': 1}).sort('createdAt', -1).limit(5).to_list(5)
    return OverviewResponse(metrics=metrics, trend=trend, statuses=statuses, recentLeads=recent, generatedAt=now_iso())


@router.get('/reports/inquiries.csv')
async def export_inquiries():
    output = io.StringIO()
    fields = ['id', 'createdAt', 'clientName', 'contactValue', 'serviceId', 'locationName', 'budgetRange', 'status', 'projectDescription']
    writer = csv.writer(output)
    writer.writerow(fields)
    async for lead in db.leads.find({}, NO_ID).sort('createdAt', -1).limit(10000):
        values = []
        for field in fields:
            value = str(lead.get(field) or '')
            # Prevent spreadsheet formula execution in user-provided fields.
            if value.lstrip().startswith(('=', '+', '-', '@')) or value.startswith(('\t', '\r', '\n')):
                value = "'" + value
            values.append(value)
        writer.writerow(values)
    return Response(output.getvalue(), media_type='text/csv', headers={'Content-Disposition': 'attachment; filename="inquiries.csv"'})