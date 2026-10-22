import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameEngine } from '../game/GameEngine';
import { RoomManager } from '../game/RoomManager';
import { ChatMessage, NightActionPayload, Phase, Role } from '../types';
import { mysqlDb } from '../db/mysql';

export function setupSocketHandlers(io: Server, roomManager: RoomManager) {
  // Mapping userId -> socketId pour cibler précisément les messages privés
  const userSockets = new Map<string, string>(); // userId -> socketId
  const socketUsers = new Map<string, { userId: string; roomId?: string }>(); // socketId -> user

  /**
   * Diffuse à chaque joueur son état de jeu STRICTEMENT privé et filtré
   */
  function broadcastGameState(roomId: string) {
    const room = roomManager.getRoom(roomId);
    const game = roomManager.getGame(roomId);
    if (!room || !game) return;

    room.players.forEach(player => {
      const socketId = userSockets.get(player.userId);
      if (socketId) {
        const clientState = game.getClientState(player.userId);
        io.to(socketId).emit('game:state', clientState);
      }
    });
  }

  io.on('connection', (socket: Socket) => {
    // -------------------------------------------------------------
    // GESTION DE SALONS
    // -------------------------------------------------------------

    socket.on('room:create', (payload, callback) => {
      try {
        const { hostUser, settings } = payload;
        if (!hostUser || !hostUser.pseudonym) {
          return callback({ success: false, message: 'Pseudonyme requis.' });
        }

        const room = roomManager.createRoom(hostUser, settings);
        userSockets.set(hostUser.id, socket.id);
        socketUsers.set(socket.id, { userId: hostUser.id, roomId: room.id });
        socket.join(`room:${room.id}`);

        callback({ success: true, room });
      } catch (err: any) {
        callback({ success: false, message: err.message });
      }
    });

    socket.on('room:join', (payload, callback) => {
      try {
        const { inviteCode, user } = payload;
        if (!inviteCode || !user || !user.pseudonym) {
          return callback({ success: false, message: 'Code et profil joueur requis.' });
        }

        const result = roomManager.joinRoom(inviteCode, user, socket.id);
        if (!result.success || !result.room) {
          return callback({ success: false, message: result.message });
        }

        userSockets.set(user.id, socket.id);
        socketUsers.set(socket.id, { userId: user.id, roomId: result.room.id });
        socket.join(`room:${result.room.id}`);

        // Notifier tous les membres du salon de la mise à jour
        io.to(`room:${result.room.id}`).emit('room:updated', result.room);
        callback({ success: true, room: result.room });
      } catch (err: any) {
        callback({ success: false, message: err.message });
      }
    });

    socket.on('room:toggleReady', (payload, callback) => {
      const { roomId, userId } = payload;
      const success = roomManager.toggleReady(roomId, userId);
      const room = roomManager.getRoom(roomId);
      if (success && room) {
        io.to(`room:${roomId}`).emit('room:updated', room);
      }
      if (callback) callback({ success });
    });

    socket.on('room:fillBots', (payload, callback) => {
      const { roomId, userId } = payload;
      const room = roomManager.getRoom(roomId);
      if (!room || room.hostId !== userId) {
        return callback?.({ success: false, message: 'Seul l\'hôte peut ajouter des bots.' });
      }

      const res = roomManager.fillWithBots(roomId);
      if (res.success) {
        io.to(`room:${roomId}`).emit('room:updated', room);
      }
      callback?.(res);
    });

    socket.on('room:leave', (payload, callback) => {
      const { roomId, userId } = payload;
      const result = roomManager.leaveRoom(roomId, userId);
      socket.leave(`room:${roomId}`);
      if (!result.roomEmpty && result.room) {
        io.to(`room:${roomId}`).emit('room:updated', result.room);
      }
      callback?.({ success: true });
    });

    socket.on('room:listPublic', (_, callback) => {
      const openRooms = roomManager.getOpenRooms();
      callback({ success: true, rooms: openRooms });
    });

    socket.on('room:start', (payload, callback) => {
      const { roomId, userId } = payload;
      const result = roomManager.startGame(roomId, userId, (engine: GameEngine) => {
        // Callback appelée à chaque changement de phase automatique
        broadcastGameState(roomId);
      });

      if (!result.success || !result.game) {
        return callback?.({ success: false, message: result.message });
      }

      io.to(`room:${roomId}`).emit('room:gameStarted', { gameId: result.game.id });
      broadcastGameState(roomId);
      callback?.({ success: true });
    });

    // -------------------------------------------------------------
    // ACTIONS DE JEU
    // -------------------------------------------------------------

    socket.on('game:reconnect', (payload, callback) => {
      const { roomId, userId } = payload;
      const room = roomManager.getRoom(roomId);
      const game = roomManager.getGame(roomId);

      if (!room || !game) {
        return callback?.({ success: false, message: 'Partie non trouvée.' });
      }

      userSockets.set(userId, socket.id);
      socketUsers.set(socket.id, { userId, roomId });
      socket.join(`room:${roomId}`);

      const player = room.players.find(p => p.userId === userId);
      if (player) {
        player.connected = true;
        player.socketId = socket.id;
      }

      const clientState = game.getClientState(userId);
      callback?.({ success: true, state: clientState });
    });

    socket.on('game:cupidChoice', (payload, callback) => {
      const { roomId, cupidUserId, target1Id, target2Id } = payload;
      const game = roomManager.getGame(roomId);
      if (!game) return callback?.({ success: false, message: 'Partie introuvable.' });

      const res = game.submitCupidChoice(cupidUserId, target1Id, target2Id);
      if (res.success) {
        broadcastGameState(roomId);
      }
      callback?.(res);
    });

    socket.on('game:nightAction', (payload, callback) => {
      const { roomId, action } = payload;
      const game = roomManager.getGame(roomId);
      if (!game) return callback?.({ success: false, message: 'Partie introuvable.' });

      const res = game.submitNightAction(action as NightActionPayload);
      if (res.success) {
        mysqlDb.saveNightAction(game.id, game.roundNumber, action);
        broadcastGameState(roomId);
      }
      callback?.(res);
    });

    socket.on('game:vote', (payload, callback) => {
      const { roomId, voterId, targetId } = payload;
      const game = roomManager.getGame(roomId);
      if (!game) return callback?.({ success: false, message: 'Partie introuvable.' });

      const res = game.submitVote(voterId, targetId);
      if (res.success) {
        mysqlDb.saveVote(game.id, game.roundNumber, voterId, targetId);
        broadcastGameState(roomId);
      }
      callback?.(res);
    });

    socket.on('game:hunterShot', (payload, callback) => {
      const { roomId, hunterId, targetId } = payload;
      const game = roomManager.getGame(roomId);
      if (!game) return callback?.({ success: false, message: 'Partie introuvable.' });

      const res = game.submitHunterShot(hunterId, targetId);
      if (res.success) {
        broadcastGameState(roomId);
      }
      callback?.(res);
    });

    // -------------------------------------------------------------
    // CHAT MULTI-CANAL SÉCURISÉ
    // -------------------------------------------------------------

    socket.on('chat:send', (payload, callback) => {
      const { roomId, senderId, channel, text } = payload;
      if (!text || text.trim().length === 0) return;

      const room = roomManager.getRoom(roomId);
      const game = roomManager.getGame(roomId);
      if (!room) return;

      const player = room.players.find(p => p.userId === senderId);
      if (!player) return;

      const message: ChatMessage = {
        id: uuidv4(),
        senderId,
        senderName: player.pseudonym,
        senderAvatar: player.avatar,
        channel,
        text: text.trim().slice(0, 500), // Limitation anti-abus
        timestamp: Date.now()
      };

      if (channel === 'ROOM') {
        // Chat public du salon
        io.to(`room:${roomId}`).emit('chat:message', message);
      } else if (channel === 'VILLAGE') {
        // Chat du village : uniquement joueurs vivants pendant le jour
        if (!game) return;
        const gamePlayer = game.players.get(senderId);
        if (!gamePlayer || !gamePlayer.alive) {
          return callback?.({ success: false, message: 'Les morts ne peuvent plus parler au village.' });
        }
        if (game.phase !== Phase.DISCUSSION && game.phase !== Phase.VOTING) {
          return callback?.({ success: false, message: 'Le chat du village est fermé pendant la nuit.' });
        }

        // Diffusé à tous les joueurs du village
        io.to(`room:${roomId}`).emit('chat:message', message);
      } else if (channel === 'WOLVES') {
        // Chat secret de la meute : UNIQUEMENT Loups classiques et Loup espion !
        if (!game) return;
        const gamePlayer = game.players.get(senderId);
        if (!gamePlayer || (gamePlayer.role !== Role.WEREWOLF && gamePlayer.role !== Role.WOLF_SPY)) {
          return callback?.({ success: false, message: 'Accès interdit au chat des loups.' });
        }

        // On envoie le message UNIQUEMENT aux membres de la meute
        game.players.forEach(p => {
          if (p.role === Role.WEREWOLF || p.role === Role.WOLF_SPY) {
            const recipientSocket = userSockets.get(p.userId);
            if (recipientSocket) {
              io.to(recipientSocket).emit('chat:message', message);
            }
          }
        });
      } else if (channel === 'DEAD') {
        // Chat des morts : uniquement pour les éliminés
        if (!game) return;
        const gamePlayer = game.players.get(senderId);
        if (!gamePlayer || gamePlayer.alive) {
          return callback?.({ success: false, message: 'Seuls les esprits défunts peuvent communiquer ici.' });
        }

        // Envoi uniquement aux morts
        game.players.forEach(p => {
          if (!p.alive) {
            const deadSocket = userSockets.get(p.userId);
            if (deadSocket) {
              io.to(deadSocket).emit('chat:message', message);
            }
          }
        });
      }

      callback?.({ success: true });
    });

    // -------------------------------------------------------------
    // DÉCONNEXION RÉSEAU
    // -------------------------------------------------------------

    socket.on('disconnect', () => {
      const user = socketUsers.get(socket.id);
      if (user) {
        userSockets.delete(user.userId);
        socketUsers.delete(socket.id);
        const { roomId } = roomManager.handlePlayerDisconnect(socket.id);
        if (roomId) {
          const room = roomManager.getRoom(roomId);
          if (room) {
            io.to(`room:${roomId}`).emit('room:updated', room);
          }
        }
      }
    });
  });
}
