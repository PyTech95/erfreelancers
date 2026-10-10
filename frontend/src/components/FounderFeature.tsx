import React from 'react';
import { Globe, Terminal, ArrowRight, UserCheck, Briefcase, Phone, MessageSquare, FileCheck } from 'lucide-react';
import { FreelancerProfile } from '../types';
interface FounderFeatureProps { founder: FreelancerProfile; onOpenProfile: (slug: string) => void; onStartEnquiryWithFounder: (freelancerId: string) => void; }
const badgeLabels = { email_verified: 'Email verified', profile_reviewed: 'Profile reviewed', identity_verified: 'Identity verified' };
export const FounderFeature: React.FC<FounderFeatureProps> = ({ founder, onStartEnquiryWithFounder }) => (
  <section id="founder" className="py-20 bg-slate-50/70 border-b border-slate-200 text-left">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 lg:p-12 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div aria-hidden="true" className="absolute top-0 right-0 w-full max-w-[280px] aspect-square bg-indigo-50/60 blur-[100px] rounded-full pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative">
          <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 p-1 shadow-md flex items-center justify-center"><div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center text-3xl font-extrabold text-white font-display">R</div></div>
            <div className="mt-4"><div className="flex items-center justify-center sm:justify-start gap-2"><h3 className="text-2xl font-bold text-slate-900 font-display">Rajeev</h3><span className="rounded-full bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">Founder</span></div><p className="text-xs text-indigo-700 font-bold mt-1">15 years of technical experience</p></div>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-1.5 w-full">
              {(founder.verifiedBadges || []).map(badge => <span key={badge.type} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200"><UserCheck className="h-3 w-3 text-emerald-600" />{badgeLabels[badge.type]}</span>)}
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100"><Globe className="h-3 w-3" />Worldwide remote collaboration</span>
            </div>
            <dl className="mt-5 w-full pt-4 border-t border-slate-200 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">Experience</dt><dd className="font-bold">15 years</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">Work together</dt><dd className="font-bold">Remote projects</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">Availability</dt><dd className="font-medium">{({ available_now: 'Accepting enquiries', limited_capacity: 'Limited capacity', waitlist: 'Waitlist', unavailable: 'Currently unavailable' })[founder.capacityStatus] || 'Ask about availability'}</dd></div>
            </dl>
            <div className="mt-5 w-full space-y-2">
              <button onClick={() => onStartEnquiryWithFounder(founder.id)} id="consult-with-rajeev-btn" className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 px-4 text-xs font-semibold text-white shadow-md transition-all hover:opacity-95 flex items-center justify-center gap-2">Request a proposal<ArrowRight className="h-3.5 w-3.5" /></button>
              <a href={`/freelancers/${founder.slug}/`} className="block text-center py-2 text-xs font-semibold text-indigo-700 hover:underline">View Rajeev’s profile</a>
              <div className="flex items-center gap-2"><a href="tel:+919711623561" className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-[11px] font-semibold text-slate-800 hover:bg-slate-50"><Phone className="h-3 w-3 text-emerald-600" />Call direct</a><a href="https://wa.me/919711623561?text=Hi%20Rajeev,%20I%20want%20to%20discuss%20a%20project" target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-[11px] font-semibold text-white hover:bg-emerald-700"><MessageSquare className="h-3 w-3" />WhatsApp</a></div>
            </div>
          </div>
          <div className="lg:col-span-8 space-y-5">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Founder-led project coordination</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-display leading-tight">15 years of experience.<br /><span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">Digital services built around your business.</span></h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Rajeev founded ER Freelancer to connect businesses with freelance digital expertise. Discuss websites, mobile applications, custom CRM and ERP systems, SEO, and AI automation directly. Remote collaboration is available worldwide; project scope and availability are confirmed before work begins.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {[
                { icon: Briefcase, title: 'Business-first planning', text: 'Start with your customers, workflows, and priorities, then define the features the project needs.' },
                { icon: Globe, title: 'Worldwide remote work', text: 'Agree meeting times, feedback methods, and timezone overlap wherever your business is based.' },
                { icon: Terminal, title: 'Technical conversations', text: 'Discuss integrations, technology options, and implementation trade-offs with Rajeev.' },
                { icon: FileCheck, title: 'Defined deliverables', text: 'Record project scope, review milestones, handover terms, and support options in the proposal.' },
              ].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Icon className="h-4 w-4 text-indigo-600" />{title}</h3><p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{text}</p></div>)}
            </div>
            <p className="pt-2 text-xs text-slate-500">Call or WhatsApp to discuss your project requirements.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);
