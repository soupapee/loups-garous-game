import { v4 as uuidv4 } from 'uuid';
import {
  DEFAULT_10_PLAYER_ROLES,
  getDefaultRolesForPlayerCount,
  Role,
  RoomData,
  RoomPlayer,
  RoomSettings
} from '../types';
import { GameEngine } from './GameEngine';
import { mysqlDb } from '../db/mysql';

export class RoomManager {
  private rooms: Map<string, RoomData> = new Map();
  private roomsByCode: Map<string, string> = new Map(); // inviteCode -> roomId
  private games: Map<string, GameEngine> = new Map(); // roomId -> GameEngine

  /**
   * Génère un code d'invitation sécurisé, unique et lisible (ex: LOUPS-7X9)
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = 'LG-';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.roomsByCode.has(code));
    return code;
  }

  /**
   * Crée un nouveau salon privé avec nombre de joueurs dynamique
   */
  public createRoom(
    hostUser: { id: string; pseudonym: string; avatar: string },
    customSettings?: Partial<RoomSettings>
  ): RoomData {
    const roomId = uuidv4();
    const inviteCode = this.generateInviteCode();

    const targetPlayerCount = customSettings?.playerCount || 10;

    const defaultSettings: RoomSettings = {
      playerCount: targetPlayerCount,
      discussionDurationSeconds: 60,
      votingDurationSeconds: 45,
      revealExactRoleOnDeath: true,
      roles: customSettings?.roles || getDefaultRolesForPlayerCount(targetPlayerCount)
    };

    const settings: RoomSettings = { ...defaultSettings, ...customSettings };

    // S'assurer que le nombre de rôles correspond toujours au nombre de joueurs choisi
    if (!settings.roles || settings.roles.length !== settings.playerCount) {
      settings.roles = getDefaultRolesForPlayerCount(settings.playerCount);
    }

    const hostPlayer: RoomPlayer = {
      userId: hostUser.id,
      pseudonym: hostUser.pseudonym,
      avatar: hostUser.avatar,
      ready: true, // L'hôte est prêt par défaut
      connected: true
    };

    const room: RoomData = {
      id: roomId,
      inviteCode,
      hostId: hostUser.id,
      status: 'WAITING',
      settings,
      players: [hostPlayer],
      createdAt: Date.now()
    };

    this.rooms.set(roomId, room);
    this.roomsByCode.set(inviteCode, roomId);

    // Sauvegarde asynchrone MySQL XAMPP
    mysqlDb.saveRoom(room);
    mysqlDb.saveRoomPlayer(roomId, hostPlayer);

    return room;
  }

  /**
   * Récupère un salon par son ID
   */
  public getRoom(roomId: string): RoomData | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Récupère un salon par son code d'invitation
   */
  public getRoomByCode(code: string): RoomData | undefined {
    const cleanCode = code.trim().toUpperCase();
    const roomId = this.roomsByCode.get(cleanCode);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  /**
   * Récupère la liste des salons publics/ouverts
   */
  public getOpenRooms(): RoomData[] {
    return Array.from(this.rooms.values())
      .filter(r => r.status === 'WAITING' && r.players.length < r.settings.playerCount);
  }

  /**
   * Rejoint un salon avec vérification stricte de capacité et concurrence
   */
  public joinRoom(
    inviteCode: string,
    user: { id: string; pseudonym: string; avatar: string },
    socketId?: string
  ): { success: boolean; message?: string; room?: RoomData } {
    const room = this.getRoomByCode(inviteCode);
    if (!room) {
      return { success: false, message: 'Salon introuvable avec ce code d\'invitation.' };
    }

    if (room.status !== 'WAITING') {
      return { success: false, message: 'La partie a déjà commencé dans ce salon.' };
    }

    // Si le joueur est déjà dans le salon, mise à jour de sa connexion
    const existingIndex = room.players.findIndex(p => p.userId === user.id);
    if (existingIndex !== -1) {
      room.players[existingIndex].connected = true;
      room.players[existingIndex].socketId = socketId;
      return { success: true, room };
    }

    // Vérification de capacité stricte
    if (room.players.length >= room.settings.playerCount) {
      return { success: false, message: 'Le salon est complet.' };
    }

    const newPlayer: RoomPlayer = {
      userId: user.id,
      pseudonym: user.pseudonym,
      avatar: user.avatar,
      ready: false,
      connected: true,
      socketId
    };

    room.players.push(newPlayer);
    mysqlDb.saveRoomPlayer(room.id, newPlayer);
    return { success: true, room };
  }

  /**
   * Bascule le statut prêt d'un joueur
   */
  public toggleReady(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'WAITING') return false;

    const player = room.players.find(p => p.userId === userId);
    if (!player) return false;

    player.ready = !player.ready;
    mysqlDb.saveRoomPlayer(roomId, player);
    return true;
  }

  /**
   * Permet à un joueur de quitter le salon
   */
  public leaveRoom(roomId: string, userId: string): { roomEmpty: boolean; newHostId?: string; room?: RoomData } {
    const room = this.rooms.get(roomId);
    if (!room) return { roomEmpty: true };

    room.players = room.players.filter(p => p.userId !== userId);
    mysqlDb.removeRoomPlayer(roomId, userId);

    if (room.players.length === 0) {
      // Salon vide : destruction propre
      this.rooms.delete(roomId);
      this.roomsByCode.delete(room.inviteCode);
      const game = this.games.get(roomId);
      if (game) {
        game.stopTimer();
        this.games.delete(roomId);
      }
      return { roomEmpty: true };
    }

    // Si l'hôte part, transmission du rôle d'hôte au joueur suivant
    let newHostId: string | undefined = undefined;
    if (room.hostId === userId) {
      room.hostId = room.players[0].userId;
      room.players[0].ready = true; // Le nouvel hôte est prêt
      newHostId = room.hostId;
      mysqlDb.saveRoom(room);
    }

    return { roomEmpty: false, newHostId, room };
  }

