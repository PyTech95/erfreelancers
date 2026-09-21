import React from 'react';
import { ShieldCheck, CheckCircle, Globe, Terminal, ArrowRight, UserCheck, Award, Briefcase, Phone, MessageSquare, Star } from 'lucide-react';
import { FreelancerProfile } from '../types';

interface FounderFeatureProps {
  founder: FreelancerProfile;
  onOpenProfile: (slug: string) => void;
  onStartEnquiryWithFounder: (freelancerId: string) => void;
}

export const FounderFeature: React.FC<FounderFeatureProps> = ({
  founder,
  onOpenProfile,
  onStartEnquiryWithFounder
}) => {
  return (
    <section id="founder" className="py-20 bg-slate-50/70 border-b border-slate-200 text-left">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 lg:p-12 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          
          {/* Subtle soft background accents */}
          <div aria-hidden="true" className="absolute top-0 right-0 w-full max-w-[280px] aspect-square bg-indigo-50/60 blur-[100px] rounded-full pointer-events-none" />
          <div aria-hidden="true" className="absolute bottom-0 left-0 w-full max-w-[280px] aspect-square bg-emerald-50/60 blur-[90px] rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative">
            
            {/* Left Column: Authentic Profile Card */}
            <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
              
              <div className="relative">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 p-1 shadow-md shadow-indigo-600/20 flex items-center justify-center">
                  <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center text-3xl font-extrabold text-white font-display">
                    R
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 rounded-full bg-emerald-100 border border-emerald-300 p-1 text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-2xl font-bold text-slate-900 font-display">Rajeev</h3>
                  <span className="rounded-full bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                    Founder & Lead
                  </span>
                </div>
                <p className="text-xs text-indigo-700 font-bold mt-1 flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  <span>15+ Years Technical Experience • 1,500+ Delivered Websites</span>
                </p>
              </div>

              {/* Badges */}
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-1.5 w-full">
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200 shadow-xs">
                  <UserCheck className="h-3 w-3 text-emerald-600" />
                  <span>Verified Identity</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                  <Briefcase className="h-3 w-3" />
                  <span>Principal Architect</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  <span>100% IP Transfer</span>
                </span>
              </div>

              {/* Delivery Stats & Metrics */}
              <div className="mt-5 w-full pt-4 border-t border-slate-200 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Track Record:</span>
                  <span className="font-bold text-slate-900">15+ Years (Active Since 2011)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Delivered Websites:</span>
                  <span className="font-bold text-emerald-700">1,500+ Production Sites</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Core Verticals:</span>
                  <span className="font-medium text-slate-800">Hospitality, Medical, Edu, Retail</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Availability:</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Open for Sprints
                  </span>
                </div>
              </div>

              <div className="mt-5 w-full space-y-2">
                <button
                  onClick={() => onStartEnquiryWithFounder(founder.id)}
                  id="consult-with-rajeev-btn"
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 px-4 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:opacity-95 flex items-center justify-center gap-2"
                >
                  <span>Request Proposal from Rajeev</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center gap-2 pt-1">
                  {/* Auto-Dial Direct Call */}
                  <a
                    href="tel:+919711623561"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-[11px] font-semibold text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
                    title="Direct phone call with Rajeev"
                  >
                    <Phone className="h-3 w-3 text-emerald-600" />
                    <span>Call Direct</span>
                  </a>

                  {/* Direct WhatsApp */}
                  <a
                    href="https://wa.me/919711623561?text=Hi%20Rajeev,%20I%20want%20to%20discuss%20a%20project%20architecture"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                    title="Open WhatsApp chat with Rajeev"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

            </div>

            {/* Right Column: Platform Model Narrative */}
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Founder-Led Technical Excellence • 15-Year Track Record</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-display leading-tight">
                15 years of hands-on delivery. <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                  1,500+ commercial websites
                </span> crafted with zero agency overhead.
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                “Over the last 15 years, our teams have architected and deployed more than 1,500 websites and digital platforms worldwide. From luxury hospitality resorts and medical hospitals to top colleges, high-volume D2C e-commerce brands, and global manufacturing plants — every project is engineered directly by verified senior specialists with no middleman markups.”
              </p>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Award className="h-4 w-4 text-indigo-600" />
                    <span>15+ Years Domain Experience</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Continuously delivering enterprise web systems and modern responsive stacks since 2011 with deep architectural rigor.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    <span>1,500+ Production Websites</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Proven track record across 10 global industries including Hospitality, Medical, Education, E-Commerce, and Manufacturing.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Terminal className="h-4 w-4 text-purple-600" />
                    <span>Direct Specialist Collaboration</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Direct call and WhatsApp coordination with developers. No account managers or junior subcontracting handoffs.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span>100% IP & Code Ownership</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Full repository handover, domain setup, hosting credentials, and documentation provided on delivery.
                  </p>
                </div>
              </div>

              {/* Direct founder contact reminder */}
              <div className="pt-2 flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Verified Founder & Architect</span>
                </span>
                <span>•</span>
                <span>Direct consultation available on Call & WhatsApp</span>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
