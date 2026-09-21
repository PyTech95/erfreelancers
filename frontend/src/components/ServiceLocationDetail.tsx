import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { applySeo } from '../lib/seo';
import {
  MapPin,
  Briefcase,
  Clock,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Globe,
  Share2,
  ChevronRight,
  Sparkles,
  UserCheck,
  Building,
  FileCode,
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Lock
} from 'lucide-react';
import { ServiceDefinition, LocationEntity, PageRecord, FreelancerProfile, Lead } from '../types';

interface ServiceLocationDetailProps {
  service: ServiceDefinition;
  location: LocationEntity;
  onBack: () => void;
  onOpenEnquiry: (serviceId: string, locationId: string, freelancerId?: string) => void;
}

export const ServiceLocationDetail: React.FC<ServiceLocationDetailProps> = ({
  service,
  location,
  onBack,
  onOpenEnquiry
}) => {
  const [pageRecord, setPageRecord] = useState<PageRecord | null>(null);
  const [matchingFreelancers, setMatchingFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Top Contact Form State
  const [clientName, setClientName] = useState('');
  const [phoneOrWhatsApp, setPhoneOrWhatsApp] = useState('');
  const [email, setEmail] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [timeline, setTimeline] = useState('Within 4 weeks');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    loadPageData();
  }, [service.id, location.id]);

  const loadPageData = async () => {
    setLoading(true);
    try {
      const path = `${location.canonicalPath}${service.slug}/`;
      const res = await apiFetch(`/api/pages/resolve?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.page) {
        setPageRecord(data.page);
        const seo = data.page.contentPackage?.seo;
        applySeo({
          title: seo?.title || `Best Freelancer ${service.title} in ${location.name} | ER Freelancer`,
          description: seo?.description,
          path,
        });
      }

      // Fetch matching specialists for this service & location
      const flRes = await apiFetch(`/api/freelancers?serviceId=${service.id}&locationId=${location.id}`);
      const flData = await flRes.json();
      setMatchingFreelancers(flData.freelancers || []);
    } catch (err) {
      console.error('Failed to load service location page:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !phoneOrWhatsApp || !projectDescription) {
      setSubmitError('Please complete name, phone/WhatsApp, and project details.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const idempotencyKey = `top-lead-${Date.now()}-${clientName.replace(/\s+/g, '').toLowerCase()}`;
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          clientName,
          contactMethod: 'Phone/WhatsApp',
          contactValue: `${phoneOrWhatsApp}${email ? ` | ${email}` : ''}`,
          serviceId: service.id,
          locationId: location.id,
          locationName: `${location.name}, ${location.countryName}`,
          timeline,
          budgetRange: budgetRange || 'Custom / Open',
          projectDescription,
          sourcePageUrl: window.location.pathname,
          consentGiven: true,
          routingMode: 'platform_first'
        })
      });

      const data = await res.json();
      if (data.success && data.lead) {
        setSubmittedLead(data.lead);
        setClientName('');
        setPhoneOrWhatsApp('');
        setEmail('');
        setProjectDescription('');
      } else {
        setSubmitError(data.error || 'Failed to submit proposal request.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 bg-white text-center text-slate-500 space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-semibold">Resolving {service.title} in {location.name}...</p>
      </div>
    );
  }

  const pkg = pageRecord?.contentPackage;
  const origin = window.location.origin;
  const canonicalUrl = `${origin}${pkg?.canonical_path || location.canonicalPath + service.slug + '/'}`;

  // Complete Schema.org Graph for Google SEO indexing & rich snippets
  const pageHeading = pkg?.hero.heading || `Best Freelancer ${service.title} in ${location.name}`;
  const seoKeywords = [
    `freelancer website designer in ${location.name}`,
    `freelancer website developer in ${location.name}`,
    `best freelancer in ${location.name}`,
    `best freelancer services in ${location.name}`,
    'freelancer near me',
    'freelance website designer near me',
    `freelancer in ${location.name}`
  ].join(', ');

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        'url': origin,
        'name': 'ER Freelancer',
        'description': 'Freelance-led digital services platform connecting businesses with verified specialists worldwide.'
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${canonicalUrl}#service`,
        'name': pageHeading,
        'url': canonicalUrl,
        'telephone': '+919711623561',
        'email': 'hello@erfreelancer.com',
        'description': pkg?.seo.description,
        'priceRange': '$$',
        'keywords': seoKeywords,
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': location.name,
          'addressCountry': location.countryName
        },
        'areaServed': {
          '@type': 'City',
          'name': location.name
        },
        'provider': {
          '@type': 'Organization',
          'name': 'ER Freelancer',
          'telephone': '+919711623561',
          'email': 'hello@erfreelancer.com',
          'url': origin
        }
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${origin}/` },
          { '@type': 'ListItem', 'position': 2, 'name': location.countryName, 'item': `${origin}/locations/${location.countryName.toLowerCase().replace(/ /g, '-')}/` },
          { '@type': 'ListItem', 'position': 3, 'name': location.name, 'item': `${origin}${location.canonicalPath}` },
          { '@type': 'ListItem', 'position': 4, 'name': service.title, 'item': canonicalUrl }
        ]
      },
      {
        '@type': 'FAQPage',
        'mainEntity': (pkg?.faqs || []).map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer
          }
        }))
      }
    ]
  };

  return (
    <div data-testid="service-location-page" className="detail-page bg-white min-h-screen text-left pb-24 text-slate-800">
      {/* Schema.org JSON-LD Script tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      {/* Top Breadcrumb & Fast Contact Bar */}
      <div className="border-b border-slate-200 bg-slate-50 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            data-testid="detail-back"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Explorer</span>
          </button>

          {/* Direct call & whatsapp buttons */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <a
              href="tel:+919711623561"
              className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call Helpline</span>
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://wa.me/919711623561"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp Chat</span>
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="mailto:hello@erfreelancer.com"
              className="hidden md:flex items-center gap-1.5 text-slate-600 hover:text-indigo-600"
            >
              <Mail className="h-3.5 w-3.5 text-indigo-500" />
              <span>hello@erfreelancer.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Hero Section with Immediate TOP CONTACT FORM (Above the fold) */}
      <div className="border-b border-slate-200 bg-slate-50/50 py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Col: Headings, Location Context, Deliverables (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div data-testid="detail-location" className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs">
                <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                <span className="font-bold text-slate-900">{location.name}, {location.countryName}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-500 text-[11px]">{location.timezone}</span>
              </div>

              <h1 data-testid="detail-heading" className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-slate-900 font-display leading-[1.15]">
                {pkg?.hero.heading || `Freelance ${service.title} in ${location.name}`}
              </h1>

              {/* Target Search Keywords & SEO Intent Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 mr-0.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>Top Searches:</span>
                </span>
                <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                  Freelancer Website Designer in {location.name}
                </span>
                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  Best Freelancer Services in {location.name}
                </span>
                <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-semibold text-purple-800">
                  Freelancer Near Me
                </span>
                <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  Best Freelancer in {location.name}
                </span>
              </div>

              {/* Neighborhoods & Local Hubs Coverage (e.g., Laxmi Nagar, CP, etc. for Delhi) */}
              {location.name.toLowerCase().includes('delhi') && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 text-xs shadow-xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <MapPin className="h-3 w-3 text-emerald-600" />
                    <span>Serving All Key Delhi NCR Hubs & Neighborhoods:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {['Laxmi Nagar', 'Connaught Place', 'Saket', 'Hauz Khas', 'Dwarka', 'Rohini', 'Nehru Place', 'Karol Bagh', 'Noida', 'Gurugram'].map((nh) => (
                      <span key={nh} className="rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-slate-700 font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                        Freelancer in {nh}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                {pkg?.hero.summary}
              </p>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Direct Line</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Talk to the developer</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>100% IP</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Full code handover</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                    <span>24h Quote</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Itemized milestone brief</p>
                </div>
              </div>

              {/* Production Deliverables Highlights */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Key Scope Deliverables for {location.name}:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  {service.deliverables.slice(0, 4).map((d, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Communication Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <a
                  href="https://wa.me/919711623561?text=Hello%20Rajeev,%20I%20need%20a%20quote%20for%20a%20project"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-xs"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href="tel:+919711623561"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-xs"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* Right Col: IMMEDIATE TOP CONTACT FORM (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="brief-panel rounded-xl border border-slate-200 bg-white p-6 shadow-md relative">
                
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Instant Scope & Proposal</span>
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 font-display mt-0.5">
                      Get a Fixed-Price Brief
                    </h2>
                  </div>
                  <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-700">
                    24h Turnaround
                  </span>
                </div>

                {submittedLead ? (
                  <div data-testid="detail-brief-success" role="status" className="py-8 text-center space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">
                      Project Brief Received!
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Thank you, <strong className="text-slate-900">{submittedLead.clientName}</strong>. Your enquiry for {service.title} in {location.name} has been routed. We will contact you at {submittedLead.contactValue} within 24 hours.
                    </p>
                    <p className="text-[11px] font-mono text-indigo-600">
                      Record ID: {submittedLead.id}
                    </p>
                    <button
                      data-testid="detail-submit-another"
                      onClick={() => setSubmittedLead(null)}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                    >
                      Submit Another Requirement
                    </button>
                  </div>
                ) : (
                  <form data-testid="detail-brief-form" onSubmit={handleTopFormSubmit} className="space-y-3.5">
                    {submitError && (
                      <div data-testid="detail-brief-error" role="alert" className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
                        {submitError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        data-testid="detail-name-input"
                        aria-label="Your name"
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Rahul Sharma / Sarah Jenkins"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Phone or WhatsApp *
                        </label>
                        <input
                          data-testid="detail-phone-input"
                          aria-label="Phone or WhatsApp"
                          type="tel"
                          required
                          value={phoneOrWhatsApp}
                          onChange={(e) => setPhoneOrWhatsApp(e.target.value)}
                          placeholder="Contact phone/WhatsApp"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Email Address (Optional)
                        </label>
                        <input
                          data-testid="detail-email-input"
                          aria-label="Email address"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@company.com"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Project Description & Scope *
                      </label>
                      <textarea
                        data-testid="detail-project-input"
                        aria-label="Project description"
                        rows={3}
                        required
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder={`Describe what you want built or improved for your ${location.name} project...`}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Your Target Budget
                        </label>
                        <input
                          data-testid="detail-budget-input"
                          aria-label="Target budget"
                          type="text"
                          value={budgetRange}
                          onChange={(e) => setBudgetRange(e.target.value)}
                          placeholder="e.g. ₹20,000 / $1,000"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Target Launch
                        </label>
                        <select
                          data-testid="detail-timeline-select"
                          aria-label="Target launch"
                          value={timeline}
                          onChange={(e) => setTimeline(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 focus:outline-none"
                        >
                          <option value="1-2 weeks">1-2 weeks (Sprint)</option>
                          <option value="Within 4 weeks">Within 4 weeks</option>
                          <option value="2-3 months">2-3 months</option>
                          <option value="Flexible">Flexible</option>
                        </select>
                      </div>
                    </div>

                    <button
                      data-testid="detail-brief-submit"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 px-4 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSubmitting ? 'Submitting Brief...' : `Submit Brief for ${location.name}`}</span>
                    </button>

                    <div className="flex flex-wrap gap-3 items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Lock className="h-3 w-3 text-emerald-600" />
                        <span>100% NDA Protection</span>
                      </span>
                      <a href="tel:+919711623561" className="text-indigo-600 hover:text-indigo-800 font-bold">
                        Call Helpline
                      </a>
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Rich Content Sections */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Authoritative Articles & Deliverable Breakdowns (8 Cols) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Rich Sections */}
            {pkg?.sections.map((sec) => (
              <article key={sec.id} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display mb-4">
                  {sec.title}
                </h2>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line space-y-3">
                  {sec.content}
                </div>
              </article>
            ))}

            {/* Structured Deliverables Checklist */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 font-display mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span>Complete Deliverables & Acceptance Checklist</span>
              </h2>
              <div className="space-y-3">
                {service.deliverables.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contextual FAQs with Schema Markup */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-indigo-600" />
                    <span>Frequently Asked Questions for {location.name}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Clear answers on pricing, delivery modes, intellectual property rights, and warranties.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {pkg?.faqs.map((faq, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Live Specialist Availability & Metadata (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Live Freelancer Matching Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 font-display mb-1 flex items-center justify-between">
                <span>Matching Specialists</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  Verified
                </span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Specialists serving {location.name} in {location.timezone}:
              </p>

              <div className="space-y-3">
                {matchingFreelancers.map(({ profile, isLocal, matchReason }) => (
                  <div
                    key={profile.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 hover:border-indigo-400 transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">
                          {profile.displayName}
                        </span>
                        <span className="text-[11px] font-semibold text-indigo-700 block">
                          {profile.primaryTitle || 'Senior Specialist'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {profile.baseLocationName || profile.timezone}
                        </span>
                      </div>
                      {isLocal ? (
                        <span className="rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Local Base
                        </span>
                      ) : (
                        <span className="rounded bg-indigo-100 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                          Remote
                        </span>
                      )}
                    </div>

                    {profile.qualifications && profile.qualifications.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {profile.qualifications.map((q: string, qIdx: number) => (
                          <span key={qIdx} className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
                            🎓 {q}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {profile.bio}
                    </p>

                    <button
                      data-testid={`detail-assign-${profile.id}`}
                      onClick={() => onOpenEnquiry(service.id, location.id, profile.id)}
                      className="w-full mt-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-1.5 px-3 text-[11px] font-bold text-white transition-colors shadow-xs"
                    >
                      Assign Brief to {profile.displayName}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Contact Card */}
            <div className="rounded-2xl border border-slate-200 bg-indigo-50/50 p-6 space-y-3 text-xs shadow-xs">
              <h3 className="font-bold text-slate-900 font-display text-sm">
                Direct Contact Desk
              </h3>
              <p className="text-slate-600">
                Prefer to discuss your project requirements immediately over phone or WhatsApp?
              </p>
              <div className="space-y-2 pt-1">
                <a
                  href="tel:+919711623561"
                  className="flex items-center gap-2 text-indigo-700 font-bold hover:underline"
                >
                  <Phone className="h-4 w-4 text-indigo-600" />
                  <span>Call Now</span>
                </a>
                <a
                  href="mailto:hello@erfreelancer.com"
                  className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <Mail className="h-4 w-4 text-indigo-600" />
                  <span>hello@erfreelancer.com</span>
                </a>
                <a
                  href="https://wa.me/919711623561?text=Hi%20Rajeev,%20I%20want%20to%20discuss%20a%20project"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-bold"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp Consultation 24/7</span>
                </a>
              </div>
            </div>

            {/* Page Value Evidence & Provenance Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 text-xs shadow-xs">
              <h3 className="font-bold text-slate-900 font-display text-sm">
                Page Value & Quality Provenance
              </h3>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Lifecycle State:</span>
                  <span className="font-bold text-emerald-700 uppercase">{pageRecord?.lifecycleState}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Quality Score:</span>
                  <span className="font-bold text-slate-900">{pageRecord?.qualityScore}/100 (Pass)</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Revision:</span>
                  <span className="font-mono text-slate-800">v{pageRecord?.revision}.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Canonical Path:</span>
                  <span className="font-mono text-indigo-600 truncate max-w-[180px]">{pkg?.canonical_path}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
