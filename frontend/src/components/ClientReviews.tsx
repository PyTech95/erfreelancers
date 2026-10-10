import React from 'react';
import { ClipboardList, FileCheck, MessagesSquare, Code, CalendarCheck, ArrowRight } from 'lucide-react';

interface ClientReviewsProps { onOpenEnquiry: () => void; }
const STANDARDS = [
  { title: 'A written scope', icon: ClipboardList, detail: 'List the pages, features, integrations, and exclusions before development begins. Use the proposal to record what is included.' },
  { title: 'A reviewable demo', icon: FileCheck, detail: 'Agree which screens and workflows can be demonstrated during the project, and how feedback will be collected.' },
  { title: 'Clear communication', icon: MessagesSquare, detail: 'Confirm the project contact, meeting times, and update schedule, including timezone overlap for remote collaboration.' },
  { title: 'Documented handover', icon: Code, detail: 'Set out the source files, deployment instructions, account access, and third-party licence terms in the project agreement.' },
  { title: 'An agreed timeline', icon: CalendarCheck, detail: 'Plan milestones around the confirmed scope, required content, client feedback, and external integrations.' },
  { title: 'Support expectations', icon: FileCheck, detail: 'Clarify the support period, covered fixes, and maintenance options before launch. Include any ongoing costs in the proposal.' },
];

export const ClientReviews: React.FC<ClientReviewsProps> = ({ onOpenEnquiry }) => (
  <section id="reviews" className="py-20 bg-white border-t border-slate-200 scroll-mt-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 mb-3"><FileCheck className="h-3.5 w-3.5" />Project transparency</div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">Know what to expect before you start</h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600">Use these practical points to discuss your requirements with Rajeev and evaluate the proposed work.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STANDARDS.map(({ title, icon: Icon, detail }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-all">
          <div className="inline-flex rounded-xl bg-indigo-50 text-indigo-700 p-3 mb-4"><Icon className="h-5 w-5" /></div>
          <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{detail}</p>
        </article>)}
      </div>
      <div className="mt-12 text-center"><button onClick={onOpenEnquiry} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 text-xs sm:text-sm font-bold shadow-md transition-all">Discuss your project scope<ArrowRight className="h-4 w-4" /></button></div>
    </div>
  </section>
);
