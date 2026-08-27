import React, { useState } from 'react';

export type PokemonType = 
  | 'grass' | 'fire' | 'water' | 'lightning' | 'psychic' 
  | 'fighting' | 'darkness' | 'metal' | 'fairy' | 'dragon' 
  | 'colorless' | 'trainer' | 'energy' | string;

interface PokemonTypeIconProps {
  type: PokemonType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBackground?: boolean;
}

const SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
};

const TYPE_IMAGE_MAP: Record<string, string> = {
  grass: '/energy/grass.png',
  g: '/energy/grass.png',
  fire: '/energy/fire.png',
  r: '/energy/fire.png',
  water: '/energy/water.png',
  w: '/energy/water.png',
  lightning: '/energy/lightning.png',
  electric: '/energy/lightning.png',
  l: '/energy/lightning.png',
  psychic: '/energy/psychic.png',
  p: '/energy/psychic.png',
  fighting: '/energy/fighting.png',
  f: '/energy/fighting.png',
  darkness: '/energy/darkness.png',
  dark: '/energy/darkness.png',
  d: '/energy/darkness.png',
  metal: '/energy/metal.png',
  steel: '/energy/metal.png',
  m: '/energy/metal.png',
  fairy: '/energy/fairy.png',
  y: '/energy/fairy.png',
  dragon: '/energy/dragon.png',
  o: '/energy/dragon.png',
  n: '/energy/dragon.png',
  colorless: '/energy/colorless.png',
  normal: '/energy/colorless.png',
  c: '/energy/colorless.png',
};

export const PokemonTypeIcon: React.FC<PokemonTypeIconProps> = ({ 
  type, 
  size = 'md', 
  className = '',
}) => {
  const [imgError, setImgError] = useState<boolean>(false);
  const normType = (type || 'colorless').toLowerCase().trim();
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;
  const imageSrc = TYPE_IMAGE_MAP[normType];

  if (imageSrc && !imgError) {
    return (
      <img
        src={imageSrc}
        alt={`${type} Energy`}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`inline-block select-none shrink-0 object-contain drop-shadow-md rounded-full ${sizeClasses} ${className}`}
      />
    );
  }

  // Fallback vector icon if image fails
  return (
    <div className={`inline-flex items-center justify-center select-none shrink-0 rounded-full bg-slate-800 text-[10px] font-bold text-white uppercase border border-slate-700 ${sizeClasses} ${className}`}>
      {normType.slice(0, 2)}
    </div>
  );
};
