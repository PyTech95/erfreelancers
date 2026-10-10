import React from 'react';
import { FileCheck, Globe, Phone, Mail, MessageSquare } from 'lucide-react';
import { ServiceDefinition } from '../types';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  services: ServiceDefinition[];
  onSelectService: (service: ServiceDefinition) => void;
  onNavigateSection: (sectionId: string) => void;
  onViewChange: (view: 'public' | 'admin' | 'freelancer') => void;
}

export const Footer: React.FC<FooterProps> = ({
  services
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
              Websites, apps, SEO, and AI automation — with 15 years of technical experience.
            </p>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Explore freelance digital services and worldwide remote collaboration. Discuss your requirements with Rajeev and agree the scope, milestones, and handover terms.
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
              <FileCheck className="h-4 w-4" />
              <span>Clear scope • Defined handover terms</span>
            </div>
          </div>

          {/* Col 3: 14 Services Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Digital Services
            </h4>
            <ul className="space-y-2 text-xs">
              {services.map((s) => (
                <li key={s.id}>
                  <a
                    href={`/services/${s.slug}/`}
                    className="text-slate-600 hover:text-indigo-600 transition-colors text-left"
                  >
                    {s.title}
                  </a>
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
              <li><a data-testid="footer-blog-link" href="/blog/" className="text-slate-600 transition-colors hover:text-indigo-600">Blog & insights</a></li>
              <li>
                <a href="/#world-map" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Worldwide Map</span>
                </a>
              </li>
              <li>
                <a href="/freelancers/" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Find a Freelancer
                </a>
              </li>
              <li>
                <a href="/locations/" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Locations Directory
                </a>
              </li>
              <li>
                <a href="/work/" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  <span>Project Work</span>
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] text-indigo-700 font-bold">
                    15 Yrs
                  </span>
                </a>
              </li>
              <li>
                <a href="/how-it-works/" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  How Projects Work
                </a>
              </li>
              <li>
                <a href="/#reviews" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Project Standards
                </a>
              </li>
              <li>
                <a href="/#faq" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Frequently Asked Questions (FAQ)
                </a>
              </li>
              <li>
                <a href="/join-as-freelancer/" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                  Join as Freelancer →
                </a>
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
                <a href="/admin" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                  Admin Console
                </a>
              </li>
              <li>
                <a data-testid="footer-sitemap" href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  XML Sitemap
                </a>
              </li>
              <li><a href="/about/" className="text-slate-600 hover:text-indigo-600">About Rajeev</a></li>
              <li><a href="/contact/" className="text-slate-600 hover:text-indigo-600">Contact</a></li>
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