  /**
   * Remplir le salon avec des bots de test pour atteindre le nombre de joueurs choisi
   */
  public fillWithBots(roomId: string): { success: boolean; message?: string } {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'WAITING') {
      return { success: false, message: 'Salon non modifiable.' };
    }

    const botNames = [
      'Godefroy de Montmirail',
      'Morgana la Sorcière',
      'Guillaume le Meunier',
      'Isolde aux Blanches Mains',
      'Barthélemy l\'Armurier',
      'Éléonore d\'Aquitaine',
      'Thibault des Bois',
      'Geneviève la Tisserande',
      'Sire Clothaire',
      'Dame Blanche',
      'Lancelot du Lac',
      'Yseult la Blonde',
      'Perceval le Gallois',
      'Viviane la Fée',
      'Gauvain le Brave',
      'Bertrand le Forgeron',
      'Marguerite des Prés',
      'Gaspard le Bûcheron'
    ];

    const botAvatars = [
      'https://api.dicebear.com/7.x/bottts/svg?seed=knight',
      'https://api.dicebear.com/7.x/bottts/svg?seed=witch',
      'https://api.dicebear.com/7.x/bottts/svg?seed=miller',
      'https://api.dicebear.com/7.x/bottts/svg?seed=maiden',
      'https://api.dicebear.com/7.x/bottts/svg?seed=blacksmith',
      'https://api.dicebear.com/7.x/bottts/svg?seed=queen',
      'https://api.dicebear.com/7.x/bottts/svg?seed=ranger',
      'https://api.dicebear.com/7.x/bottts/svg?seed=weaver',
      'https://api.dicebear.com/7.x/bottts/svg?seed=noble',
      'https://api.dicebear.com/7.x/bottts/svg?seed=ghost',
      'https://api.dicebear.com/7.x/bottts/svg?seed=paladin',
      'https://api.dicebear.com/7.x/bottts/svg?seed=priestess',
      'https://api.dicebear.com/7.x/bottts/svg?seed=bard',
      'https://api.dicebear.com/7.x/bottts/svg?seed=druid',
      'https://api.dicebear.com/7.x/bottts/svg?seed=cleric',
      'https://api.dicebear.com/7.x/bottts/svg?seed=alchemist',
      'https://api.dicebear.com/7.x/bottts/svg?seed=innkeeper',
      'https://api.dicebear.com/7.x/bottts/svg?seed=hunter2'
    ];

    let botIdx = 0;
    while (room.players.length < room.settings.playerCount) {
      const name = botNames[botIdx % botNames.length];
      const avatar = botAvatars[botIdx % botAvatars.length];
      const botId = `bot-${uuidv4().substring(0, 8)}`;

      const botPlayer: RoomPlayer = {
        userId: botId,
        pseudonym: `${name}`,
        avatar,
        ready: true,
        connected: true,
        isBot: true
      };

      room.players.push(botPlayer);
      mysqlDb.saveRoomPlayer(roomId, botPlayer);
      botIdx++;
    }

    return { success: true };
  }

  /**
   * Lance la partie (autorisé uniquement pour l'hôte quand tout le monde est prêt)
   */
  public startGame(
    roomId: string,
    hostUserId: string,
    onPhaseChange?: (engine: GameEngine) => void
  ): { success: boolean; message?: string; game?: GameEngine } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: 'Salon introuvable.' };
    }
    if (room.hostId !== hostUserId) {
      return { success: false, message: 'Seul l\'hôte peut lancer la partie.' };
    }
    if (room.players.length !== room.settings.playerCount) {
      return { 
        success: false, 
        message: `Il faut exactement ${room.settings.playerCount} joueurs pour lancer (actuellement ${room.players.length}).` 
      };
    }
    // Vérification de composition de rôles valide
    if (room.settings.roles.length !== room.players.length) {
      room.settings.roles = getDefaultRolesForPlayerCount(room.players.length);
    }
    // Vérification que tous les joueurs sont prêts
    const unreadyPlayer = room.players.find(p => !p.ready);
    if (unreadyPlayer) {
      return { 
        success: false, 
        message: `Tous les joueurs doivent être prêts. ${unreadyPlayer.pseudonym} n'est pas encore prêt.` 
      };
    }

    const gameId = uuidv4();
    room.status = 'IN_GAME';
    room.gameId = gameId;

    mysqlDb.saveRoom(room);

    const game = new GameEngine(gameId, roomId, room.players, room.settings, (engine) => {
      mysqlDb.saveGame(engine);
      if (onPhaseChange) onPhaseChange(engine);
    });
    this.games.set(roomId, game);
    game.start();

    mysqlDb.saveGame(game);

    return { success: true, game };
  }

  /**
   * Récupère le moteur de jeu associé à un salon
   */
  public getGame(roomId: string): GameEngine | undefined {
    return this.games.get(roomId);
  }

  /**
   * Gère la déconnexion réseau d'un joueur
   */
  public handlePlayerDisconnect(socketId: string): { roomId?: string; userId?: string } {
    for (const [roomId, room] of this.rooms.entries()) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        player.connected = false;
        player.socketId = undefined;
        return { roomId, userId: player.userId };
      }
    }
    return {};
  }
}
