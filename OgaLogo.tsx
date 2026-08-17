import React from 'react';

interface OgaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'full' | 'compact' | 'badge-only';
}

export const OgaLogo: React.FC<OgaLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'full',
}) => {
  const sizeConfig = {
    sm: {
      badgeSize: 'w-8 h-8 rounded-xl',
      carIcon: 'w-4 h-4',
      titleSize: 'text-sm font-black',
      tagSize: 'text-[9px] px-1.5 py-0.5',
      subSize: 'text-[10px]',
      gap: 'gap-2',
    },
    md: {
      badgeSize: 'w-10 h-10 rounded-2xl',
      carIcon: 'w-5 h-5',
      titleSize: 'text-base font-black',
      tagSize: 'text-[10px] px-2 py-0.5',
      subSize: 'text-[11px]',
      gap: 'gap-3',
    },
    lg: {
      badgeSize: 'w-12 h-12 rounded-2xl',
      carIcon: 'w-6 h-6',
      titleSize: 'text-xl font-black',
      tagSize: 'text-[11px] px-2.5 py-0.5',
      subSize: 'text-xs',
      gap: 'gap-3.5',
    },
    xl: {
      badgeSize: 'w-16 h-16 rounded-3xl',
      carIcon: 'w-8 h-8',
      titleSize: 'text-2xl font-black',
      tagSize: 'text-xs px-3 py-1',
      subSize: 'text-sm',
      gap: 'gap-4',
    },
  }[size];

  return (
    <div className={`flex items-center ${sizeConfig.gap} select-none ${className}`}>
      {/* 3D Glowing Orange Squircle Car Badge */}
      <div
        className={`relative shrink-0 ${sizeConfig.badgeSize} flex items-center justify-center transition-transform hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, #ff8c00 0%, #e65100 50%, #bf360c 100%)',
          boxShadow:
            '0 4px 14px rgba(230, 81, 0, 0.45), inset 0 2px 2px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.35)',
          border: '1.5px solid rgba(255, 214, 153, 0.4)',
        }}
      >
        {/* Ambient Outer Glow */}
        <div
          className="absolute -inset-1 rounded-2xl opacity-60 blur-sm pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,140,0,0.6) 0%, transparent 70%)' }}
        />

        {/* Crisp 3D Neon Outline Car Icon */}
        <svg
          className={`${sizeConfig.carIcon} relative z-10 text-amber-100`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5)) drop-shadow(0 0 4px rgba(255,235,59,0.8))',
          }}
        >
          {/* Detailed Modern SUV / Vehicle Contour matching Logo.jpeg */}
          <path d="M4 15V10c0-1.1.9-2 2-2h2.5c.7 0 1.3-.3 1.7-.8L12 5h4.5c.8 0 1.5.5 1.8 1.2L19.5 9H20c1.1 0 2 .9 2 2v4" />
          <path d="M4 15h1.5" />
          <path d="M9.5 15h5" />
          <path d="M18.5 15H20" />
          <circle cx="7.5" cy="15.5" r="2" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <circle cx="16.5" cy="15.5" r="2" fill="none" stroke="currentColor" strokeWidth="2.2" />
        </svg>
      </div>

      {variant !== 'badge-only' && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            {/* 3D Metallic Gold & Chrome Brand Typography */}
            <span
              className={`${sizeConfig.titleSize} tracking-tight`}
              style={{
                letterSpacing: '-0.02em',
              }}
            >
              {/* OGA - 3D Metallic Gold */}
              <span
                style={{
                  background: 'linear-gradient(180deg, #fff3b0 0%, #f6d365 30%, #fda085 70%, #d4af37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8)) drop-shadow(0 2px 3px rgba(0,0,0,0.6))',
                  fontWeight: 900,
                  marginRight: '3px',
                }}
              >
                OGA
              </span>
              {/* Fleet - 3D Metallic Chrome Silver */}
              <span
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 40%, #94a3b8 70%, #64748b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8)) drop-shadow(0 2px 3px rgba(0,0,0,0.5))',
                  fontWeight: 800,
                }}
              >
                Fleet
              </span>
            </span>

            {/* 3D Embossed Gold ENTERPRISE Pill Badge */}
            <div
              className={`font-black uppercase tracking-wider ${sizeConfig.tagSize} rounded-md text-slate-950 flex items-center justify-center`}
              style={{
                background: 'linear-gradient(180deg, #fae084 0%, #e5b94c 50%, #c49a33 100%)',
                boxShadow:
                  '0 2px 5px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -1px 2px rgba(0,0,0,0.4)',
                border: '1px solid #785a1a',
                color: '#2a1a04',
                textShadow: '0 1px 0 rgba(255,255,255,0.4)',
              }}
            >
              ENTERPRISE
            </div>
          </div>

          {/* Subtitle */}
          {showSubtitle && (
            <p
              className={`${sizeConfig.subSize} text-slate-300 font-normal tracking-wide whitespace-nowrap mt-0.5`}
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              }}
            >
              ระบบจองยานพาหนะ OGA International
            </p>
          )}
        </div>
      )}
    </div>
  );
};
