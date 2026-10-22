import React, { useState } from 'react';
import { X, Check, Award, Shield, Moon } from 'lucide-react';
import { UserSession } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  user: UserSession;
  onClose: () => void;
  onSave: (newUser: UserSession) => void;
}

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=wolf_gothic_1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=knight_armor_2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=sorceress_witch_3',
  'https://api.dicebear.com/7.x/bottts/svg?seed=hunter_ranger_4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=seer_oracle_5',
  'https://api.dicebear.com/7.x/bottts/svg?seed=guard_paladin_6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=cupid_angel_7',
  'https://api.dicebear.com/7.x/bottts/svg?seed=villager_miller_8',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, user, onClose, onSave }) => {
  const [pseudo, setPseudo] = useState(user.pseudonym);
  const [avatar, setAvatar] = useState(user.avatar);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pseudo.trim().length === 0) return;
    onSave({
      ...user,
      pseudonym: pseudo.trim(),
      avatar
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-gothic-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gothic-950/80">
          <h3 className="font-serif font-black text-lg text-white">Profil & Statistiques</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Pseudonyme */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Votre Pseudonyme
            </label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              maxLength={24}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-gothic-950 border border-slate-700 text-white font-medium focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
              placeholder="Ex: Aldous le Sage"
            />
          </div>

          {/* Choix d'avatar */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Choisissez votre Avatar
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {AVATAR_OPTIONS.map((url, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setAvatar(url)}
                  className={`relative p-2 rounded-xl border-2 transition ${
                    avatar === url
                      ? 'border-red-500 bg-red-950/40 shadow-lg shadow-red-950/50 scale-105'
                      : 'border-slate-800 bg-gothic-950 hover:border-slate-600'
                  }`}
                >
                  <img src={url} alt={`Avatar ${i}`} className="w-full h-12 object-contain" />
                  {avatar === url && (
                    <div className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Statistiques sauvegardées localement */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Historique de Bravoure
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-gothic-950 border border-slate-800">
                <Award className="w-4 h-4 text-amber-400 mx-auto mb-0.5" />
                <span className="text-base font-bold text-white block">12</span>
                <span className="text-[10px] text-slate-400">Parties</span>
              </div>
              <div className="p-2 rounded-lg bg-gothic-950 border border-slate-800">
                <Shield className="w-4 h-4 text-blue-400 mx-auto mb-0.5" />
                <span className="text-base font-bold text-white block">8</span>
                <span className="text-[10px] text-slate-400">Victoires</span>
              </div>
              <div className="p-2 rounded-lg bg-gothic-950 border border-slate-800">
                <Moon className="w-4 h-4 text-red-500 mx-auto mb-0.5" />
                <span className="text-base font-bold text-white block">67%</span>
                <span className="text-[10px] text-slate-400">Taux</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs transition shadow-lg shadow-red-950/50"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
