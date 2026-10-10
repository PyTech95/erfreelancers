import React from 'react';
import { FileCheck, Code, Users, CalendarCheck, ArrowRight, Settings } from 'lucide-react';

interface TrustGuaranteesProps { onOpenEnquiry: () => void; }
const COMMITMENTS = [
  { title: 'Ownership and handover', icon: Code, description: 'Agree the source-code handover, account ownership, documentation, and any third-party licence restrictions in writing.' },
  { title: 'Direct communication', icon: Users, description: 'Discuss your requirements with Rajeev and confirm who will handle technical questions and project updates.' },
  { title: 'Milestone planning', icon: CalendarCheck, description: 'Confirm the scope, review points, payment schedule, and acceptance criteria in your project proposal.' },
  { title: 'Support options', icon: Settings, description: 'Choose support and maintenance to suit your project. The agreed scope and support period should be recorded before launch.' },
];
const CHECKLIST = [
  ['Scope', 'Pages, features, integrations, and exclusions', 'A written proposal'],
  ['Budget', 'Development, hosting, licences, and provider costs', 'An itemized estimate'],
  ['Delivery', 'Milestones, content, and feedback dependencies', 'An agreed project schedule'],
  ['Handover', 'Source files, accounts, and operating instructions', 'A delivery checklist'],
  ['Collaboration', 'Remote meetings, availability, and timezone overlap', 'A named project contact'],
];
export const TrustGuarantees: React.FC<TrustGuaranteesProps> = ({ onOpenEnquiry }) => (
  <section className="py-20 bg-slate-900 text-white border-t border-slate-800">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 px-3.5 py-1 text-xs font-bold text-indigo-300 mb-4"><FileCheck className="h-3.5 w-3.5" />A clear working agreement</div>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">Freelance expertise, with the details agreed upfront</h2>
        <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">Plan the practical details of your website, application, or business software before development begins.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {COMMITMENTS.map(({ title, icon: Icon, description }) => <article key={title} className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6">
          <div className="h-11 w-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mb-4"><Icon className="h-6 w-6" /></div>
          <h3 className="text-base font-bold mb-2">{title}</h3><p className="text-xs text-slate-300 leading-relaxed">{description}</p>
        </article>)}
      </div>
      <div data-testid="trust-comparison" className="trust-comparison rounded-3xl border border-slate-800 bg-slate-950/70 p-4 sm:p-8 shadow-2xl overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm"><caption className="sr-only">Project planning checklist</caption>
          <thead><tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400"><th className="py-4 pr-3">Topic</th><th className="py-4 pr-3">Discuss together</th><th className="py-4 text-indigo-300">Record before starting</th></tr></thead>
          <tbody>{CHECKLIST.map(([topic, discuss, record]) => <tr key={topic} className="border-b border-slate-800/80"><th scope="row" className="py-4 pr-3 font-semibold text-slate-200">{topic}</th><td className="py-4 pr-3 text-slate-300">{discuss}</td><td className="py-4 text-emerald-300">{record}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button data-testid="trust-start-project" onClick={onOpenEnquiry} className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2">Discuss your requirements<ArrowRight className="h-4 w-4" /></button>
        <a data-testid="trust-call-founder" href="tel:+919711623561" className="w-full sm:w-auto rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-3.5 text-xs sm:text-sm font-bold text-white transition-all text-center">Call Rajeev</a>
      </div>
    </div>
  </section>
);
