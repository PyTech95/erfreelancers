import React from 'react';
import { Send, FileText, CheckCircle, Code, ShieldCheck, ArrowRight, Laptop, Lock } from 'lucide-react';

export const WorkflowTimeline: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Qualified Project Enquiry',
      desc: 'Submit your requirements, timeline, and location context via our structured brief builder or direct call.',
      icon: Send
    },
    {
      num: '02',
      title: 'Scope & Specialist Matching',
      desc: 'We match your brief with qualified independent specialists who have verified capacity and relevant service expertise.',
      icon: FileText
    },
    {
      num: '03',
      title: 'Itemized Proposal & Agreement',
      desc: 'Receive a clear proposal detailing deliverables, tech choices, milestone dates, and fixed costs—no hidden fees.',
      icon: CheckCircle
    },
    {
      num: '04',
      title: 'Milestone Execution & Demos',
      desc: 'Work directly with your developer. Track progress via live staging preview URLs and git commit updates.',
      icon: Code
    },
    {
      num: '05',
      title: 'Handover & 100% IP Transfer',
      desc: 'Source code, credentials, documentation, and training are handed over with complete intellectual property ownership.',
      icon: ShieldCheck
    }
  ];

  const proposalInclusions = [
    'Custom UI/UX Figma component design files',
    'Full production-ready source code in private Git repo',
    'Server deployment & domain/SSL configuration assistance',
    'Editor walkthrough video guides & CMS training session',
    '30-day post-launch bug warranty & stability support',
    'Clean API documentation & environment variable handbook'
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-left">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700 mb-3 shadow-xs">
            <Lock className="h-3.5 w-3.5" />
            <span>Predictable & Accountable Delivery</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
            How Projects Work from Brief to Handover
          </h2>
          <p className="text-base text-slate-600 mt-3">
            Direct communication, defined milestones, and verifiable deliverables. You always know what is being built, when it will ship, and who is writing the code.
          </p>
        </div>

        {/* 5-Step Process Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between hover:border-indigo-400 hover:bg-white hover:shadow-md transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-extrabold font-display text-slate-300">
                      {step.num}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Proposal Inclusions Checklist */}
        <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                What Your Project Proposal Includes
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Every scope of work is tailored to your business brief and agreed upon before work begins.
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800 self-start sm:self-auto">
              Standard Inclusions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposalInclusions.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
