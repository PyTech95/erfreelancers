import React, { useState } from 'react';
import { ShieldCheck, UserCheck, CheckCircle2, Globe, Sparkles, Send } from 'lucide-react';
import { ServiceDefinition } from '../types';

interface FreelancerPortalProps {
  services: ServiceDefinition[];
}

export const FreelancerPortal: React.FC<FreelancerPortalProps> = ({ services }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'apply'>('overview');
  
  // Application Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [baseCity, setBaseCity] = useState('');
  const [country, setCountry] = useState('India');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [selectedServices, setSelectedServices] = useState<string[]>(['S01']);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [deliveryPreference, setDeliveryPreference] = useState<'worldwide_remote' | 'local_only' | 'hybrid'>('worldwide_remote');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const toggleService = (sId: string) => {
    setSelectedServices(prev =>
      prev.includes(sId) ? prev.filter(x => x !== sId) : [...prev, sId]
    );
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 text-left py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700 mb-2">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Verified Specialist Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Join ER Freelancer as a Verified Specialist
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Zero bidding contests. Direct vetted project scopes. Guaranteed milestone escrow and prompt client payments.
            </p>
          </div>

          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeSubTab === 'overview' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standards
            </button>
            <button
              onClick={() => setActiveSubTab('apply')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeSubTab === 'apply' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apply to Join
            </button>
          </div>
        </div>

        {/* SUBTAB 1: Overview & Guidelines */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900">
                Why Senior Freelancers Work With ER Freelancer
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Direct Project Briefs</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    No race-to-the-bottom bidding wars. Clients receive your profile directly based on matched capabilities, verified track record, and timezone alignment.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Protected Milestones</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Every project operates under transparent scopes, milestone sign-offs, and agreed payment schedules. Direct client communication throughout.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Geographic Transparency</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    We clearly distinguish your true physical base from remote delivery markets. No fake location spoofing or manufactured identities.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <button
                  onClick={() => setActiveSubTab('apply')}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Start Specialist Application
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: Application Form */}
        {activeSubTab === 'apply' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            {submittedSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Specialist Application Submitted!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-slate-900">{fullName}</strong>. Your profile has been queued for engineering verification. We will review your code repositories and work samples within 24-48 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmittedSuccess(false);
                    setActiveSubTab('overview');
                  }}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Return to Network Standards
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Specialist Onboarding Application
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Provide accurate technical information. Identity and work samples are reviewed manually before profile activation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Legal / Professional Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rajeev Sharma"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rajeev@dev.com"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Base Physical City *
                    </label>
                    <input
                      type="text"
                      required
                      value={baseCity}
                      onChange={(e) => setBaseCity(e.target.value)}
                      placeholder="e.g. New Delhi"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Timezone *
                    </label>
                    <input
                      type="text"
                      required
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="Asia/Kolkata"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Service Offerings */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select Your Verified Service Competencies (At least 1 required)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {services.map(s => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${
                          selectedServices.includes(s.id)
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="line-clamp-1">{s.id}: {s.title}</span>
                        {selectedServices.includes(s.id) && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Portfolio or Live Website URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://mywork.dev"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GitHub or GitLab Profile URL
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/myusername"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Technical Biography & Key Capabilities *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your tech stack proficiency, years of commercial experience, and recent project outcomes..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 px-6 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSubmitting ? 'Submitting Application...' : 'Submit Profile for Verification'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
