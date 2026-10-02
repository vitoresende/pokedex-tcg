import React, { useId } from 'react';

interface RaritySymbolIconProps {
  symbolType: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Optional card-accurate gray/silver border background stamp */
  withCardBadge?: boolean;
}

// Mathematically balanced, stout Pokémon card star silhouette
const STAR_POINTS = "12,2.8 14.6,8.4 20.7,9.2 16.2,13.4 17.4,19.5 12,16.5 6.6,19.5 7.8,13.4 3.3,9.2 9.4,8.4";

export const RaritySymbolIcon: React.FC<RaritySymbolIconProps> = ({
  symbolType,
  size = 'md',
  className = '',
  withCardBadge = false
}) => {
  const uid = useId().replace(/:/g, '');

  // Dimensions based on size for single (1:1), double (11:6), and triple (8:3) symbols
  const singleDimensions = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  const doubleDimensions = {
    sm: 'w-7 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-8',
    xl: 'w-18 h-10'
  };

  const tripleDimensions = {
    sm: 'w-10 h-4',
    md: 'w-16 h-6',
    lg: 'w-20 h-8',
    xl: 'w-26 h-10'
  };

  const singleDim = singleDimensions[size] || singleDimensions.md;
  const doubleDim = doubleDimensions[size] || doubleDimensions.md;
  const tripleDim = tripleDimensions[size] || tripleDimensions.md;

  const renderIcon = () => {
    switch (symbolType) {
      case 'circle':
        // Common: Solid jet-black circle ● matching real card print
        return (
          <svg viewBox="0 0 24 24" className={`${singleDim} ${className}`} aria-label="Comum (Bolinha)">
            <circle cx="12" cy="12" r="7" fill="#0f172a" stroke="#000000" strokeWidth="0.5" />
          </svg>
        );

      case 'diamond':
        // Uncommon: Solid jet-black diamond ◆ matching real card print (NOT blue!)
        return (
          <svg viewBox="0 0 24 24" className={`${singleDim} ${className}`} aria-label="Incomum (Losango)">
            <polygon points="12,3.2 19.2,12 12,20.8 4.8,12" fill="#0f172a" stroke="#000000" strokeWidth="0.5" />
          </svg>
        );

      case 'black-star':
        // Rare: Solid jet-black 5-pointed star ★
        return (
          <svg viewBox="0 0 24 24" className={`${singleDim} ${className}`} aria-label="Rara (Estrela preta)">
            <polygon points={STAR_POINTS} fill="#0f172a" stroke="#000000" strokeWidth="0.5" />
          </svg>
        );

      case 'double-black-star':
        // Double Rare (Pokémon ex): Two solid jet-black stars ★★
        return (
          <svg viewBox="0 0 44 24" className={`${doubleDim} ${className}`} aria-label="Dupla Rara (Duas estrelas pretas)">
            <g transform="translate(0, 0)">
              <polygon points={STAR_POINTS} fill="#0f172a" stroke="#000000" strokeWidth="0.5" />
            </g>
            <g transform="translate(20, 0)">
              <polygon points={STAR_POINTS} fill="#0f172a" stroke="#000000" strokeWidth="0.5" />
            </g>
          </svg>
        );

      case 'double-silver-star':
        // Ultra Rare (Full Art ex / Supporter): Two metallic silver foil stars ★★
        const silverGradId = `silverGrad_${uid}`;
        return (
          <svg viewBox="0 0 44 24" className={`${doubleDim} ${className}`} aria-label="Ultra Rara (Duas estrelas prata)">
            <defs>
              <linearGradient id={silverGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#e2e8f0" />
                <stop offset="55%" stopColor="#94a3b8" />
                <stop offset="85%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>
            <g transform="translate(0, 0)">
              <polygon points={STAR_POINTS} fill={`url(#${silverGradId})`} stroke="#334155" strokeWidth="0.8" />
            </g>
            <g transform="translate(20, 0)">
              <polygon points={STAR_POINTS} fill={`url(#${silverGradId})`} stroke="#334155" strokeWidth="0.8" />
            </g>
          </svg>
        );

      case 'gold-star':
        // Illustration Rare (AR): Single rich gold foil star ★
        const goldGradId = `goldGrad_${uid}`;
        return (
          <svg viewBox="0 0 24 24" className={`${singleDim} ${className}`} aria-label="Ilustração Rara (Estrela dourada)">
            <defs>
              <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="20%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="78%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
            <polygon points={STAR_POINTS} fill={`url(#${goldGradId})`} stroke="#78350f" strokeWidth="0.8" />
          </svg>
        );

      case 'double-gold-star':
        // Special Illustration Rare (SAR): Two rich gold foil stars ★★
        const doubleGoldGradId = `doubleGoldGrad_${uid}`;
        return (
          <svg viewBox="0 0 44 24" className={`${doubleDim} ${className}`} aria-label="Ilustração Rara Especial (Duas estrelas douradas)">
            <defs>
              <linearGradient id={doubleGoldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="20%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="78%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
            <g transform="translate(0, 0)">
              <polygon points={STAR_POINTS} fill={`url(#${doubleGoldGradId})`} stroke="#78350f" strokeWidth="0.8" />
            </g>
            <g transform="translate(20, 0)">
              <polygon points={STAR_POINTS} fill={`url(#${doubleGoldGradId})`} stroke="#78350f" strokeWidth="0.8" />
            </g>
          </svg>
        );

      case 'triple-gold-star':
        // Hyper Rare (Gold/HR): Three rich gold foil stars ★★★
        const tripleGoldGradId = `tripleGoldGrad_${uid}`;
        return (
          <svg viewBox="0 0 64 24" className={`${tripleDim} ${className}`} aria-label="Hiper Rara (Três estrelas douradas)">
            <defs>
              <linearGradient id={tripleGoldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="20%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="78%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
            <g transform="translate(0, 0)">
              <polygon points={STAR_POINTS} fill={`url(#${tripleGoldGradId})`} stroke="#78350f" strokeWidth="0.8" />
            </g>
            <g transform="translate(20, 0)">
              <polygon points={STAR_POINTS} fill={`url(#${tripleGoldGradId})`} stroke="#78350f" strokeWidth="0.8" />
            </g>
            <g transform="translate(40, 0)">
              <polygon points={STAR_POINTS} fill={`url(#${tripleGoldGradId})`} stroke="#78350f" strokeWidth="0.8" />
            </g>
          </svg>
        );

      case 'mega-gold-star':
        // Mega Hyper Rare (Crown / UR): Radiant 8-pointed faceted star
        const megaGoldGradId = `megaGoldGrad_${uid}`;
        return (
          <svg viewBox="0 0 24 24" className={`${singleDim} ${className}`} aria-label="Mega Hiper Rara (Estrela diferente dourada)">
            <defs>
              <linearGradient id={megaGoldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="20%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="80%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
            <polygon points="12,1.5 14.5,7.2 21,7.2 16,11.5 18.5,18 12,14 5.5,18 8,11.5 3,7.2 9.5,7.2" fill={`url(#${megaGoldGradId})`} stroke="#78350f" strokeWidth="0.8" />
            <polygon points="12,3.5 13.6,8 18,8 14.5,10.8 16,15.5 12,12.8 8,15.5 9.5,10.8 6,8 10.4,8" fill="#fef08a" opacity="0.65" />
            <circle cx="12" cy="11.2" r="2.2" fill="#ffffff" stroke="#eab308" strokeWidth="0.5" />
          </svg>
        );

      case 'pink-star':
        // ACE SPEC (Ás na Manga): Hot magenta foil star
        const pinkGradId = `pinkGrad_${uid}`;
        return (
          <svg viewBox="0 0 24 24" className={`${singleDim} ${className}`} aria-label="Ás na Manga (Estrela rosa)">
            <defs>
              <linearGradient id={pinkGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fdf2f8" />
                <stop offset="25%" stopColor="#f472b6" />
                <stop offset="60%" stopColor="#db2777" />
                <stop offset="100%" stopColor="#831843" />
              </linearGradient>
            </defs>
            <polygon points={STAR_POINTS} fill={`url(#${pinkGradId})`} stroke="#701a75" strokeWidth="0.8" />
          </svg>
        );

      case 'hollow-gold-star':
        // Shiny Rare (Paldean Fates Baby Shiny): Hollow outline-only gold star ☆
        const hollowGoldGradId = `hollowGoldGrad_${uid}`;
        return (
          <svg viewBox="0 0 24 24" className={`${singleDim} ${className}`} aria-label="Brilhante Rara (Estrela dourada só borda)">
            <defs>
              <linearGradient id={hollowGoldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <polygon points={STAR_POINTS} fill="#fef08a" fillOpacity="0.1" stroke={`url(#${hollowGoldGradId})`} strokeWidth="2.2" strokeLinejoin="round" />
          </svg>
        );

      case 'double-hollow-gold-star':
        // Shiny Ultra Rare (Paldean Fates Shiny ex): Two hollow gold stars ☆☆
        const doubleHollowGradId = `doubleHollowGrad_${uid}`;
        return (
          <svg viewBox="0 0 44 24" className={`${doubleDim} ${className}`} aria-label="Brilhante Ultra Rara (Duas estrelas douradas só borda)">
            <defs>
              <linearGradient id={doubleHollowGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <g transform="translate(0, 0)">
              <polygon points={STAR_POINTS} fill="#fef08a" fillOpacity="0.1" stroke={`url(#${doubleHollowGradId})`} strokeWidth="2.2" strokeLinejoin="round" />
            </g>
            <g transform="translate(20, 0)">
              <polygon points={STAR_POINTS} fill="#fef08a" fillOpacity="0.1" stroke={`url(#${doubleHollowGradId})`} strokeWidth="2.2" strokeLinejoin="round" />
            </g>
          </svg>
        );

      case 'black-white-star':
        // Black & White Rare (Raio Preto e Fulgor Branco): One pure white foil star, one deep black star
        return (
          <svg viewBox="0 0 44 24" className={`${doubleDim} ${className}`} aria-label="Black White Rara (Duas estrelas, uma branca, uma preta)">
            <g transform="translate(0, 0)">
              <polygon points={STAR_POINTS} fill="#ffffff" stroke="#334155" strokeWidth="1.2" />
            </g>
            <g transform="translate(20, 0)">
              <polygon points={STAR_POINTS} fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.8" />
            </g>
          </svg>
        );

      case 'futuristic-star':
        // Futuristic Rare (30 Years Pokemon TCG): Chromatic rainbow star with cybernetic rings
        const futuristicGradId = `futuristicGrad_${uid}`;
        return (
          <svg viewBox="0 0 24 24" className={`${singleDim} ${className}`} aria-label="Rara Futurista (Estrela colorida 30 anos)">
            <defs>
              <linearGradient id={futuristicGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="25%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="75%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <polygon points={STAR_POINTS} fill={`url(#${futuristicGradId})`} stroke="#ffffff" strokeWidth="1" />
            <circle cx="12" cy="12" r="3.2" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" opacity="0.85" />
            <circle cx="12" cy="12" r="1.4" fill="#ffffff" />
          </svg>
        );

      case 'promo-star':
      case 'promo':
        // Promo Card: Official Black Star Promo with "PROMO" lettering
        return (
          <svg viewBox="0 0 24 24" className={`${singleDim} ${className}`} aria-label="Carta Promocional (Promo)">
            <polygon points={STAR_POINTS} fill="#0f172a" stroke="#000000" strokeWidth="0.6" />
            <text x="12" y="13.2" textAnchor="middle" fill="#ffffff" fontSize="3.6" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.3">
              PROMO
            </text>
          </svg>
        );

      case 'secret-number':
      case 'secret-rare':
      case 'secret':
        // Secret Rare: Collector number exceeding set total (e.g. 83/82), with gold border and sparkle
        const secretBorderId = `secretBorder_${uid}`;
        return (
          <svg viewBox="0 0 44 24" className={`${doubleDim} ${className}`} aria-label="Rara Secreta (83/82)">
            <defs>
              <linearGradient id={secretBorderId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <rect x="1" y="2" width="42" height="20" rx="5" fill="#090d16" stroke={`url(#${secretBorderId})`} strokeWidth="1.2" />
            {/* Secret gold star sparkle */}
            <polygon points="36,3.5 37,6 39.5,7 37,8 36,10.5 35,8 32.5,7 35,6" fill="#fde047" />
            <text x="17" y="14.5" textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="900" fontSize="8.5">
              <tspan fill="#facc15">83</tspan>
              <tspan fill="#64748b" fontSize="7.5">/</tspan>
              <tspan fill="#94a3b8" fontSize="7.5">82</tspan>
            </text>
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 24 24" className={`${singleDim} ${className}`}>
            <polygon points={STAR_POINTS} fill="#0f172a" stroke="#000000" strokeWidth="0.5" />
          </svg>
        );
    }
  };

  if (withCardBadge) {
    return (
      <div className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 border border-slate-300 shadow-inner">
        {renderIcon()}
      </div>
    );
  }

  return renderIcon();
};
