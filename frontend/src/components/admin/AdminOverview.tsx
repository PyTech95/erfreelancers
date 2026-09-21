import React, { useEffect, useState } from 'react';
import { InquiryChart } from './InquiryChart';
import { ArrowUpRight, Inbox, Users, FileText, Mail, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { adminRequest } from './adminApi';

export const AdminOverview = ({ onNavigate }: { onNavigate: (id: string) => void }) => {
  const [data, setData] = useState<any>(null); const [days, setDays] = useState('30'); const [error, setError] = useState('');
  const load = () => { setError(''); adminRequest(`/api/admin/overview?days=${days}`).then(setData).catch(e => setError(e.message)); };
  useEffect(load, [days]);
  const metrics = [
    { key: 'inquiries', label: 'Total inquiries', Icon: Inbox, color: 'text-indigo-600', tab: 'leads' },
    { key: 'freelancers', label: 'Approved freelancers', Icon: Users, color: 'text-emerald-600', tab: 'freelancers' },
    { key: 'publishedPosts', label: 'Published posts', Icon: FileText, color: 'text-amber-600', tab: 'blog' },
    { key: 'confirmationsSent', label: 'Confirmations sent', Icon: Mail, color: 'text-sky-600', tab: 'leads' },
  ];
  return <section data-testid="admin-overview-panel" className="space-y-8">
    {error && <p data-testid="overview-error" role="alert" className="text-sm text-rose-700">{error}<Button data-testid="overview-retry" variant="ghost" onClick={load}><RefreshCw size={15} />Retry</Button></p>}
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{metrics.map(({ key, label, Icon, color, tab }) => <button data-testid={`overview-metric-${key}`} key={key} onClick={() => onNavigate(tab)} className="group rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-400 sm:p-5"><div className="flex justify-between"><Icon size={20} className={color} /><ArrowUpRight size={15} className="text-slate-400" /></div><p className="mt-5 font-display text-3xl font-semibold">{data ? data.metrics[key].toLocaleString() : '—'}</p><p className="mt-1 text-xs text-slate-500">{label}</p></button>)}</div>
    <div className="border-y border-slate-200 py-7"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-semibold">Inquiry activity</h2><p className="mt-1 text-xs text-slate-500">Daily submissions · UTC</p></div><select data-testid="overview-date-range" aria-label="Inquiry chart date range" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={days} onChange={e => setDays(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div>
      <div data-testid="overview-chart-container" className="h-64 w-full min-w-0 sm:h-72" role="img" aria-label={`Inquiry submissions over the last ${days} days`}>
        {data && <InquiryChart data={data.trend} />}
      </div>
    </div>
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <div><div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Recent inquiries</h2><Button data-testid="overview-view-inquiries" variant="ghost" onClick={() => onNavigate('leads')}>View all<ArrowUpRight size={15} /></Button></div><div className="divide-y divide-slate-200">{data?.recentLeads.map((lead: any) => <button key={lead.id} data-testid={`overview-recent-${lead.id}`} onClick={() => onNavigate('leads')} className="flex w-full items-center justify-between gap-3 py-4 text-left"><div><p className="text-sm font-semibold">{lead.clientName}</p><p className="mt-1 text-xs text-slate-500">{new Date(lead.createdAt).toLocaleDateString()} · {lead.serviceId}</p></div><span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{lead.status.replace('_', ' ')}</span></button>)}{data?.recentLeads.length === 0 && <p data-testid="overview-empty" className="py-8 text-sm text-slate-500">No inquiries yet.</p>}</div></div>
      <div><h2 className="mb-6 font-display text-lg font-semibold">Inquiry status</h2><div className="space-y-5">{data?.statuses.map((item: any) => <div key={item.status} data-testid={`overview-status-${item.status}`}><div className="mb-2 flex justify-between text-xs"><span className="capitalize text-slate-600">{item.status.replace('_', ' ')}</span><strong>{item.count}</strong></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.count / Math.max(data.metrics.inquiries, 1) * 100}%` }} /></div></div>)}</div>{data?.metrics.emailAttention > 0 && <button data-testid="overview-email-attention" onClick={() => onNavigate('leads')} className="mt-8 flex w-full items-center gap-3 rounded-lg bg-amber-50 p-4 text-left text-xs text-amber-900"><Mail size={18} />{data.metrics.emailAttention} emails awaiting setup or retry<ArrowUpRight className="shrink-0" size={15} /></button>}</div>
    </div>
  </section>;
};