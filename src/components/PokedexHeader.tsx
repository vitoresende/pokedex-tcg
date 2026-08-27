import React, { useState } from 'react';
import { Volume2, VolumeX, ShieldCheck, ShieldAlert, Sparkles, User as UserIcon } from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { useAuth } from '../context/AuthContext';
import { soundEffects } from '../services/audio';

interface PokedexHeaderProps {
  onNavigateToAuth: () => void;
}

export const PokedexHeader: React.FC<PokedexHeaderProps> = ({ onNavigateToAuth }) => {
  const { isMuted, toggleMute } = useCollection();
  const { user, isAllowed } = useAuth();
  const [photoError, setPhotoError] = useState<boolean>(false);

  const handleSensorClick = () => {
    soundEffects.playScan();
  };

  const userInitial = (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-pokedex-red border-b-4 border-pokedex-darkred shadow-lg select-none">
      {/* Upper Pokedex bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Sensor & Status LEDs */}
        <div className="flex items-center space-x-3">
          {/* Main Blue Lens / Sensor */}
          <button
            onClick={handleSensorClick}
            aria-label="Pokédex Optical Sensor"
            className="relative w-12 h-12 rounded-full bg-white p-1 shadow-md hover:scale-105 active:scale-95 transition-transform flex items-center justify-center focus:outline-none"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-300 via-pokedex-blue to-blue-700 shadow-inner flex items-center justify-center relative overflow-hidden border-2 border-white">
              {/* Lens Glare */}
              <div className="absolute top-1 left-1.5 w-3.5 h-3.5 rounded-full bg-white/70 blur-[0.5px]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse"></div>
            </div>
          </button>

          {/* Mini 3 LEDs (Red, Yellow, Green) */}
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 border border-red-950 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-950 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-950 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
          </div>
        </div>

        {/* Title & Brand */}
        <div className="text-center hidden sm:block">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-4 h-4 text-pokedex-yellow" />
            <h1 className="font-display font-black text-xl tracking-wider text-white uppercase drop-shadow-md">
              Pokédex TCG Master
            </h1>
            <span className="bg-pokedex-darkred/60 text-yellow-300 font-mono text-xs px-2 py-0.5 rounded font-bold border border-yellow-400/30">
              v1.0
            </span>
          </div>
        </div>

        {/* Action Controls: Audio & User Profile */}
        <div className="flex items-center space-x-2">
          {/* Mute/Sound Button */}
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Enable sounds" : "Mute sounds"}
            className="w-9 h-9 rounded-lg bg-pokedex-darkred/80 hover:bg-pokedex-darkred text-white flex items-center justify-center border border-white/20 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-yellow-300 animate-pulse" />}
          </button>

          {/* User Auth Status Pill (Top Right) */}
          <button
            onClick={onNavigateToAuth}
            className="flex items-center space-x-2 bg-pokedex-darker hover:bg-black/60 text-white px-3 py-1.5 rounded-xl border border-white/20 text-xs font-medium transition-all shadow-md active:scale-95"
          >
            {user ? (
              <>
                <div className="relative">
                  {user.photoURL && !photoError ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={() => setPhotoError(true)}
                      className="w-6 h-6 rounded-full object-cover border border-white/70 shadow-sm"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pokedex-blue to-blue-700 text-white flex items-center justify-center text-xs font-bold border border-white/60 shadow-sm">
                      {userInitial}
                    </div>
                  )}
                  {isAllowed ? (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950 shadow-sm"></div>
                  ) : (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-slate-950 shadow-sm"></div>
                  )}
                </div>
                <span className="hidden md:inline truncate max-w-[100px] text-slate-200 font-semibold">
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                {isAllowed ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
              </>
            ) : (
              <span className="text-yellow-300 font-semibold flex items-center gap-1.5">
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Decorative Pokedex Bevel Line */}
      <div className="h-1 bg-gradient-to-r from-red-600 via-red-400 to-red-600"></div>
    </header>
  );
};
