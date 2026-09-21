import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Globe,
  Sparkles,
  ArrowRight,
  UserCheck,
  Phone,
  MessageSquare,
  Mail,
  Star,
  GraduationCap,
  Briefcase,
  Lock,
  X,
  ExternalLink,
  Send,
  Award
} from 'lucide-react';
import { FreelancerProfile, ServiceDefinition, LocationEntity } from '../types';

interface FreelancerDirectoryProps {
  services: ServiceDefinition[];
  onSelectFreelancerForBrief: (freelancer: FreelancerProfile) => void;
  onViewServiceLocation?: (service: ServiceDefinition, location: LocationEntity) => void;
}

export const FreelancerDirectory: React.FC<FreelancerDirectoryProps> = ({
  services,
  onSelectFreelancerForBrief
}) => {
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [deliveryMode, setDeliveryMode] = useState<'all' | 'remote' | 'onsite'>('all');
  const [loading, setLoading] = useState(false);

  // Gated Profile Modal State
  const [activeProfile, setActiveProfile] = useState<FreelancerProfile | null>(null);
  const [unlockedProfiles, setUnlockedProfiles] = useState<Record<string, boolean>>({});
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [enquirySuccessLeadId, setEnquirySuccessLeadId] = useState<string | null>(null);

  // Gated Form Fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [budgetRange, setBudgetRange] = useState('Flexible / Based on Scope');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchFreelancers();
  }, [selectedServiceId, selectedRegion, deliveryMode, searchQuery]);

  const fetchFreelancers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedServiceId !== 'all') params.append('serviceId', selectedServiceId);
      if (selectedRegion !== 'all') params.append('region', selectedRegion);
      if (deliveryMode !== 'all') params.append('deliveryMode', deliveryMode);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      params.append('limit', '145');

      const res = await apiFetch(`/api/freelancers?${params.toString()}`);
      const data = await res.json();
      setFreelancers(data.freelancers || []);
      setTotalCount(data.totalCount || (data.freelancers ? data.freelancers.length : 0));
    } catch (err) {
      console.error('Failed to load freelancers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGatedProfile = (profile: FreelancerProfile) => {
    setActiveProfile(profile);
    setFormError('');
    setEnquirySuccessLeadId(null);
  };

  const handleCloseModal = () => {
    setActiveProfile(null);
    setFormError('');
    setEnquirySuccessLeadId(null);
  };

  const handleGatedFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    if (!clientName.trim() || !clientPhone.trim() || !clientEmail.trim() || !projectDescription.trim()) {
      setFormError('Please fill in all required fields (Name, Phone/WhatsApp, Email, Project Need).');
      return;
    }

    setIsSubmittingEnquiry(true);
    setFormError('');

    try {
      const idempotencyKey = `lead-gated-${activeProfile.id}-${Date.now()}`;
      const payload = {
        idempotencyKey,
        serviceId: activeProfile.services[0] || 'S01',
        locationId: activeProfile.baseLocationId || 'loc-ctry-in',
        clientName: clientName.trim(),
        contactMethod: 'phone',
        contactValue: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        locationName: activeProfile.baseLocationName || 'Global',
        remotePreference: 'remote_ok',
        projectDescription: `[Specialist Inquiry for ${activeProfile.displayName} (${activeProfile.id})]\n${projectDescription.trim()}`,
        budgetRange,
        timeline: 'Within 4 weeks',
        consentGiven: true,
        routingMode: 'direct_assignment',
        freelancerId: activeProfile.id
      };

      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.lead) {
        setEnquirySuccessLeadId(data.lead.id);
        setUnlockedProfiles(prev => ({ ...prev, [activeProfile.id]: true }));
      } else {
        setFormError(data.error || 'Failed to submit inquiry. Please try again or WhatsApp directly.');
      }
    } catch (err) {
      console.error('Error submitting gated profile inquiry:', err);
      setFormError('Network error submitting your inquiry. Please reach out via WhatsApp directly.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  const founderWhatsApp = '+919711623561';
  const platformEmail = 'hello@erfreelancer.com';

  return (
    <section id="directory" className="py-20 bg-slate-50/60 border-b border-slate-200 text-left">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 mb-3 shadow-2xs">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span>140+ Verified Freelancers Worldwide • Direct Founder Coordination</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              Best Freelancer Specialists Directory
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
              Explore 140+ thoroughly vetted website designers, full-stack engineers, and digital specialists across India, USA, Europe, UAE, and 3,600+ verified locations worldwide.
            </p>
          </div>

          {/* Privacy Notice Banner */}
          <div className="rounded-2xl border border-indigo-100 bg-white p-4 max-w-md shadow-xs shrink-0">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-slate-900">Privacy & Escrow Protected</p>
                <p className="text-slate-600 mt-0.5 leading-snug">
                  Freelancer phone numbers and emails are shielded. Every project is coordinated directly with Founder Rajeev Sharma with milestone escrow & 100% IP handover.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Filter & Search Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, qualification (e.g. 'IIT', 'AWS'), skill, or city..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none shadow-2xs"
              />
            </div>

            {/* Service Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 px-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 focus:outline-none shadow-2xs"
              >
                <option value="all">All 14 Services</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{`${s.id}: ${s.title}`}</option>
                ))}
              </select>
            </div>

            {/* Delivery Mode */}
            <div className="md:col-span-3">
              <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold h-full">
                <button
                  onClick={() => setDeliveryMode('all')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                    deliveryMode === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Modes
                </button>
                <button
                  onClick={() => setDeliveryMode('remote')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                    deliveryMode === 'remote' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Remote
                </button>
                <button
                  onClick={() => setDeliveryMode('onsite')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                    deliveryMode === 'onsite' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Local Hub
                </button>
              </div>
            </div>

          </div>

          {/* Region Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-500 mr-2 text-[11px] uppercase tracking-wider">Region Hubs:</span>
            {[
              { id: 'all', label: 'All Global (140+)' },
              { id: 'india', label: '🇮🇳 India & Delhi NCR' },
              { id: 'usa_canada', label: '🇺🇸 North America' },
              { id: 'europe_uk', label: '🇬🇧 UK & Europe' },
              { id: 'uae_middle_east', label: '🇦🇪 UAE & Middle East' },
              { id: 'apac', label: '🌏 Asia Pacific' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedRegion === r.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Active Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
          <span>Showing <strong className="text-slate-900">{freelancers.length}</strong> verified specialists {selectedRegion !== 'all' ? `in selected region` : `worldwide`}</span>
          <span>⚡ Founder Verification Active</span>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            <div className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
            <p>Filtering 140+ verified global specialists...</p>
          </div>
        ) : freelancers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <p className="text-slate-900 font-bold text-base">No matching specialists found for this filter.</p>
            <p className="text-slate-600 text-xs mt-1">Try broadening your search query or selecting "All Global" to browse the full directory.</p>
            <button
              onClick={() => {
                setSelectedServiceId('all');
                setSelectedRegion('all');
                setDeliveryMode('all');
                setSearchQuery('');
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freelancers.map(({ profile, isLocal, matchReason }) => {
              const p: FreelancerProfile = profile;
              const waText = encodeURIComponent(`Hi Rajeev, I am interested in hiring freelancer ${p.displayName} (${p.primaryTitle || 'Specialist'} - Ref: ${p.id}) for my project. Please share verified availability and quote.`);
              const mailSubject = encodeURIComponent(`Hire Inquiry for ${p.displayName} (${p.id})`);
              const mailBody = encodeURIComponent(`Hi Rajeev,\n\nI found the profile of ${p.displayName} (${p.primaryTitle || 'Specialist'}) on ER Freelancer and would like to discuss hiring them for an upcoming project.\n\nPlease share availability and next steps.\n\nThank you!`);

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between hover:border-indigo-400 hover:shadow-lg transition-all shadow-xs group"
                >
                  <div>
                    {/* Top Header: Avatar, Name, Location */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 p-0.5 flex items-center justify-center font-bold text-white text-base font-display shadow-xs shrink-0">
                          <div className="h-full w-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                            {p.displayName.slice(0, 2).trim()}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900 font-display group-hover:text-indigo-600 transition-colors">
                              {p.displayName}
                            </h3>
                            {p.isFounder ? (
                              <span className="rounded-md bg-purple-100 border border-purple-200 px-1.5 py-0.2 text-[10px] font-extrabold text-purple-800">
                                Founder
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.2 text-[10px] font-semibold border border-emerald-200">
                                <UserCheck className="h-2.5 w-2.5" />
                                Vetted
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-indigo-700 mt-0.5 line-clamp-1">
                            {p.primaryTitle || 'Senior Full-Stack Specialist'}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{p.baseLocationName || 'Worldwide Remote'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Mode Badge */}
                      {isLocal ? (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                          Local Hub
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 shrink-0">
                          Remote
                        </span>
                      )}
                    </div>

                    {/* Qualifications Section (Prominently Highlighted) */}
                    {p.qualifications && p.qualifications.length > 0 && (
                      <div className="mb-3 rounded-xl bg-amber-50/70 border border-amber-200/80 p-2.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px] mb-1">
                          <GraduationCap className="h-3.5 w-3.5 text-amber-700" />
                          <span>Qualifications & Verified Certifications:</span>
                        </div>
                        <div className="space-y-1">
                          {p.qualifications.map((qual, qIdx) => (
                            <div key={qIdx} className="text-[11px] font-medium text-amber-950 flex items-start gap-1">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{qual}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metrics Row: Experience, Rating, Completed Projects */}
                    <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200/70 mb-3 text-center text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Exp</span>
                        <span className="font-bold text-slate-900 text-xs">{p.experienceYears || '8+ Yrs'}</span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Rating</span>
                        <span className="font-bold text-amber-600 text-xs flex items-center justify-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{p.rating || 5.0}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Projects</span>
                        <span className="font-bold text-slate-900 text-xs">{p.completedProjects || 50}+</span>
                      </div>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {p.bio}
                    </p>

                    {/* Services / Skills Chips */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {p.services.slice(0, 3).map((sId: string) => {
                        const sObj = services.find(s => s.id === sId);
                        return (
                          <span key={sId} className="rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold">
                            {sObj?.title || sId}
                          </span>
                        );
                      })}
                      {p.services.length > 3 && (
                        <span className="rounded-md bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[10px] font-medium">
                          +{p.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    
                    {/* Primary Button: View Full Profile & Portfolio (Gated requirement form) */}
                    <button
                      onClick={() => handleOpenGatedProfile(p)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 px-3 text-xs font-bold text-white shadow-2xs transition-all"
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>{unlockedProfiles[p.id] ? 'View Full Unlocked Profile' : 'View Full Profile & Portfolio'}</span>
                    </button>

                    {/* Quick Direct Contacts (Redirects to Founder Rajeev's WhatsApp & Email) */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${founderWhatsApp.replace('+', '')}?text=${waText}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-2 px-2 text-xs font-bold text-emerald-800 transition-colors"
                        title="Inquire via Founder WhatsApp"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={`mailto:${platformEmail}?subject=${mailSubject}&body=${mailBody}`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 px-2 text-xs font-semibold text-slate-700 transition-colors"
                        title="Send Platform Inquiry Email"
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span>Email</span>
                      </a>

                      <a
                        href={`tel:${founderWhatsApp}`}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-2 text-slate-700 transition-colors"
                        title="Call Desk (+91 97116 23561)"
                      >
                        <Phone className="h-3.5 w-3.5 text-indigo-600" />
                      </a>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* GATED PROFILE & PORTFOLIO MODAL */}
      {activeProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900 font-display">
                    {activeProfile.displayName}
                  </h3>
                  {activeProfile.isFounder && (
                    <span className="rounded bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5">
                      Founder
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                  {activeProfile.primaryTitle || 'Senior Specialist'} • {activeProfile.baseLocationName}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-left">
              
              {/* Privacy Notice on Top */}
              <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3.5 text-xs text-indigo-950 flex items-start gap-3">
                <Lock className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Specialist Privacy & Client Protection Policy</p>
                  <p className="text-indigo-800 text-[11px] mt-0.5">
                    Individual phone numbers and personal emails remain private. To protect specialist time and provide exact budget milestone estimates, please submit your requirement brief below. Founder Rajeev Sharma will review and coordinate your introduction directly.
                  </p>
                </div>
              </div>

              {/* Qualifications */}
              {activeProfile.qualifications && activeProfile.qualifications.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-2">
                    <GraduationCap className="h-4 w-4 text-amber-700" />
                    <span>Verified Qualifications & Academic Credentials</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeProfile.qualifications.map((q, idx) => (
                      <div key={idx} className="text-xs font-semibold text-amber-950 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* IF NOT UNLOCKED YET: Gated Project Requirement Form */}
              {!unlockedProfiles[activeProfile.id] && !enquirySuccessLeadId ? (
                <form onSubmit={handleGatedFormSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="rounded-xl bg-slate-100/70 p-3 text-xs font-semibold text-slate-700">
                    📝 Please complete this quick project form to unlock the full profile, verified portfolio links, and request an interview:
                  </div>

                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Amit Verma"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Work Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="e.g. amit@company.com"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Estimated Budget
                      </label>
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                      >
                        <option value="Under ₹25,000">Under ₹25,000 (Starter)</option>
                        <option value="₹25,000 - ₹60,000">₹25,000 - ₹60,000 (Standard)</option>
                        <option value="₹60,000 - ₹1,50,000">₹60,000 - ₹1,50,000 (Growth)</option>
                        <option value="₹1,50,000+ / Custom">₹1,50,000+ / Custom SaaS/App</option>
                        <option value="Flexible / Based on Scope">Flexible / Based on Scope</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Project Requirement / Needs *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Briefly describe what you need built (e.g. Next.js website, mobile app, redesign, timeline, specific features)..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingEnquiry}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3.5 px-4 text-xs font-extrabold text-white shadow-md transition-all disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSubmittingEnquiry ? 'Sending Requirement & Unlocking...' : `Submit Requirement & Unlock Full Profile`}</span>
                  </button>

                  <p className="text-center text-[11px] text-slate-400">
                    🔒 Zero spam. All inquiries go directly to Founder Rajeev Sharma (+91 97116 23561).
                  </p>
                </form>
              ) : (
                /* UNLOCKED FULL PROFILE VIEW */
                <div className="space-y-6 pt-2 border-t border-slate-100">
                  
                  {enquirySuccessLeadId && (
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950">
                      <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span>Inquiry Received Successfully! (Ref: {enquirySuccessLeadId})</span>
                      </div>
                      <p className="text-xs text-emerald-800 mt-1">
                        Full profile and portfolio case studies are now unlocked below. Founder Rajeev Sharma has been notified and will contact you directly via WhatsApp / Email.
                      </p>
                    </div>
                  )}

                  {/* Full Bio */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Professional Background</h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {activeProfile.bio}
                    </p>
                  </div>

                  {/* Portfolio Items */}
                  {activeProfile.portfolioItems && activeProfile.portfolioItems.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Verified Project Case Studies</h4>
                      <div className="space-y-3">
                        {activeProfile.portfolioItems.map((item) => (
                          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                              <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold">
                                Verified Delivery
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                              {item.summary}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((t, idx) => (
                                <span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Direct Contact Options with Founder */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                    <a
                      href={`https://wa.me/${founderWhatsApp.replace('+', '')}?text=${encodeURIComponent(`Hi Rajeev, I have submitted inquiry ${enquirySuccessLeadId || ''} to hire ${activeProfile.displayName} (${activeProfile.primaryTitle}). Can we discuss next steps?`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-4 text-xs font-bold text-white shadow-xs transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Chat with Rajeev on WhatsApp</span>
                    </a>

                    <a
                      href={`tel:${founderWhatsApp}`}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 py-3 px-4 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Phone className="h-4 w-4 text-indigo-600" />
                      <span>Call Helpline (+91 97116 23561)</span>
                    </a>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </section>
  );
};
