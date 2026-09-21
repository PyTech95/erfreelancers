import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle2, ShieldCheck, Sparkles, MessageSquare, Phone } from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'pricing' | 'process' | 'ownership' | 'locations';
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq-0',
    category: 'locations',
    question: 'How do I find and hire the best freelancer services near me?',
    answer: 'Simply use our search bar or 1-click "Near Me" GPS detector at the top of the page. ER Freelancer connects you immediately with verified freelance website designers, full-stack developers, and digital specialists located in your exact vicinity (such as Laxmi Nagar, Delhi NCR, and 3,600+ cities globally). You get direct WhatsApp coordination (+91 97116 23561) with founder Rajeev Sharma, custom budget alignment, milestone escrow protection, and 100% intellectual property handover.'
  },
  {
    id: 'faq-1',
    category: 'pricing',
    question: 'How does your pricing work? Can I propose my own custom budget?',
    answer: 'Yes! Unlike traditional agencies with rigid pricing tiers and heavy markups, ER Freelancer offers open, flexible budget alignment. Whether your project budget is ₹15,000, ₹50,000, or $2,500+, we tailor the technical architecture and delivery sprint to fit your exact budget and milestones. There are zero hidden agency fees or surprise billings.'
  },
  {
    id: 'faq-2',
    category: 'ownership',
    question: 'Do I get 100% source code, intellectual property (IP), and domain ownership?',
    answer: 'Absolutely. Upon project completion and milestone sign-off, you receive 100% intellectual property ownership. This includes the complete GitHub/GitLab source code repository, Figma design assets, production database access, domain configuration, and server credentials. We enforce zero vendor lock-in.'
  },
  {
    id: 'faq-3',
    category: 'process',
    question: 'What is the typical delivery timeline for a website or web application?',
    answer: 'Standard business websites and landing pages are typically launched in 5 to 10 business days. Custom full-stack web applications, ecommerce stores, or SaaS MVPs take between 2 to 4 weeks depending on third-party integrations (payments, CRM, APIs). We work in rapid agile sprints with live staging links so you see daily progress.'
  },
  {
    id: 'faq-4',
    category: 'locations',
    question: 'Can I hire or meet a freelancer website designer locally near me in Delhi / Laxmi Nagar?',
    answer: 'Yes! Our founder Rajeev Sharma is based in Laxmi Nagar, Delhi with over 15+ years of software engineering experience. We provide on-site and in-person consultations across Delhi NCR (Laxmi Nagar, Connaught Place, Noida, Gurugram) as well as seamless remote collaboration worldwide across 3,600+ cities.'
  },
  {
    id: 'faq-5',
    category: 'process',
    question: 'Will I communicate directly with the engineer or a middleman account manager?',
    answer: 'You communicate directly with our founder Rajeev Sharma and senior full-stack developers. There are no junior account executives or bureaucratic telephone tags. You get direct WhatsApp and phone access (+91 97116 23561) for real-time updates and fast problem-solving.'
  },
  {
    id: 'faq-6',
    category: 'pricing',
    question: 'How are payments structured? Do I have to pay everything upfront?',
    answer: 'Never. All projects follow a transparent milestone-based schedule (e.g. Initial Discovery & UI Prototype -> Development & Staging Demo -> Final QA, Deployment & IP Handover). You only approve and release milestone payments as tangible deliverables are demonstrated and tested on staging.'
  },
  {
    id: 'faq-7',
    category: 'process',
    question: 'What happens after the website goes live? Do you provide post-launch support?',
    answer: 'Every project includes a complimentary 30-to-60-day post-launch warranty covering bug fixes, technical tuning, performance optimization, and video walk-through training for you and your staff. Long-term monthly maintenance packages are also available.'
  },
  {
    id: 'faq-8',
    category: 'ownership',
    question: 'Which technologies and frameworks do your freelancer developers specialize in?',
    answer: 'We build modern, ultra-fast web and mobile solutions using React, Next.js, TypeScript, Tailwind CSS, Node.js, Python, PostgreSQL, MongoDB, WordPress, Shopify, and Flutter. Every site is engineered for 95+ Google PageSpeed mobile scores, responsive typography, and enterprise-grade security.'
  }
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
            Transparent answers regarding custom pricing, 100% intellectual property ownership, milestone payments, and hiring verified freelancer website developers near you.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Questions' },
              { id: 'pricing', label: 'Pricing & Payments' },
              { id: 'ownership', label: 'Code & 100% IP' },
              { id: 'process', label: 'Delivery & Sprints' },
              { id: 'locations', label: 'Local Delhi & Remote' }
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

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-fade-in">
                    <p>{faq.answer}</p>
                  </div>
                )}
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
              Talk directly with our founder Rajeev Sharma
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Get an honest technical assessment, free architecture consultation, and itemized timeline with zero sales pressure.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenEnquiry}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer"
            >
              Start Free Project Brief
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
