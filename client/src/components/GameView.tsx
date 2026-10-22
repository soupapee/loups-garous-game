import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Moon,
  Sun,
  Clock,
  Skull,
  Shield,
  Heart,
  Eye,
  Crosshair,
  FlaskConical,
  MessageSquare,
  Send,
  Users,
  Check,
  Sparkles,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import {
  Camp,
  ChatMessage,
  ClientGameState,
  Phase,
  Role,
  UserSession
} from '../types';
import { RoleCard, ROLE_INFO } from './RoleCard';

interface GameViewProps {
  gameState: ClientGameState;
  currentUser: UserSession;
  chatMessages: ChatMessage[];
  onCupidChoice: (target1Id: string, target2Id: string) => void;
  onNightAction: (actionType: string, targetId?: string) => void;
  onVote: (targetId: string) => void;
  onHunterShot: (targetId: string) => void;
  onSendMessage: (channel: 'VILLAGE' | 'WOLVES' | 'DEAD', text: string) => void;
  onLeaveGame: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  gameState,
  currentUser,
  chatMessages,
  onCupidChoice,
  onNightAction,
  onVote,
  onHunterShot,
  onSendMessage,
  onLeaveGame
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'MY_ROLE' | 'CHAT'>('ACTIONS');
  const [chatChannel, setChatChannel] = useState<'VILLAGE' | 'WOLVES' | 'DEAD'>('VILLAGE');
  const [chatInput, setChatInput] = useState('');

  // Sélections d'actions
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [cupidTarget1, setCupidTarget1] = useState<string>('');
  const [cupidTarget2, setCupidTarget2] = useState<string>('');
  const [witchPoisonTarget, setWitchPoisonTarget] = useState<string>('');

