export enum Role {
  WEREWOLF = 'WEREWOLF',
  WHITE_WOLF = 'WHITE_WOLF',
  WOLF_SPY = 'WOLF_SPY',
  SEER = 'SEER',
  WITCH = 'WITCH',
  BODYGUARD = 'BODYGUARD',
  HUNTER = 'HUNTER',
  CUPID = 'CUPID',
  VILLAGER = 'VILLAGER'
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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  channel: 'ROOM' | 'VILLAGE' | 'WOLVES' | 'DEAD';
  text: string;
  timestamp: number;
}
