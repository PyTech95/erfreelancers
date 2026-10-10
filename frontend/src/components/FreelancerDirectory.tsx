import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Users, Search, FileCheck, MapPin, Globe, UserCheck, MessageSquare, Star, Briefcase, ArrowRight } from 'lucide-react';
import { FreelancerProfile, ServiceDefinition, LocationEntity } from '../types';
interface FreelancerDirectoryProps {
  services: ServiceDefinition[];
  onSelectFreelancerForBrief: (freelancer: FreelancerProfile) => void;
  onViewServiceLocation?: (service: ServiceDefinition, location: LocationEntity) => void;
}
interface Match { profile: FreelancerProfile; isLocal?: boolean; matchReason?: string; }
const badgeLabels = { email_verified: 'Email verified', profile_reviewed: 'Profile reviewed', identity_verified: 'Identity verified' };
export const FreelancerDirectory: React.FC<FreelancerDirectoryProps> = ({ services, onSelectFreelancerForBrief }) => {
  const [freelancers, setFreelancers] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [deliveryMode, setDeliveryMode] = useState<'all' | 'remote' | 'onsite'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    const fetchFreelancers = async () => {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams({ limit: '145' });
        if (selectedServiceId !== 'all') params.set('serviceId', selectedServiceId);
        if (selectedRegion !== 'all') params.set('region', selectedRegion);
        if (deliveryMode !== 'all') params.set('deliveryMode', deliveryMode);
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        const res = await apiFetch(`/api/freelancers?${params}`);
        if (!res.ok) throw new Error('Directory request failed');
        const data = await res.json();
        if (!cancelled) setFreelancers((data.freelancers || []).filter((match: Match) => match.profile?.profileState === 'approved'));
      } catch {
        if (!cancelled) { setFreelancers([]); setError('Profiles could not load. Please change a filter to retry or contact Rajeev.'); }
      } finally { if (!cancelled) setLoading(false); }
    };
    fetchFreelancers();
    return () => { cancelled = true; };
  }, [selectedServiceId, selectedRegion, deliveryMode, searchQuery]);
  return <section id="directory" className="py-20 bg-slate-50/60 border-b border-slate-200 text-left">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div><div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 mb-3"><Users className="h-3.5 w-3.5" />Freelance specialists · Remote collaboration</div><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">Find a freelancer for your project</h2><p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">Explore approved profiles by service, location, and delivery mode. A freelancer’s actual base and remote availability are shown separately.</p></div>
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 max-w-md shadow-xs"><div className="flex items-start gap-3"><FileCheck className="h-5 w-5 text-indigo-600 shrink-0" /><div className="text-xs"><p className="font-bold text-slate-900">Project coordination</p><p className="text-slate-600 mt-0.5">Browse public profiles and send your requirements to the platform. Rajeev can discuss availability, scope, and next steps with you.</p></div></div></div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative"><label htmlFor="directory-search" className="sr-only">Search freelancers</label><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="directory-search" type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, skill, or city" className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-xs font-semibold" /></div>
          <div className="md:col-span-3"><label htmlFor="directory-service" className="sr-only">Service</label><select id="directory-service" value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 px-3 text-xs font-semibold"><option value="all">All services</option>{services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
          <div className="md:col-span-3 flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold" role="group" aria-label="Delivery mode">{(['all', 'remote', 'onsite'] as const).map(mode => <button key={mode} onClick={() => setDeliveryMode(mode)} aria-pressed={deliveryMode === mode} className={`flex-1 py-1.5 rounded-lg ${deliveryMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>{mode === 'all' ? 'All modes' : mode === 'onsite' ? 'In person' : 'Remote'}</button>)}</div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs" role="group" aria-label="Freelancer region"><span className="font-bold text-slate-500 mr-2">Region:</span>{[['all', 'Worldwide'], ['india', 'India'], ['usa_canada', 'North America'], ['europe_uk', 'UK & Europe'], ['uae_middle_east', 'Middle East'], ['apac', 'Asia Pacific']].map(([id, label]) => <button key={id} onClick={() => setSelectedRegion(id)} aria-pressed={selectedRegion === id} className={`px-3 py-1 rounded-lg font-medium ${selectedRegion === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{label}</button>)}</div>
      </div>
      <p className="text-xs text-slate-500 mb-4" role="status">{loading ? 'Loading matching profiles…' : `Showing ${freelancers.length} approved ${freelancers.length === 1 ? 'profile' : 'profiles'}`}</p>
      {error && <p role="alert" className="mb-4 text-sm text-rose-700">{error}</p>}
      {!loading && !error && freelancers.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><p className="font-semibold text-slate-900">No matching profiles found.</p><p className="text-xs text-slate-600 mt-2">Try another service or region, or contact Rajeev to discuss remote options.</p><button onClick={() => { setSelectedServiceId('all'); setSelectedRegion('all'); setDeliveryMode('all'); setSearchQuery(''); }} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Reset filters</button></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{!loading && freelancers.map(({ profile: p }) => <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between hover:border-indigo-400 hover:shadow-lg transition-all shadow-xs">
        <div><div className="flex items-start gap-3 mb-3"><div aria-hidden="true" className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white shrink-0">{p.displayName.slice(0, 2)}</div><div><h3 className="text-base font-bold text-slate-900 font-display"><a href={`/freelancers/${p.slug}/`} className="hover:text-indigo-600">{p.displayName}</a>{p.isFounder && <span className="ml-2 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-800">Founder</span>}</h3>{p.primaryTitle && <p className="text-xs font-semibold text-indigo-700 mt-1">{p.primaryTitle}</p>}{p.baseLocationName && <p className="mt-1 text-xs text-slate-500"><MapPin className="inline h-3 w-3 mr-1" />Based in {p.baseLocationName}</p>}</div></div>
          {p.deliveryModes?.includes('remote') && <p className="text-xs text-emerald-700 mb-3"><Globe className="inline h-3 w-3 mr-1" />{p.coverageScope === 'worldwide_remote' ? 'Available remotely worldwide' : 'Remote projects in approved service areas'}</p>}
          {(p.verifiedBadges || []).length > 0 && <div className="flex flex-wrap gap-1 mb-3">{p.verifiedBadges.map(badge => <span key={badge.type} className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700"><UserCheck className="inline h-3 w-3 mr-1" />{badgeLabels[badge.type]}</span>)}</div>}
          {(p.experienceYears || (typeof p.rating === 'number' && p.rating > 0) || typeof p.completedProjects === 'number') && <div className="flex flex-wrap gap-4 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 mb-3 text-xs">{p.experienceYears && <span><span className="text-slate-500">Experience:</span> {p.experienceYears}</span>}{typeof p.rating === 'number' && p.rating > 0 && p.rating <= 5 && <span><Star className="inline h-3 w-3 text-amber-600 mr-1" />{p.rating}/5</span>}{typeof p.completedProjects === 'number' && p.completedProjects >= 0 && <span><span className="text-slate-500">Projects:</span> {p.completedProjects}</span>}</div>}
          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">{p.bio}</p>
          {p.qualifications?.length ? <p className="text-xs text-slate-600 mb-3"><span className="font-semibold">Listed qualifications:</span> {p.qualifications.join(' · ')}</p> : null}
          <div className="flex flex-wrap gap-1 mb-4">{p.services.slice(0, 3).map(id => <span key={id} className="rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold">{services.find(s => s.id === id)?.title || id}</span>)}</div>
        </div>
        <div className="pt-3 border-t border-slate-100 space-y-2"><a href={`/freelancers/${p.slug}/`} className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 px-3 text-xs font-bold text-white"><Briefcase className="h-3.5 w-3.5" />View profile and portfolio<ArrowRight className="h-3.5 w-3.5" /></a><button onClick={() => onSelectFreelancerForBrief(p)} className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 px-3 text-xs font-semibold text-slate-700"><MessageSquare className="h-3.5 w-3.5" />Discuss a project</button></div>
      </article>)}</div>
    </div>
  </section>;
};
