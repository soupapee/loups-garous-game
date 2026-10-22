// ====================================================================
// GESTIONNAIRE DE BASE DE DONNÉES MYSQL / MARIADB — XAMPP & PHPMYADMIN
// Permet la persistance en local sur XAMPP (http://localhost/phpmyadmin)
// ====================================================================

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { GameEngine } from '../game/GameEngine';
import { NightActionPayload, RoomData, RoomPlayer } from '../types';

dotenv.config();

export class MySQLDatabase {
  private pool: mysql.Pool | null = null;
  public isConnected: boolean = false;

  constructor() {
    this.initPool();
  }

  private async initPool() {
    try {
      const host = process.env.MYSQL_HOST || 'localhost';
      const port = Number(process.env.MYSQL_PORT) || 3306;
      const user = process.env.MYSQL_USER || 'root';
      const password = process.env.MYSQL_PASSWORD || '';
      const database = process.env.MYSQL_DATABASE || 'if0_43237247_loups_garous';

      // Les hébergeurs gérés (notamment InfinityFree) ne donnent pas le droit
      // CREATE DATABASE. La base doit donc être créée avant le déploiement.
      // On se connecte directement à la base configurée.
      this.pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Création automatique des tables si nécessaires
      await this.ensureTables();
      this.isConnected = true;
      console.log(`🐬 Connecté avec succès à MySQL / XAMPP (Base: ${database} sur port ${port})`);
      console.log(`📊 Vous pouvez inspecter les données en direct sur : http://localhost/phpmyadmin`);
    } catch (err: any) {
      this.isConnected = false;
      console.warn(`⚠️ Avertissement MySQL XAMPP : Impossible de se connecter à MySQL (${err.message}).`);
      console.warn(`💡 Assurez-vous que MySQL est démarré dans le panneau de contrôle XAMPP.`);
      console.warn(`🚀 Le moteur de jeu continue de fonctionner avec le store en mémoire.`);
    }
  }

  private async ensureTables() {
    if (!this.pool) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        pseudonym VARCHAR(50) NOT NULL,
        avatar VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        invite_code VARCHAR(16) NOT NULL UNIQUE,
        host_id VARCHAR(36) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
        settings JSON NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS room_players (
        room_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        ready TINYINT(1) NOT NULL DEFAULT 0,
        connection_status VARCHAR(20) NOT NULL DEFAULT 'CONNECTED',
        joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        room_id VARCHAR(36) NOT NULL,
        phase VARCHAR(40) NOT NULL DEFAULT 'ROLE_ASSIGNMENT',
        phase_started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        phase_ends_at DATETIME NOT NULL,
        round_number INT NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        winner_camp VARCHAR(30) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS game_players (
        game_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        role_secret VARCHAR(40) NOT NULL,
        camp VARCHAR(30) NOT NULL,
        alive TINYINT(1) NOT NULL DEFAULT 1,
        lover_id VARCHAR(36) NULL,
        role_state JSON NOT NULL,
        PRIMARY KEY (game_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS night_actions (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        game_id VARCHAR(36) NOT NULL,
        round_number INT NOT NULL,
        actor_id VARCHAR(36) NOT NULL,
        action_type VARCHAR(40) NOT NULL,
        target_id VARCHAR(36) NULL,
        second_target_id VARCHAR(36) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'RESOLVED',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        game_id VARCHAR(36) NOT NULL,
        round_number INT NOT NULL,
        voter_id VARCHAR(36) NOT NULL,
        target_id VARCHAR(36) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  // --- Sauvegardes synchronisées ---

  public async saveUser(user: { id: string; pseudonym: string; avatar: string }) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query(
        `INSERT INTO users (id, pseudonym, avatar) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE pseudonym = VALUES(pseudonym), avatar = VALUES(avatar)`,
        [user.id, user.pseudonym, user.avatar]
      );
    } catch (e) {}
  }

  public async saveRoom(room: RoomData) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query(
        `INSERT INTO rooms (id, invite_code, host_id, status, settings)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), host_id = VALUES(host_id), settings = VALUES(settings)`,
        [room.id, room.inviteCode, room.hostId, room.status, JSON.stringify(room.settings)]
      );
    } catch (e) {}
  }

  public async saveRoomPlayer(roomId: string, player: RoomPlayer) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.saveUser({ id: player.userId, pseudonym: player.pseudonym, avatar: player.avatar });
      await this.pool.query(
        `INSERT INTO room_players (room_id, user_id, ready, connection_status)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE ready = VALUES(ready), connection_status = VALUES(connection_status)`,
        [roomId, player.userId, player.ready ? 1 : 0, player.connected ? 'CONNECTED' : 'DISCONNECTED']
      );
    } catch (e) {}
  }

  public async removeRoomPlayer(roomId: string, userId: string) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query(`DELETE FROM room_players WHERE room_id = ? AND user_id = ?`, [roomId, userId]);
    } catch (e) {}
  }

  public async saveGame(game: GameEngine) {
    if (!this.pool || !this.isConnected) return;
    try {
      const phaseEndsDate = new Date(game.phaseEndsAt);
      const phaseStartedDate = new Date(game.phaseStartedAt);

      await this.pool.query(
        `INSERT INTO games (id, room_id, phase, phase_started_at, phase_ends_at, round_number, status, winner_camp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE phase = VALUES(phase), phase_ends_at = VALUES(phase_ends_at), round_number = VALUES(round_number), status = VALUES(status), winner_camp = VALUES(winner_camp)`,
        [
          game.id,
          game.roomId,
          game.phase,
          phaseStartedDate,
          phaseEndsDate,
          game.roundNumber,
          game.phase === 'GAME_OVER' ? 'COMPLETED' : 'ACTIVE',
          game.winnerCamp || null
        ]
      );

      // Sauvegarde des joueurs de la partie
      for (const player of game.players.values()) {
        await this.pool.query(
          `INSERT INTO game_players (game_id, user_id, role_secret, camp, alive, lover_id, role_state)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE alive = VALUES(alive), lover_id = VALUES(lover_id), role_state = VALUES(role_state)`,
          [
            game.id,
            player.userId,
            player.role,
            player.camp,
            player.alive ? 1 : 0,
            player.loverId || null,
            JSON.stringify(player.roleState)
          ]
        );
      }
    } catch (e) {}
  }

  public async saveVote(gameId: string, round: number, voterId: string, targetId: string) {
    if (!this.pool || !this.isConnected) return;
    try {
      const id = `${gameId}-${round}-${voterId}`;
      await this.pool.query(
        `INSERT INTO votes (id, game_id, round_number, voter_id, target_id)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE target_id = VALUES(target_id)`,
        [id, gameId, round, voterId, targetId]
      );
    } catch (e) {}
  }

  public async saveNightAction(gameId: string, round: number, action: NightActionPayload) {
    if (!this.pool || !this.isConnected) return;
    try {
      const id = `${gameId}-${round}-${action.actorId}-${action.actionType}`;
      await this.pool.query(
        `INSERT INTO night_actions (id, game_id, round_number, actor_id, action_type, target_id, second_target_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE target_id = VALUES(target_id), second_target_id = VALUES(second_target_id)`,
        [id, gameId, round, action.actorId, action.actionType, action.targetId || null, action.secondTargetId || null]
      );
    } catch (e) {}
  }
}

export const mysqlDb = new MySQLDatabase();
