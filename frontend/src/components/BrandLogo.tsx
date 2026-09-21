import React from 'react';

interface BrandLogoProps {
  className?: string;
  iconSize?: number;
  showSubtitle?: boolean;
  showBadge?: boolean;
  dark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  iconSize = 36,
  showSubtitle = true,
  showBadge = true,
  dark = false
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Authentic Freelancer F-Mark SVG (Blue & Teal Origami Icon) */}
      <div 
        className="relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg 
          viewBox="0 0 130 126" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Top Blue Bar */}
          <path d="M28 6 L124 6 L100 34 L8 34 Z" fill="#2E37FE" />
          {/* Teal Polygon Facet */}
          <path d="M8 34 L62 34 L8 70 Z" fill="#13B59B" />
          {/* Lower Blue Wing and Stem */}
          <path d="M8 70 L62 34 L122 58 L54 78 L26 78 L26 100 L8 116 Z" fill="#2E37FE" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`text-xl font-extrabold tracking-tight font-display ${dark ? 'text-white' : 'text-slate-900'}`}>
            Freelancer
          </span>
          {showBadge && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              Verified
            </span>
          )}
        </div>
        {showSubtitle && (
          <span className={`text-[10px] font-semibold tracking-wide mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Hire Specialists Near You
          </span>
        )}
      </div>
    </div>
  );
};
