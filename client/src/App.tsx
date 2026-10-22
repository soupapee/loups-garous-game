import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { GameView } from './components/GameView';
import { RulesModal } from './components/RulesModal';
import { ProfileModal } from './components/ProfileModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { PublicRoomsModal } from './components/PublicRoomsModal';
import { socketService } from './services/socketService';
import { soundEngine } from './services/soundEngine';
import {
  ChatMessage,
  ClientGameState,
  RoomData,
  RoomSettings,
  UserSession
} from './types';

const STORAGE_KEY = 'loups_garous_user_session';

function getInitialUser(): UserSession {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}

  const randomAdjectives = ['le Sage', 'le Vaillant', 'l\'Ombre', 'le Guetteur', 'des Bois', 'le Silencieux'];
  const randomNames = ['Godefroy', 'Clothilde', 'Guillaume', 'Morgane', 'Barthélemy', 'Éléonore', 'Thibault'];
  const name = `${randomNames[Math.floor(Math.random() * randomNames.length)]} ${randomAdjectives[Math.floor(Math.random() * randomAdjectives.length)]}`;
  const seeds = ['wolf_gothic_1', 'knight_armor_2', 'sorceress_witch_3', 'hunter_ranger_4'];
  const seed = seeds[Math.floor(Math.random() * seeds.length)];

  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `u-${Math.random().toString(36).substring(2, 9)}`;

  const newUser: UserSession = {
    id,
    pseudonym: name,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  } catch (e) {}

  return newUser;
}

