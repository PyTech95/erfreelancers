import React, { useEffect, useState } from 'react';
import { Save, RefreshCw, BellOff, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const WhatsAppAlerts = () => {
  const [settings, setSettings] = useState<any>(null);
  const [queue, setQueue] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setError('');
    try {
      const [a, b] = await Promise.all([apiFetch('/api/admin/whatsapp/settings'), apiFetch(`/api/admin/whatsapp/queue?page=${page}`)]);
      if (!a.ok || !b.ok) throw new Error();
      setSettings(await a.json()); setQueue(await b.json());
    } catch { setError('Could not load WhatsApp settings and queue. Please retry.'); }
  };
  useEffect(() => { load(); }, [page]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setFeedback('');
    try {
      const { recipient, templateName, templateLanguage } = settings;
      const res = await apiFetch('/api/admin/whatsapp/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient, templateName, templateLanguage, deliveryEnabled: false }) });
      if (!res.ok) throw new Error('Check recipient (+country code), lowercase template name and language code.');
      setSettings(await res.json()); setFeedback('Draft saved. Automatic WhatsApp delivery is still disabled.');
    } catch (e: any) { setError(e.message || 'Could not save settings.'); }
    finally { setBusy(false); }
  };
  const dismiss = async (id: string) => {
    setBusy(true); setError('');
    try { const res = await apiFetch(`/api/admin/whatsapp/queue/${encodeURIComponent(id)}/dismiss`, { method: 'POST' }); if (!res.ok) throw new Error(); await load(); }
    catch { setError('Could not dismiss alert. Please retry.'); }
    finally { setBusy(false); }
  };
  return <section data-testid="whatsapp-alerts-panel" className="space-y-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-display text-lg font-bold">WhatsApp lead alerts</h2><p className="mt-2 text-sm text-slate-600">New briefs are stored in your alert queue, including chatbot enquiries.</p></div><span data-testid="whatsapp-delivery-status" className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"><BellOff size={16} />Delivery disabled</span></div>
    <p data-testid="whatsapp-setup-notice" className="text-sm text-slate-600">No WhatsApp messages are being sent. Provider credentials, an approved template and explicit activation are still required. Queued alerts will not be sent automatically when settings change.</p>
    {error && <p data-testid="whatsapp-error" role="alert" className="text-sm text-rose-700">{error}</p>}
    {feedback && <p data-testid="whatsapp-feedback" role="status" className="text-sm text-emerald-700">{feedback}</p>}
    {!settings ? <Button data-testid="whatsapp-retry-load" variant="outline" onClick={load}>Load settings</Button> : <form data-testid="whatsapp-settings-form" onSubmit={save} className="grid gap-4 border-y border-slate-200 py-6 sm:grid-cols-2 lg:grid-cols-3">
      {[['recipient', 'Your WhatsApp number', '+919876543210'], ['templateName', 'Future approved template name', 'new_project_brief'], ['templateLanguage', 'Template language code', 'en_US']].map(([key, label, placeholder]) => <div key={key}><label htmlFor={`wa-${key}`} className="mb-2 block text-sm font-medium">{label}</label><Input data-testid={`whatsapp-${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}-input`} id={`wa-${key}`} type={key === 'recipient' ? 'tel' : 'text'} value={settings[key]} placeholder={placeholder} onChange={e => { setSettings({ ...settings, [key]: e.target.value }); setFeedback(''); }} /></div>)}
      <div className="sm:col-span-2 lg:col-span-3"><Button data-testid="whatsapp-save-settings" type="submit" disabled={busy}><Save />{busy ? 'Saving…' : 'Save draft settings'}</Button></div>
    </form>}
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 data-testid="whatsapp-queue-count" className="font-semibold">Alert queue · {queue?.pending ?? '—'} waiting for setup</h3><Button data-testid="whatsapp-refresh-queue" variant="outline" onClick={load}><RefreshCw />Refresh</Button></div>
    {queue?.items.length === 0 && <p data-testid="whatsapp-empty-queue" className="py-8 text-sm text-slate-500">No alerts yet. New project briefs will appear here.</p>}
    <div className="space-y-3">{queue?.items.map((item: any) => <article key={item.id} data-testid={`whatsapp-alert-${item.leadId}`} className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5"><div className="flex flex-wrap justify-between gap-3"><div><h4 className="font-semibold">{item.clientName}</h4><p className="mt-1 text-sm text-slate-600">{item.contactValue} · {item.serviceId} · {item.budgetRange}</p></div><span data-testid={`whatsapp-alert-status-${item.leadId}`} className="text-xs font-semibold text-amber-800">{item.status === 'pending_setup' ? 'Waiting for setup · Not sent' : 'Dismissed · Not sent'}</span></div><p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{item.projectDescription}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()} · Attempts: {item.attempts}</p>{item.status === 'pending_setup' && <Button data-testid={`whatsapp-dismiss-${item.leadId}`} size="sm" variant="outline" disabled={busy} onClick={() => dismiss(item.id)}><Archive />Dismiss alert</Button>}</div></article>)}</div>
    {queue && queue.total > 20 && <div className="flex items-center justify-between"><Button data-testid="whatsapp-previous-page" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft />Previous</Button><span data-testid="whatsapp-page-number" className="text-sm">{page} / {Math.ceil(queue.total / 20)}</span><Button data-testid="whatsapp-next-page" variant="outline" disabled={page * 20 >= queue.total} onClick={() => setPage(page + 1)}>Next<ChevronRight /></Button></div>}
  </section>;
};