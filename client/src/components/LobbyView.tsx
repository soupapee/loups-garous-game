import React, { useState } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  Crown, 
  Play, 
  LogOut, 
  Bot, 
  Clock, 
  ShieldCheck, 
  Send,
  MessageSquare
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { ChatMessage, RoomData, UserSession } from '../types';

interface LobbyViewProps {
  room: RoomData;
  currentUser: UserSession;
  chatMessages: ChatMessage[];
  onToggleReady: () => void;
  onFillBots: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onSendMessage: (text: string) => void;
  loading: boolean;
  errorMessage?: string;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentUser,
  chatMessages,
  onToggleReady,
  onFillBots,
  onStartGame,
  onLeaveRoom,
  onSendMessage,
  loading,
  errorMessage
}) => {
  const [copied, setCopied] = useState(false);
  const [inputText, setInputText] = useState('');

  const isHost = room.hostId === currentUser.id;
  const currentPlayer = room.players.find(p => p.userId === currentUser.id);
  const isReady = currentPlayer?.ready || false;
  const isFull = room.players.length === room.settings.playerCount;
  const allReady = room.players.every(p => p.ready);
  const canStart = isHost && isFull && allReady;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.inviteCode);
    setCopied(true);
    soundEngine.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim().length === 0) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Bannière d'en-tête du Salon */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gothic-900 via-gothic-950 to-gothic-900 border border-slate-700 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest block mb-1">
            Chambre Secrète d'Attente
          </span>
          <h2 className="font-serif font-black text-2xl md:text-3xl text-white">
            Rassemblement du Village
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
              <Users className="w-4 h-4 text-indigo-400" />
              <strong>{room.players.length} / {room.settings.playerCount}</strong> Joueurs
            </span>
            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
              <Clock className="w-4 h-4 text-amber-400" /> Débat : {room.settings.discussionDurationSeconds}s | Vote : {room.settings.votingDurationSeconds}s
            </span>
            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Révélation à la mort
            </span>
          </div>
        </div>

        {/* Code du salon & Partage */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="flex items-center gap-2 bg-gothic-950 px-4 py-2.5 rounded-xl border border-slate-700 shadow-inner">
            <span className="text-xs text-slate-400">Code d'invitation :</span>
            <span className="font-mono font-black text-xl text-amber-400 tracking-wider">
              {room.inviteCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="ml-2 p-1.5 rounded-lg bg-gothic-800 hover:bg-gothic-700 text-slate-200 transition"
              title="Copier le code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && (
            <span className="text-[10px] text-emerald-400 font-semibold">
              Code copié dans le presse-papiers !
            </span>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/70 border border-red-700 text-red-200 text-xs font-semibold text-center">
          {errorMessage}
        </div>
      )}

      {/* Grille principale : Joueurs à gauche, Chat et Contrôles à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Joueurs (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" /> Habitants Réunis ({room.players.length}/{room.settings.playerCount})
            </h3>
            {isHost && !isFull && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onFillBots();
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 shadow"
                title={`Remplir instantanément à ${room.settings.playerCount} joueurs pour tester la partie`}
              >
                <Bot className="w-4 h-4" /> Remplir avec des Bots (Test {room.settings.playerCount} Joueurs)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.players.map((p) => {
              const isPPlayerHost = p.userId === room.hostId;
              const isCurrent = p.userId === currentUser.id;

              return (
                <div
                  key={p.userId}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    isCurrent
                      ? 'border-red-600/70 bg-gradient-to-r from-red-950/40 via-gothic-900 to-gothic-900 shadow-md'
                      : 'border-slate-800 bg-gothic-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={p.avatar}
                        alt={p.pseudonym}
                        className="w-11 h-11 rounded-full border border-slate-700 bg-slate-950 object-cover"
                      />
                      {isPPlayerHost && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-black p-0.5 rounded-full shadow" title="Hôte de la partie">
                          <Crown className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-sm text-white">
                          {p.pseudonym}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] bg-red-900/60 text-red-200 px-1.5 py-0.2 rounded font-semibold border border-red-700/40">
                            Vous
                          </span>
                        )}
                        {p.isBot && (
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-semibold border border-slate-700">
                            IA
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {p.connected ? 'En ligne' : 'Déconnecté'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {p.ready ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Prêt
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        En attente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Places vides restantes */}
            {Array.from({ length: Math.max(0, room.settings.playerCount - room.players.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="p-3.5 rounded-xl border border-dashed border-slate-800 bg-black/20 flex items-center justify-center text-center text-slate-500 text-xs"
              >
                Place vacante ({room.players.length + idx + 1}/10)
              </div>
            ))}
          </div>

          {/* Boutons d'action du joueur */}
          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={() => {
                soundEngine.playClick();
                onToggleReady();
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-serif font-bold text-sm transition shadow-lg ${
                isReady
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-950/40 border border-emerald-500'
              }`}
            >
              {isReady ? 'Annuler mon statut Prêt' : 'Je suis Prêt !'}
            </button>

            {isHost && (
              <button
                onClick={() => {
                  soundEngine.playWolfHowl();
                  onStartGame();
                }}
                disabled={!canStart || loading}
                className={`flex-1 py-3 px-4 rounded-xl font-serif font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl ${
                  canStart && !loading
                    ? 'bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white border border-red-400 shadow-red-950/60'
                    : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title={
                  !isFull
                    ? `Il manque ${10 - room.players.length} joueur(s)`
                    : !allReady
                    ? 'Tous les joueurs doivent être prêts'
                    : 'Lancer la partie'
                }
              >
                <Play className="w-4 h-4 fill-current" />
                {loading ? 'Lancement...' : `Lancer la Partie (${room.settings.playerCount} Joueurs)`}
              </button>
            )}

            <button
              onClick={() => {
                soundEngine.playClick();
                onLeaveRoom();
              }}
              className="py-3 px-4 rounded-xl bg-gothic-950 hover:bg-gothic-900 text-rose-400 border border-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Quitter
            </button>
          </div>
        </div>

        {/* Colonne Chat du Salon (1/3) */}
        <div className="rounded-2xl border border-slate-700 bg-gothic-900 flex flex-col h-[520px] shadow-2xl overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 bg-gothic-950 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <h4 className="font-serif font-bold text-sm text-white">Chat du Salon</h4>
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
            {chatMessages.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                Aucun message pour le moment. Saluez vos compagnons de jeu !
              </div>
            ) : (
              chatMessages.map((m) => {
                const isMe = m.senderId === currentUser.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 font-medium mb-0.5">
                      {m.senderName}
                    </span>
                    <div
                      className={`p-2.5 rounded-xl max-w-[85%] break-words leading-relaxed ${
                        isMe
                          ? 'bg-red-950/80 border border-red-800/70 text-slate-100 rounded-tr-none'
                          : 'bg-gothic-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-gothic-950 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrire un message..."
              maxLength={200}
              className="flex-1 px-3 py-2 rounded-xl bg-gothic-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={inputText.trim().length === 0}
              className="p-2 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
