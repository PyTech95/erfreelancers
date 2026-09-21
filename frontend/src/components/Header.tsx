import React, { useEffect, useState } from 'react';
import { Menu, X, ChevronRight, Phone, MessageSquare, MapPin, Plus } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  currentView: 'public' | 'admin' | 'freelancer';
  onViewChange: (view: 'public' | 'admin' | 'freelancer') => void;
  onOpenEnquiry: (serviceId?: string, locationId?: string) => void;
  onNavigateSection: (sectionId: string) => void;
}
const links = [
  ['services', 'Services'], ['directory', 'Freelancers'], ['search-finder', 'Find Near Me'],
  ['world-map', 'Worldwide Map'], ['locations-hub', 'Locations'], ['work', 'Delivered Work'],
  ['how-it-works', 'How It Works'], ['reviews', 'Reviews'], ['faq', 'FAQ'],
];
const whatsapp = 'https://wa.me/919711623561?text=Hi%20Rajeev,%20I%20am%20looking%20for%20a%20freelancer';

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onOpenEnquiry, onNavigateSection }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const navigate = (id: string) => { onNavigateSection(id); setOpen(false); };
  const view = (next: HeaderProps['currentView']) => { onViewChange(next); setOpen(false); };

  return <header data-testid="site-header" className="site-header sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
    <div className="border-b border-slate-100 bg-slate-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8 text-[11px] text-slate-600">
        <span data-testid="header-coverage" className="inline-flex items-center gap-1.5"><MapPin size={13} className="shrink-0 text-indigo-600" /><span>3,600+ cities<span className="hidden sm:inline"> · Specialists near you</span></span></span>
        <span data-testid="header-track-record" className="hidden lg:block">15+ years · 1,500+ delivered websites</span>
        <a data-testid="header-top-whatsapp" href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-900"><MessageSquare size={13} />WhatsApp</a>
      </div>
    </div>
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
      <button data-testid="header-home" aria-label="Freelancer Homepage" onClick={() => navigate('hero')} className="header-brand min-w-0 text-left"><BrandLogo iconSize={34} /></button>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden lg:flex items-center gap-1 mr-2">
          {(['public', 'freelancer', 'admin'] as const).map((item, i) => <button key={item} data-testid={`header-view-${item}`} onClick={() => view(item)} aria-pressed={currentView === item} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${currentView === item ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>{['Client', 'Specialist', 'Admin'][i]}</button>)}
        </div>
        <a data-testid="header-call" href="tel:+919711623561" className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold hover:bg-slate-50"><Phone size={14} className="text-emerald-600" />Call</a>
        <button data-testid="header-post-project" onClick={() => { onOpenEnquiry(); setOpen(false); }} className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"><Plus size={15} />Post a Requirement</button>
        <button data-testid="header-menu-toggle" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} aria-controls="header-mobile-menu" onClick={() => setOpen(!open)} className="lg:hidden grid h-11 w-11 place-items-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100">{open ? <X size={23} /> : <Menu size={23} />}</button>
      </div>
    </div>
    <nav data-testid="header-desktop-navigation" aria-label="Main navigation" className="hidden lg:flex mx-auto max-w-7xl justify-between gap-1 border-t border-slate-100 px-6 pb-1">
      {links.map(([id, label]) => <button key={id} data-testid={`header-nav-${id}`} onClick={() => navigate(id)} className="whitespace-nowrap rounded-lg px-2 py-3 text-xs font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700">{label}</button>)}
    </nav>
    {open && <nav id="header-mobile-menu" data-testid="header-mobile-menu" aria-label="Mobile navigation" className="mobile-menu lg:hidden absolute left-0 right-0 border-t border-slate-200 bg-white p-4 shadow-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {links.map(([id, label]) => <button key={id} data-testid={`header-mobile-${id}`} onClick={() => navigate(id)} className="flex items-center justify-between rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">{label}<ChevronRight size={15} /></button>)}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
        {(['public', 'freelancer', 'admin'] as const).map((item, i) => <button key={item} data-testid={`header-mobile-view-${item}`} onClick={() => view(item)} aria-pressed={currentView === item} className="rounded-lg bg-slate-100 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-200">{['Client', 'Specialist', 'Admin'][i]}</button>)}
      </div>
      <button data-testid="header-mobile-post-project" onClick={() => { onOpenEnquiry(); setOpen(false); }} className="mt-3 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Post a Requirement</button>
    </nav>}
  </header>;
};