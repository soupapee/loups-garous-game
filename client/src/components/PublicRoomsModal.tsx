import React from 'react';
import { X, Users, RefreshCw, KeyRound } from 'lucide-react';
import { RoomData } from '../types';

interface PublicRoomsModalProps {
  isOpen: boolean;
  rooms: RoomData[];
  onClose: () => void;
  onRefresh: () => void;
  onJoin: (inviteCode: string) => void;
  loading: boolean;
}

export const PublicRoomsModal: React.FC<PublicRoomsModalProps> = ({
  isOpen,
  rooms,
  onClose,
  onRefresh,
  onJoin,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-gothic-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gothic-950/80">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-serif font-black text-lg text-white">Salons Publics Disponibles</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {rooms.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-slate-400">Aucun salon public ouvert en ce moment.</p>
              <p className="text-xs text-slate-500 mt-1">Créez votre propre partie pour accueillir des villageois !</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-gothic-950 hover:border-slate-700 transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-amber-400 text-xs bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                      {room.inviteCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      Salon de {room.players[0]?.pseudonym || 'Hôte'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>Joueurs : {room.players.length} / {room.settings.playerCount}</span>
                    <span>Débat : {room.settings.discussionDurationSeconds}s</span>
                  </div>
                </div>

                <button
                  onClick={() => onJoin(room.inviteCode)}
                  className="px-3.5 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Rejoindre
                </button>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-gothic-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
