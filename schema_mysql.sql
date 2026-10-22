-- ====================================================================
-- SCHÉMA MYSQL / MARIADB — XAMPP & PHPMYADMIN
-- Base de données pour « Les Loups-Garous : Ombres du Village »
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `if0_43237247_loups_garous` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `if0_43237247_loups_garous`;

-- 1. Table des utilisateurs (profils et pseudonymes)
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL,
    `pseudonym` VARCHAR(50) NOT NULL,
    `avatar` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table des salons de jeu privés
CREATE TABLE IF NOT EXISTS `rooms` (
    `id` VARCHAR(36) NOT NULL,
    `invite_code` VARCHAR(16) NOT NULL UNIQUE,
    `host_id` VARCHAR(36) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    `settings` JSON NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_rooms_invite_code` (`invite_code`),
    INDEX `idx_rooms_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table des joueurs dans un salon
CREATE TABLE IF NOT EXISTS `room_players` (
    `room_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `ready` TINYINT(1) NOT NULL DEFAULT 0,
    `connection_status` VARCHAR(20) NOT NULL DEFAULT 'CONNECTED',
    `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`room_id`, `user_id`),
    CONSTRAINT `fk_room_players_room` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table des parties actives ou terminées
CREATE TABLE IF NOT EXISTS `games` (
    `id` VARCHAR(36) NOT NULL,
    `room_id` VARCHAR(36) NOT NULL,
    `phase` VARCHAR(40) NOT NULL DEFAULT 'ROLE_ASSIGNMENT',
    `phase_started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `phase_ends_at` DATETIME NOT NULL,
    `round_number` INT NOT NULL DEFAULT 1,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `winner_camp` VARCHAR(30) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_games_room_id` (`room_id`),
    CONSTRAINT `fk_games_room` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table des joueurs d'une partie avec leurs rôles secrets
CREATE TABLE IF NOT EXISTS `game_players` (
    `game_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `role_secret` VARCHAR(40) NOT NULL,
    `camp` VARCHAR(30) NOT NULL,
    `alive` TINYINT(1) NOT NULL DEFAULT 1,
    `lover_id` VARCHAR(36) NULL,
    `role_state` JSON NOT NULL,
    PRIMARY KEY (`game_id`, `user_id`),
    INDEX `idx_game_players_alive` (`game_id`, `alive`),
    CONSTRAINT `fk_game_players_game` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table des actions nocturnes
CREATE TABLE IF NOT EXISTS `night_actions` (
    `id` VARCHAR(36) NOT NULL,
    `game_id` VARCHAR(36) NOT NULL,
    `round_number` INT NOT NULL,
    `actor_id` VARCHAR(36) NOT NULL,
    `action_type` VARCHAR(40) NOT NULL,
    `target_id` VARCHAR(36) NULL,
    `second_target_id` VARCHAR(36) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'RESOLVED',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_night_actions_round` (`game_id`, `round_number`),
    CONSTRAINT `fk_night_actions_game` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table des votes diurnes
CREATE TABLE IF NOT EXISTS `votes` (
    `id` VARCHAR(36) NOT NULL,
    `game_id` VARCHAR(36) NOT NULL,
    `round_number` INT NOT NULL,
    `voter_id` VARCHAR(36) NOT NULL,
    `target_id` VARCHAR(36) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_vote_round` (`game_id`, `round_number`, `voter_id`),
    CONSTRAINT `fk_votes_game` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table des événements publics de la partie
CREATE TABLE IF NOT EXISTS `game_events` (
    `id` VARCHAR(36) NOT NULL,
    `game_id` VARCHAR(36) NOT NULL,
    `event_type` VARCHAR(60) NOT NULL,
    `public_payload` JSON NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_game_events_game` (`game_id`, `created_at`),
    CONSTRAINT `fk_game_events_game` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
