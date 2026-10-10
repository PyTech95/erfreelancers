import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare } from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'pricing' | 'process' | 'ownership' | 'locations';
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  { id: 'faq-0', category: 'locations', question: 'How do I find a freelancer for my location?', answer: 'Choose a service and search your city or locality. The directory distinguishes a freelancer’s actual base from remote service coverage. A matching location page does not imply an office or an in-person specialist in that area.' },
  { id: 'faq-1', category: 'pricing', question: 'How is a project quote prepared?', answer: 'Share your required features, integrations, content, budget, and preferred timeline. Rajeev can discuss a suitable scope and prepare a proposal. Development fees and external costs such as hosting, licences, and API usage should be agreed before work starts.' },
  { id: 'faq-2', category: 'ownership', question: 'What happens to the source code and project accounts?', answer: 'The project agreement should specify the source files, documentation, accounts, and access included in handover. Ownership and licence terms can differ for custom code, open-source components, and third-party services, so confirm these terms in the proposal.' },
  { id: 'faq-3', category: 'process', question: 'How long will my website or application take?', answer: 'Timing depends on the confirmed scope, content readiness, integrations, and review requirements. A project schedule and milestones are agreed after reviewing your brief. Ask which dependencies could change the timeline.' },
  { id: 'faq-4', category: 'locations', question: 'Can we work together if my business is outside India?', answer: 'Yes. Rajeev is available for remote projects worldwide. Meeting times, timezone overlap, and feedback arrangements can be agreed during scoping. In-person work is available only when a freelancer explicitly confirms it for your location.' },
  { id: 'faq-5', category: 'process', question: 'Who will coordinate my enquiry?', answer: 'You can contact Rajeev through the project form, phone, or WhatsApp. A submitted enquiry is recorded by the platform for review and assignment. Confirm the delivery contact and communication schedule as part of your project proposal.' },
  { id: 'faq-6', category: 'pricing', question: 'How are project payments arranged?', answer: 'Payment amounts, advance requirements, and milestone dates are agreed in the proposal. Ask how milestones will be reviewed and accepted before making a payment.' },
  { id: 'faq-7', category: 'process', question: 'Is support available after launch?', answer: 'Support and ongoing maintenance can be included in the proposal. Confirm the support period, response arrangements, covered fixes, and ongoing costs before starting the project.' },
  { id: 'faq-8', category: 'ownership', question: 'Which technologies can be used for my project?', answer: 'Technology choices depend on your requirements. Options include React, Next.js, WordPress, mobile application frameworks, Python, and suitable databases. The proposal should explain the recommended stack, integrations, hosting, and maintenance needs.' }
];

interface FaqSectionProps {
  onOpenEnquiry: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onOpenEnquiry }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pricing' | 'process' | 'ownership' | 'locations'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const filteredFaqs = selectedCategory === 'all'
    ? FAQS
    : FAQS.filter(f => f.category === selectedCategory);

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200 scroll-mt-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700 mb-4 shadow-2xs">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
            <span>Got Questions? Everything You Need to Know</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Practical answers about project pricing, ownership terms, milestones, and working with freelancers remotely.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Questions' },
              { id: 'pricing', label: 'Pricing & Payments' },
              { id: 'ownership', label: 'Code & Ownership' },
              { id: 'process', label: 'Delivery & Sprints' },
              { id: 'locations', label: 'Location & Remote Work' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion FAQ Items */}
        <div className="space-y-3.5">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-indigo-200 bg-white shadow-md'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-5 sm:px-6 py-4.5 sm:py-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                      isOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                <div hidden={!isOpen} className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-fade-in">
                    <p>{faq.answer}</p>
                  </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Still have a unique question or custom scope?</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Talk directly with our founder Rajeev
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Discuss your requirements, technical options, budget, and proposed timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenEnquiry}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer"
            >
              Submit your project brief
            </button>
            <a
              href="https://wa.me/919711623561?text=Hi%20Rajeev,%20I%20have%20a%20question%20about%20freelancer%20services"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-xs sm:text-sm font-bold text-white flex items-center gap-2 shadow-md transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
