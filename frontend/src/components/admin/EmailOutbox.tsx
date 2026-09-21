import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { adminRequest } from './adminApi';

export const mailLabel = (status: string) => ({ pending_setup: 'Awaiting Gmail setup', pending: 'Queued / retrying', sending: 'Sending', sent: 'Sent', failed: 'Failed', skipped: 'No email supplied', simulated: 'SIMULATED · Not sent' }[status] || status);
export const EmailOutbox = ({ items, onRefresh }: { items: any[]; onRefresh: () => void }) => {
  const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [limit, setLimit] = useState(10);
  const retry = async (id: string) => { setBusy(id); setError(''); try { await adminRequest(`/api/admin/email/outbox/${id}/retry`, 'POST'); onRefresh(); } catch (e: any) { setError(e.message); } finally { setBusy(''); } };
  return <details className="border-t border-slate-200 pt-6"><summary data-testid="admin-email-outbox-toggle" className="cursor-pointer font-display text-lg font-semibold">Email delivery ({items.length})</summary>
    {error && <p data-testid="email-outbox-error" role="alert" className="my-4 text-sm text-rose-700">{error}</p>}
    {items.some(m => m.status === 'simulated') && <p data-testid="admin-email-simulated-notice" className="my-4 text-xs text-amber-800">Historical SIMULATED messages are previews only and were never sent.</p>}
    <div className="mt-5 divide-y divide-slate-200">{items.slice(0, limit).map(mail => <article key={mail.id} data-testid={`outbox-mail-${mail.id}`} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-slate-500">{mail.kind === 'confirmation' ? 'Client confirmation' : 'Admin notification'} · {mail.recipient || 'Recipient pending setup'}</p><h3 className="mt-1 text-sm font-semibold">{mail.subject}</h3><p data-testid={`outbox-status-${mail.id}`} className={`mt-2 text-xs font-medium ${mail.status === 'sent' ? 'text-emerald-700' : mail.status === 'failed' ? 'text-rose-700' : 'text-slate-500'}`}>{mailLabel(mail.status)} · {mail.attempts} attempts</p>{mail.lastError && <p data-testid={`outbox-error-${mail.id}`} className="mt-2 text-xs text-amber-800">{mail.lastError}</p>}</div>{['failed', 'pending_setup', 'pending'].includes(mail.status) && <Button data-testid={`outbox-retry-${mail.id}`} size="sm" variant="outline" disabled={!!busy} onClick={() => retry(mail.id)}><RefreshCw size={14} />{busy === mail.id ? 'Queuing…' : 'Retry'}</Button>}</div><details className="mt-3"><summary data-testid={`outbox-preview-${mail.id}`} className="cursor-pointer text-xs text-indigo-700">View email</summary><pre className="mt-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600">{mail.body}</pre></details></article>)}</div>
    {items.length > limit && <Button data-testid="outbox-load-more" variant="outline" onClick={() => setLimit(limit + 20)}>Show more</Button>}
  </details>;
};