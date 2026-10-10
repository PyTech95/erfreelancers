import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink, ChevronDown, Check, RefreshCw, Save } from 'lucide-react';
import { apiFetch, API_BASE } from '../../api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const SearchConsoleKit = () => {
  const [kit, setKit] = useState<any>(null);
  const [manifest, setManifest] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState('Not checked');
  const load = async () => {
    setError('');
    try {
      const [a, b] = await Promise.all([apiFetch('/api/admin/search-console'), apiFetch('/api/seo/sitemaps-manifest')]);
      if (!a.ok || !b.ok) throw new Error();
      setKit(await a.json()); setManifest(await b.json());
    } catch { setError('Could not load Search Console settings. Please retry.'); }
  };
  useEffect(() => { load(); }, []);
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setMessage('Copied to clipboard.'); }
    catch { setError('Clipboard unavailable. Select and copy the displayed value.'); }
  };
  const save = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      const res = await apiFetch('/api/admin/search-console', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kit.checklist) });
      if (!res.ok) throw new Error('Check the TXT record format: google-site-verification=your-code');
      setKit(await res.json()); setMessage('Checklist saved. Completion is manually recorded, not verified by Google here.');
    } catch (e: any) { setError(e.message || 'Could not save. Please retry.'); }
    finally { setSaving(false); }
  };
  const checkSitemap = async () => {
    setHealth('Checking…');
    try { const res = await apiFetch('/api/sitemap.xml'); const xml = await res.text(); setHealth(res.ok && xml.includes('<sitemapindex') ? 'App sitemap: reachable XML' : 'App sitemap: check failed'); }
    catch { setHealth('App sitemap: check failed'); }
  };
  const update = (key: string, value: any) => { setKit({ ...kit, checklist: { ...kit.checklist, [key]: value } }); setMessage(''); };
  return <section data-testid="search-console-kit" className="space-y-7">
    {error && <p data-testid="search-console-error" role="alert" className="text-sm text-rose-700">{error} <button data-testid="search-console-retry" onClick={load} className="underline">Retry loading</button></p>}
    {!kit ? <p data-testid="search-console-loading">Loading Search Console kit…</p> : <>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-slate-200 pb-6">
        <div><p className="text-xs font-semibold uppercase text-emerald-700">Search Console Kit</p><h2 data-testid="search-console-domain" className="mt-2 font-display text-lg font-bold">{kit.domain}</h2><p className="mt-2 max-w-xl text-sm text-slate-600">Domain verification and sitemap submission. Google controls crawling and indexing; neither is guaranteed.</p></div>
        <Button data-testid="search-console-guide-toggle" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="bg-indigo-600 text-white hover:bg-indigo-700"><ChevronDown size={16} />{expanded ? 'Close setup guide' : 'Open setup guide'}</Button>
      </div>
      <div data-testid="search-console-status" className="flex flex-wrap items-center gap-3 text-sm text-slate-600"><span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">Manual verification required</span><span>{['propertyCreated', 'dnsVerified', 'sitemapSubmitted'].filter(k => kit.checklist[k]).length}/3 steps marked complete by admin</span></div>
      {expanded && <div data-testid="search-console-guide" className="space-y-7">
        <div className="space-y-3 border-l-2 border-indigo-200 pl-5"><h3 className="font-semibold">01 · Add your Domain property</h3><p className="text-sm text-slate-600">In Google Search Console, choose Add property → Domain. Enter <strong>{kit.domain}</strong> without https:// or a path.</p><div className="flex flex-wrap gap-2"><Button data-testid="search-console-copy-domain" variant="outline" onClick={() => copy(kit.domain)}><Copy />Copy domain</Button><a data-testid="search-console-open-google" href={kit.consoleUrl} target="_blank" rel="noreferrer" className="admin-link"><ExternalLink size={15} />Open Google Console</a></div><label className="flex items-center gap-2 text-sm"><input data-testid="search-console-property-checkbox" type="checkbox" checked={kit.checklist.propertyCreated} onChange={e => update('propertyCreated', e.target.checked)} />I added the Domain property</label></div>
        <div className="space-y-3 border-l-2 border-indigo-200 pl-5"><h3 className="font-semibold">02 · Verify DNS ownership</h3><p className="text-sm text-slate-600">Copy the exact TXT value supplied by Google. At your domain's DNS provider, add a TXT record with host @ (or the root host your provider requires). Keep existing records. Return to Google and click Verify. Propagation can take up to 72 hours.</p><label htmlFor="gsc-txt" className="block text-sm font-medium">Google verification TXT value</label><div className="flex gap-2"><Input data-testid="search-console-txt-input" id="gsc-txt" value={kit.checklist.dnsRecord} onChange={e => update('dnsRecord', e.target.value)} placeholder="google-site-verification=…" /><Button data-testid="search-console-copy-txt" aria-label="Copy TXT value" title="Copy TXT value" variant="outline" size="icon" disabled={!kit.checklist.dnsRecord} onClick={() => copy(kit.checklist.dnsRecord)}><Copy /></Button></div><label className="flex items-center gap-2 text-sm"><input data-testid="search-console-verified-checkbox" type="checkbox" checked={kit.checklist.dnsVerified} onChange={e => update('dnsVerified', e.target.checked)} />Google confirmed ownership (manual confirmation)</label></div>
        <div className="space-y-3 border-l-2 border-indigo-200 pl-5"><h3 className="font-semibold">03 · Submit your sitemap</h3><p className="text-sm text-slate-600">Open your verified property's Sitemaps report. Paste the full URL below and click Submit. Check the status inside Google. The public domain must serve this app first.</p><code data-testid="search-console-sitemap-url" className="block break-all rounded-lg border border-slate-200 bg-white p-3 text-sm">{kit.sitemapUrl}</code><div className="flex flex-wrap gap-2"><Button data-testid="search-console-copy-sitemap" variant="outline" onClick={() => copy(kit.sitemapUrl)}><Copy />Copy sitemap</Button><a data-testid="search-console-submit-link" className="admin-link" target="_blank" rel="noreferrer" href={kit.submissionUrl}><ExternalLink size={15} />Open Sitemaps report</a><a data-testid="search-console-public-sitemap" className="admin-link" target="_blank" rel="noreferrer" href={kit.sitemapUrl}>View public XML</a></div><label className="flex items-center gap-2 text-sm"><input data-testid="search-console-submitted-checkbox" type="checkbox" checked={kit.checklist.sitemapSubmitted} onChange={e => update('sitemapSubmitted', e.target.checked)} />I submitted the sitemap in Google</label></div>
        <div className="flex flex-wrap gap-3"><Button data-testid="search-console-save" onClick={save} disabled={saving}><Save />{saving ? 'Saving…' : 'Save checklist'}</Button><a data-testid="search-console-help" className="admin-link" href="https://support.google.com/webmasters/answer/9008080" target="_blank" rel="noreferrer">Google verification help<ExternalLink size={14} /></a></div>
      </div>}
      {message && <p data-testid="search-console-feedback" role="status" className="text-sm text-emerald-700 flex items-start gap-2"><Check size={16} className="shrink-0" />{message}</p>}
      <div className="border-t border-slate-200 pt-6 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Sitemap diagnostics</h3><Button data-testid="search-console-check-sitemap" variant="outline" onClick={checkSitemap}><RefreshCw />Check app XML</Button></div><p data-testid="search-console-xml-status" className="text-sm text-slate-600">{health}. This checks the app endpoint, not domain ownership.</p><p data-testid="search-console-url-count" className="text-sm text-slate-600">{manifest?.totalPublicUrls?.toLocaleString()} URLs listed in sitemap files · Google indexed count unknown</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{manifest?.childSitemaps?.map((url: string, i: number) => <a key={url} data-testid={`search-console-child-${i}`} href={`${API_BASE}${new URL(url).pathname}`} target="_blank" rel="noreferrer" className="admin-link justify-between border border-slate-200 bg-white p-3 text-xs">{url.split('/').pop()}<ExternalLink size={14} /></a>)}</div><p className="text-xs text-slate-500">Landing-page metadata is client-rendered. Sitemap inclusion does not mean Google has indexed a page.</p></div>
    </>}
  </section>;
};