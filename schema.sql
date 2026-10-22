-- ====================================================================
-- SCHEMA POSTGRESQL / SUPABASE — JEU MULTIJOUEUR « LES LOUPS-GAROUS »
-- Conforme aux spécifications architecturales et règles de sécurité RLS
-- ====================================================================

-- Extensions requises pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (joueurs anonymes ou enregistrés)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pseudonym VARCHAR(50) NOT NULL,
    avatar VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des salons de jeu privés
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invite_code VARCHAR(12) NOT NULL UNIQUE,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING', -- 'WAITING', 'IN_GAME', 'FINISHED', 'EXPIRED'
    settings JSONB NOT NULL DEFAULT '{
        "playerCount": 10,
        "discussionDurationSeconds": 60,
        "votingDurationSeconds": 45,
        "revealExactRoleOnDeath": true,
        "roles": [
            "WEREWOLF", "WEREWOLF", "WHITE_WOLF", "WOLF_SPY",
            "SEER", "WITCH", "BODYGUARD", "HUNTER", "CUPID", "VILLAGER"
        ]
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Table des joueurs présents dans un salon
CREATE TABLE IF NOT EXISTS room_players (
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ready BOOLEAN NOT NULL DEFAULT FALSE,
    connection_status VARCHAR(20) NOT NULL DEFAULT 'CONNECTED', -- 'CONNECTED', 'DISCONNECTED'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- Table des instances de parties en cours ou terminées
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    phase VARCHAR(40) NOT NULL DEFAULT 'ROLE_ASSIGNMENT',
    phase_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    phase_ends_at TIMESTAMPTZ NOT NULL,
    round_number INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED'
    winner_camp VARCHAR(30), -- 'VILLAGE', 'WEREWOLVES', 'WHITE_WOLF', 'DRAW'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des participants à une partie et leurs rôles secrets
CREATE TABLE IF NOT EXISTS game_players (
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_secret VARCHAR(40) NOT NULL,
    camp VARCHAR(30) NOT NULL, -- 'VILLAGE', 'WEREWOLVES', 'INDEPENDENT'
    alive BOOLEAN NOT NULL DEFAULT TRUE,
    lover_id UUID REFERENCES users(id),
    role_state JSONB NOT NULL DEFAULT '{}'::jsonb, -- potions sorcière, dernière cible protecteur, etc.
    PRIMARY KEY (game_id, user_id)
);

-- Table des actions nocturnes
CREATE TABLE IF NOT EXISTS night_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(40) NOT NULL, -- 'WOLF_KILL', 'WHITE_WOLF_KILL', 'SEER_PEEK', 'WITCH_HEAL', 'WITCH_POISON', 'GUARD_PROTECT', 'CUPID_LINK', 'SPY_INVESTIGATE'
    target_id UUID REFERENCES users(id) ON DELETE SET NULL,
    second_target_id UUID REFERENCES users(id) ON DELETE SET NULL, -- utile pour Cupidon (2 cibles)
    status VARCHAR(20) NOT NULL DEFAULT 'RESOLVED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des votes diurnes
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_vote_per_round_voter UNIQUE (game_id, round_number, voter_id)
);

-- Table du journal public des événements de partie
CREATE TABLE IF NOT EXISTS game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    event_type VARCHAR(60) NOT NULL,
    public_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- INDEX DE PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_rooms_invite_code ON rooms(invite_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);
CREATE INDEX IF NOT EXISTS idx_game_players_game_alive ON game_players(game_id, alive);
CREATE INDEX IF NOT EXISTS idx_night_actions_round ON night_actions(game_id, round_number);
CREATE INDEX IF NOT EXISTS idx_votes_game_round ON votes(game_id, round_number);
CREATE INDEX IF NOT EXISTS idx_game_events_game ON game_events(game_id, created_at);

-- ====================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS) SUR SUPABASE / POSTGRESQL
-- ====================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE night_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique / sécurisée
CREATE POLICY "Les utilisateurs peuvent lire les profils publics" 
    ON users FOR SELECT USING (true);

CREATE POLICY "Tout le monde peut voir les salons actifs" 
    ON rooms FOR SELECT USING (status != 'EXPIRED');

CREATE POLICY "Les joueurs voient les participants de leur salon" 
    ON room_players FOR SELECT USING (true);

CREATE POLICY "Les joueurs voient l'état public du jeu" 
    ON games FOR SELECT USING (true);

CREATE POLICY "Les événements publics sont lisibles par tous les joueurs" 
    ON game_events FOR SELECT USING (true);

-- CRITIQUE : Protection du rôle secret dans game_players
-- Un joueur ne peut voir QUE son propre rôle secret (ou après la fin de la partie)
CREATE POLICY "Un joueur ne peut lire que son propre rôle secret avant la fin" 
    ON game_players FOR SELECT USING (
        user_id = auth.uid() 
        OR (SELECT status FROM games WHERE games.id = game_players.game_id) = 'COMPLETED'
        OR alive = false AND (SELECT (settings->>'revealExactRoleOnDeath')::boolean FROM rooms JOIN games ON rooms.id = games.room_id WHERE games.id = game_players.game_id) = true
    );

-- Protection des actions nocturnes : l'acteur seul peut voir son action enregistrée
CREATE POLICY "Seul l'auteur peut voir son action nocturne" 
    ON night_actions FOR SELECT USING (
        actor_id = auth.uid()
        OR (SELECT status FROM games WHERE games.id = night_actions.game_id) = 'COMPLETED'
    );
