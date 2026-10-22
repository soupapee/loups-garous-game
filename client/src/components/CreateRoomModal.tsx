import React, { useState } from 'react';
import { X, Sparkles, Shield, Clock, Users } from 'lucide-react';
import { getDefaultRolesForPlayerCount, Role, RoomSettings } from '../types';
import { ROLE_INFO } from './RoleCard';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (settings: RoomSettings) => void;
  loading: boolean;
  errorMessage?: string;
  isConnected?: boolean;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  loading,
  errorMessage,
  isConnected = true
}) => {
  const [playerCount, setPlayerCount] = useState<number>(10);
  const [discussionDuration, setDiscussionDuration] = useState<number>(60);
  const [votingDuration, setVotingDuration] = useState<number>(45);
  const [revealOnDeath, setRevealOnDeath] = useState<boolean>(true);

  if (!isOpen) return null;

  // Calcul dynamique de la composition de rôles adaptée
  const currentRoles = getDefaultRolesForPlayerCount(playerCount);

  // Groupement des rôles par occurrences pour affichage lisible
  const roleCounts: Record<string, { role: Role; count: number }> = {};
  currentRoles.forEach((role) => {
    if (!roleCounts[role]) {
      roleCounts[role] = { role, count: 0 };
    }
    roleCounts[role].count++;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      playerCount,
      discussionDurationSeconds: discussionDuration,
      votingDurationSeconds: votingDuration,
      revealExactRoleOnDeath: revealOnDeath,
      roles: currentRoles
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-gothic-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gothic-950/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            <h3 className="font-serif font-black text-xl text-white">Créer un Salon Personnalisé</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Sélection libre du nombre de joueurs (4 à 18) */}
          <div className="p-4 rounded-xl bg-gothic-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-indigo-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Nombre de Joueurs</span>
                  <span className="text-[11px] text-slate-400">Réglez la taille du village (4 à 18)</span>
                </div>
              </div>
              <span className="font-serif text-xl font-black text-amber-400 px-3.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/40">
                {playerCount} Joueurs
              </span>
            </div>

            {/* Curseur & Sélecteur rapide */}
            <input
              type="range"
              min="4"
              max="18"
              step="1"
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />

            {/* Raccourcis rapides */}
            <div className="flex gap-1.5 justify-between pt-1">
              {[4, 6, 8, 10, 12, 15, 18].map((count) => (
                <button
                  type="button"
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={`px-2 py-1 text-[11px] rounded font-bold transition ${
                    playerCount === count
                      ? 'bg-red-800 text-white border border-red-500 shadow'
                      : 'bg-gothic-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {count}j
                </button>
              ))}
            </div>
          </div>

          {/* Durées des chronomètres */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Débat (sec.)
              </label>
              <select
                value={discussionDuration}
                onChange={(e) => setDiscussionDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-gothic-950 border border-slate-700 text-white text-xs font-semibold focus:border-red-500 focus:outline-none"
              >
                <option value={30}>30 secondes</option>
                <option value={45}>45 secondes</option>
                <option value={60}>60 secondes (Défaut)</option>
                <option value={90}>90 secondes</option>
                <option value={120}>120 secondes</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-400" /> Vote (sec.)
              </label>
              <select
                value={votingDuration}
                onChange={(e) => setVotingDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-gothic-950 border border-slate-700 text-white text-xs font-semibold focus:border-red-500 focus:outline-none"
              >
                <option value={30}>30 secondes</option>
                <option value={45}>45 secondes (Défaut)</option>
                <option value={60}>60 secondes</option>
              </select>
            </div>
          </div>

          {/* Révélation du rôle à la mort */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gothic-950 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-slate-400" />
              <div>
                <span className="text-xs font-bold text-white block">Révélation à la mort</span>
                <span className="text-[11px] text-slate-400">Dévoile le rôle exact au village lors du trépas</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={revealOnDeath}
                onChange={(e) => setRevealOnDeath(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {/* Composition dynamique des rôles selon le nombre de joueurs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Composition Équilibrée ({currentRoles.length} Rôles / {playerCount} Joueurs)
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                ✓ Équilibrage automatique
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-black/40 p-3 rounded-xl border border-slate-800 text-slate-300 max-h-40 overflow-y-auto">
              {Object.values(roleCounts).map(({ role, count }) => {
                const info = ROLE_INFO[role];
                return (
                  <div key={role} className="flex items-center justify-between py-1 px-1.5 rounded bg-gothic-950/60 border border-white/5">
                    <span className="font-semibold text-slate-200 truncate pr-1">
                      {info?.name || role}
                    </span>
                    <span className="font-mono font-bold text-amber-400 bg-black/50 px-1.5 rounded">
                      x{count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {!isConnected && (
            <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-700/80 text-amber-200 text-xs text-center font-medium">
              ⚠️ Le serveur de jeu (port 4000) semble hors-ligne. Vérifiez que la commande backend est bien lancée.
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs text-center font-medium">
              {errorMessage}
            </div>
          )}

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
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-red-950/50"
            >
              {loading ? 'Création...' : `Créer le Salon (${playerCount} Joueurs)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
