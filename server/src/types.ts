// ====================================================================
// TYPES & MODÈLES DE DONNÉES — LES LOUPS-GAROUS
// ====================================================================

export enum Role {
  WEREWOLF = 'WEREWOLF',          // Loup-garou classique
  WHITE_WOLF = 'WHITE_WOLF',      // Loup blanc (solitaire / indépendant)
  WOLF_SPY = 'WOLF_SPY',          // Loup espion
  SEER = 'SEER',                  // Voyante
  WITCH = 'WITCH',                // Sorcière
  BODYGUARD = 'BODYGUARD',        // Protecteur / Salvateur
  HUNTER = 'HUNTER',              // Chasseur
  CUPID = 'CUPID',                // Cupidon
  VILLAGER = 'VILLAGER'           // Villageois simple
}

export enum Camp {
  VILLAGE = 'VILLAGE',
  WEREWOLVES = 'WEREWOLVES',
  INDEPENDENT = 'INDEPENDENT'
}

export enum Phase {
  WAITING_ROOM = 'WAITING_ROOM',
  ROLE_ASSIGNMENT = 'ROLE_ASSIGNMENT',
  CUPID_SELECTION = 'CUPID_SELECTION',
  NIGHT_ACTIONS = 'NIGHT_ACTIONS',
  NIGHT_RESOLUTION = 'NIGHT_RESOLUTION',
  DAWN_ANNOUNCEMENT = 'DAWN_ANNOUNCEMENT',
  DISCUSSION = 'DISCUSSION',
  VOTING = 'VOTING',
  VOTE_RESOLUTION = 'VOTE_RESOLUTION',
  DEATH_EFFECTS = 'DEATH_EFFECTS',
  WIN_CHECK = 'WIN_CHECK',
  GAME_OVER = 'GAME_OVER'
}

export interface RoleDefinition {
  id: Role;
  name: string;
  camp: Camp;
  description: string;
  powers: string;
  limitations: string;
  icon: string;
}

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  [Role.WEREWOLF]: {
    id: Role.WEREWOLF,
    name: 'Loup-garou classique',
    camp: Camp.WEREWOLVES,
    description: 'Chaque nuit, se réunit avec la meute pour dévorer un villageois.',
    powers: 'Participe au vote nocturne de la meute pour désigner une victime.',
    limitations: 'Doit trouver un consensus avec ses congénères ; aucune victime en cas d\'égalité.',
    icon: 'Moon'
  },
  [Role.WHITE_WOLF]: {
    id: Role.WHITE_WOLF,
    name: 'Loup blanc',
    camp: Camp.INDEPENDENT,
    description: 'Un loup solitaire qui n\'appartient pas à la meute et chasse pour son propre compte.',
    powers: 'Attaque secrètement un joueur vivant de son choix chaque nuit.',
    limitations: 'Ne participe pas au chat secret des loups. Doit être le dernier survivant pour gagner.',
    icon: 'Skull'
  },
  [Role.WOLF_SPY]: {
    id: Role.WOLF_SPY,
    name: 'Loup espion',
    camp: Camp.WEREWOLVES,
    description: 'Membre infiltré de la meute qui sonde les allégeances des suspects.',
    powers: 'Découvre secrètement le camp d\'un joueur vivant chaque nuit (Village, Loups ou Indépendant).',
    limitations: 'Ne découvre pas le rôle exact, seulement son camp d\'appartenance.',
    icon: 'Eye'
  },
  [Role.SEER]: {
    id: Role.SEER,
    name: 'Voyante',
    camp: Camp.VILLAGE,
    description: 'Possède le don de double vue pour percer les mystères de la nuit.',
    powers: 'Chaque nuit, découvre le rôle exact et secret d\'un joueur vivant.',
    limitations: 'Une seule vision par nuit. Doit convaincre le village sans se faire démasquer par les loups.',
    icon: 'Eye'
  },
  [Role.WITCH]: {
    id: Role.WITCH,
    name: 'Sorcière',
    camp: Camp.VILLAGE,
    description: 'Maîtresse des philtres mystiques, capable de redonner la vie ou de semer la mort.',
    powers: 'Possède 1 potion de guérison (sauve la victime des loups) et 1 potion d\'empoisonnement mortel.',
    limitations: 'Chaque potion n\'est utilisable qu\'une seule fois dans toute la partie.',
    icon: 'FlaskConical'
  },
  [Role.BODYGUARD]: {
    id: Role.BODYGUARD,
    name: 'Protecteur',
    camp: Camp.VILLAGE,
    description: 'Garde vaillant qui veille sur un habitant chaque nuit pour repousser les attaques.',
    powers: 'Protège un joueur contre les assauts nocturnes des loups et du loup blanc.',
    limitations: 'Ne peut pas protéger la même personne deux nuits de suite. Ne peut pas s\'autoprotéger.',
    icon: 'Shield'
  },
  [Role.HUNTER]: {
    id: Role.HUNTER,
    name: 'Chasseur',
    camp: Camp.VILLAGE,
    description: 'Tireur d\'élite redoutable qui n\'emporte jamais ses secrets dans la tombe.',
    powers: 'Au moment de sa mort, peut tirer sur un autre joueur vivant et l\'éliminer instantanément.',
    limitations: 'Son pouvoir ne s\'active qu\'au moment précis de sa propre élimination.',
    icon: 'Crosshair'
  },
  [Role.CUPID]: {
    id: Role.CUPID,
    name: 'Cupidon',
    camp: Camp.VILLAGE,
    description: 'Flèche les cœurs lors de la première nuit pour lier deux destins à la vie à la mort.',
    powers: 'Désigne deux joueurs amoureux au début de la nuit 1.',
    limitations: 'Si l\'un des amoureux meurt, le second meurt instantanément de chagrin.',
    icon: 'Heart'
  },
  [Role.VILLAGER]: {
    id: Role.VILLAGER,
    name: 'Villageois simple',
    camp: Camp.VILLAGE,
    description: 'Habitant probe et attentif du village qui use de logique pour traquer les bêtes.',
    powers: 'Participe aux débats diurnes et possède un vote décisif pour condamner les suspects.',
    limitations: 'Aucun pouvoir magique nocturne. Sa force réside dans la déduction et la persuasion.',
    icon: 'Users'
  }
};

