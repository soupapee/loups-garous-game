import React, { useState } from 'react';
import { X, KeyRound } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (inviteCode: string) => void;
  loading: boolean;
  errorMessage?: string;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  loading,
  errorMessage
}) => {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 0) return;
    onJoin(code.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-gothic-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gothic-950/80">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-black text-lg text-white">Rejoindre une Partie</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Code d'Invitation du Salon
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: LG-7K4X"
              maxLength={12}
              required
              className="w-full text-center tracking-widest uppercase font-mono font-black text-lg px-4 py-3 rounded-xl bg-gothic-950 border border-slate-700 text-amber-400 focus:border-red-500 focus:outline-none"
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs text-center">
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
              disabled={loading || code.trim().length === 0}
              className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-red-950/50"
            >
              {loading ? 'Connexion...' : 'Rejoindre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
