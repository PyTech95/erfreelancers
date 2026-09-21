import React, { useEffect, useState } from 'react';
import { Mail, Save, Send, LockKeyhole } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { toast } from '../ui/sonner';
import { adminRequest } from './adminApi';

export const EmailSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const load = () => { setError(''); adminRequest('/api/admin/email/settings').then(setSettings).catch(e => setError(e.message)); };
  useEffect(load, []);
  const edit = (field: string, value: any) => { setDirty(true); setNotice(''); setSettings({ ...settings, [field]: value }); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy('save'); setError(''); setNotice('');
    try {
      const saved = await adminRequest('/api/admin/email/settings', 'PUT', { gmailAddress: settings.gmailAddress, senderName: settings.senderName,
        notificationEmail: settings.notificationEmail || null, enabled: settings.enabled, ...(password ? { appPassword: password } : {}) });
      setSettings(saved); setPassword(''); setDirty(false); setNotice('Gmail settings saved securely.'); toast.success('Gmail settings saved');
    } catch (e: any) { setError(e.message); } finally { setBusy(''); }
  };
  const test = async () => {
    setBusy('test'); setError(''); setNotice('');
    try { const result = await adminRequest('/api/admin/email/test', 'POST'); setNotice(result.message); toast.success('Test email sent'); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(''); const saved = await adminRequest('/api/admin/email/settings').catch(() => null); if (saved) setSettings(saved); }
  };
  return <section data-testid="gmail-settings-panel" className="max-w-3xl">
    <div className="mb-8 flex items-start gap-3"><Mail className="mt-1 text-emerald-600" size={24} /><div><h2 className="font-display text-lg font-semibold">Gmail delivery</h2><p className="mt-1 text-sm text-slate-500">Inquiry notifications & client confirmations</p></div></div>
    {error && <p data-testid="email-settings-error" role="alert" className="mb-5 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!settings ? <Button data-testid="email-settings-reload" variant="outline" onClick={load}>Reload settings</Button> : <form data-testid="gmail-settings-form" onSubmit={save} className="space-y-6">
      <div data-testid="email-connection-status" className={`flex items-center gap-2 border-l-2 py-2 pl-4 text-sm ${settings.passwordSet ? 'border-emerald-500 text-emerald-800' : 'border-amber-400 text-amber-800'}`}><LockKeyhole size={16} />{!settings.passwordSet ? 'Not configured' : settings.lastTestSuccess ? 'Gmail test passed' : settings.lastTestSuccess === false ? 'Last Gmail test failed' : 'Credentials saved · Not tested'}</div>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">Gmail address<Input data-testid="email-gmail-address" type="email" required maxLength={254} value={settings.gmailAddress} onChange={e => edit('gmailAddress', e.target.value)} placeholder="you@gmail.com" /></label>
        <label className="space-y-2 text-sm font-medium">Sender name<Input data-testid="email-sender-name" required maxLength={80} value={settings.senderName} onChange={e => edit('senderName', e.target.value)} /></label>
      </div>
      <label className="block space-y-2 text-sm font-medium">Google App Password<Input data-testid="email-app-password" type="password" autoComplete="new-password" required={!settings.passwordSet} maxLength={32} value={password} onChange={e => { setPassword(e.target.value); setDirty(true); }} placeholder={settings.passwordSet ? 'Saved securely · Leave blank to keep' : '16-letter Google App Password'} /></label>
      <a data-testid="email-google-password-link" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-indigo-700 underline underline-offset-4">Create a Google App Password ↗</a>
      <label className="block space-y-2 text-sm font-medium">Notification email <span className="font-normal text-slate-500">(optional)</span><Input data-testid="email-notification-address" type="email" maxLength={254} value={settings.notificationEmail} onChange={e => edit('notificationEmail', e.target.value)} placeholder="Same as Gmail address" /></label>
      <div className="flex items-start justify-between gap-5 border-y border-slate-200 py-5"><label htmlFor="email-delivery-switch" className="text-sm font-medium">Automatic inquiry emails<span className="mt-1 block text-xs font-normal leading-relaxed text-slate-500">Notify your inbox and thank clients who provide an email address.</span></label><Switch id="email-delivery-switch" data-testid="email-delivery-enabled" checked={settings.enabled} onCheckedChange={value => edit('enabled', value)} /></div>
      <div className="flex flex-wrap gap-3"><Button data-testid="email-save-settings" type="submit" disabled={!!busy}><Save size={16} />{busy === 'save' ? 'Saving…' : 'Save settings'}</Button><Button data-testid="email-send-test" type="button" variant="outline" disabled={!!busy || !settings.passwordSet || dirty} onClick={test}><Send size={16} />{busy === 'test' ? 'Sending…' : 'Send test email'}</Button></div>
      {notice && <p data-testid="email-settings-success" role="status" className="text-sm text-emerald-700">{notice}</p>}
      {settings.lastTestAt && <p data-testid="email-last-test" className="text-xs text-slate-500">Last test: {new Date(settings.lastTestAt).toLocaleString()}</p>}
    </form>}
  </section>;
};