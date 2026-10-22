import React, { useState } from 'react';
import { Volume2, VolumeX, Moon, User } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { UserSession } from '../types';

interface HeaderProps {
  user: UserSession;
  roomCode?: string;
  isConnected?: boolean;
  onOpenProfile: () => void;
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  roomCode, 
  isConnected = true, 
  onOpenProfile, 
  onOpenRules 
}) => {
  const [muted, setMuted] = useState(soundEngine.isMuted());
  const [volume, setVolume] = useState(soundEngine.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handleToggleMute = () => {
    const isMute = soundEngine.toggleMute();
    setMuted(isMute);
    soundEngine.playClick();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundEngine.setVolume(val);
  };

  return (
    <header className="relative z-30 border-b border-gothic-800 bg-gothic-950/90 backdrop-blur-md px-4 lg:px-8 py-3 flex items-center justify-between shadow-xl">
      {/* Logo & Titre */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-900 to-indigo-900 border border-slate-700 flex items-center justify-center shadow-lg shadow-red-950/40">
          <Moon className="w-6 h-6 text-slate-100" />
        </div>
        <div>
          <h1 className="font-serif font-black text-lg md:text-xl text-slate-100 tracking-wider flex items-center gap-2">
            Les Loups-Garous
            <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-red-950/90 border border-red-700/60 text-red-300">
              Ombres du Village
            </span>
          </h1>
          {roomCode && (
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Salon :</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40">
                {roomCode}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contrôles droite : Statut Serveur, Règles, Son, Profil */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Statut Réseau Backend */}
        <div 
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gothic-900 border border-slate-800 text-[11px]"
          title={isConnected ? 'Serveur temps réel connecté sur le port 4000' : 'Serveur déconnecté sur le port 4000'}
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className={isConnected ? 'text-slate-300' : 'text-rose-400 font-semibold'}>
            {isConnected ? 'Serveur En Ligne' : 'Serveur Hors-Ligne'}
          </span>
        </div>

        {/* Bouton Règles */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenRules();
          }}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gothic-850 hover:bg-gothic-800 text-slate-300 border border-slate-700/70 transition shadow-sm"
        >
          Règles & Rôles
        </button>

        {/* Contrôle Audio Web Audio API */}
        <div 
          className="relative flex items-center"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-gothic-850 hover:bg-gothic-800 border border-slate-700/70 text-slate-300 transition"
            title={muted ? 'Activer le son' : 'Couper le son'}
          >
            {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-slate-200" />}
          </button>

          {showVolumeSlider && (
            <div className="absolute right-0 top-12 p-3 bg-gothic-900 border border-slate-700 rounded-xl shadow-2xl z-50 flex items-center gap-2 w-44">
              <span className="text-[10px] text-slate-400">Vol:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-red-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-300 w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Profil Joueur */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenProfile();
          }}
          className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-gothic-850 hover:bg-gothic-800 border border-slate-700/80 transition"
        >
          <img
            src={user.avatar}
            alt={user.pseudonym}
            className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 object-cover"
          />
          <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate hidden sm:inline">
            {user.pseudonym}
          </span>
          <User className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
};
