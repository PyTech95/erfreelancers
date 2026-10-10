import React, { lazy, Suspense, useState, useEffect } from 'react';
import './responsive.css';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServiceLocationFinder } from './components/ServiceLocationFinder';
import { ServicesGrid } from './components/ServicesGrid';
import { WorldwideMap } from './components/WorldwideMap';
import { FounderFeature } from './components/FounderFeature';
import { FreelancerDirectory } from './components/FreelancerDirectory';
import { LocationsHub } from './components/LocationsHub';
import { WorkShowcase } from './components/WorkShowcase';
import { WorkflowTimeline } from './components/WorkflowTimeline';
import { TrustGuarantees } from './components/TrustGuarantees';
import { ClientReviews } from './components/ClientReviews';
import { FaqSection } from './components/FaqSection';
import { EnquiryModal } from './components/EnquiryModal';
import { apiFetch, getAdminToken, clearAdminToken } from './api';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ServiceDefinition, LocationEntity, FreelancerProfile } from './types';
import { Phone, MessageSquare } from 'lucide-react';
import { applyPageMetadata, usePublicPage } from './publicPageData';
import { publicPath } from './publicRoutes';

const PublicPage = lazy(() => import('./pages/PublicPage'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminLogin = lazy(() => import('./components/AdminLogin').then(module => ({ default: module.AdminLogin })));
const FreelancerPortal = lazy(() => import('./components/FreelancerPortal').then(module => ({ default: module.FreelancerPortal })));
const ChatbotWidget = lazy(() => import('./components/ChatbotWidget').then(module => ({ default: module.ChatbotWidget })));

function HomeMetadata() {
  usePublicPage(`${window.location.pathname}${window.location.search}`);
  return null;
}

export default function App() {
  return <MarketplaceApp />;
}

function MarketplaceApp() {
  const currentPath = window.location.pathname;
  const pageQuery = new URLSearchParams(window.location.search).get('page');
  const hasNonDefaultPage = pageQuery !== null && pageQuery !== '1';
  const currentView: 'public' | 'admin' | 'freelancer' = (currentPath === '/admin' || currentPath.startsWith('/admin/')) ? 'admin' : !hasNonDefaultPage && (currentPath === '/join-as-freelancer' || currentPath === '/join-as-freelancer/') ? 'freelancer' : 'public';
  const isHomepage = currentPath === '/' && !hasNonDefaultPage;
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [founder, setFounder] = useState<FreelancerProfile | null>(null);
  const [adminAuthed, setAdminAuthed] = useState<boolean>(() => !!getAdminToken());
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryParams, setEnquiryParams] = useState<{
    serviceId?: string;
    locationId?: string;
    freelancerId?: string;
  }>({});

  // Initial metadata and data loading
  useEffect(() => {
    if (currentView === 'admin') return;
    const controller = new AbortController();
    fetchInitialData(controller.signal);
    return () => controller.abort();
  }, [currentView]);

  useEffect(() => {
    const onLogout = () => setAdminAuthed(false);
    window.addEventListener('erf-admin-logout', onLogout);
    return () => window.removeEventListener('erf-admin-logout', onLogout);
  }, []);

  // The pathname is the source of truth. Never replace a deep link during initial loading.
  useEffect(() => {
    if (currentView === 'public') return;
    applyPageMetadata({
      path: currentPath,
      title: currentView === 'admin' ? 'Admin login | ER Freelancer' : 'Join as a freelancer | ER Freelancer',
      description: currentView === 'admin' ? 'Secure administration for ER Freelancer.' : 'Create and manage your freelancer application.',
      robots: currentView === 'admin' ? 'noindex,nofollow' : 'noindex,follow'
    });
  }, [currentPath, currentView]);

  const fetchInitialData = async (signal?: AbortSignal) => {
    try {
      const [svcRes, founderRes] = await Promise.all([
        apiFetch('/api/services', { signal }),
        apiFetch('/api/founder', { signal })
      ]);
      const svcData = await svcRes.json();
      const founderData = await founderRes.json();
      if (signal?.aborted) return;
      setServices(svcData.services || []);
      setFounder(founderData.founder || null);
    } catch (err) {
      if (!signal?.aborted) console.error('Failed to load initial platform data:', err);
    }
  };

  const handleOpenEnquiry = (serviceId?: string, locationId?: string, freelancerId?: string) => {
    setEnquiryParams({ serviceId, locationId, freelancerId });
    setEnquiryOpen(true);
  };

  const handleSelectServiceLocation = (service: ServiceDefinition, location: LocationEntity) => {
    window.location.assign(`${publicPath(location.canonicalPath).replace(/\/?$/, '/')}${service.slug}/`);
  };

  const handleSelectService = (service: ServiceDefinition) => {
    window.location.assign(`/services/${service.slug}/`);
  };

  const handleViewChange = (view: 'public' | 'admin' | 'freelancer') => {
    window.location.assign(view === 'admin' ? '/admin' : view === 'freelancer' ? '/join-as-freelancer/' : '/');
  };

  const handleNavigateSection = (sectionId: string) => {
    if (!isHomepage) {
      window.location.assign(`/#${sectionId}`);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Universal Top Header */}
      {!(currentView === 'admin' && adminAuthed) && <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        onOpenEnquiry={(sId, lId) => handleOpenEnquiry(sId, lId)}
        onNavigateSection={handleNavigateSection}
      />}

      {/* Main View Router */}
      <main className={currentView === 'admin' ? '' : 'pb-16 md:pb-0'}>
        <Suspense fallback={<p role="status" className="mx-auto max-w-7xl px-6 py-20 text-slate-600">Loading page…</p>}>
        {currentView === 'admin' ? (
          adminAuthed ? (
            <AdminDashboard onLogout={() => { clearAdminToken(); setAdminAuthed(false); }} />
          ) : (
            <AdminLogin onSuccess={() => setAdminAuthed(true)} />
          )
        ) : currentView === 'freelancer' ? (
          <FreelancerPortal services={services} />
        ) : !isHomepage ? (
          <PublicPage onOpenEnquiry={handleOpenEnquiry} />
        ) : (
          /* Public Client Experience */
          <div>
            <HomeMetadata />
            <Hero
              onStartProject={(sId, locName) => handleOpenEnquiry(sId, locName)}
              onExploreServices={() => handleNavigateSection('services')}
              onSelectServiceLocation={(slug, path) => window.location.assign(`${publicPath(path).replace(/\/?$/, '/')}${slug}/`)}
            />

            <ServiceLocationFinder
              services={services}
              onSelectServiceLocation={handleSelectServiceLocation}
              onOpenEnquiry={handleOpenEnquiry}
            />

            <ServicesGrid
              services={services}
              onSelectService={handleSelectService}
              onOpenEnquiry={(sId) => handleOpenEnquiry(sId)}
            />

            {/* Interactive Worldwide Coverage Map */}
            <WorldwideMap
              services={services}
              onSelectServiceLocation={handleSelectServiceLocation}
              onOpenEnquiry={handleOpenEnquiry}
            />

            {founder && (
              <FounderFeature
                founder={founder}
                onOpenProfile={(slug) => window.location.assign(`/freelancers/${slug}/`)}
                onStartEnquiryWithFounder={(flId) => handleOpenEnquiry('S01', undefined, flId)}
              />
            )}

            <FreelancerDirectory
              services={services}
              onSelectFreelancerForBrief={(fl) => handleOpenEnquiry(fl.services[0], undefined, fl.id)}
              onViewServiceLocation={handleSelectServiceLocation}
            />

            <LocationsHub
              services={services}
              onSelectServiceLocation={handleSelectServiceLocation}
            />

            <WorkShowcase onOpenEnquiry={(serviceId) => handleOpenEnquiry(serviceId)} />

            <WorkflowTimeline />

            <TrustGuarantees onOpenEnquiry={() => handleOpenEnquiry()} />

            <ClientReviews onOpenEnquiry={() => handleOpenEnquiry()} />

            <FaqSection onOpenEnquiry={() => handleOpenEnquiry()} />
          </div>
        )}
        </Suspense>
      </main>

      {/* Universal Footer */}
      {currentView !== 'admin' && <Footer
        services={services}
        onSelectService={handleSelectService}
        onNavigateSection={handleNavigateSection}
        onViewChange={handleViewChange}
      />}

      {/* Conversion Project Brief Modal */}
      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        services={services}
        defaultServiceId={enquiryParams.serviceId}
        defaultLocationId={enquiryParams.locationId}
        defaultFreelancerId={enquiryParams.freelancerId}
      />

      {/* Floating Quick Direct Consultation Bar (Bottom Left) */}
      {currentView !== 'admin' && <div className="fixed bottom-5 left-5 z-40 hidden lg:flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md p-1.5 shadow-xl border border-slate-200/80">
        <a
          href="https://wa.me/919711623561?text=Hello%20Rajeev,%20I%20have%20a%20project%20enquiry"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all hover:scale-102"
          aria-label="Chat on WhatsApp"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>WhatsApp</span>
        </a>

        <a
          href="tel:+919711623561"
          className="flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all hover:scale-102"
          aria-label="Direct Phone Line"
        >
          <Phone className="h-3.5 w-3.5" />
          <span>Call: +91 97116 23561</span>
        </a>
      </div>}

      {/* AI Scoping Interactive Chatbot (Bottom Right) */}
      {currentView !== 'admin' && <Suspense fallback={null}><ChatbotWidget
        onOpenEnquiryModal={() => handleOpenEnquiry()}
      /></Suspense>}

      {/* Mobile App-Style Bottom Navigation Menu (Fixed Bottom on Mobile) */}
      {currentView !== 'admin' && <MobileBottomNav
        onNavigateHome={() => window.location.assign('/')}
        onNavigateServices={() => {
          handleNavigateSection('services');
        }}
        onRequestCode={() => handleOpenEnquiry()}
      />}
    </div>
  );
}
