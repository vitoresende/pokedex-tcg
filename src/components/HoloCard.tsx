import React, { useState, useRef } from 'react';
import { Card } from '../types';
import { Sparkles } from 'lucide-react';
import { soundEffects } from '../services/audio';

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
      card.card_number === 'Energia' ||
      card.name_pt.toLowerCase().includes('básica') ||
      card.name_en.toLowerCase().includes('basic energy');

    let cardFileName = `${cleanSet}_${(card.card_number || '1').replace(/\//g, '_')}.png`;
    let fallbackEnergyUrl = '';

    if (isBasicEnergy && BASIC_ENERGY_FILES[card.color_code]) {
      cardFileName = BASIC_ENERGY_FILES[card.color_code].file;
      fallbackEnergyUrl = BASIC_ENERGY_FILES[card.color_code].url;
    }

    const sources: string[] = [];

    // 1. Firebase Storage Bucket padrão do projeto (com nome de arquivo principal)
    if (storageBucket && !storageBucket.includes('demo') && !storageBucket.includes('Example')) {
      sources.push(`https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/cards%2F${encodeURIComponent(cardFileName)}?alt=media`);
      
      // Fallback sem leading zero para o storage (ex: cri_84.png vs cri_084.png)
      const altFileName = `${cleanSet}_${cleanNum}.png`;
      if (altFileName !== cardFileName) {
        sources.push(`https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/cards%2F${encodeURIComponent(altFileName)}?alt=media`);
      }
    }

    // 2. Direct Cloud Storage URL (se a carta já tiver URL do Firebase Storage salva)
    if (card.image_url && card.image_url.includes('firebasestorage.googleapis.com')) {
      sources.push(card.image_url);
    }

    // 3. Fallback oficial específico para cartas de energia básica
    if (fallbackEnergyUrl) {
      sources.push(fallbackEnergyUrl);
    }

    // 4. Imagem customizada / URL direta
    if (card.image_url && !sources.includes(card.image_url)) {
      sources.push(card.image_url);
    }

    // 5. Fallback CDNs complementares (Pokemontcg.io e Limitless TCG)
    if (card.set_code) {
      const SET_CODE_POKEMONTCG_IO_MAP: Record<string, string> = {
        'sum': 'sm1',
        'gri': 'sm2',
        'bus': 'sm3',
        'cin': 'sm4',
        'upr': 'sm5',
        'fli': 'sm6',
        'ces': 'sm7',
        'lot': 'sm8',
        'teu': 'sm9',
        'unb': 'sm10',
        'unm': 'sm11',
        'cec': 'sm12',
        'hif': 'sma',
      };
      const pokemontcgSet = SET_CODE_POKEMONTCG_IO_MAP[cleanSet] || cleanSet;
      sources.push(`https://images.pokemontcg.io/${pokemontcgSet}/${cleanNum}_hires.png`);
      sources.push(`https://images.pokemontcg.io/${pokemontcgSet}/${cleanNum}.png`);
      sources.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${card.set_code.toUpperCase()}/${card.set_code.toUpperCase()}_${cleanNum.padStart(3, '0')}_R_PT.png`);
      sources.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${card.set_code.toUpperCase()}/${card.set_code.toUpperCase()}_${cleanNum.padStart(3, '0')}_R_EN.png`);
    }

    if (imageErrorLevel < sources.length) {
      return sources[imageErrorLevel];
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
            src={currentSrc}
            alt={`${card.name_pt} (${card.name_en || ''})`}
            loading="lazy"
            onError={() => setImageErrorLevel(prev => prev + 1)}
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
