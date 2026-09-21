import React from 'react';
import { API_BASE } from '../api';
import { Sparkles, ShieldCheck, Globe, ArrowRight, Phone, Mail, MessageSquare } from 'lucide-react';
import { ServiceDefinition } from '../types';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  services: ServiceDefinition[];
  onSelectService: (service: ServiceDefinition) => void;
  onNavigateSection: (sectionId: string) => void;
  onViewChange: (view: 'public' | 'admin' | 'freelancer') => void;
}

export const Footer: React.FC<FooterProps> = ({
  services,
  onSelectService,
  onNavigateSection,
  onViewChange
}) => {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-left text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Col 1 & 2: Brand & Direct Contact */}
          <div className="lg:col-span-2 space-y-4">
            {/* Authentic Freelancer Logo */}
            <BrandLogo iconSize={36} showSubtitle={false} />

            <p className="text-sm text-slate-800 font-semibold">
              Websites, apps, and digital engineering — 15+ years experience & 1,500+ delivered platforms.
            </p>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Work with vetted freelancers serving your city or available for remote sprints. Direct communication, guaranteed milestone protection, and zero agency markups.
            </p>

            {/* Direct Official Contact Buttons (NO raw numbers) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Direct Intake & Support:
              </p>
              
              <div className="flex items-center gap-2">
                <a
                  href="tel:+919711623561"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                  title="Click to direct dial"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call Now</span>
                </a>

                <a
                  href="https://wa.me/919711623561?text=Hi%20Rajeev,%20I%20am%20looking%20for%20a%20freelancer"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                  title="Chat on WhatsApp"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <a
                href="mailto:hello@erfreelancer.com"
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 transition-colors pt-1"
              >
                <Mail className="h-3.5 w-3.5 text-indigo-600" />
                <span>hello@erfreelancer.com</span>
              </a>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold pt-1">
              <ShieldCheck className="h-4 w-4" />
              <span>3,600+ Global Locations • 100% IP Code Ownership</span>
            </div>
          </div>

          {/* Col 3: 14 Services Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              14 Digital Services
            </h4>
            <ul className="space-y-2 text-xs">
              {services.slice(0, 7).map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => onSelectService(s)}
                    className="text-slate-600 hover:text-indigo-600 transition-colors text-left"
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Platform & Exploration */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Platform & Work
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><a data-testid="footer-blog-link" href="/blog" className="text-slate-600 transition-colors hover:text-indigo-600">Blog & insights</a></li>
              <li>
                <button onClick={() => onNavigateSection('world-map')} className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Worldwide Map (45+ Countries)</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('directory')} className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Find a Freelancer Near Me
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('locations-hub')} className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Locations Directory (3,600)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('work')} className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  <span>Delivered Work (1,500+ Sites)</span>
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] text-indigo-700 font-bold">
                    15 Yrs
                  </span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('how-it-works')} className="text-slate-600 hover:text-indigo-600 transition-colors">
                  How Projects Work
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('reviews')} className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Client Reviews (5.0★)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('faq')} className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Frequently Asked Questions (FAQ)
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('freelancer')} className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                  Join as Freelancer →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Administration & Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Governance & Links
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onViewChange('admin')} className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                  Admin Console (50.4k Ops)
                </button>
              </li>
              <li>
                <a data-testid="footer-sitemap" href={`${API_BASE}/api/sitemap.xml`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  XML Sitemap Shards
                </a>
              </li>
              <li>
                <a data-testid="footer-locations-export" href={`${API_BASE}/api/exports/locations-manifest.csv`} download className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Locations Manifest (.csv)
                </a>
              </li>
              <li>
                <a data-testid="footer-pages-export" href={`${API_BASE}/api/exports/pages-manifest.csv`} download className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Pages Manifest (.csv)
                </a>
              </li>
              <li>
                <span className="text-slate-400">100% Client IP Ownership Guarantee</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ER Freelancer Platform. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a href="tel:+919711623561" className="text-emerald-700 font-semibold hover:underline flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>Call Helpline</span>
            </a>
            <span>•</span>
            <a href="https://wa.me/919711623561" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold hover:underline flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>WhatsApp Support</span>
            </a>
            <span>•</span>
            <span>hello@erfreelancer.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
