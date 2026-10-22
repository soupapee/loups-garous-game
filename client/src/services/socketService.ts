import { io, Socket } from 'socket.io-client';
import {
  ChatMessage,
  ClientGameState,
  NightActionPayload,
  RoomData,
  RoomSettings,
  UserSession
} from '../types';

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor() {
    const configuredServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL?.trim();
    if (configuredServerUrl) {
      this.serverUrl = configuredServerUrl.replace(/\/$/, '');
      return;
    }
    // Port 4000 par défaut pour le backend Node.js
    const isDev = window.location.port === '5173' || window.location.port === '5174';
    this.serverUrl = isDev 
      ? `http://${window.location.hostname || 'localhost'}:4000` 
      : `${window.location.protocol}//${window.location.host}`;
  }

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        timeout: 5000
      });

      this.socket.on('connect', () => {
        console.log('🔗 Connecté au serveur de jeu:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('⚠️ Déconnexion du serveur:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.warn('⚠️ Erreur de connexion au serveur (port 4000):', error.message);
      });
    }
    return this.socket;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public onConnectionChange(callback: (connected: boolean) => void): () => void {
    const s = this.getSocket();
    const handleConnect = () => callback(true);
    const handleDisconnect = () => callback(false);

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);

    // Notifier immédiatement de l'état actuel
    callback(s.connected);

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
    };
  }

  /**
   * Helper d'émission avec délai d'expiration pour éviter les promesses bloquées
   */
  private emitWithTimeout<T>(event: string, data: any, timeoutMs: number = 6000): Promise<T> {
    return new Promise((resolve) => {
      const socket = this.getSocket();

      if (!socket.connected) {
        socket.connect();
      }

      const timer = setTimeout(() => {
        resolve({
          success: false,
          message: 'Le serveur backend (port 4000) ne répond pas. Vérifiez que la commande "npm run dev:server" est bien active.'
        } as unknown as T);
      }, timeoutMs);

      socket.emit(event, data, (response: T) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  }

  // --- Salons ---

  public createRoom(hostUser: UserSession, settings?: Partial<RoomSettings>): Promise<{ success: boolean; room?: RoomData; message?: string }> {
    return this.emitWithTimeout('room:create', { hostUser, settings });
  }

  public joinRoom(inviteCode: string, user: UserSession): Promise<{ success: boolean; room?: RoomData; message?: string }> {
    return this.emitWithTimeout('room:join', { inviteCode, user });
  }

  public toggleReady(roomId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    return this.emitWithTimeout('room:toggleReady', { roomId, userId });
  }

  public fillBots(roomId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    return this.emitWithTimeout('room:fillBots', { roomId, userId });
  }

  public leaveRoom(roomId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    return this.emitWithTimeout('room:leave', { roomId, userId });
  }

  public listPublicRooms(): Promise<{ success: boolean; rooms: RoomData[]; message?: string }> {
    return this.emitWithTimeout('room:listPublic', {});
  }

  public startGame(roomId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    return this.emitWithTimeout('room:start', { roomId, userId });
  }

  // --- Jeu en cours ---

  public reconnectGame(roomId: string, userId: string): Promise<{ success: boolean; state?: ClientGameState; message?: string }> {
    return this.emitWithTimeout('game:reconnect', { roomId, userId });
  }

  public submitCupidChoice(roomId: string, cupidUserId: string, target1Id: string, target2Id: string): Promise<{ success: boolean; message?: string }> {
    return this.emitWithTimeout('game:cupidChoice', { roomId, cupidUserId, target1Id, target2Id });
  }

  public submitNightAction(roomId: string, action: Partial<NightActionPayload>): Promise<{ success: boolean; message?: string; payload?: any }> {
    return this.emitWithTimeout('game:nightAction', { roomId, action });
  }

  public submitVote(roomId: string, voterId: string, targetId: string): Promise<{ success: boolean; message?: string }> {
    return this.emitWithTimeout('game:vote', { roomId, voterId, targetId });
  }

  public submitHunterShot(roomId: string, hunterId: string, targetId: string): Promise<{ success: boolean; message?: string }> {
    return this.emitWithTimeout('game:hunterShot', { roomId, hunterId, targetId });
  }

  public sendChatMessage(roomId: string, senderId: string, channel: 'ROOM' | 'VILLAGE' | 'WOLVES' | 'DEAD', text: string): Promise<{ success: boolean; message?: string }> {
    return this.emitWithTimeout('chat:send', { roomId, senderId, channel, text });
  }

  // --- Écouteurs d'événements ---

  public onRoomUpdated(callback: (room: RoomData) => void): () => void {
    const s = this.getSocket();
    s.on('room:updated', callback);
    return () => s.off('room:updated', callback);
  }

  public onGameStarted(callback: (data: { gameId: string }) => void): () => void {
    const s = this.getSocket();
    s.on('room:gameStarted', callback);
    return () => s.off('room:gameStarted', callback);
  }

  public onGameState(callback: (state: ClientGameState) => void): () => void {
    const s = this.getSocket();
    s.on('game:state', callback);
    return () => s.off('game:state', callback);
  }

  public onChatMessage(callback: (message: ChatMessage) => void): () => void {
    const s = this.getSocket();
    s.on('chat:message', callback);
    return () => s.off('chat:message', callback);
  }
}

export const socketService = new SocketService();
