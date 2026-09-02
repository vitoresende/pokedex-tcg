import React, { useState, useRef } from 'react';
import { Card } from '../types';
import { Sparkles } from 'lucide-react';
import { soundEffects } from '../services/audio';
import { downloadAndUploadImageToStorage } from '../services/firebase';

interface HoloCardProps {
  card: Card;
  className?: string;
  isDetailed?: boolean;
}

export const HoloCard: React.FC<HoloCardProps> = ({ card, className = '', isDetailed = false }) => {
  const [imageErrorLevel, setImageErrorLevel] = useState<number>(0);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotX = ((y - centerY) / centerY) * -12;
    const rotY = ((x - centerX) / centerX) * 12;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (card.is_foil) {
      soundEffects.playFoilShine();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  // Resolução de Imagem Prioritária (Firebase Storage -> Direct Storage/CDN URL -> Fallback CDN -> Procedural CSS)
  const getImageSource = () => {
    const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pokedex-tcg-782d5.firebasestorage.app';
    const cleanNum = card.card_number ? card.card_number.replace(/\D/g, '') || '1' : '1';
    const unpaddedNum = cleanNum.replace(/^0+/, '') || '1';
    const paddedNum = cleanNum.padStart(3, '0');
    const cleanSet = (card.set_code || 'set').toLowerCase();
    
    // Mapeamento específico e inequívoco para cada tipo de Carta de Energia Básica
    const BASIC_ENERGY_FILES: Record<string, { file: string; url: string }> = {
      'G': { file: 'sve_1.png', url: 'https://images.pokemontcg.io/sve/1.png' },
      'R': { file: 'sve_2.png', url: 'https://images.pokemontcg.io/sve/2.png' },
      'W': { file: 'sve_3.png', url: 'https://images.pokemontcg.io/sve/3.png' },
      'L': { file: 'sve_4.png', url: 'https://images.pokemontcg.io/sve/4.png' },
      'P': { file: 'sve_5.png', url: 'https://images.pokemontcg.io/sve/5.png' },
      'F': { file: 'sve_6.png', url: 'https://images.pokemontcg.io/sve/6.png' },
      'D': { file: 'sve_7.png', url: 'https://images.pokemontcg.io/sve/7.png' },
      'M': { file: 'sve_8.png', url: 'https://images.pokemontcg.io/sve/8.png' },
      'Y': { file: 'sm1_169.png', url: 'https://images.pokemontcg.io/sm1/169.png' }
    };

    const isBasicEnergy = 
      card.set_code === 'BAS' || 
      card.set_code === 'SVE' ||
      card.set_code === 'SV-BE' ||
      card.card_number === 'Energia' ||
      (card.name_pt.toLowerCase().includes('energia') && Boolean(BASIC_ENERGY_FILES[card.color_code])) ||
      card.name_pt.toLowerCase().includes('básica') ||
      card.name_en.toLowerCase().includes('basic energy');

    let cardFileName = `${cleanSet}_${(card.card_number || '1').replace(/\//g, '_')}.png`;
    let fallbackEnergyUrl = '';

    if (isBasicEnergy && BASIC_ENERGY_FILES[card.color_code]) {
      cardFileName = BASIC_ENERGY_FILES[card.color_code].file;
      fallbackEnergyUrl = BASIC_ENERGY_FILES[card.color_code].url;
    }

    const sources: string[] = [];

    // 1. Firebase Storage Bucket padrão do projeto (com nome de arquivo principal e variações com/sem zero)
    if (storageBucket && !storageBucket.includes('demo') && !storageBucket.includes('Example')) {
      sources.push(`https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/cards%2F${encodeURIComponent(cardFileName)}?alt=media`);
      
      const altFileName = `${cleanSet}_${unpaddedNum}.png`;
      if (altFileName !== cardFileName) {
        sources.push(`https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/cards%2F${encodeURIComponent(altFileName)}?alt=media`);
      }
      const paddedFileName = `${cleanSet}_${paddedNum}.png`;
      if (paddedFileName !== cardFileName && paddedFileName !== altFileName) {
        sources.push(`https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/cards%2F${encodeURIComponent(paddedFileName)}?alt=media`);
      }
    }

    // 2. Direct Cloud Storage URL
    if (card.image_url && card.image_url.includes('firebasestorage.googleapis.com')) {
      sources.push(card.image_url);
    }

    // 3. Fallback oficial específico para cartas de energia básica
    if (fallbackEnergyUrl) {
      sources.push(fallbackEnergyUrl);
    }

    // 4. Imagem customizada / URL direta
    if (card.image_url) {
      sources.push(card.image_url);
    }

    // 5. Fallback CDNs complementares (Pokemontcg.io e Limitless TCG)
    if (card.set_code) {
      const SET_CODE_POKEMONTCG_IO_MAP: Record<string, string> = {
        // Scarlet & Violet
        'svi': 'sv1', 'sv1': 'sv1',
        'pal': 'sv2', 'sv2': 'sv2',
        'obf': 'sv3', 'sv3': 'sv3',
        'mew': 'sv3pt5', '151': 'sv3pt5',
        'par': 'sv4', 'sv4': 'sv4',
        'paf': 'sv4pt5',
        'tef': 'sv5', 'sv5': 'sv5',
        'twm': 'sv6', 'sv6': 'sv6',
        'sfa': 'sv6pt5',
        'scr': 'sv7', 'sv7': 'sv7',
        'ssp': 'sv8', 'sv8': 'sv8',
        'pre': 'sv8pt5',
        'dri': 'dri',
        'jtg': 'jtg',
        'svp': 'svp',
        // Sword & Shield
        'ssh': 'swsh1', 'swsh1': 'swsh1',
        'rcl': 'swsh2', 'swsh2': 'swsh2',
        'daa': 'swsh3', 'swsh3': 'swsh3',
        'cpa': 'swsh35',
        'viv': 'swsh4', 'swsh4': 'swsh4',
        'shf': 'swsh45',
        'bst': 'swsh5', 'swsh5': 'swsh5',
        'cre': 'swsh6', 'swsh6': 'swsh6',
        'evs': 'swsh7', 'swsh7': 'swsh7',
        'cel': 'cel25',
        'fst': 'swsh8', 'swsh8': 'swsh8',
        'brs': 'swsh9', 'swsh9': 'swsh9',
        'asr': 'swsh10', 'swsh10': 'swsh10',
        'pgo': 'pgo',
        'lor': 'swsh11', 'swsh11': 'swsh11',
        'sit': 'swsh12', 'swsh12': 'swsh12',
        'crz': 'swsh12pt5',
        'swsh': 'swshp', 'swshp': 'swshp',
        // Sun & Moon
        'sum': 'sm1', 'sm1': 'sm1',
        'gri': 'sm2', 'sm2': 'sm2',
        'bus': 'sm3', 'sm3': 'sm3',
        'cin': 'sm4', 'sm4': 'sm4',
        'upr': 'sm5', 'sm5': 'sm5',
        'fli': 'sm6', 'sm6': 'sm6',
        'ces': 'sm7', 'sm7': 'sm7',
        'drm': 'sm75',
        'lot': 'sm8', 'sm8': 'sm8',
        'teu': 'sm9', 'sm9': 'sm9',
        'unb': 'sm10', 'sm10': 'sm10',
        'unm': 'sm11', 'sm11': 'sm11',
        'hif': 'sma', 'sma': 'sma',
        'cec': 'sm12', 'sm12': 'sm12',
        'smp': 'smp',
      };
      const pokemontcgSet = SET_CODE_POKEMONTCG_IO_MAP[cleanSet] || cleanSet;
      sources.push(`https://images.pokemontcg.io/${pokemontcgSet}/${unpaddedNum}_hires.png`);
      sources.push(`https://images.pokemontcg.io/${pokemontcgSet}/${unpaddedNum}.png`);

      const SET_CODE_LIMITLESS_MAP: Record<string, string> = {
        // Scarlet & Violet aliases
        'SV1': 'SVI', 'SV01': 'SVI',
        'SV2': 'PAL', 'SV02': 'PAL',
        'SV3': 'OBF', 'SV03': 'OBF',
        '151': 'MEW', 'SV3.5': 'MEW',
        'SV4': 'PAR', 'SV04': 'PAR',
        'SV4.5': 'PAF',
        'SV5': 'TEF', 'SV05': 'TEF',
        'SV6': 'TWM', 'SV06': 'TWM',
        'SV6.5': 'SFA',
        'SV7': 'SCR', 'SV07': 'SCR',
        'SV8': 'SSP', 'SV08': 'SSP',
        'SV8.5': 'PRE',
        // Sword & Shield aliases
        'SWSH1': 'SSH', 'SWSH01': 'SSH',
        'SWSH2': 'RCL', 'SWSH02': 'RCL',
        'SWSH3': 'DAA', 'SWSH03': 'DAA',
        'SWSH3.5': 'CPA',
        'SWSH4': 'VIV', 'SWSH04': 'VIV',
        'SWSH4.5': 'SHF',
        'SWSH5': 'BST', 'SWSH05': 'BST',
        'SWSH6': 'CRE', 'SWSH06': 'CRE',
        'SWSH7': 'EVS', 'SWSH07': 'EVS',
        'SWSH8': 'FST', 'SWSH08': 'FST',
        'SWSH9': 'BRS', 'SWSH09': 'BRS',
        'SWSH10': 'ASR',
        'SWSH11': 'LOR',
        'SWSH12': 'SIT',
        'SWSH12.5': 'CRZ',
        // Sun & Moon aliases
        'SM1': 'SUM', 'SM01': 'SUM',
        'SM2': 'GRI', 'SM02': 'GRI',
        'SM3': 'BUS', 'SM03': 'BUS',
        'SM4': 'CIN', 'SM04': 'CIN',
        'SM5': 'UPR', 'SM05': 'UPR',
        'SM6': 'FLI', 'SM06': 'FLI',
        'SM7': 'CES', 'SM07': 'CES',
        'SM7.5': 'DRM',
        'SM8': 'LOT', 'SM08': 'LOT',
        'SM9': 'TEU', 'SM09': 'TEU',
        'SM10': 'UNB',
        'SM11': 'UNM',
        'SM11.5': 'HIF', 'SMA': 'HIF',
        'SM12': 'CEC',
      };
      const rawSet = (card.set_code || '').toUpperCase();
      const limitlessSet = SET_CODE_LIMITLESS_MAP[rawSet] || rawSet;
      sources.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${limitlessSet}/${limitlessSet}_${paddedNum}_R_PT.png`);
      sources.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${limitlessSet}/${limitlessSet}_${paddedNum}_R_EN.png`);
      sources.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${limitlessSet}/${limitlessSet}_${unpaddedNum}_R_PT.png`);
      sources.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${limitlessSet}/${limitlessSet}_${unpaddedNum}_R_EN.png`);
    }

    const uniqueSources = Array.from(new Set(sources.filter(Boolean)));

    if (imageErrorLevel < uniqueSources.length) {
      return uniqueSources[imageErrorLevel];
    }
    return null;
  };

  const currentSrc = getImageSource();

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none transition-transform duration-150 ease-out will-change-transform ${className}`}
      style={{
        perspective: '1000px',
        transform: isHovered ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)` : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      }}
    >
      {/* Outer Card Container */}
      <div className={`w-full h-full rounded-2xl overflow-hidden shadow-xl border-2 relative ${
        card.is_foil 
          ? 'border-yellow-400/80 shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
          : 'border-slate-700/80'
      }`}>
        {/* Actual Image or CSS Fallback */}
        {currentSrc ? (
          <img
            key={currentSrc}
            src={currentSrc}
            alt={`${card.name_pt} (${card.name_en || ''})`}
            loading="lazy"
            onError={() => setImageErrorLevel(prev => prev + 1)}
            onLoad={() => {
              // Auto-cache to Google Cloud Storage if loaded from external fallback CDN
              if (currentSrc && !currentSrc.includes('firebasestorage.googleapis.com')) {
                const cleanSet = (card.set_code || 'imp').toLowerCase();
                const cleanNum = (card.card_number || '1').replace(/\D/g, '') || '1';
                const targetFilename = `${cleanSet}_${cleanNum}.png`;
                downloadAndUploadImageToStorage(currentSrc, targetFilename).catch(() => {});
              }
            }}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          /* High-Tech Procedural CSS Pokédex Card Fallback */
          <div 
            className="w-full h-full p-4 flex flex-col justify-between rounded-xl relative overflow-hidden text-white"
            style={{ backgroundColor: card.color_bg || '#232936' }}
          >
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">{card.card_category || 'Carta'}</span>
                <h4 className="font-bold text-sm leading-tight drop-shadow">{card.name_pt}</h4>
                <p className="text-[10px] opacity-75">{card.name_en}</p>
              </div>
              <span className="text-xs font-mono font-black bg-black/40 px-2 py-0.5 rounded border border-white/20">
                #{card.card_number}
              </span>
            </div>

            <div className="my-auto flex flex-col items-center justify-center z-10">
              <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 mb-2">
                <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-black/50 text-center">{card.set_pt || card.set_code || 'Pokémon TCG'}</span>
            </div>

            <div className="flex justify-between items-end text-[10px] font-mono z-10">
              <span className="bg-black/40 px-1.5 py-0.5 rounded">{card.rarity_name || 'Comum'}</span>
              <span className="bg-black/40 px-1.5 py-0.5 rounded">{card.quality || 'NM'}</span>
            </div>

            {/* Circuit Background Pattern */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]"></div>
          </div>
        )}

        {/* Foil Holographic Rainbow & Sheen Effect */}
        {card.is_foil && isHovered && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-80 transition-opacity rounded-xl"
            style={{
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.8) 0%, rgba(255,215,0,0.5) 25%, rgba(0,240,255,0.4) 50%, transparent 80%), linear-gradient(135deg, rgba(255,0,128,0.2), rgba(0,255,255,0.2), rgba(255,255,0,0.2))`
            }}
          />
        )}

        {/* Glare Glass Overlay */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60 rounded-xl"
            style={{
              background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.7) 45%, transparent 50%)`
            }}
          />
        )}

        {/* Foil Badge Icon */}
        {card.is_foil && (
          <div className="absolute top-2 right-2 z-20 bg-black/70 backdrop-blur-md p-1 rounded-full border border-yellow-400/60 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          </div>
        )}
      </div>
    </div>
  );
};
