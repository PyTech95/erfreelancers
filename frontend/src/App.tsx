import React, { useState, useEffect } from 'react';
import './responsive.css';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServiceLocationFinder } from './components/ServiceLocationFinder';
import { ServicesGrid } from './components/ServicesGrid';
import { WorldwideMap } from './components/WorldwideMap';
import { FounderFeature } from './components/FounderFeature';
import { FreelancerDirectory } from './components/FreelancerDirectory';
import { LocationsHub } from './components/LocationsHub';
import { LiveShowcase } from './components/LiveShowcase';
import { WorkflowTimeline } from './components/WorkflowTimeline';
import { TrustGuarantees } from './components/TrustGuarantees';
import { ClientReviews } from './components/ClientReviews';
import { FaqSection } from './components/FaqSection';
import { ServiceLocationDetail } from './components/ServiceLocationDetail';
import { EnquiryModal } from './components/EnquiryModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { apiFetch, getAdminToken, clearAdminToken } from './api';
import { applySeo } from './lib/seo';
import { FreelancerPortal } from './components/FreelancerPortal';
import { ChatbotWidget } from './components/ChatbotWidget';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ServiceDefinition, LocationEntity, FreelancerProfile } from './types';
import { Phone, MessageSquare } from 'lucide-react';
import BlogPage from './pages/BlogPage';

export default function App() {
  return window.location.pathname === '/blog' || window.location.pathname.startsWith('/blog/') ? <BlogPage /> : <MarketplaceApp />;
}

