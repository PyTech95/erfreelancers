import React, { useState } from 'react';
import { Star, CheckCircle2, Quote, Building2, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

interface Review {
  id: string;
  clientName: string;
  role: string;
  company: string;
  city: string;
  country: string;
  projectType: string;
  rating: number;
  date: string;
  reviewText: string;
  metricHighlight: string;
}

const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    clientName: 'Vikram Malhotra',
    role: 'Founder & Managing Director',
    company: 'Nexus Health Logistics',
    city: 'Delhi',
    country: 'India',
    projectType: 'Custom React Web Portal & Logistics Dashboard',
    rating: 5,
    date: 'February 2026',
    reviewText: 'Rajeev and his team delivered what 2 previous agencies failed to deliver in 6 months. Having direct engineer access over WhatsApp made all the difference. Our customer booking speed increased 3x and we own 100% of our code.',
    metricHighlight: '3x faster bookings • 100% IP handed over'
  },
  {
    id: 'rev-2',
    clientName: 'Elena Rostova',
    role: 'Head of Growth',
    company: 'Aura Lifestyle Apparel',
    city: 'Dubai',
    country: 'UAE',
    projectType: 'High-Converting Shopify Plus Custom Theme',
    rating: 5,
    date: 'January 2026',
    reviewText: 'We needed a luxury ecommerce store built with custom payment integrations for GCC and Stripe. Delivery was on time in just 12 days, perfectly responsive on mobile, with a PageSpeed score of 96. Exceptional freelancer craft.',
    metricHighlight: '12-day launch • 96 PageSpeed score'
  },
  {
    id: 'rev-3',
    clientName: 'Anil Singhania',
    role: 'CEO',
    company: 'Singhania Real Estate Advisory',
    city: 'Noida / Laxmi Nagar',
    country: 'India',
    projectType: 'Real Estate Portal & CRM Lead Engine',
    rating: 5,
    date: 'March 2026',
    reviewText: 'I was looking for a top freelancer website designer near me in Laxmi Nagar / Delhi. Finding Rajeev was a blessing. He visited our office, understood our property listing workflow, and built a custom search portal that doubled our inbound inquiries.',
    metricHighlight: 'Local Laxmi Nagar presence • 2x lead growth'
  },
  {
    id: 'rev-4',
    clientName: 'David K. Bennett',
    role: 'Co-Founder & CTO',
    company: 'Synapse AI Automation',
    city: 'London',
    country: 'United Kingdom',
    projectType: 'Next.js SaaS MVP & Stripe Subscription Flow',
    rating: 5,
    date: 'December 2025',
    reviewText: 'The quality of TypeScript code and clean modular architecture was on par with senior Silicon Valley engineers. Saved us over $25,000 compared to London agency quotes. Zero bureaucracy, pure engineering velocity.',
    metricHighlight: 'Saved $25k+ vs agencies • 100% on schedule'
  },
  {
    id: 'rev-5',
    clientName: 'Pooja Iyer',
    role: 'Director of Marketing',
    company: 'Kavya Organics & Wellness',
    city: 'Bengaluru',
    country: 'India',
    projectType: 'D2C Ecommerce & WhatsApp Automated Checkout',
    rating: 5,
    date: 'January 2026',
    reviewText: 'The automated WhatsApp ordering and payment integration transformed our business. Our cart abandonment dropped by 42% within the first two weeks of launching the new site. Highly recommended for serious brands.',
    metricHighlight: '42% lower cart dropoff • WhatsApp CRM'
  },
  {
    id: 'rev-6',
    clientName: 'Marcus Lindqvist',
    role: 'Operations Lead',
    company: 'Nordic Dental Network',
    city: 'Stockholm',
    country: 'Sweden',
    projectType: 'Multi-Clinic Appointment & Patient Booking App',
    rating: 5,
    date: 'November 2025',
    reviewText: 'Clear milestones, transparent pricing, and instant communication. We released milestone payments only after testing on staging. Complete peace of mind and pristine code documentation.',
    metricHighlight: 'Zero upfront risk • Milestone protected'
  }
];

interface ClientReviewsProps {
  onOpenEnquiry: () => void;
}

export const ClientReviews: React.FC<ClientReviewsProps> = ({ onOpenEnquiry }) => {
  const [filter, setFilter] = useState<'all' | 'india' | 'international'>('all');

  const filteredReviews = filter === 'all'
    ? REVIEWS
    : filter === 'india'
    ? REVIEWS.filter(r => r.country === 'India')
    : REVIEWS.filter(r => r.country !== 'India');

  return (
    <section id="reviews" className="py-20 bg-white border-t border-slate-200 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 mb-3 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Client Feedback • 5.0 Star Rating Across 1,500+ Projects</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              Client Reviews & Verified Results
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              See what founders, business owners, and engineering leaders say about working directly with Rajeev Sharma and our verified freelance network.
            </p>
          </div>

          {/* Location / Scope Filter */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Reviews ({REVIEWS.length})
            </button>
            <button
              onClick={() => setFilter('india')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filter === 'india'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delhi & India
            </button>
            <button
              onClick={() => setFilter('international')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filter === 'international'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Global / Remote
            </button>
          </div>
        </div>

        {/* Rating Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">5.0 / 5.0</div>
            <div className="flex justify-center items-center gap-1 my-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400" />
              ))}
            </div>
            <div className="text-[11px] font-semibold text-slate-500">Average Client Rating</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">1,500+</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-2">Delivered Websites & Apps</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">100%</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-2">IP & Code Handover</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">0%</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-2">Agency Markup Bloat</div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Stars & Metric */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Verified Project
                  </span>
                </div>

                {/* Outcome Badge */}
                <div className="rounded-lg bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-900 mb-4">
                  {rev.metricHighlight}
                </div>

                {/* Review Body */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-4">
                  "{rev.reviewText}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-slate-100 mt-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {rev.clientName}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      <span>{rev.company}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                      <MapPin className="h-3 w-3 text-indigo-500" />
                      <span>{rev.city}</span>
                    </span>
                    <p className="text-[10px] text-slate-400">{rev.date}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Link */}
        <div className="mt-12 text-center">
          <button
            onClick={onOpenEnquiry}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <span>Get Your Project Started With Zero Risk</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
