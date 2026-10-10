import React, { useEffect, useState } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { apiFetch } from '../../api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminRequest } from './adminApi';
import { EmailOutbox, mailLabel } from './EmailOutbox';

const statuses = ['new', 'assigned', 'contacted', 'proposal_sent', 'won', 'archived'];
export const AdminLeads = () => {
  const [data, setData] = useState<any>(null); const [freelancers, setFreelancers] = useState<any[]>([]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState('');
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all'); const [page, setPage] = useState(1);
  const load = async () => { setError(''); try { setData(await adminRequest('/api/leads')); } catch (e: any) { setError(e.message); } };
  useEffect(() => { load(); adminRequest('/api/admin/freelancers').then(d => setFreelancers(d.freelancers)).catch(() => undefined); }, []);
  const update = async (id: string, path: string, method: string, body: any) => { setBusy(id); setError(''); try { await adminRequest(path, method, body); await load(); } catch (e: any) { setError(e.message); } finally { setBusy(''); } };
  const exportCsv = async () => {
    setError(''); try { const response = await apiFetch('/api/admin/reports/inquiries.csv'); if (!response.ok) throw new Error('Export could not be downloaded.'); const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'inquiries.csv'; anchor.click(); URL.revokeObjectURL(url); } catch (e: any) { setError(e.message); }
  };
  const filtered = (data?.leads || []).filter((lead: any) => (filter === 'all' || lead.status === filter) && `${lead.clientName} ${lead.contactValue} ${lead.projectDescription} ${lead.locationName}`.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const activePage = Math.min(page, pages);
  return <section data-testid="admin-leads-panel" className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 data-testid="admin-lead-count" className="font-display text-lg font-semibold">Project inquiries ({data?.leads.length ?? '—'})</h2><div className="flex flex-wrap gap-2"><Button data-testid="admin-export-inquiries" variant="outline" onClick={exportCsv}><Download size={15} />Export CSV</Button><Button data-testid="admin-refresh-leads" variant="outline" onClick={load}><RefreshCw size={15} />Refresh</Button></div></div>
    <div className="flex flex-wrap gap-3"><Input data-testid="inquiries-search-input" aria-label="Search inquiries" placeholder="Search name, contact or project…" className="max-w-md" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /><select data-testid="inquiries-status-filter" aria-label="Filter inquiry status" className="rounded-md border border-slate-200 bg-white p-2 text-sm" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}><option value="all">All statuses</option>{statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
    {error && <p data-testid="admin-leads-error" role="alert" className="text-sm text-rose-700">{error}</p>}
    {data && !filtered.length && <p data-testid="admin-leads-empty" className="border-y border-slate-200 py-12 text-sm text-slate-500">{data.leads.length ? 'No matching inquiries.' : 'No inquiries yet.'}</p>}
    <div className="grid gap-4 xl:grid-cols-2">{filtered.slice((activePage - 1) * 12, activePage * 12).map((lead: any) => <article key={lead.id} data-testid={`admin-lead-${lead.id}`} className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 data-testid={`admin-lead-name-${lead.id}`} className="font-semibold">{lead.clientName}</h3><p data-testid={`admin-lead-contact-${lead.id}`} className="mt-1 break-all text-sm text-slate-600">{lead.contactValue}</p></div><span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{lead.leadSource === 'chatbot' ? 'Chatbot' : 'Web form'}</span></div>
      <p className="mt-3 text-sm text-slate-600">{lead.locationName} · {lead.serviceId}</p><p data-testid={`admin-lead-budget-${lead.id}`} className="mt-2 text-sm font-semibold text-emerald-700">{lead.budgetRange || 'Open budget'}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">{new Date(lead.createdAt).toLocaleString()}</span><select data-testid={`admin-lead-status-${lead.id}`} aria-label={`Status for ${lead.clientName}`} value={lead.status} disabled={busy === lead.id} onChange={e => update(lead.id, `/api/leads/${lead.id}/status`, 'PATCH', { status: e.target.value })} className="rounded-md border border-slate-200 bg-white p-2 text-xs">{statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
      <div data-testid={`admin-lead-delivery-${lead.id}`} className="mt-4 space-y-1 border-t border-slate-100 pt-3">{data.outbox.filter((m: any) => m.leadId === lead.id && m.kind).map((m: any) => <p key={m.id} data-testid={`lead-email-${m.id}`} className="text-xs text-slate-500">{m.kind === 'confirmation' ? 'Thank-you email' : 'Admin email'}: {mailLabel(m.status)}</p>)}</div>
      <details className="mt-3"><summary data-testid={`admin-lead-details-${lead.id}`} className="cursor-pointer text-sm font-semibold text-indigo-700">Scope & conversation</summary><p data-testid={`admin-lead-scope-${lead.id}`} className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{lead.projectDescription}</p><p className="mt-2 text-xs text-slate-500">Reference: {lead.id} · {lead.timeline}</p>
        <label className="mt-4 block text-xs font-medium text-slate-600">Assign specialist<select data-testid={`admin-lead-assignment-${lead.id}`} value={lead.assignedFreelancerId || ''} disabled={busy === lead.id} onChange={e => update(lead.id, `/api/leads/${lead.id}/assign`, 'POST', { freelancerId: e.target.value })} className="mt-2 w-full rounded-md border border-slate-200 bg-white p-2"><option value="" disabled>Choose a specialist</option>{freelancers.filter(f => f.profileState === 'approved' || f.id === lead.assignedFreelancerId).map(f => <option key={f.id} value={f.id}>{f.displayName}</option>)}</select></label>
        {lead.chatTranscript?.map((m: any, i: number) => <div key={i} data-testid={`admin-transcript-${lead.id}-${i}`} className="mt-3 border-l-2 border-slate-200 pl-3 text-sm"><strong>{m.sender === 'user' ? 'Client' : 'Assistant'}</strong><p className="mt-1 whitespace-pre-wrap">{m.text}</p></div>)}
      </details>
    </article>)}</div>
    {pages > 1 && <div className="flex items-center justify-center gap-4"><Button data-testid="inquiries-previous" variant="outline" size="icon" aria-label="Previous inquiries" disabled={activePage === 1} onClick={() => setPage(activePage - 1)}><ChevronLeft size={16} /></Button><span data-testid="inquiries-pagination" className="text-xs text-slate-500">{activePage} / {pages}</span><Button data-testid="inquiries-next" variant="outline" size="icon" aria-label="Next inquiries" disabled={activePage === pages} onClick={() => setPage(activePage + 1)}><ChevronRight size={16} /></Button></div>}
    <EmailOutbox items={data?.outbox || []} onRefresh={load} />
  </section>;
};