import React from 'react';

interface RaritySymbolIconProps {
  symbolType: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const STAR_POINTS = "12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26";

export const RaritySymbolIcon: React.FC<RaritySymbolIconProps> = ({
  symbolType,
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
    xl: 'w-12 h-12'
  };

  const dimension = sizeMap[size] || sizeMap.md;

  // Render based on symbol_type
  switch (symbolType) {
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" className={`${dimension} ${className}`} aria-label="Comum (Bolinha)">
          <circle cx="12" cy="12" r="8" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
        </svg>
      );

    case 'diamond':
      return (
        <svg viewBox="0 0 24 24" className={`${dimension} ${className}`} aria-label="Incomum (Losango)">
          <polygon points="12,2 22,12 12,22 2,12" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      );

    case 'black-star':
      return (
        <svg viewBox="0 0 24 24" className={`${dimension} ${className}`} aria-label="Rara (Estrela preta)">
          <polygon points={STAR_POINTS} fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
        </svg>
      );

    case 'double-black-star':
      return (
        <svg viewBox="0 0 44 24" className={`h-6 w-11 ${size === 'lg' ? 'h-9 w-16' : size === 'xl' ? 'h-12 w-22' : size === 'sm' ? 'h-4 w-7' : ''} ${className}`} aria-label="Dupla Rara (Duas estrelas pretas)">
          <g transform="translate(0, 0)">
            <polygon points={STAR_POINTS} fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
          </g>
          <g transform="translate(20, 0)">
            <polygon points={STAR_POINTS} fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
          </g>
        </svg>
      );

    case 'double-silver-star':
      return (
        <svg viewBox="0 0 44 24" className={`h-6 w-11 ${size === 'lg' ? 'h-9 w-16' : size === 'xl' ? 'h-12 w-22' : size === 'sm' ? 'h-4 w-7' : ''} ${className}`} aria-label="Ultra Rara (Duas estrelas prata)">
          <defs>
            <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#cbd5e1" />
              <stop offset="80%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <g transform="translate(0, 0)">
            <polygon points={STAR_POINTS} fill="url(#silverGrad)" stroke="#f8fafc" strokeWidth="1.2" filter="drop-shadow(0 0 2px rgba(255,255,255,0.4))" />
          </g>
          <g transform="translate(20, 0)">
            <polygon points={STAR_POINTS} fill="url(#silverGrad)" stroke="#f8fafc" strokeWidth="1.2" filter="drop-shadow(0 0 2px rgba(255,255,255,0.4))" />
          </g>
        </svg>
      );

    case 'gold-star':
      return (
        <svg viewBox="0 0 24 24" className={`${dimension} ${className}`} aria-label="Ilustração Rara (Estrela dourada)">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <polygon points={STAR_POINTS} fill="url(#goldGrad)" stroke="#fef3c7" strokeWidth="1.2" filter="drop-shadow(0 0 4px rgba(245,158,11,0.6))" />
        </svg>
      );

    case 'double-gold-star':
      return (
        <svg viewBox="0 0 44 24" className={`h-6 w-11 ${size === 'lg' ? 'h-9 w-16' : size === 'xl' ? 'h-12 w-22' : size === 'sm' ? 'h-4 w-7' : ''} ${className}`} aria-label="Ilustração Rara Especial (Duas estrelas douradas)">
          <defs>
            <linearGradient id="goldGradDouble" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <g transform="translate(0, 0)">
            <polygon points={STAR_POINTS} fill="url(#goldGradDouble)" stroke="#fef3c7" strokeWidth="1.2" filter="drop-shadow(0 0 3px rgba(245,158,11,0.5))" />
          </g>
          <g transform="translate(20, 0)">
            <polygon points={STAR_POINTS} fill="url(#goldGradDouble)" stroke="#fef3c7" strokeWidth="1.2" filter="drop-shadow(0 0 3px rgba(245,158,11,0.5))" />
          </g>
        </svg>
      );

    case 'triple-gold-star':
      return (
        <svg viewBox="0 0 64 24" className={`h-6 w-16 ${size === 'lg' ? 'h-9 w-24' : size === 'xl' ? 'h-12 w-32' : size === 'sm' ? 'h-4 w-10' : ''} ${className}`} aria-label="Hiper Rara (Três estrelas douradas)">
          <defs>
            <linearGradient id="goldGradTriple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <g transform="translate(0, 0)">
            <polygon points={STAR_POINTS} fill="url(#goldGradTriple)" stroke="#fef3c7" strokeWidth="1.2" filter="drop-shadow(0 0 3px rgba(234,179,8,0.6))" />
          </g>
          <g transform="translate(20, 0)">
            <polygon points={STAR_POINTS} fill="url(#goldGradTriple)" stroke="#fef3c7" strokeWidth="1.2" filter="drop-shadow(0 0 3px rgba(234,179,8,0.6))" />
          </g>
          <g transform="translate(40, 0)">
            <polygon points={STAR_POINTS} fill="url(#goldGradTriple)" stroke="#fef3c7" strokeWidth="1.2" filter="drop-shadow(0 0 3px rgba(234,179,8,0.6))" />
          </g>
        </svg>
      );

    case 'mega-gold-star':
      return (
        <svg viewBox="0 0 24 24" className={`${dimension} ${className}`} aria-label="Mega Hiper Rara (Estrela diferente dourada)">
          <defs>
            <linearGradient id="megaGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fde047" />
              <stop offset="60%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          {/* 8-pointed faceted radiant star */}
          <polygon points="12,1 14.5,7 21,7 16,11.5 18.5,18 12,14 5.5,18 8,11.5 3,7 9.5,7" fill="url(#megaGoldGrad)" stroke="#fef08a" strokeWidth="1.2" filter="drop-shadow(0 0 6px rgba(234,179,8,0.8))" />
          <polygon points="12,3 13.5,8 18,8 14.5,11 16,16 12,13 8,16 9.5,11 6,8 10.5,8" fill="#fef08a" opacity="0.6" />
          <circle cx="12" cy="11" r="2.5" fill="#ffffff" />
        </svg>
      );

    case 'pink-star':
      return (
        <svg viewBox="0 0 24 24" className={`${dimension} ${className}`} aria-label="Ás na Manga (Estrela rosa)">
          <defs>
            <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdf2f8" />
              <stop offset="30%" stopColor="#f472b6" />
              <stop offset="70%" stopColor="#db2777" />
              <stop offset="100%" stopColor="#9d174d" />
            </linearGradient>
          </defs>
          <polygon points={STAR_POINTS} fill="url(#pinkGrad)" stroke="#fbcfe8" strokeWidth="1.5" filter="drop-shadow(0 0 5px rgba(236,72,153,0.7))" />
        </svg>
      );

    case 'hollow-gold-star':
      return (
        <svg viewBox="0 0 24 24" className={`${dimension} ${className}`} aria-label="Brilhante Rara (Estrela dourada só borda)">
          <polygon points={STAR_POINTS} fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" filter="drop-shadow(0 0 3px rgba(245,158,11,0.5))" />
        </svg>
      );

    case 'double-hollow-gold-star':
      return (
        <svg viewBox="0 0 44 24" className={`h-6 w-11 ${size === 'lg' ? 'h-9 w-16' : size === 'xl' ? 'h-12 w-22' : size === 'sm' ? 'h-4 w-7' : ''} ${className}`} aria-label="Brilhante Ultra Rara (Duas estrelas douradas só borda)">
          <g transform="translate(0, 0)">
            <polygon points={STAR_POINTS} fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" filter="drop-shadow(0 0 3px rgba(245,158,11,0.5))" />
          </g>
          <g transform="translate(20, 0)">
            <polygon points={STAR_POINTS} fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" filter="drop-shadow(0 0 3px rgba(245,158,11,0.5))" />
          </g>
        </svg>
      );

    case 'black-white-star':
      return (
        <svg viewBox="0 0 44 24" className={`h-6 w-11 ${size === 'lg' ? 'h-9 w-16' : size === 'xl' ? 'h-12 w-22' : size === 'sm' ? 'h-4 w-7' : ''} ${className}`} aria-label="Black White Rara (Duas estrelas, uma branca, uma preta)">
          {/* White Star */}
          <g transform="translate(0, 0)">
            <polygon points={STAR_POINTS} fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" filter="drop-shadow(0 0 3px rgba(255,255,255,0.7))" />
          </g>
          {/* Black Star */}
          <g transform="translate(20, 0)">
            <polygon points={STAR_POINTS} fill="#09090b" stroke="#cbd5e1" strokeWidth="1.5" />
          </g>
        </svg>
      );

    case 'futuristic-star':
      return (
        <svg viewBox="0 0 24 24" className={`${dimension} ${className}`} aria-label="Rara Futurista (Estrela colorida 30 anos)">
          <defs>
            <linearGradient id="futuristicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="25%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="75%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <polygon points={STAR_POINTS} fill="url(#futuristicGrad)" stroke="#ffffff" strokeWidth="1.5" filter="drop-shadow(0 0 6px rgba(139,92,246,0.8))" />
          {/* Futuristic geometric inner shine */}
          <circle cx="12" cy="12" r="3.5" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" opacity="0.8" />
          <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" className={`${dimension} ${className}`}>
          <polygon points={STAR_POINTS} fill="#eab308" stroke="#fef08a" strokeWidth="1" />
        </svg>
      );
  }
};