export const DEFAULT_10_PLAYER_ROLES: Role[] = [
  Role.WEREWOLF,
  Role.WEREWOLF,
  Role.WHITE_WOLF,
  Role.WOLF_SPY,
  Role.SEER,
  Role.WITCH,
  Role.BODYGUARD,
  Role.HUNTER,
  Role.CUPID,
  Role.VILLAGER
];

export function getDefaultRolesForPlayerCount(count: number): Role[] {
  const safeCount = Math.max(4, Math.min(18, count));
  switch (safeCount) {
    case 4:
      return [Role.WEREWOLF, Role.SEER, Role.WITCH, Role.VILLAGER];
    case 5:
      return [Role.WEREWOLF, Role.SEER, Role.WITCH, Role.HUNTER, Role.VILLAGER];
    case 6:
      return [Role.WEREWOLF, Role.WOLF_SPY, Role.SEER, Role.WITCH, Role.HUNTER, Role.VILLAGER];
    case 7:
      return [Role.WEREWOLF, Role.WEREWOLF, Role.SEER, Role.WITCH, Role.BODYGUARD, Role.HUNTER, Role.VILLAGER];
    case 8:
      return [Role.WEREWOLF, Role.WEREWOLF, Role.SEER, Role.WITCH, Role.BODYGUARD, Role.HUNTER, Role.CUPID, Role.VILLAGER];
    case 9:
      return [Role.WEREWOLF, Role.WEREWOLF, Role.WOLF_SPY, Role.SEER, Role.WITCH, Role.BODYGUARD, Role.HUNTER, Role.CUPID, Role.VILLAGER];
    case 10:
      return [
        Role.WEREWOLF, Role.WEREWOLF, Role.WHITE_WOLF, Role.WOLF_SPY,
        Role.SEER, Role.WITCH, Role.BODYGUARD, Role.HUNTER, Role.CUPID, Role.VILLAGER
      ];
    default: {
      const base = [
        Role.WEREWOLF, Role.WEREWOLF, Role.WHITE_WOLF, Role.WOLF_SPY,
        Role.SEER, Role.WITCH, Role.BODYGUARD, Role.HUNTER, Role.CUPID, Role.VILLAGER
      ];
      const extra = safeCount - 10;
      for (let i = 0; i < extra; i++) {
        if (i % 4 === 1) {
          base.push(Role.WEREWOLF);
        } else {
          base.push(Role.VILLAGER);
        }
      }
      return base;
    }
  }
}

