import React from 'react';
import { 
  Moon, 
  PlusCircle, 
  KeyRound, 
  Users, 
  BookOpen, 
  Award
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { UserSession } from '../types';

interface HomeViewProps {
  user: UserSession;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onPublicRooms: () => void;
  onRules: () => void;
  onProfile: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  onCreateRoom,
  onJoinRoom,
  onPublicRooms,
  onRules,
  onProfile
}) => {
  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
      {/* Arrière-plan atmosphérique gothique avec lune et brume */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-gothic-950 to-black pointer-events-none" />
      
      {/* Pleine lune mystique en arrière plan */}
      <div className="absolute top-12 w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-b from-slate-100/10 to-transparent blur-3xl pointer-events-none" />

      {/* Silhouettes de forêt et village brumeux */}
      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center">
        {/* Blason gothique animé */}
        <div 
          onClick={() => {
            soundEngine.playWolfHowl();
          }}
          className="cursor-pointer group relative mb-6"
          title="Cliquez pour entendre le hurlement du loup !"
        >
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-red-950 via-gothic-900 to-black border-2 border-red-700/60 shadow-2xl shadow-red-950/60 flex items-center justify-center group-hover:scale-105 group-hover:border-red-500 transition duration-300">
            <Moon className="w-12 h-12 md:w-14 md:h-14 text-red-500 group-hover:text-red-400 transition" />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-950 text-red-300 border border-red-700/70 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow">
            Hurlement 🐺
          </span>
        </div>

        {/* Titre Principal */}
        <h1 className="font-serif font-black text-4xl sm:text-5xl md:text-6xl text-white tracking-wider mb-2 drop-shadow-2xl">
          Les Loups-Garous
        </h1>
        <h2 className="font-serif text-lg md:text-xl text-red-400 font-semibold tracking-widest uppercase mb-4">
          Ombres du Village
        </h2>
        
        <p className="text-slate-300 text-sm md:text-base max-w-lg mb-8 leading-relaxed font-light">
          Un village médiéval plongé dans les ténèbres. Les bêtes chassent à l'abri des regards.
          Démasquez les monstres avant que le dernier habitant ne soit dévoré.
        </p>

        {/* Profil invité rapide */}
        <div className="flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-gothic-900/80 border border-slate-700/80 shadow-lg mb-8">
          <img
            src={user.avatar}
            alt={user.pseudonym}
            className="w-10 h-10 rounded-full border border-slate-600 bg-slate-900"
          />
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Joueur Actuel
            </span>
            <span className="font-serif font-bold text-white text-sm">
              {user.pseudonym}
            </span>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onProfile();
            }}
            className="ml-3 px-3 py-1 text-xs font-semibold rounded-lg bg-gothic-800 hover:bg-gothic-700 text-slate-200 border border-slate-600 transition"
          >
            Changer
          </button>
        </div>

        {/* Menu Principal des Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-md">
          {/* Créer une partie */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onCreateRoom();
            }}
            className="group py-4 px-5 rounded-2xl bg-gradient-to-r from-red-900 via-red-800 to-red-950 hover:from-red-800 hover:to-red-900 text-white font-serif font-bold text-base border border-red-600/70 shadow-xl shadow-red-950/60 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
          >
            <PlusCircle className="w-5 h-5 text-red-300 group-hover:rotate-90 transition duration-300" />
            Créer une Partie
          </button>

          {/* Rejoindre une partie */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onJoinRoom();
            }}
            className="group py-4 px-5 rounded-2xl bg-gradient-to-r from-gothic-850 to-gothic-900 hover:bg-gothic-800 text-white font-serif font-bold text-base border border-slate-700/80 shadow-xl transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
          >
            <KeyRound className="w-5 h-5 text-amber-400" />
            Rejoindre un Salon
          </button>

          {/* Parties publiques */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onPublicRooms();
            }}
            className="py-3 px-4 rounded-xl bg-gothic-900 hover:bg-gothic-850 text-slate-300 font-semibold text-xs border border-slate-800 transition flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            Parties Publiques
          </button>

          {/* Comment jouer */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onRules();
            }}
            className="py-3 px-4 rounded-xl bg-gothic-900 hover:bg-gothic-850 text-slate-300 font-semibold text-xs border border-slate-800 transition flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Comment Jouer
          </button>
        </div>

        {/* Profil et statistiques */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onProfile();
          }}
          className="mt-3.5 text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          Consulter mon profil et mes statistiques
        </button>
      </div>
    </div>
  );
};
