import React from 'react';
import { Home, Briefcase, Phone, FileCode2 } from 'lucide-react';

interface MobileBottomNavProps {
  currentSection?: string;
  onNavigateHome: () => void;
  onNavigateServices: () => void;
  onRequestCode: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentSection = 'home',
  onNavigateHome,
  onNavigateServices,
  onRequestCode,
}) => {
  return (
    <nav
      id="mobile-bottom-menu"
      data-testid="mobile-bottom-menu"
      aria-label="Mobile Navigation Menu"
      className="fixed bottom-0 left-0 right-0 z-50 block md:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-[0_-6px_25px_rgba(0,0,0,0.08)] safe-area-pb"
    >
      <div className="grid grid-cols-5 items-center h-16 px-1 max-w-md mx-auto">
        
        {/* 1. Home */}
        <button
          onClick={onNavigateHome}
          id="mobile-nav-home"
          data-testid="mobile-nav-home"
          type="button"
          className="group flex flex-col items-center justify-center py-1 text-slate-600 active:scale-95 transition-all hover:text-indigo-600 focus:outline-none"
          aria-label="Home"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full transition-colors group-hover:bg-indigo-50">
            <Home className="h-5 w-5 transition-transform group-hover:scale-110" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-slate-700 group-hover:text-indigo-600 mt-0.5">
            Home
          </span>
        </button>

        {/* 2. Services */}
        <button
          onClick={onNavigateServices}
          id="mobile-nav-services"
          data-testid="mobile-nav-services"
          type="button"
          className="group flex flex-col items-center justify-center py-1 text-slate-600 active:scale-95 transition-all hover:text-indigo-600 focus:outline-none"
          aria-label="Services"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full transition-colors group-hover:bg-indigo-50">
            <Briefcase className="h-5 w-5 transition-transform group-hover:scale-110" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-slate-700 group-hover:text-indigo-600 mt-0.5">
            Services
          </span>
        </button>

        {/* 3. Call (Direct Auto-Dial) */}
        <a
          href="tel:+919711623561"
          id="mobile-nav-call"
          data-testid="mobile-nav-call"
          className="group flex flex-col items-center justify-center py-1 text-emerald-600 active:scale-95 transition-all hover:text-emerald-700 focus:outline-none"
          aria-label="Direct Phone Call"
          title="Call Now"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 transition-transform group-hover:scale-110 group-hover:bg-emerald-100 shadow-xs">
            <Phone className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-emerald-700 mt-0.5">
            Call
          </span>
        </a>

        {/* 4. WhatsApp (Direct WhatsApp Scoping) */}
        <a
          href="https://wa.me/919711623561?text=Hi%20Rajeev,%20I%20am%20looking%20for%20a%20freelancer%20near%20me"
          target="_blank"
          rel="noreferrer"
          id="mobile-nav-whatsapp"
          data-testid="mobile-nav-whatsapp"
          className="group flex flex-col items-center justify-center py-1 active:scale-95 transition-all focus:outline-none"
          aria-label="WhatsApp Chat"
          title="WhatsApp Now"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white transition-transform group-hover:scale-110 group-hover:bg-emerald-600 shadow-xs">
            {/* Clean Vector WhatsApp Icon */}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.969.586 1.761.88 2.796.88 3.18 0 5.767-2.587 5.767-5.766.001-3.182-2.585-5.766-5.767-5.766zm3.392 8.232c-.145.409-.844.757-1.182.784-.337.027-.723.136-2.316-.523-1.637-.677-2.673-2.342-2.755-2.451-.082-.11-.655-.873-.655-1.662 0-.79.412-1.18.558-1.341.145-.162.317-.202.423-.202.106 0 .212.002.304.007.097.005.228-.037.356.271.134.32.459 1.118.5 1.2.041.082.069.178.014.288-.055.109-.083.178-.164.273-.082.096-.172.214-.246.287-.082.082-.168.172-.072.336.096.165.426.702.914 1.137.628.559 1.157.732 1.322.814.165.082.261.069.358-.041.096-.11.412-.48.522-.644.11-.165.22-.137.37-.082.151.055.955.45 1.119.532.165.083.275.123.315.192.042.069.042.399-.103.808z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold tracking-tight text-emerald-600 mt-0.5">
            WhatsApp
          </span>
        </a>

        {/* 5. Request Code */}
        <button
          onClick={onRequestCode}
          id="mobile-nav-request-code"
          data-testid="mobile-nav-request-code"
          type="button"
          className="group flex flex-col items-center justify-center py-1 active:scale-95 transition-all focus:outline-none"
          aria-label="Request Code"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25 transition-transform group-hover:scale-110">
            <FileCode2 className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-indigo-700 group-hover:text-indigo-800 mt-0.5 whitespace-nowrap">
            Request Code
          </span>
        </button>

      </div>
    </nav>
  );
};