export interface UserSession {
  id: string;
  pseudonym: string;
  avatar: string;
}

export interface RoomSettings {
  playerCount: number;
  discussionDurationSeconds: number;
  votingDurationSeconds: number;
  revealExactRoleOnDeath: boolean;
  roles: Role[];
}

export interface RoomPlayer {
  userId: string;
  pseudonym: string;
  avatar: string;
  ready: boolean;
  connected: boolean;
  socketId?: string;
  isBot?: boolean;
}

export interface RoomData {
  id: string;
  inviteCode: string;
  hostId: string;
  status: 'WAITING' | 'IN_GAME' | 'FINISHED';
  settings: RoomSettings;
  players: RoomPlayer[];
  gameId?: string;
  createdAt: number;
}

export interface GamePlayerState {
  userId: string;
  pseudonym: string;
  avatar: string;
  role: Role;
  camp: Camp;
  alive: boolean;
  loverId?: string;
  deathRound?: number;
  deathCause?: string;
  roleState: {
    witchHealUsed?: boolean;
    witchPoisonUsed?: boolean;
    lastProtectedUserId?: string;
    seerInspected?: Record<number, { targetId: string; targetName: string; role: Role }>;
    spyInspected?: Record<number, { targetId: string; targetName: string; camp: Camp }>;
  };
}

export interface NightActionPayload {
  actorId: string;
  actionType: 
    | 'WOLF_KILL' 
    | 'WHITE_WOLF_KILL' 
    | 'SEER_PEEK' 
    | 'SPY_INVESTIGATE' 
    | 'GUARD_PROTECT' 
    | 'WITCH_HEAL' 
    | 'WITCH_POISON' 
    | 'CUPID_LINK';
  targetId?: string;
  secondTargetId?: string;
}

export interface VoteData {
  voterId: string;
  targetId: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  channel: 'ROOM' | 'VILLAGE' | 'WOLVES' | 'DEAD';
  text: string;
  timestamp: number;
}

export interface DeathRecord {
  userId: string;
  pseudonym: string;
  role?: Role;
  cause: string;
}

export interface ClientPublicPlayer {
  userId: string;
  pseudonym: string;
  avatar: string;
  alive: boolean;
  connected: boolean;
  isDead: boolean;
  revealedRole?: Role;
  deathCause?: string;
  hasVoted?: boolean;
}

export interface ClientGameState {
  gameId: string;
  roomId: string;
  phase: Phase;
  roundNumber: number;
  phaseStartedAt: number;
  phaseEndsAt: number;
  timeRemainingSeconds: number;
  players: ClientPublicPlayer[];
  winnerCamp?: Camp | 'DRAW';
  winnerMessage?: string;
  recentDeaths: DeathRecord[];
  allRevealedRoles?: Record<string, { role: Role; camp: Camp; pseudonym: string }>;
  hunterMustShoot?: boolean;
  hunterId?: string;
  // Données strictement privées pour le client actuel :
  myRole?: Role;
  myCamp?: Camp;
  myLover?: { userId: string; pseudonym: string; alive: boolean };
  werewolfAllies?: { userId: string; pseudonym: string; role: Role }[];
  seerInspectionHistory?: Record<number, { targetId: string; targetName: string; role: Role }>;
  spyInspectionHistory?: Record<number, { targetId: string; targetName: string; camp: Camp }>;
  witchState?: {
    healAvailable: boolean;
    poisonAvailable: boolean;
    wolfVictimId?: string;
    wolfVictimName?: string;
  };
  guardLastProtectedId?: string;
}