export const App: React.FC = () => {
  const [user, setUser] = useState<UserSession>(getInitialUser);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [publicRooms, setPublicRooms] = useState<RoomData[]>([]);

  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isPublicOpen, setIsPublicOpen] = useState(false);

  // États d'action
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isConnected, setIsConnected] = useState<boolean>(socketService.isConnected());

  // Connexion au serveur et enregistrement des écouteurs temps réel
  useEffect(() => {
    socketService.connect();

    const unsubConn = socketService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    const unsubRoom = socketService.onRoomUpdated((updatedRoom) => {
      setRoom(updatedRoom);
    });

    const unsubGameStarted = socketService.onGameStarted(() => {
      soundEngine.playWolfHowl();
    });

    const unsubGameState = socketService.onGameState((state) => {
      setGameState(state);
    });

    const unsubChat = socketService.onChatMessage((msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      unsubConn();
      unsubRoom();
      unsubGameStarted();
      unsubGameState();
      unsubChat();
    };
  }, []);

  // Sauvegarde utilisateur
  const handleSaveUser = (newUser: UserSession) => {
    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {}
  };

  // Actions de salons
  const handleCreateRoom = async (settings: RoomSettings) => {
    setLoading(true);
    setErrorMessage(undefined);
    try {
      const res = await socketService.createRoom(user, settings);
      if (res.success && res.room) {
        setRoom(res.room);
        setGameState(null);
        setChatMessages([]);
        setIsCreateOpen(false);
        soundEngine.playClick();
      } else {
        setErrorMessage(res.message || 'Échec de la création du salon.');
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (inviteCode: string) => {
    setLoading(true);
    setErrorMessage(undefined);
    try {
      const res = await socketService.joinRoom(inviteCode, user);
      if (res.success && res.room) {
        setRoom(res.room);
        setGameState(null);
        setChatMessages([]);
        setIsJoinOpen(false);
        setIsPublicOpen(false);
        soundEngine.playClick();
      } else {
        setErrorMessage(res.message || 'Impossible de rejoindre le salon.');
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReady = async () => {
    if (!room) return;
    await socketService.toggleReady(room.id, user.id);
  };

  const handleFillBots = async () => {
    if (!room) return;
    await socketService.fillBots(room.id, user.id);
  };

  const handleStartGame = async () => {
    if (!room) return;
    setLoading(true);
    setErrorMessage(undefined);
    const res = await socketService.startGame(room.id, user.id);
    if (!res.success) {
      setErrorMessage(res.message);
    }
    setLoading(false);
  };

  const handleLeaveRoom = async () => {
    if (!room) return;
    await socketService.leaveRoom(room.id, user.id);
    setRoom(null);
    setGameState(null);
    setChatMessages([]);
  };

  const handleRefreshPublicRooms = async () => {
    setLoading(true);
    const res = await socketService.listPublicRooms();
    if (res.success) {
      setPublicRooms(res.rooms);
    }
    setLoading(false);
  };

  const handleOpenPublicRooms = () => {
    handleRefreshPublicRooms();
    setIsPublicOpen(true);
  };

  // Actions de jeu
  const handleCupidChoice = async (target1Id: string, target2Id: string) => {
    if (!room) return;
    await socketService.submitCupidChoice(room.id, user.id, target1Id, target2Id);
  };

  const handleNightAction = async (actionType: string, targetId?: string) => {
    if (!room) return;
    await socketService.submitNightAction(room.id, {
      actorId: user.id,
      actionType: actionType as any,
      targetId
    });
  };

  const handleVote = async (targetId: string) => {
    if (!room) return;
    await socketService.submitVote(room.id, user.id, targetId);
  };

  const handleHunterShot = async (targetId: string) => {
    if (!room) return;
    await socketService.submitHunterShot(room.id, user.id, targetId);
  };

  const handleSendChatMessage = async (
    channel: 'ROOM' | 'VILLAGE' | 'WOLVES' | 'DEAD',
    text: string
  ) => {
    if (!room) return;
    await socketService.sendChatMessage(room.id, user.id, channel, text);
  };

  const handleLeaveGame = () => {
    setGameState(null);
    setRoom(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gothic-950 text-slate-100 selection:bg-red-900 selection:text-white">
      {/* En-tête Global avec contrôles audio Web Audio API */}
      <Header
        user={user}
        roomCode={room?.inviteCode}
        isConnected={isConnected}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {/* Corps Principal : Vue Accueil | Salle d'Attente | Jeu en Cours */}
      <main className="flex-1">
        {gameState ? (
          <GameView
            gameState={gameState}
            currentUser={user}
            chatMessages={chatMessages}
            onCupidChoice={handleCupidChoice}
            onNightAction={handleNightAction}
            onVote={handleVote}
            onHunterShot={handleHunterShot}
            onSendMessage={(channel, text) => handleSendChatMessage(channel, text)}
            onLeaveGame={handleLeaveGame}
          />
        ) : room ? (
          <LobbyView
            room={room}
            currentUser={user}
            chatMessages={chatMessages.filter(m => m.channel === 'ROOM')}
            onToggleReady={handleToggleReady}
            onFillBots={handleFillBots}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onSendMessage={(text) => handleSendChatMessage('ROOM', text)}
            loading={loading}
            errorMessage={errorMessage}
          />
        ) : (
          <HomeView
            user={user}
            onCreateRoom={() => setIsCreateOpen(true)}
            onJoinRoom={() => setIsJoinOpen(true)}
            onPublicRooms={handleOpenPublicRooms}
            onRules={() => setIsRulesOpen(true)}
            onProfile={() => setIsProfileOpen(true)}
          />
        )}
      </main>

      {/* Modals & Grimoires */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <ProfileModal
        isOpen={isProfileOpen}
        user={user}
        onClose={() => setIsProfileOpen(false)}
        onSave={handleSaveUser}
      />
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setErrorMessage(undefined);
        }}
        onCreate={handleCreateRoom}
        loading={loading}
        errorMessage={errorMessage}
        isConnected={isConnected}
      />
      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoin={handleJoinRoom}
        loading={loading}
        errorMessage={errorMessage}
      />
      <PublicRoomsModal
        isOpen={isPublicOpen}
        rooms={publicRooms}
        onClose={() => setIsPublicOpen(false)}
        onRefresh={handleRefreshPublicRooms}
        onJoin={handleJoinRoom}
        loading={loading}
      />
    </div>
  );
};

export default App;
