// ─────────────────────────────────────────────
// EbosLogo — Reusable Vector Brand Logo Component
// Renders the sleek EBOS emblem + typography
// Props: size ('sm', 'md', 'lg'), showText (boolean), className
// ─────────────────────────────────────────────

export function EbosLogo({ size = 'md', showText = true, className = '' }) {
  // Size presets
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', subtext: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-2xl', subtext: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-4xl', subtext: 'text-xs' }
  };

  const { icon, text, subtext } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Mark SVG */}
      <div className={`relative shrink-0 ${icon}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="ebos-icon-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA"/>
              <stop offset="50%" stopColor="#2563EB"/>
              <stop offset="100%" stopColor="#4F46E5"/>
            </linearGradient>

            <linearGradient id="ebos-icon-gold" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B"/>
              <stop offset="100%" stopColor="#FBBF24"/>
            </linearGradient>
          </defs>

          {/* Outer Hex Shield */}
          <path 
            d="M 100 20 L 165 58 L 165 142 L 100 180 L 35 142 L 35 58 Z" 
            fill="none" 
            stroke="url(#ebos-icon-blue)" 
            strokeWidth="14" 
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* E Monogram & Growth Bars */}
          <path d="M 62 58 L 62 142" stroke="url(#ebos-icon-blue)" strokeWidth="14" strokeLinecap="round"/>
          <path d="M 62 65 L 135 65" stroke="url(#ebos-icon-blue)" strokeWidth="13" strokeLinecap="round"/>
          <path d="M 62 100 L 118 100" stroke="url(#ebos-icon-gold)" strokeWidth="13" strokeLinecap="round"/>
          <path d="M 62 135 L 138 135" stroke="url(#ebos-icon-blue)" strokeWidth="13" strokeLinecap="round"/>
          
          {/* Spark Dot */}
          <circle cx="138" cy="65" r="7" fill="url(#ebos-icon-gold)"/>
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className={`font-black tracking-tight bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent ${text}`}>
              EBOS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
          </div>
          <span className={`font-bold tracking-widest text-slate-400 uppercase mt-0.5 ${subtext}`}>
            Business OS
          </span>
        </div>
      )}
    </div>
  );
}
