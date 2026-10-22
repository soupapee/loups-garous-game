import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../src/game/GameEngine';
import { RoomManager } from '../src/game/RoomManager';
import {
  Camp,
  DEFAULT_10_PLAYER_ROLES,
  Phase,
  Role,
  RoomPlayer,
  RoomSettings
} from '../src/types';

function createMockPlayers(count = 10): RoomPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    userId: `user-${i + 1}`,
    pseudonym: `Joueur_${i + 1}`,
    avatar: `avatar_${i + 1}.png`,
    ready: true,
    connected: true
  }));
}

function createDefaultSettings(): RoomSettings {
  return {
    playerCount: 10,
    discussionDurationSeconds: 60,
    votingDurationSeconds: 45,
    revealExactRoleOnDeath: true,
    roles: [...DEFAULT_10_PLAYER_ROLES]
  };
}

describe('Suite de tests automatisés — Les Loups-Garous (20 Scénarios obligatoires)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // TEST 1
  it('1. Distribution de exactement 10 rôles pour 10 joueurs', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-1', 'room-1', players, settings);

    expect(engine.players.size).toBe(10);
    const rolesAssigned = Array.from(engine.players.values()).map(p => p.role);
    expect(rolesAssigned.length).toBe(10);

    // Vérifier le compte exact de chaque rôle
    const countRole = (r: Role) => rolesAssigned.filter(role => role === r).length;
    expect(countRole(Role.WEREWOLF)).toBe(2);
    expect(countRole(Role.WHITE_WOLF)).toBe(1);
    expect(countRole(Role.WOLF_SPY)).toBe(1);
    expect(countRole(Role.SEER)).toBe(1);
    expect(countRole(Role.WITCH)).toBe(1);
    expect(countRole(Role.BODYGUARD)).toBe(1);
    expect(countRole(Role.HUNTER)).toBe(1);
    expect(countRole(Role.CUPID)).toBe(1);
    expect(countRole(Role.VILLAGER)).toBe(1);
  });

  // TEST 2
  it('2. Impossibilité de lancer une partie avec une composition invalide', () => {
    const players = createMockPlayers(9); // 9 joueurs au lieu de 10
    const settings = createDefaultSettings(); // 10 rôles

    expect(() => {
      new GameEngine('game-err', 'room-err', players, settings);
    }).toThrow(/composition de rôles/);

    const roomManager = new RoomManager();
    const host = { id: 'u1', pseudonym: 'Host', avatar: 'a1' };
    const room = roomManager.createRoom(host);
    const result = roomManager.startGame(room.id, host.id);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Il faut exactement 10 joueurs/);
  });

  // TEST 3
  it('3. Confidentialité des rôles et des enquêtes', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-secret', 'room-1', players, settings);

    const villager = Array.from(engine.players.values()).find(p => p.role === Role.VILLAGER)!;
    const seer = Array.from(engine.players.values()).find(p => p.role === Role.SEER)!;
    const whiteWolf = Array.from(engine.players.values()).find(p => p.role === Role.WHITE_WOLF)!;
    const werewolf = Array.from(engine.players.values()).find(p => p.role === Role.WEREWOLF)!;

    // État vu par le villageois
    const villagerView = engine.getClientState(villager.userId);
    expect(villagerView.myRole).toBe(Role.VILLAGER);
    expect(villagerView.werewolfAllies).toBeUndefined();
    expect(villagerView.seerInspectionHistory).toBeUndefined();

    // Tous les autres joueurs vivants ne doivent pas avoir leur rôle révélé
    villagerView.players.forEach(p => {
      expect(p.revealedRole).toBeUndefined();
    });

    // Le Loup blanc ne voit aucun allié de meute
    const whiteWolfView = engine.getClientState(whiteWolf.userId);
    expect(whiteWolfView.werewolfAllies).toBeUndefined();

    // Le Loup classique voit uniquement ses alliés loups (loups classiques + espion, JAMAIS le loup blanc)
    const wolfView = engine.getClientState(werewolf.userId);
    expect(wolfView.werewolfAllies).toBeDefined();
    wolfView.werewolfAllies!.forEach(ally => {
      expect(ally.role).not.toBe(Role.WHITE_WOLF);
      expect([Role.WEREWOLF, Role.WOLF_SPY]).toContain(ally.role);
    });
  });

  // TEST 4
  it('4. Fonctionnement du vote et de l\'égalité (aucun éliminé en cas d\'égalité)', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-vote', 'room-1', players, settings);

    engine.startVoting();

    const p1 = players[0].userId;
    const p2 = players[1].userId;
    const p3 = players[2].userId;
    const p4 = players[3].userId;

    // Égalité : 2 votes pour p1, 2 votes pour p2
    engine.submitVote(p3, p1);
    engine.submitVote(p4, p1);
    engine.submitVote(players[4].userId, p2);
    engine.submitVote(players[5].userId, p2);

    engine.resolveVote();

    // Aucun joueur éliminé en cas d'égalité
    expect(engine.players.get(p1)!.alive).toBe(true);
    expect(engine.players.get(p2)!.alive).toBe(true);
    expect(engine.recentDeaths.length).toBe(0);

    // Nouveau vote avec majorité stricte
    engine.startVoting();
    engine.submitVote(p3, p1);
    engine.submitVote(p4, p1);
    engine.submitVote(players[4].userId, p1); // 3 votes pour p1
    engine.submitVote(players[5].userId, p2); // 1 vote pour p2

    engine.resolveVote();
    expect(engine.players.get(p1)!.alive).toBe(false);
    expect(engine.recentDeaths.length).toBe(1);
    expect(engine.recentDeaths[0].userId).toBe(p1);
  });

  // TEST 5
  it('5. Potion de soin et potion de poison de la Sorcière', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-witch', 'room-1', players, settings);

    const witch = Array.from(engine.players.values()).find(p => p.role === Role.WITCH)!;
    const victim = Array.from(engine.players.values()).find(p => p.role === Role.VILLAGER)!;
    const poisonTarget = Array.from(engine.players.values()).find(p => p.role === Role.WEREWOLF)!;

    engine.startNightActions();

    // Loups attaquent le villageois
    const wolf = Array.from(engine.players.values()).find(p => p.role === Role.WEREWOLF)!;
    engine.submitNightAction({ actorId: wolf.userId, actionType: 'WOLF_KILL', targetId: victim.userId });

    // Sorcière utilise sa potion de soin pour sauver le villageois
    const healRes = engine.submitNightAction({ actorId: witch.userId, actionType: 'WITCH_HEAL' });
    expect(healRes.success).toBe(true);

    // Sorcière utilise sa potion de poison contre un loup
    const poisonRes = engine.submitNightAction({ actorId: witch.userId, actionType: 'WITCH_POISON', targetId: poisonTarget.userId });
    expect(poisonRes.success).toBe(true);

    engine.resolveNight();

    // Le villageois a été sauvé !
    expect(engine.players.get(victim.userId)!.alive).toBe(true);
    // Le loup a été empoisonné et est mort !
    expect(engine.players.get(poisonTarget.userId)!.alive).toBe(false);
    expect(witch.roleState.witchHealUsed).toBe(true);
    expect(witch.roleState.witchPoisonUsed).toBe(true);

    // Tentative de réutiliser les potions -> rejetée
    engine.startNightActions();
    const reHeal = engine.submitNightAction({ actorId: witch.userId, actionType: 'WITCH_HEAL' });
    expect(reHeal.success).toBe(false);
    const rePoison = engine.submitNightAction({ actorId: witch.userId, actionType: 'WITCH_POISON', targetId: victim.userId });
    expect(rePoison.success).toBe(false);
  });

  // TEST 6
  it('6. Protection contre une attaque nocturne par le Protecteur', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-guard', 'room-1', players, settings);

    const guard = Array.from(engine.players.values()).find(p => p.role === Role.BODYGUARD)!;
    const target = Array.from(engine.players.values()).find(p => p.role === Role.VILLAGER)!;
    const wolf = Array.from(engine.players.values()).find(p => p.role === Role.WEREWOLF)!;

    engine.startNightActions();

    // Protecteur protège la cible
    const protectRes = engine.submitNightAction({
      actorId: guard.userId,
      actionType: 'GUARD_PROTECT',
      targetId: target.userId
    });
    expect(protectRes.success).toBe(true);

    // Loups attaquent cette même cible
    engine.submitNightAction({
      actorId: wolf.userId,
      actionType: 'WOLF_KILL',
      targetId: target.userId
    });

    engine.resolveNight();

    // La cible survit grâce à la protection !
    expect(engine.players.get(target.userId)!.alive).toBe(true);

    // Le protecteur ne peut pas protéger la même cible deux nuits de suite
    engine.startNightActions();
    const consecutiveProtect = engine.submitNightAction({
      actorId: guard.userId,
      actionType: 'GUARD_PROTECT',
      targetId: target.userId
    });
    expect(consecutiveProtect.success).toBe(false);
    expect(consecutiveProtect.message).toMatch(/deux nuits de suite/);
  });

  // TEST 7
  it('7. Enquête secrète du Loup espion (découvre le camp mais pas le rôle exact)', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-spy', 'room-1', players, settings);

    const spy = Array.from(engine.players.values()).find(p => p.role === Role.WOLF_SPY)!;
    const villager = Array.from(engine.players.values()).find(p => p.role === Role.VILLAGER)!;
    const whiteWolf = Array.from(engine.players.values()).find(p => p.role === Role.WHITE_WOLF)!;

    engine.startNightActions();

    // Enquête sur le villageois
    const resVillager = engine.submitNightAction({
      actorId: spy.userId,
      actionType: 'SPY_INVESTIGATE',
      targetId: villager.userId
    });
    expect(resVillager.success).toBe(true);
    expect(resVillager.payload.camp).toBe(Camp.VILLAGE);
    expect(resVillager.payload.role).toBeUndefined(); // NE RÉVÈLE PAS LE RÔLE

    // Vérification de la visibilité dans le state client de l'espion
    const spyState = engine.getClientState(spy.userId);
    expect(spyState.spyInspectionHistory?.[1]?.camp).toBe(Camp.VILLAGE);

    // Un autre joueur ne voit pas cette enquête
    const seerState = engine.getClientState(villager.userId);
    expect(seerState.spyInspectionHistory).toBeUndefined();
  });

  // TEST 8
  it('8. Mort du Chasseur et élimination de sa cible', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-hunter', 'room-1', players, settings);

    const hunter = Array.from(engine.players.values()).find(p => p.role === Role.HUNTER)!;
    const target = Array.from(engine.players.values()).find(p => p.role === Role.WEREWOLF)!;

    // On tue le chasseur par le vote du village
    engine.startVoting();
    // 3 votes contre le chasseur
    engine.submitVote(players[0].userId, hunter.userId);
    engine.submitVote(players[1].userId, hunter.userId);
    engine.submitVote(players[2].userId, hunter.userId);

    engine.resolveVote();

    expect(engine.players.get(hunter.userId)!.alive).toBe(false);
    expect(engine.hunterPendingShooterId).toBe(hunter.userId);

    // Le Chasseur tire sur sa cible
    engine.startDeathEffects();
    expect(engine.phase).toBe(Phase.DEATH_EFFECTS);

    const shotRes = engine.submitHunterShot(hunter.userId, target.userId);
    expect(shotRes.success).toBe(true);

    // La cible est éliminée
    expect(engine.players.get(target.userId)!.alive).toBe(false);
  });

  // TEST 9
  it('9. Lien amoureux et mort en chaîne', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-cupid', 'room-1', players, settings);

    const cupid = Array.from(engine.players.values()).find(p => p.role === Role.CUPID)!;
    const p1 = players[0].userId;
    const p2 = players[1].userId;

    // Cupidon lie p1 et p2
    engine.advanceFromRoleAssignment();
    expect(engine.phase).toBe(Phase.CUPID_SELECTION);

    const cupidRes = engine.submitCupidChoice(cupid.userId, p1, p2);
    expect(cupidRes.success).toBe(true);

    expect(engine.players.get(p1)!.loverId).toBe(p2);
    expect(engine.players.get(p2)!.loverId).toBe(p1);

    // Tuons p1 pendant la nuit
    engine.startNightActions();
    const wolf = Array.from(engine.players.values()).find(p => p.role === Role.WEREWOLF)!;
    engine.submitNightAction({ actorId: wolf.userId, actionType: 'WOLF_KILL', targetId: p1 });

    engine.resolveNight();

    // p1 est mort, p2 doit être mort de chagrin !
    expect(engine.players.get(p1)!.alive).toBe(false);
    expect(engine.players.get(p2)!.alive).toBe(false);
    const deaths = engine.recentDeaths.map(d => d.userId);
    expect(deaths).toContain(p1);
    expect(deaths).toContain(p2);
  });

  // TEST 10
  it('10. Victoire du village', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-win-village', 'room-1', players, settings);

    // Éliminons tous les loups classiques, le loup espion et le loup blanc
    engine.players.forEach(p => {
      if (p.role === Role.WEREWOLF || p.role === Role.WOLF_SPY || p.role === Role.WHITE_WOLF) {
        p.alive = false;
      }
    });

    const isGameOver = engine.checkWinCondition();
    expect(isGameOver).toBe(true);
    expect(engine.winnerCamp).toBe(Camp.VILLAGE);
    expect(engine.phase).toBe(Phase.GAME_OVER);
  });

  // TEST 11
  it('11. Victoire des loups (parité avec villageois et loup blanc mort)', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-win-wolves', 'room-1', players, settings);

    // Loup blanc éliminé
    const whiteWolf = Array.from(engine.players.values()).find(p => p.role === Role.WHITE_WOLF)!;
    whiteWolf.alive = false;

    // Laisser 3 loups (2 classiques + 1 espion) et 3 villageois vivants (parité)
    let villagerCount = 0;
    engine.players.forEach(p => {
      if (p.role !== Role.WEREWOLF && p.role !== Role.WOLF_SPY && p.role !== Role.WHITE_WOLF) {
        villagerCount++;
        if (villagerCount > 3) {
          p.alive = false;
        }
      }
    });

    const isGameOver = engine.checkWinCondition();
    expect(isGameOver).toBe(true);
    expect(engine.winnerCamp).toBe(Camp.WEREWOLVES);
    expect(engine.phase).toBe(Phase.GAME_OVER);
  });

  // TEST 12
  it('12. Victoire indépendante du Loup blanc (dernier survivant)', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-win-ww', 'room-1', players, settings);

    // Tous les joueurs sauf le Loup blanc sont éliminés
    engine.players.forEach(p => {
      if (p.role !== Role.WHITE_WOLF) {
        p.alive = false;
      }
    });

    const isGameOver = engine.checkWinCondition();
    expect(isGameOver).toBe(true);
    expect(engine.winnerCamp).toBe(Camp.INDEPENDENT);
    expect(engine.phase).toBe(Phase.GAME_OVER);
  });

  // TEST 13
  it('13. Cas où le village a éliminé les loups classiques mais où le Loup blanc survit', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-ww-alive', 'room-1', players, settings);

    // Éliminons loups classiques et espion
    engine.players.forEach(p => {
      if (p.role === Role.WEREWOLF || p.role === Role.WOLF_SPY) {
        p.alive = false;
      }
    });

    // Le Loup blanc et 3 villageois sont vivants
    const isGameOver = engine.checkWinCondition();
    // LE JEU NE DOIT PAS SE TERMINER, LE VILLAGE N'A PAS GAGNÉ !
    expect(isGameOver).toBe(false);
    expect(engine.winnerCamp).toBeUndefined();
  });

  // TEST 14
  it('14. Rejet des votes doubles (modification de vote sans doubler)', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-dup-vote', 'room-1', players, settings);

    engine.startVoting();
    const voter = players[0].userId;
    const targetA = players[1].userId;
    const targetB = players[2].userId;

    engine.submitVote(voter, targetA);
    expect(engine.votes.get(voter)).toBe(targetA);
    expect(engine.votes.size).toBe(1);

    // Deuxième soumission : remplace la première
    engine.submitVote(voter, targetB);
    expect(engine.votes.get(voter)).toBe(targetB);
    expect(engine.votes.size).toBe(1); // Le nombre total de votes reste 1
  });

  // TEST 15
  it('15. Rejet des actions hors phase', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-out-phase', 'room-1', players, settings);

    // En phase ROLE_ASSIGNMENT, essayer de voter
    const voteRes = engine.submitVote(players[0].userId, players[1].userId);
    expect(voteRes.success).toBe(false);
    expect(voteRes.message).toMatch(/Le vote n'est pas ouvert/);

    // En phase DISCUSSION, essayer d'effectuer une action nocturne
    engine.startDiscussion();
    const nightRes = engine.submitNightAction({
      actorId: players[0].userId,
      actionType: 'WOLF_KILL',
      targetId: players[1].userId
    });
    expect(nightRes.success).toBe(false);
    expect(nightRes.message).toMatch(/pendant la nuit/);
  });

  // TEST 16
  it('16. Expiration correcte des délais de 60 et 45 secondes (horloge simulée)', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-timers', 'room-1', players, settings);

    engine.startDiscussion();
    expect(engine.phase).toBe(Phase.DISCUSSION);

    // Avancement de 60 secondes pour la discussion
    vi.advanceTimersByTime(60000);
    expect(engine.phase).toBe(Phase.VOTING);

    // Avancement de 45 secondes pour le vote
    vi.advanceTimersByTime(45000);
    expect(engine.phase).toBe(Phase.VOTE_RESOLUTION);
  });

  // TEST 17
  it('17. Reconnexion après une coupure réseau', () => {
    const roomManager = new RoomManager();
    const host = { id: 'u1', pseudonym: 'HostPlayer', avatar: 'host.png' };
    const room = roomManager.createRoom(host);

    // Simuler déconnexion
    const disconnectInfo = roomManager.handlePlayerDisconnect('socket-123');
    expect(disconnectInfo).toBeDefined();

    // Reconnexion avec le même userId
    const joinRes = roomManager.joinRoom(room.inviteCode, host, 'socket-456');
    expect(joinRes.success).toBe(true);
    expect(joinRes.room?.players.find(p => p.userId === host.id)?.connected).toBe(true);
  });

  // TEST 18
  it('18. Deux joueurs ne peuvent pas rejoindre une place restante simultanément si cela dépasse la capacité', () => {
    const roomManager = new RoomManager();
    const host = { id: 'u1', pseudonym: 'Host', avatar: 'a1' };
    const room = roomManager.createRoom(host);

    // Remplir 9 places
    for (let i = 2; i <= 10; i++) {
      const res = roomManager.joinRoom(room.inviteCode, {
        id: `u${i}`,
        pseudonym: `Joueur_${i}`,
        avatar: `a${i}`
      });
      expect(res.success).toBe(true);
    }
    expect(room.players.length).toBe(10);

    // Tentative du 11ème joueur
    const extraJoin = roomManager.joinRoom(room.inviteCode, {
      id: 'u11',
      pseudonym: 'Joueur_EnTrop',
      avatar: 'a11'
    });
    expect(extraJoin.success).toBe(false);
    expect(extraJoin.message).toMatch(/complet/);
    expect(room.players.length).toBe(10);
  });

  // TEST 19
  it('19. Les joueurs morts ne peuvent plus voter', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-dead-vote', 'room-1', players, settings);

    // Marquer un joueur comme mort
    const deadPlayer = players[0].userId;
    engine.players.get(deadPlayer)!.alive = false;

    engine.startVoting();

    const deadVote = engine.submitVote(deadPlayer, players[1].userId);
    expect(deadVote.success).toBe(false);
    expect(deadVote.message).toMatch(/joueurs morts ne peuvent pas voter/);
    expect(engine.votes.has(deadPlayer)).toBe(false);
  });

  // TEST 20
  it('20. Toutes les parties atteignent un état terminal (GAME_OVER) lorsque les conditions de victoire sont remplies', () => {
    const players = createMockPlayers(10);
    const settings = createDefaultSettings();
    const engine = new GameEngine('game-terminal', 'room-1', players, settings);

    // Simuler élimination de tous les loups
    engine.players.forEach(p => {
      if (p.role === Role.WEREWOLF || p.role === Role.WOLF_SPY || p.role === Role.WHITE_WOLF) {
        p.alive = false;
      }
    });

    const isOver = engine.checkWinCondition();
    expect(isOver).toBe(true);
    expect(engine.phase).toBe(Phase.GAME_OVER);
    expect(engine.winnerCamp).toBe(Camp.VILLAGE);

    // Tous les rôles sont alors dévoilés publiquement
    const finalState = engine.getClientState(players[0].userId);
    expect(finalState.allRevealedRoles).toBeDefined();
    expect(Object.keys(finalState.allRevealedRoles!).length).toBe(10);
  });

  // TEST 21 - Nombre de joueurs dynamique (4 à 18 joueurs)
  it('21. Choix dynamique du nombre de joueurs (ex: 6, 8, 12) et équilibrage automatique', () => {
    const roomManager = new RoomManager();
    const host = { id: 'u1', pseudonym: 'HostDynamic', avatar: 'a1' };

    // Test avec 6 joueurs
    const room6 = roomManager.createRoom(host, { playerCount: 6 });
    expect(room6.settings.playerCount).toBe(6);
    expect(room6.settings.roles.length).toBe(6);
    roomManager.fillWithBots(room6.id);
    expect(room6.players.length).toBe(6);
    const start6 = roomManager.startGame(room6.id, host.id);
    expect(start6.success).toBe(true);
    expect(start6.game?.players.size).toBe(6);

    // Test avec 8 joueurs
    const room8 = roomManager.createRoom(host, { playerCount: 8 });
    expect(room8.settings.playerCount).toBe(8);
    expect(room8.settings.roles.length).toBe(8);
    roomManager.fillWithBots(room8.id);
    expect(room8.players.length).toBe(8);
    const start8 = roomManager.startGame(room8.id, host.id);
    expect(start8.success).toBe(true);
    expect(start8.game?.players.size).toBe(8);

    // Test avec 12 joueurs
    const room12 = roomManager.createRoom(host, { playerCount: 12 });
    expect(room12.settings.playerCount).toBe(12);
    expect(room12.settings.roles.length).toBe(12);
    roomManager.fillWithBots(room12.id);
    expect(room12.players.length).toBe(12);
    const start12 = roomManager.startGame(room12.id, host.id);
    expect(start12.success).toBe(true);
    expect(start12.game?.players.size).toBe(12);
  });
});
