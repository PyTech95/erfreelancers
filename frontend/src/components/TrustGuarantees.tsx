import React from 'react';
import { ShieldCheck, Code, Users, Clock, Check, X, Sparkles, ArrowRight, Zap, Award, Lock } from 'lucide-react';

interface TrustGuaranteesProps {
  onOpenEnquiry: () => void;
}

export const TrustGuarantees: React.FC<TrustGuaranteesProps> = ({ onOpenEnquiry }) => {
  return (
    <section className="py-20 bg-slate-900 text-white border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 px-3.5 py-1 text-xs font-bold text-indigo-300 mb-4 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>The ER Freelancer Difference • Zero Agency Bloat</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
            Why Forward-Thinking Businesses Choose Us Over Traditional Agencies
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Eliminate junior account executive telephone tags, 400% agency markups, and proprietary code lock-in. Work directly with proven engineering craft.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-xs">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mb-4">
              <Code className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">100% IP & Code Ownership</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You own your GitHub repository, database schemas, Figma designs, and domain credentials from Day 1. Zero proprietary hostage lock-in.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-xs">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Direct Engineer Contact</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct line to founder Rajeev Sharma (+91 97116 23561) and your assigned senior developers via WhatsApp and phone. Fast, technical clarity.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-xs">
            <div className="h-11 w-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Milestone Escrow Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pay as you progress. Funds are only disbursed when concrete, staging-tested milestones are delivered and validated by your team.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-xs">
            <div className="h-11 w-11 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Post-Launch Warranty</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every website and app includes up to 60 days of complimentary bug fixing, security patches, and performance tuning after going live.
            </p>
          </div>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div data-testid="trust-comparison" className="trust-comparison rounded-3xl border border-slate-800 bg-slate-950/70 p-4 sm:p-8 shadow-2xl">
          <div className="min-w-0">
            <div className="trust-comparison-header grid grid-cols-3 pb-4 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="col-span-1">Criteria</div>
              <div className="col-span-1 text-slate-400">Traditional Agency</div>
              <div className="col-span-1 text-indigo-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>ER Freelancer Network</span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs sm:text-sm">
              <div className="grid grid-cols-3 py-4 items-center">
                <div className="font-semibold text-slate-300">Cost & Pricing</div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>300%–500% markup for overhead</span>
                </div>
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Fair, direct rates & flexible open budget</span>
                </div>
              </div>

              <div className="grid grid-cols-3 py-4 items-center">
                <div className="font-semibold text-slate-300">Point of Contact</div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Non-technical account manager</span>
                </div>
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Founder & Senior Engineer directly</span>
                </div>
              </div>

              <div className="grid grid-cols-3 py-4 items-center">
                <div className="font-semibold text-slate-300">Delivery Velocity</div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>8–16 weeks slow bureaucratic cycles</span>
                </div>
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Rapid 1–3 week agile sprints</span>
                </div>
              </div>

              <div className="grid grid-cols-3 py-4 items-center">
                <div className="font-semibold text-slate-300">Source Code & IP</div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Often proprietary or held hostage</span>
                </div>
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>100% full GitHub & IP ownership</span>
                </div>
              </div>

              <div className="grid grid-cols-3 py-4 items-center">
                <div className="font-semibold text-slate-300">Local Coordination</div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Impersonal corporate ticketing</span>
                </div>
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Delhi & Laxmi Nagar local + 3,600+ cities</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            data-testid="trust-start-project"
            onClick={onOpenEnquiry}
            className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start With A Free Scoping Session</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            data-testid="trust-call-founder"
            href="tel:+919711623561"
            className="w-full sm:w-auto rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-3.5 text-xs sm:text-sm font-bold text-white transition-all text-center"
          >
            Call Founder: +91 97116 23561
          </a>
        </div>

      </div>
    </section>
  );
};