  // Gestion des sons et effets d'ambiance selon la phase
  useEffect(() => {
    if (gameState.phase === Phase.NIGHT_ACTIONS) {
      soundEngine.playWolfHowl();
    } else if (gameState.phase === Phase.DAWN_ANNOUNCEMENT || gameState.phase === Phase.VOTE_RESOLUTION) {
      soundEngine.playChurchBell();
    } else if (gameState.phase === Phase.VOTING) {
      soundEngine.playHeartbeat();
    } else if (gameState.phase === Phase.GAME_OVER) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [gameState.phase]);

  const me = gameState.players.find(p => p.userId === currentUser.id);
  const amAlive = me?.alive ?? true;
  const isWolf = gameState.myRole === Role.WEREWOLF || gameState.myRole === Role.WOLF_SPY;
  const isWhiteWolf = gameState.myRole === Role.WHITE_WOLF;

  // Filtrage des messages pour le canal sélectionné
  const filteredMessages = chatMessages.filter(m => m.channel === chatChannel);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim().length === 0) return;
    onSendMessage(chatChannel, chatInput);
    setChatInput('');
  };

  const isNight =
    gameState.phase === Phase.NIGHT_ACTIONS ||
    gameState.phase === Phase.CUPID_SELECTION ||
    gameState.phase === Phase.NIGHT_RESOLUTION;

  return (
    <div className={`min-h-[calc(100vh-65px)] p-3 sm:p-6 transition-colors duration-1000 ${
      isNight ? 'bg-gradient-to-b from-gothic-950 via-slate-950 to-black' : 'bg-gradient-to-b from-gothic-900 via-gothic-950 to-black'
    }`}>
      {/* 1. Bannière d'en-tête de Phase & Chronomètre Serveur */}
      <div className="max-w-6xl mx-auto mb-6 p-4 sm:p-5 rounded-2xl bg-gothic-900/90 border border-slate-700 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
            isNight 
              ? 'bg-gradient-to-br from-indigo-950 to-red-950 border-red-700/60 shadow-red-950/50' 
              : 'bg-gradient-to-br from-amber-950 to-amber-900 border-amber-600/60 shadow-amber-950/50'
          }`}>
            {isNight ? (
              <Moon className="w-7 h-7 text-red-400 animate-pulse" />
            ) : (
              <Sun className="w-7 h-7 text-amber-300 animate-spin-slow" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-serif font-black text-amber-400 uppercase tracking-widest">
                Cycle {gameState.roundNumber}
              </span>
              <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-black/40 border border-white/5">
                {isNight ? 'Période Nocturne' : 'Période Diurne'}
              </span>
            </div>

            <h2 className="font-serif font-black text-xl md:text-2xl text-white tracking-wide">
              {gameState.phase === Phase.ROLE_ASSIGNMENT && 'Révélation de votre Rôle Secret'}
              {gameState.phase === Phase.CUPID_SELECTION && 'Cupidon flèche deux amoureux'}
              {gameState.phase === Phase.NIGHT_ACTIONS && 'Nuit profonde — Les pouvoirs s\'éveillent'}
              {gameState.phase === Phase.NIGHT_RESOLUTION && 'Résolution des attaques nocturnes...'}
              {gameState.phase === Phase.DAWN_ANNOUNCEMENT && 'L\'Aube se lève sur le Village'}
              {gameState.phase === Phase.DISCUSSION && 'Débats du Village — Traque des Loups'}
              {gameState.phase === Phase.VOTING && 'Tribunal du Peuple — Vote de Condamnation'}
              {gameState.phase === Phase.VOTE_RESOLUTION && 'Sentence du Bûcher'}
              {gameState.phase === Phase.DEATH_EFFECTS && 'Dernier Souffle du Chasseur !'}
              {gameState.phase === Phase.GAME_OVER && 'Partie Terminée'}
            </h2>
          </div>
        </div>

        {/* Chronomètre Serveur Impartial */}
        {gameState.phase !== Phase.GAME_OVER && (
          <div className="flex items-center gap-3 bg-gothic-950 px-5 py-2.5 rounded-2xl border border-slate-700 shadow-inner">
            <Clock className={`w-6 h-6 ${gameState.timeRemainingSeconds <= 10 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                Temps Restant
              </span>
              <span className={`font-mono font-black text-2xl tracking-wider ${
                gameState.timeRemainingSeconds <= 10 ? 'text-red-500 animate-pulse' : 'text-white'
              }`}>
                {String(Math.floor(gameState.timeRemainingSeconds / 60)).padStart(2, '0')}:
                {String(gameState.timeRemainingSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Annonce des Morts Récentes (Lever du soleil / Exécution) */}
      {gameState.recentDeaths && gameState.recentDeaths.length > 0 && (
        <div className="max-w-6xl mx-auto mb-6 p-4 rounded-2xl bg-red-950/60 border-2 border-red-700/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <Skull className="w-8 h-8 text-red-500 animate-bounce" />
            <div>
              <h4 className="font-serif font-bold text-sm text-red-200 uppercase tracking-wider">
                Funérailles du Village ({gameState.recentDeaths.length} trépas)
              </h4>
              <div className="text-xs text-slate-200 mt-1 space-y-0.5">
                {gameState.recentDeaths.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-bold text-white">{d.pseudonym}</span>
                    <span className="text-slate-400">— {d.cause}</span>
                    {d.role && (
                      <span className="text-[10px] px-2 py-0.2 rounded bg-black/50 text-amber-300 border border-amber-600/40">
                        {ROLE_INFO[d.role]?.name || d.role}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Disposition Centrale : Grille des 10 Habitants & Panneau d'Actions */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grille du Village (2 colonnes sur 3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Les {gameState.players.length} Habitants du Village
            </h3>
            <span className="text-xs text-slate-400">
              {gameState.players.filter(p => p.alive).length} survivants sur {gameState.players.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {gameState.players.map((player) => {
              const isCurrent = player.userId === currentUser.id;
              const isLover = gameState.myLover && gameState.myLover.userId === player.userId;
              const isWolfAlly = gameState.werewolfAllies?.some(a => a.userId === player.userId);
              const isSelected = selectedTargetId === player.userId;

              return (
                <div
                  key={player.userId}
                  onClick={() => {
                    if (player.alive) {
                      soundEngine.playClick();
                      setSelectedTargetId(player.userId);
                    }
                  }}
                  className={`relative p-3 rounded-2xl border-2 flex flex-col items-center text-center transition cursor-pointer select-none ${
                    !player.alive
                      ? 'border-slate-800 bg-black/60 opacity-60 grayscale'
                      : isSelected
                      ? 'border-amber-400 bg-amber-950/40 shadow-xl shadow-amber-950/60 scale-102'
                      : isCurrent
                      ? 'border-red-600/80 bg-gothic-900 shadow-lg'
                      : 'border-slate-800 bg-gothic-900/80 hover:border-slate-600'
                  }`}
                >
                  {/* Badges d'allégeance secrète / amour */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {isLover && (
                      <div className="p-1 rounded-full bg-pink-900 text-pink-300 shadow" title="Votre Amour éternel">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}
                    {isWolfAlly && (
                      <div className="p-1 rounded-full bg-red-900 text-red-300 shadow" title="Allié Loup-Garou">
                        <Moon className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}
                    {player.hasVoted && gameState.phase === Phase.VOTING && (
                      <div className="p-1 rounded-full bg-emerald-900 text-emerald-300 shadow" title="A déjà voté">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div className="relative mb-2">
                    <img
                      src={player.avatar}
                      alt={player.pseudonym}
                      className={`w-14 h-14 rounded-2xl object-cover border-2 ${
                        !player.alive ? 'border-slate-700 bg-black' : 'border-slate-600 bg-slate-900'
                      }`}
                    />
                    {!player.alive && (
                      <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                        <Skull className="w-8 h-8 text-rose-500" />
                      </div>
                    )}
                  </div>

                  <span className="font-serif font-bold text-xs text-white max-w-[100px] truncate">
                    {player.pseudonym}
                  </span>

                  {isCurrent && (
                    <span className="text-[9px] bg-red-950 text-red-300 border border-red-700/60 px-1.5 rounded-full font-bold mt-0.5">
                      Vous
                    </span>
                  )}

                  {/* Rôle dévoilé si mort ou fin de partie */}
                  {player.revealedRole ? (
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full mt-1.5">
                      {ROLE_INFO[player.revealedRole]?.name || player.revealedRole}
                    </span>
                  ) : player.alive ? (
                    <span className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Vivant
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-400 font-semibold mt-1">
                      Trépassé
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Révélation d'informations privées reçues (Voyante, Loup Espion) */}
          {gameState.seerInspectionHistory && Object.keys(gameState.seerInspectionHistory).length > 0 && (
            <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-800/60 shadow-lg">
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Eye className="w-4 h-4" /> Visions Célestes de la Voyante
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(gameState.seerInspectionHistory).map(([round, vision]) => (
                  <div key={round} className="p-2 rounded-lg bg-black/40 border border-sky-900/40 flex items-center justify-between">
                    <span className="text-slate-300">Nuit {round} : {vision.targetName}</span>
                    <span className="font-bold text-amber-400">
                      {ROLE_INFO[vision.role]?.name || vision.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameState.spyInspectionHistory && Object.keys(gameState.spyInspectionHistory).length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 shadow-lg">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Eye className="w-4 h-4" /> Rapports d'Infiltration de l'Espion
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(gameState.spyInspectionHistory).map(([round, rep]) => (
                  <div key={round} className="p-2 rounded-lg bg-black/40 border border-amber-900/40 flex items-center justify-between">
                    <span className="text-slate-300">Nuit {round} : {rep.targetName}</span>
                    <span className="font-bold text-amber-400 uppercase">
                      Camp : {rep.camp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panneau Latéral : Onglets Actions / Carte de Rôle / Chat */}
        <div className="space-y-4">
          {/* Navigation des Onglets */}
          <div className="flex rounded-xl bg-gothic-950 border border-slate-800 p-1">
            <button
              onClick={() => setActiveTab('ACTIONS')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'ACTIONS'
                  ? 'bg-red-950 text-white border border-red-700/60 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-red-400" /> Actions
            </button>
            <button
              onClick={() => setActiveTab('MY_ROLE')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'MY_ROLE'
                  ? 'bg-red-950 text-white border border-red-700/60 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" /> Mon Rôle
            </button>
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'CHAT'
                  ? 'bg-red-950 text-white border border-red-700/60 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Discussion
            </button>
          </div>

          {/* CONTENU ONGLETS */}

          {/* 1. PANNEAU DES ACTIONS DU JOUEUR */}
          {activeTab === 'ACTIONS' && (
            <div className="p-5 rounded-2xl bg-gothic-900 border border-slate-700 shadow-2xl space-y-4">
              <h4 className="font-serif font-black text-base text-white border-b border-slate-800 pb-2">
                Pouvoirs & Décisions
              </h4>

              {/* Si le joueur est mort */}
              {!amAlive && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-center">
                  <Skull className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <h5 className="font-serif font-bold text-rose-300 text-sm">Vous avez succombé</h5>
                  <p className="text-xs text-slate-400 mt-1">
                    Votre voix s'est éteinte avec les vivants. Vous pouvez observer le déroulement et parler dans le chat des esprits défunts.
                  </p>
                </div>
              )}

              {/* Action Cupidon */}
              {amAlive && gameState.phase === Phase.CUPID_SELECTION && gameState.myRole === Role.CUPID && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 fill-current" /> Choisissez deux amoureux :
                  </span>
                  <div className="space-y-2">
                    <select
                      value={cupidTarget1}
                      onChange={(e) => setCupidTarget1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gothic-950 border border-slate-700 text-white text-xs"
                    >
                      <option value="">Sélectionnez le 1er amoureux...</option>
                      {gameState.players.filter(p => p.alive).map(p => (
                        <option key={p.userId} value={p.userId}>{p.pseudonym}</option>
                      ))}
                    </select>

                    <select
                      value={cupidTarget2}
                      onChange={(e) => setCupidTarget2(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gothic-950 border border-slate-700 text-white text-xs"
                    >
                      <option value="">Sélectionnez le 2ème amoureux...</option>
                      {gameState.players.filter(p => p.alive && p.userId !== cupidTarget1).map(p => (
                        <option key={p.userId} value={p.userId}>{p.pseudonym}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => onCupidChoice(cupidTarget1, cupidTarget2)}
                    disabled={!cupidTarget1 || !cupidTarget2 || cupidTarget1 === cupidTarget2}
                    className="w-full py-2.5 rounded-xl bg-pink-800 hover:bg-pink-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg transition"
                  >
                    Lier les Deux Amoureux
                  </button>
                </div>
              )}

              {/* Action Meute des Loups */}
              {amAlive && gameState.phase === Phase.NIGHT_ACTIONS && isWolf && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60">
                    <span className="text-xs font-bold text-red-300 flex items-center gap-1.5 mb-1">
                      <Moon className="w-4 h-4 text-red-500" /> Vote Nocturne de la Meute
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Sélectionnez un habitant à dévorer cette nuit avec vos congénères.
                    </p>
                  </div>

                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gothic-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="">Choisir la victime des loups...</option>
                    {gameState.players.filter(p => p.alive).map(p => (
                      <option key={p.userId} value={p.userId}>{p.pseudonym}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => onNightAction('WOLF_KILL', selectedTargetId)}
                    disabled={!selectedTargetId}
                    className="w-full py-2.5 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg transition"
                  >
                    Voter pour cette Victime
                  </button>
                </div>
              )}

              {/* Action Loup Espion */}
              {amAlive && gameState.phase === Phase.NIGHT_ACTIONS && gameState.myRole === Role.WOLF_SPY && (
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" /> Pouvoir d'Infiltration de l'Espion :
                  </span>
                  <button
                    onClick={() => onNightAction('SPY_INVESTIGATE', selectedTargetId)}
                    disabled={!selectedTargetId}
                    className="w-full py-2 rounded-xl bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs shadow transition"
                  >
                    Sonder le Camp de la Cible
                  </button>
                </div>
              )}

              {/* Action Loup Blanc Solitaire */}
              {amAlive && gameState.phase === Phase.NIGHT_ACTIONS && isWhiteWolf && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                      <Skull className="w-4 h-4" /> Frappe Solitaire du Loup Blanc
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Chassez pour vous seul. Choisissez un habitant à éliminer cette nuit.
                    </p>
                  </div>

                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gothic-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="">Choisir la proie du loup blanc...</option>
                    {gameState.players.filter(p => p.alive && p.userId !== currentUser.id).map(p => (
                      <option key={p.userId} value={p.userId}>{p.pseudonym}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => onNightAction('WHITE_WOLF_KILL', selectedTargetId)}
                    disabled={!selectedTargetId}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg transition"
                  >
                    Égorger cette Proie
                  </button>
                </div>
              )}

              {/* Action Voyante */}
              {amAlive && gameState.phase === Phase.NIGHT_ACTIONS && gameState.myRole === Role.SEER && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" /> Vision Céleste de la Voyante :
                  </span>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gothic-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="">Sélectionner une âme à sonder...</option>
                    {gameState.players.filter(p => p.alive && p.userId !== currentUser.id).map(p => (
                      <option key={p.userId} value={p.userId}>{p.pseudonym}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => onNightAction('SEER_PEEK', selectedTargetId)}
                    disabled={!selectedTargetId}
                    className="w-full py-2.5 rounded-xl bg-sky-800 hover:bg-sky-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg transition"
                  >
                    Révéler son Rôle Secret
                  </button>
                </div>
              )}

              {/* Action Protecteur */}
              {amAlive && gameState.phase === Phase.NIGHT_ACTIONS && gameState.myRole === Role.BODYGUARD && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> Garde Nocturne du Protecteur :
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Vous ne pouvez pas protéger la même personne deux nuits consécutives.
                  </p>

                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gothic-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="">Choisir qui protéger...</option>
                    {gameState.players
                      .filter(p => p.alive && p.userId !== currentUser.id && p.userId !== gameState.guardLastProtectedId)
                      .map(p => (
                        <option key={p.userId} value={p.userId}>{p.pseudonym}</option>
                      ))}
                  </select>

                  <button
                    onClick={() => onNightAction('GUARD_PROTECT', selectedTargetId)}
                    disabled={!selectedTargetId}
                    className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg transition"
                  >
                    Monter la Garde
                  </button>
                </div>
              )}

              {/* Action Sorcière */}
              {amAlive && gameState.phase === Phase.NIGHT_ACTIONS && gameState.myRole === Role.WITCH && (
                <div className="space-y-4">
                  {/* Potion de Soin */}
                  <div className="p-3 rounded-xl bg-gothic-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4 text-purple-400" /> Potion de Guérison
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {gameState.witchState?.healAvailable ? '1 restante' : 'Épuisée'}
                      </span>
                    </span>

                    {gameState.witchState?.wolfVictimName ? (
                      <p className="text-xs text-amber-300">
                        Victime des loups : <strong>{gameState.witchState.wolfVictimName}</strong>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Aucune victime directe des loups pour l'instant.
                      </p>
                    )}

                    <button
                      onClick={() => onNightAction('WITCH_HEAL')}
                      disabled={!gameState.witchState?.healAvailable || !gameState.witchState?.wolfVictimId}
                      className="w-full py-2 rounded-lg bg-purple-800 hover:bg-purple-700 disabled:opacity-30 text-white font-bold text-xs transition"
                    >
                      Sauver la Victime
                    </button>
                  </div>

                  {/* Potion de Poison */}
                  <div className="p-3 rounded-xl bg-gothic-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-rose-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Skull className="w-4 h-4 text-rose-400" /> Potion de Poison
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {gameState.witchState?.poisonAvailable ? '1 restante' : 'Épuisée'}
                      </span>
                    </span>

                    <select
                      value={witchPoisonTarget}
                      onChange={(e) => setWitchPoisonTarget(e.target.value)}
                      disabled={!gameState.witchState?.poisonAvailable}
                      className="w-full px-3 py-2 rounded-xl bg-gothic-900 border border-slate-700 text-white text-xs disabled:opacity-40"
                    >
                      <option value="">Cible à empoisonner...</option>
                      {gameState.players.filter(p => p.alive).map(p => (
                        <option key={p.userId} value={p.userId}>{p.pseudonym}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => onNightAction('WITCH_POISON', witchPoisonTarget)}
                      disabled={!gameState.witchState?.poisonAvailable || !witchPoisonTarget}
                      className="w-full py-2 rounded-lg bg-rose-900 hover:bg-rose-800 disabled:opacity-30 text-white font-bold text-xs transition"
                    >
                      Empoisonner cette Cible
                    </button>
                  </div>
                </div>
              )}

              {/* Action Chasseur (DEATH_EFFECTS) */}
              {gameState.hunterMustShoot && (
                <div className="p-4 rounded-xl bg-orange-950/70 border-2 border-orange-600 space-y-3 animate-pulse">
                  <span className="text-xs font-black text-orange-200 uppercase tracking-wider flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-orange-400" /> Tir Mortel du Chasseur !
                  </span>
                  <p className="text-xs text-orange-100 leading-relaxed">
                    Vous avez été éliminé ! Avant de rendre votre dernier souffle, désignez le joueur à abattre.
                  </p>

                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-orange-500 text-white text-xs font-bold"
                  >
                    <option value="">Sélectionnez votre victime...</option>
                    {gameState.players.filter(p => p.alive).map(p => (
                      <option key={p.userId} value={p.userId}>{p.pseudonym}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      soundEngine.playGunshot();
                      onHunterShot(selectedTargetId);
                    }}
                    disabled={!selectedTargetId}
                    className="w-full py-2.5 rounded-xl bg-orange-700 hover:bg-orange-600 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider shadow-xl transition"
                  >
                    Feu ! Abattre la Cible
                  </button>
                </div>
              )}

              {/* Action Tribunal de Vote (VOTING) */}
              {amAlive && gameState.phase === Phase.VOTING && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                      <Skull className="w-4 h-4 text-amber-400" /> Votez pour Éliminer un Suspect
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Vous pouvez modifier votre vote jusqu'à la fin du décompte. En cas d'égalité, personne ne sera éliminé.
                    </p>
                  </div>

                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gothic-950 border border-slate-700 text-white text-xs font-semibold"
                  >
                    <option value="">Choisir qui condamner au bûcher...</option>
                    {gameState.players.filter(p => p.alive && p.userId !== currentUser.id).map(p => (
                      <option key={p.userId} value={p.userId}>{p.pseudonym}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => onVote(selectedTargetId)}
                    disabled={!selectedTargetId}
                    className="w-full py-2.5 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg transition"
                  >
                    Envoyer au Bûcher
                  </button>
                </div>
              )}

              {/* État passif (Villageois ou attente nocturne) */}
              {amAlive && gameState.phase === Phase.NIGHT_ACTIONS && gameState.myRole === Role.VILLAGER && (
                <div className="p-4 rounded-xl bg-black/40 border border-slate-800 text-center space-y-2">
                  <Moon className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400 italic">
                    « Vous dormez d'un sommeil agité dans votre chaumière pendant que les forces obscures rôdent dans la brume... »
                  </p>
                </div>
              )}

              {/* Discussion de jour */}
              {amAlive && gameState.phase === Phase.DISCUSSION && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-center space-y-2">
                  <Sun className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300">
                    Débattez et confrontez les suspects dans l'onglet Discussion avant l'ouverture du tribunal de vote !
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. ONGLETS MON RÔLE */}
          {activeTab === 'MY_ROLE' && (
            <div className="space-y-4">
              <RoleCard role={gameState.myRole} />

              {/* Révélation de l'Amour éternel de Cupidon */}
              {gameState.myLover && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/60 to-gothic-900 border border-pink-700/60 shadow-xl flex items-center gap-3">
                  <Heart className="w-8 h-8 text-pink-400 fill-current animate-pulse shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-pink-300 tracking-wider block">
                      Lien Amoureux Scellé
                    </span>
                    <span className="font-serif font-black text-sm text-white">
                      Vous êtes éperdument amoureux de {gameState.myLover.pseudonym}
                    </span>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {gameState.myLover.alive ? 'En vie à vos côtés' : 'Trépassé — Votre trépas de chagrin est proche'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. ONGLETS DISCUSSION & SALONS CHAT SÉCURISÉS */}
          {activeTab === 'CHAT' && (
            <div className="rounded-2xl border border-slate-700 bg-gothic-900 flex flex-col h-[520px] shadow-2xl overflow-hidden">
              {/* Canaux de discussion */}
              <div className="flex border-b border-slate-800 bg-gothic-950 p-1.5 gap-1">
                <button
                  onClick={() => setChatChannel('VILLAGE')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                    chatChannel === 'VILLAGE'
                      ? 'bg-amber-950 text-amber-200 border border-amber-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Village
                </button>

                {isWolf && (
                  <button
                    onClick={() => setChatChannel('WOLVES')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                      chatChannel === 'WOLVES'
                        ? 'bg-red-950 text-red-200 border border-red-800'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🐺 Meute
                  </button>
                )}

                <button
                  onClick={() => setChatChannel('DEAD')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                    chatChannel === 'DEAD'
                      ? 'bg-purple-950 text-purple-200 border border-purple-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  💀 Défunts
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-2 text-xs">
                {filteredMessages.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    {chatChannel === 'VILLAGE' && 'Le village est calme pour le moment.'}
                    {chatChannel === 'WOLVES' && 'Concertez-vous en secret avec votre meute.'}
                    {chatChannel === 'DEAD' && 'Le royaume des ombres attend vos murmures.'}
                  </div>
                ) : (
                  filteredMessages.map((m) => {
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

              {/* Formulaire d'envoi */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-gothic-950 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    chatChannel === 'VILLAGE' && !amAlive
                      ? 'Les morts ne peuvent plus parler au village...'
                      : 'Écrire un message...'
                  }
                  disabled={chatChannel === 'VILLAGE' && !amAlive}
                  maxLength={300}
                  className="flex-1 px-3 py-2 rounded-xl bg-gothic-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-red-500 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={chatInput.trim().length === 0 || (chatChannel === 'VILLAGE' && !amAlive)}
                  className="p-2 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL DE FIN DE PARTIE & VICTOIRE GOTHIC */}
      {gameState.phase === Phase.GAME_OVER && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="relative w-full max-w-2xl bg-gothic-900 border-2 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-xl shadow-amber-950/60">
              <Trophy className="w-10 h-10 text-black fill-current" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400 block mb-1">
                Sentence Finale
              </span>
              <h2 className="font-serif font-black text-3xl md:text-4xl text-white">
                {gameState.winnerCamp === Camp.VILLAGE && 'Victoire du Village !'}
                {gameState.winnerCamp === Camp.WEREWOLVES && 'Victoire des Loups-Garous !'}
                {gameState.winnerCamp === Camp.INDEPENDENT && 'Victoire du Loup Blanc !'}
                {gameState.winnerCamp === 'DRAW' && 'Égalité Macabre !'}
              </h2>
              <p className="text-sm text-slate-300 mt-2 italic max-w-lg mx-auto">
                {gameState.winnerMessage}
              </p>
            </div>

            {/* Dévoilement de tous les rôles de la partie */}
            {gameState.allRevealedRoles && (
              <div className="space-y-2 text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Révélation de Tous les Rôles de la Partie :
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs max-h-48 overflow-y-auto p-2 bg-black/50 rounded-xl border border-slate-800">
                  {Object.entries(gameState.allRevealedRoles).map(([uid, info]) => (
                    <div key={uid} className="p-2 rounded-lg bg-gothic-950 border border-slate-800 flex items-center justify-between">
                      <span className="font-serif font-bold text-white truncate max-w-[90px]">
                        {info.pseudonym}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-400">
                        {ROLE_INFO[info.role]?.name || info.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onLeaveGame}
              className="py-3 px-8 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-serif font-bold text-sm shadow-xl shadow-red-950/60 transition flex items-center justify-center gap-2 mx-auto"
            >
              Retour à l'Accueil <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
