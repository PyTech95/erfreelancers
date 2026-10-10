import React, { useState } from 'react';
import { Globe, Bell, Inbox, Activity, Users, Shield, Download, LogOut, LayoutDashboard, FileText, Settings, Menu, ArrowUpRight, Plus } from 'lucide-react';
import { SearchConsoleKit } from './admin/SearchConsoleKit';
import { WhatsAppAlerts } from './admin/WhatsAppAlerts';
import { AdminLeads } from './admin/AdminLeads';
import { AdminOperations } from './admin/AdminOperations';
import { AdminOverview } from './admin/AdminOverview';
import { EmailSettings } from './admin/EmailSettings';
import { AdminBlog } from './admin/AdminBlog';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Toaster } from './ui/sonner';

const tabs = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard, group: 'Workspace' },
  { id: 'leads', label: 'Inquiries', Icon: Inbox, group: 'Workspace' },
  { id: 'freelancers', label: 'Freelancer records', Icon: Users, group: 'Workspace' },
  { id: 'blog', label: 'Blog posts', Icon: FileText, group: 'Workspace' },
  { id: 'seo', label: 'Search Console', Icon: Globe, group: 'Operations' },
  { id: 'whatsapp', label: 'WhatsApp alerts', Icon: Bell, group: 'Operations' },
  { id: 'pipeline', label: 'Page pipeline', Icon: Activity, group: 'Operations' },
  { id: 'facts', label: 'Business facts', Icon: Shield, group: 'Operations' },
  { id: 'exports', label: 'Reports & exports', Icon: Download, group: 'Operations' },
  { id: 'settings', label: 'Email settings', Icon: Settings, group: 'Settings' },
];

export const AdminDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [tab, setTab] = useState(() => { const param = new URLSearchParams(window.location.search).get('tab'); return tabs.some(t => t.id === param) ? param! : 'overview'; });
  const [open, setOpen] = useState(false);
  const select = (id: string) => { setTab(id); setOpen(false); window.history.replaceState({}, '', `/admin?tab=${id}`); window.scrollTo({ top: 0 }); };
  const navigation = (mobile: boolean) => <nav data-testid={mobile ? 'admin-mobile-navigation' : 'admin-tabs'} aria-label="Admin sections" className="space-y-6">{['Workspace', 'Operations', 'Settings'].map(group => <div key={group}><p className="mb-2 px-3 text-[10px] font-semibold uppercase text-slate-400">{group}</p><div className="space-y-1">{tabs.filter(t => t.group === group).map(({ id, label, Icon }) => <button key={id} data-testid={`admin-${mobile ? 'mobile-' : ''}tab-${id}`} onClick={() => select(id)} aria-current={tab === id ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${tab === id ? 'bg-emerald-400 text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon size={17} className="shrink-0" />{label}</button>)}</div></div>)}</nav>;
  const brand = <div className="mb-9 flex items-center gap-3 px-2"><img data-testid="admin-brand-icon" src="/freelancer-icon.svg" alt="" className="h-8 w-8" /><div><p className="font-display text-lg font-semibold text-white">ER Freelancer</p><p className="mt-0.5 text-[10px] text-slate-400">BUSINESS WORKSPACE</p></div></div>;
  return <div data-testid="admin-dashboard" className="admin-dashboard min-h-screen bg-[#f8fafb] text-slate-900 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside data-testid="admin-sidebar" className="sticky top-0 hidden h-screen flex-col overflow-y-auto bg-[#17202b] px-4 py-7 lg:flex">{brand}{navigation(false)}<button data-testid="admin-logout-button" onClick={onLogout} className="mt-auto flex items-center gap-3 border-t border-white/10 px-3 pb-2 pt-5 text-xs text-slate-300 hover:text-white"><LogOut size={16} />Sign out</button></aside>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent data-testid="admin-mobile-sidebar" side="left" className="w-[280px] max-w-[90vw] overflow-y-auto border-0 bg-[#17202b] px-4 text-white"><SheetTitle className="mb-2 text-left text-lg text-white">ER Freelancer</SheetTitle><SheetDescription className="mb-7 text-left text-xs text-slate-400">Business workspace</SheetDescription>{navigation(true)}<Button data-testid="admin-mobile-logout" variant="ghost" onClick={onLogout} className="mt-7 text-white"><LogOut size={16} />Sign out</Button></SheetContent></Sheet>
    <div className="min-w-0"><header data-testid="admin-top-header" className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-8"><div className="flex min-w-0 items-center gap-3"><Button data-testid="admin-open-menu" variant="ghost" size="icon" aria-label="Open admin navigation" className="shrink-0 lg:hidden" onClick={() => setOpen(true)}><Menu size={21} /></Button><span className="text-xs text-slate-500">Workspace <span className="mx-2 text-slate-300">/</span> <span data-testid="admin-current-section" className="text-slate-900">{tabs.find(t => t.id === tab)?.label}</span></span></div><a data-testid="admin-view-website" href="/" className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600"><span className="hidden sm:inline">View website</span><ArrowUpRight size={18} /></a></header>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-8 sm:py-10 xl:px-12"><div className="mb-9 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-medium text-emerald-700">ER Freelancer / Admin</p><h1 data-testid="admin-title" className="mt-2 font-display text-4xl font-semibold">{tab === 'overview' ? 'Business overview' : tabs.find(t => t.id === tab)?.label}</h1></div>{tab === 'overview' && <Button data-testid="admin-quick-blog" onClick={() => select('blog')}><Plus size={16} />Blog posts</Button>}</div>
        {tab === 'overview' ? <AdminOverview onNavigate={select} /> : tab === 'settings' ? <EmailSettings /> : tab === 'blog' ? <AdminBlog /> : tab === 'seo' ? <SearchConsoleKit /> : tab === 'whatsapp' ? <WhatsAppAlerts /> : tab === 'leads' ? <AdminLeads /> : <AdminOperations key={tab} tab={tab} />}
      </div>
    </div><Toaster position="top-right" />
  </div>;
};