function MarketplaceApp() {
  const [currentView, setCurrentView] = useState<'public' | 'admin' | 'freelancer'>(() => window.location.pathname.startsWith('/admin') ? 'admin' : window.location.pathname.startsWith('/join-as-freelancer') ? 'freelancer' : 'public');
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [founder, setFounder] = useState<FreelancerProfile | null>(null);
  const [activeServiceLocation, setActiveServiceLocation] = useState<{
    service: ServiceDefinition;
    location: LocationEntity;
  } | null>(null);
  
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

  // Deep-link handling: /admin, /join-as-freelancer/, /locations/<country>/<city>/<service-slug>/
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      setCurrentView('admin');
    } else if (path.startsWith('/join-as-freelancer')) {
      setCurrentView('freelancer');
    } else if (path.startsWith('/locations/') && path.split('/').filter(Boolean).length >= 3) {
      apiFetch(`/api/pages/resolve?path=${encodeURIComponent(path)}`)
        .then(r => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.service && data?.location) {
            setActiveServiceLocation({ service: data.service as ServiceDefinition, location: data.location as LocationEntity });
          }
        })
        .catch(() => undefined);
    }
  }, []);

  // Keep URL + document title in sync with the active view (client-side SEO substitute)
  useEffect(() => {
    const defaultTitle = 'Best Freelancer Services Near Me | Freelance Website Designer & Developer | ER Freelancer';
    let path = '/';
    let title = defaultTitle;
    if (currentView === 'admin') {
      path = '/admin';
      title = 'Admin Dashboard | ER Freelancer';
    } else if (currentView === 'freelancer') {
      path = '/join-as-freelancer/';
      title = 'Join as a Freelancer | ER Freelancer';
    } else if (activeServiceLocation) {
      path = `${activeServiceLocation.location.canonicalPath}${activeServiceLocation.service.slug}/`;
      title = `Best Freelancer ${activeServiceLocation.service.title} in ${activeServiceLocation.location.name} | ER Freelancer`;
    }
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    applySeo({
      title,
      path,
      noindex: currentView === 'admin',
      description: activeServiceLocation
        ? `Hire a verified freelance ${activeServiceLocation.service.title} specialist in ${activeServiceLocation.location.name}. Direct call & WhatsApp coordination, 15+ years experience, 1,500+ delivered websites, 100% IP ownership.`
        : 'Looking for the best freelancer services near me? Hire top-rated freelancer website designers, full-stack web developers, and tech specialists in Delhi, Laxmi Nagar & 3,600+ cities worldwide. 15+ yrs experience, 1,500+ websites, 100% IP ownership. Call/WhatsApp: +91 97116 23561.',
    });
  }, [currentView, activeServiceLocation]);

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
    setActiveServiceLocation({ service, location });
    setCurrentView('public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectService = async (service: ServiceDefinition) => {
    try {
      const res = await apiFetch('/api/locations?search=delhi&limit=1');
      const data = await res.json();
      const loc = data.locations?.[0] || (await (await apiFetch('/api/locations?limit=1')).json()).locations?.[0];
      if (loc) {
        handleSelectServiceLocation(service, loc);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateSection = (sectionId: string) => {
    setActiveServiceLocation(null);
    setCurrentView('public');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Universal Top Header */}
      {!(currentView === 'admin' && adminAuthed) && <Header
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          if (view !== 'public') {
            setActiveServiceLocation(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenEnquiry={(sId, lId) => handleOpenEnquiry(sId, lId)}
        onNavigateSection={handleNavigateSection}
      />}

      {/* Main View Router */}
      <main className={currentView === 'admin' ? '' : 'pb-16 md:pb-0'}>
        {currentView === 'admin' ? (
          adminAuthed ? (
            <AdminDashboard onLogout={() => { clearAdminToken(); setAdminAuthed(false); }} />
          ) : (
            <AdminLogin onSuccess={() => setAdminAuthed(true)} />
          )
        ) : currentView === 'freelancer' ? (
          <FreelancerPortal services={services} />
        ) : activeServiceLocation ? (
          <ServiceLocationDetail
            service={activeServiceLocation.service}
            location={activeServiceLocation.location}
            onBack={() => {
              setActiveServiceLocation(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenEnquiry={(sId, lId, flId) => handleOpenEnquiry(sId, lId, flId)}
          />
        ) : (
          /* Public Client Experience */
          <div>
            <Hero
              onStartProject={(sId, locName) => handleOpenEnquiry(sId, locName)}
              onExploreServices={() => handleNavigateSection('services')}
              onSelectServiceLocation={(slug, path) => {
                apiFetch(`/api/pages/resolve?path=${encodeURIComponent(path + slug + '/')}`)
                  .then(r => r.json()).then(d => {
                    if (d.service && d.location) handleSelectServiceLocation(d.service, d.location);
                  }).catch(() => undefined);
              }}
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
                onOpenProfile={(slug) => handleNavigateSection('directory')}
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

            <LiveShowcase onOpenEnquiry={(serviceId) => handleOpenEnquiry(serviceId)} />

            <WorkflowTimeline />

            <TrustGuarantees onOpenEnquiry={() => handleOpenEnquiry()} />

            <ClientReviews onOpenEnquiry={() => handleOpenEnquiry()} />

            <FaqSection onOpenEnquiry={() => handleOpenEnquiry()} />
          </div>
        )}
      </main>

      {/* Universal Footer */}
      {currentView !== 'admin' && <Footer
        services={services}
        onSelectService={handleSelectService}
        onNavigateSection={handleNavigateSection}
        onViewChange={(view) => {
          setCurrentView(view);
          setActiveServiceLocation(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
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
      {currentView !== 'admin' && <ChatbotWidget
        currentServiceTitle={activeServiceLocation?.service.title}
        currentLocationName={activeServiceLocation?.location.name}
        onOpenEnquiryModal={() => handleOpenEnquiry()}
      />}

      {/* Mobile App-Style Bottom Navigation Menu (Fixed Bottom on Mobile) */}
      {currentView !== 'admin' && <MobileBottomNav
        onNavigateHome={() => {
          setActiveServiceLocation(null);
          setCurrentView('public');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateServices={() => {
          handleNavigateSection('services');
        }}
        onRequestCode={() => handleOpenEnquiry()}
      />}
    </div>
  );
}
