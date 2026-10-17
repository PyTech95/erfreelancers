import React from 'react';

interface BrandLogoProps {
  className?: string;
  iconSize?: number;
  showSubtitle?: boolean;
  showBadge?: boolean;
  dark?: boolean;
}

// Original ER Freelancer mark (an "ER" monogram tile). Deliberately distinct from other marketplaces' logos.
export const BrandMark: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
    <defs>
      <linearGradient id="erf-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4F46E5" />
        <stop offset="1" stopColor="#0F766E" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#erf-g)" />
    <path d="M14 18h17v6H21v5h9v6h-9v5h10v6H14z" fill="#fff" />
    <path d="M35 18h9.5c5.2 0 8.5 3 8.5 7.6 0 3.3-1.7 5.7-4.5 6.8L54 46h-7.6l-4.4-12.6h-.4V46H35zm6.6 6v4.4h2.6c1.6 0 2.4-.8 2.4-2.2s-.8-2.2-2.4-2.2z" fill="#A7F3D0" />
  </svg>
);

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', iconSize = 36, showSubtitle = true, dark = false }) => (
  <span className={`flex items-center gap-2.5 select-none ${className}`}>
    <BrandMark size={iconSize} />
    <span className="flex flex-col text-left leading-none">
      <span className={`font-display text-xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
        ER <span className="text-indigo-600">Freelancer</span>
      </span>
      {showSubtitle && (
        <span className={`mt-1 text-[10px] font-semibold tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          Founder-led web, app &amp; growth team
        </span>
      )}
    </span>
  </span>
);
