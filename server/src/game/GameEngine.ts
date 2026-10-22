import {
  Camp,
  ClientGameState,
  ClientPublicPlayer,
  DeathRecord,
  GamePlayerState,
  NightActionPayload,
  Phase,
  Role,
  RoomPlayer,
  RoomSettings
} from '../types';

export class GameEngine {
  public id: string;
  public roomId: string;
  public phase: Phase;
  public roundNumber: number;
  public phaseStartedAt: number;
  public phaseEndsAt: number;
  public settings: RoomSettings;
  public players: Map<string, GamePlayerState> = new Map();
  public winnerCamp?: Camp | 'DRAW';
  public winnerMessage?: string;
  public recentDeaths: DeathRecord[] = [];
  public allDeaths: DeathRecord[] = [];

  // Actions collectées pour la phase nocturne en cours
  public nightActions: NightActionPayload[] = [];
  // Votes collectés pour la phase de vote en cours (voterId -> targetId)
  public votes: Map<string, string> = new Map();

  // Chasseur en attente de tir
  public hunterPendingShooterId?: string;

  // Timer interne pour transitions automatiques
  private phaseTimer: NodeJS.Timeout | null = null;
  private onPhaseChangeCallback?: (engine: GameEngine) => void;

  constructor(
    id: string,
    roomId: string,
    roomPlayers: RoomPlayer[],
    settings: RoomSettings,
    onPhaseChange?: (engine: GameEngine) => void
  ) {
    this.id = id;
    this.roomId = roomId;
    this.settings = settings;
    this.onPhaseChangeCallback = onPhaseChange;
    this.roundNumber = 1;
    this.phase = Phase.ROLE_ASSIGNMENT;
    this.phaseStartedAt = Date.now();
    this.phaseEndsAt = Date.now() + 6000; // 6s pour découvrir son rôle

    this.initializePlayers(roomPlayers, settings.roles);
  }

  /**
   * Vérifie et distribue secrètement les rôles aux joueurs
   */
  private initializePlayers(roomPlayers: RoomPlayer[], roles: Role[]): void {
    if (roomPlayers.length !== roles.length) {
      throw new Error(`La composition de rôles (${roles.length}) ne correspond pas au nombre de joueurs (${roomPlayers.length})`);
    }

    // Mélange de Fisher-Yates pour une distribution aléatoire et équitable
    const shuffledRoles = [...roles];
    for (let i = shuffledRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
    }

    roomPlayers.forEach((rp, index) => {
      const role = shuffledRoles[index];
      let camp = Camp.VILLAGE;
      if (role === Role.WEREWOLF || role === Role.WOLF_SPY) {
        camp = Camp.WEREWOLVES;
      } else if (role === Role.WHITE_WOLF) {
        camp = Camp.INDEPENDENT;
      }

      this.players.set(rp.userId, {
        userId: rp.userId,
        pseudonym: rp.pseudonym,
        avatar: rp.avatar,
        role,
        camp,
        alive: true,
        roleState: {
          witchHealUsed: false,
          witchPoisonUsed: false,
          seerInspected: {},
          spyInspected: {}
        }
      });
    });
  }

  /**
   * Démarre la machine à états de la partie
   */
  public start(autoSchedule = true): void {
    if (autoSchedule) {
      this.schedulePhaseTransition(this.phaseEndsAt - Date.now(), () => {
        this.advanceFromRoleAssignment();
      });
    }
  }

  /**
   * Arrête le timer en cours pour nettoyage ou tests
   */
  public stopTimer(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  private schedulePhaseTransition(delayMs: number, callback: () => void): void {
    this.stopTimer();
    const safeDelay = Math.max(100, delayMs);
    this.phaseTimer = setTimeout(() => {
      callback();
    }, safeDelay);
  }

  private notifyPhaseChange(): void {
    if (this.onPhaseChangeCallback) {
      this.onPhaseChangeCallback(this);
    }
  }

  /**
   * Transition depuis ROLE_ASSIGNMENT
   */
  public advanceFromRoleAssignment(): void {
    const hasCupid = Array.from(this.players.values()).some(p => p.role === Role.CUPID && p.alive);
    if (hasCupid && this.roundNumber === 1) {
      this.setPhase(Phase.CUPID_SELECTION, 25);
      this.schedulePhaseTransition(25000, () => this.advanceFromCupid());
    } else {
      this.startNightActions();
    }
  }

  /**
   * Soumission du choix des amoureux par Cupidon
   */
  public submitCupidChoice(cupidUserId: string, target1Id: string, target2Id: string): { success: boolean; message?: string } {
    if (this.phase !== Phase.CUPID_SELECTION) {
      return { success: false, message: 'Ce n\'est pas la phase de sélection de Cupidon.' };
    }
    const cupid = this.players.get(cupidUserId);
    if (!cupid || cupid.role !== Role.CUPID || !cupid.alive) {
      return { success: false, message: 'Action non autorisée pour ce joueur.' };
    }
    if (target1Id === target2Id) {
      return { success: false, message: 'Cupidon doit choisir deux joueurs distincts.' };
    }
    const p1 = this.players.get(target1Id);
    const p2 = this.players.get(target2Id);
    if (!p1 || !p1.alive || !p2 || !p2.alive) {
      return { success: false, message: 'Les amoureux doivent être des joueurs vivants.' };
    }

    p1.loverId = p2.userId;
    p2.loverId = p1.userId;

    this.advanceFromCupid();
    return { success: true };
  }

  public advanceFromCupid(): void {
    this.startNightActions();
  }

  /**
   * Démarre la phase des actions nocturnes
   */
  public startNightActions(): void {
    this.nightActions = [];
    const nightDuration = 30; // 30 secondes pour les actions nocturnes
    this.setPhase(Phase.NIGHT_ACTIONS, nightDuration);

    this.schedulePhaseTransition(nightDuration * 1000, () => {
      this.resolveNight();
    });
  }

  /**
   * Soumission d'une action nocturne par un joueur
   */
  public submitNightAction(action: NightActionPayload): { success: boolean; message?: string; payload?: any } {
    if (this.phase !== Phase.NIGHT_ACTIONS) {
      return { success: false, message: 'Les actions nocturnes ne sont possibles que pendant la nuit.' };
    }

    const actor = this.players.get(action.actorId);
    if (!actor || !actor.alive) {
      return { success: false, message: 'Seul un joueur vivant peut accomplir une action.' };
    }

    switch (action.actionType) {
      case 'WOLF_KILL': {
        if (actor.role !== Role.WEREWOLF && actor.role !== Role.WOLF_SPY) {
          return { success: false, message: 'Seuls les membres de la meute peuvent voter pour la victime des loups.' };
        }
        if (!action.targetId) {
          return { success: false, message: 'Une cible est requise.' };
        }
        const target = this.players.get(action.targetId);
        if (!target || !target.alive) {
          return { success: false, message: 'La cible doit être vivante.' };
        }
        // Mise à jour ou ajout du vote du loup
        this.nightActions = this.nightActions.filter(a => !(a.actorId === actor.userId && a.actionType === 'WOLF_KILL'));
        this.nightActions.push(action);
        this.checkIfAllNightActionsDone();
        return { success: true };
      }

      case 'WHITE_WOLF_KILL': {
        if (actor.role !== Role.WHITE_WOLF) {
          return { success: false, message: 'Action réservée au Loup blanc.' };
        }
        if (!action.targetId) {
          return { success: false, message: 'Une cible est requise.' };
        }
        if (action.targetId === actor.userId) {
          return { success: false, message: 'Le Loup blanc ne peut pas s\'attaquer lui-même.' };
        }
        const target = this.players.get(action.targetId);
        if (!target || !target.alive) {
          return { success: false, message: 'La cible doit être vivante.' };
        }
        this.nightActions = this.nightActions.filter(a => !(a.actorId === actor.userId && a.actionType === 'WHITE_WOLF_KILL'));
        this.nightActions.push(action);
        this.checkIfAllNightActionsDone();
        return { success: true };
      }

      case 'SEER_PEEK': {
        if (actor.role !== Role.SEER) {
          return { success: false, message: 'Action réservée à la Voyante.' };
        }
        if (!action.targetId) {
          return { success: false, message: 'Une cible est requise.' };
        }
        const target = this.players.get(action.targetId);
        if (!target || !target.alive) {
          return { success: false, message: 'La Voyante ne peut sonder qu\'un joueur vivant.' };
        }
        // Enregistre l'inspection dans le journal privé de la Voyante
        actor.roleState.seerInspected = actor.roleState.seerInspected || {};
        actor.roleState.seerInspected[this.roundNumber] = {
          targetId: target.userId,
          targetName: target.pseudonym,
          role: target.role
        };
        this.nightActions = this.nightActions.filter(a => !(a.actorId === actor.userId && a.actionType === 'SEER_PEEK'));
        this.nightActions.push(action);
        this.checkIfAllNightActionsDone();
        return { 
          success: true, 
          payload: { targetId: target.userId, role: target.role, pseudonym: target.pseudonym } 
        };
      }

      case 'SPY_INVESTIGATE': {
        if (actor.role !== Role.WOLF_SPY) {
          return { success: false, message: 'Action réservée au Loup espion.' };
        }
        if (!action.targetId) {
          return { success: false, message: 'Une cible est requise.' };
        }
        const target = this.players.get(action.targetId);
        if (!target || !target.alive) {
          return { success: false, message: 'Le Loup espion ne peut enquêter que sur un joueur vivant.' };
        }
        // Le loup espion découvre UNIQUEMENT le camp (Village, Loups ou Indépendant), PAS le rôle exact !
        actor.roleState.spyInspected = actor.roleState.spyInspected || {};
        actor.roleState.spyInspected[this.roundNumber] = {
          targetId: target.userId,
          targetName: target.pseudonym,
          camp: target.camp
        };
        this.nightActions = this.nightActions.filter(a => !(a.actorId === actor.userId && a.actionType === 'SPY_INVESTIGATE'));
        this.nightActions.push(action);
        this.checkIfAllNightActionsDone();
        return { 
          success: true, 
          payload: { targetId: target.userId, camp: target.camp, pseudonym: target.pseudonym } 
        };
      }

      case 'GUARD_PROTECT': {
        if (actor.role !== Role.BODYGUARD) {
          return { success: false, message: 'Action réservée au Protecteur.' };
        }
        if (!action.targetId) {
          return { success: false, message: 'Une cible est requise.' };
        }
        if (action.targetId === actor.userId) {
          return { success: false, message: 'L\'autoprotection n\'est pas autorisée par défaut.' };
        }
        if (actor.roleState.lastProtectedUserId === action.targetId) {
          return { success: false, message: 'Le Protecteur ne peut pas protéger la même personne deux nuits de suite.' };
        }
        const target = this.players.get(action.targetId);
        if (!target || !target.alive) {
          return { success: false, message: 'La cible doit être vivante.' };
        }
        this.nightActions = this.nightActions.filter(a => !(a.actorId === actor.userId && a.actionType === 'GUARD_PROTECT'));
        this.nightActions.push(action);
        this.checkIfAllNightActionsDone();
        return { success: true };
      }

      case 'WITCH_HEAL': {
        if (actor.role !== Role.WITCH) {
          return { success: false, message: 'Action réservée à la Sorcière.' };
        }
        if (actor.roleState.witchHealUsed) {
          return { success: false, message: 'La potion de guérison a déjà été utilisée.' };
        }
        this.nightActions = this.nightActions.filter(a => !(a.actorId === actor.userId && a.actionType === 'WITCH_HEAL'));
        this.nightActions.push(action);
        this.checkIfAllNightActionsDone();
        return { success: true };
      }

      case 'WITCH_POISON': {
        if (actor.role !== Role.WITCH) {
          return { success: false, message: 'Action réservée à la Sorcière.' };
        }
        if (actor.roleState.witchPoisonUsed) {
          return { success: false, message: 'La potion de poison a déjà été utilisée.' };
        }
        if (!action.targetId) {
          return { success: false, message: 'Une cible vivante est requise pour le poison.' };
        }
        const target = this.players.get(action.targetId);
        if (!target || !target.alive) {
          return { success: false, message: 'La cible doit être vivante.' };
        }
        this.nightActions = this.nightActions.filter(a => !(a.actorId === actor.userId && a.actionType === 'WITCH_POISON'));
        this.nightActions.push(action);
        this.checkIfAllNightActionsDone();
        return { success: true };
      }

      default:
        return { success: false, message: 'Action nocturne inconnue.' };
    }
  }

  /**
   * Vérifie si tous les acteurs vivants ayant une action possible ont répondu
   */
  private checkIfAllNightActionsDone(): void {
    // Si tous les joueurs actifs ont joué, on peut accélérer la transition
    const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);
    const livingRoles = new Set(alivePlayers.map(p => p.role));

    // Loups vivants (classiques + espion)
    const livingPackMembers = alivePlayers.filter(p => p.role === Role.WEREWOLF || p.role === Role.WOLF_SPY);
    const wolfVotes = this.nightActions.filter(a => a.actionType === 'WOLF_KILL');
    const allWolvesVoted = livingPackMembers.length === 0 || wolfVotes.length === livingPackMembers.length;

    // Loup blanc
    const whiteWolf = alivePlayers.find(p => p.role === Role.WHITE_WOLF);
    const whiteWolfActed = !whiteWolf || this.nightActions.some(a => a.actionType === 'WHITE_WOLF_KILL');

    // Voyante
    const seer = alivePlayers.find(p => p.role === Role.SEER);
    const seerActed = !seer || this.nightActions.some(a => a.actionType === 'SEER_PEEK');

    // Espion
    const spy = alivePlayers.find(p => p.role === Role.WOLF_SPY);
    const spyActed = !spy || this.nightActions.some(a => a.actionType === 'SPY_INVESTIGATE');

    // Protecteur
    const guard = alivePlayers.find(p => p.role === Role.BODYGUARD);
    const guardActed = !guard || this.nightActions.some(a => a.actionType === 'GUARD_PROTECT');

    // Pour la sorcière, elle peut décider de ne rien faire, donc on n'impose pas d'action obligatoire pour clore
    if (allWolvesVoted && whiteWolfActed && seerActed && spyActed && guardActed) {
      // Si tout le monde a voté, on peut attendre 2 secondes pour donner une chance à la sorcière puis résoudre
      // Si la sorcière n'a plus de potions ou est morte, on résout immédiatement !
      const witch = alivePlayers.find(p => p.role === Role.WITCH);
      const witchHasPotions = witch && (!witch.roleState.witchHealUsed || !witch.roleState.witchPoisonUsed);
      if (!witchHasPotions) {
        this.resolveNight();
      }
    }
  }

  /**
   * Résolution déterministe de la nuit selon l'ordre de priorité strict
   */
  public resolveNight(): void {
    this.stopTimer();
    this.setPhase(Phase.NIGHT_RESOLUTION, 3);
    this.recentDeaths = [];

    // 1. Cible du protecteur
    const guardAction = this.nightActions.find(a => a.actionType === 'GUARD_PROTECT');
    const protectedUserId = guardAction?.targetId;
    const guard = Array.from(this.players.values()).find(p => p.role === Role.BODYGUARD);
    if (guard) {
      guard.roleState.lastProtectedUserId = protectedUserId;
    }

    // 2. Cible collective des loups (vote majoritaire déterministe)
    const wolfVotes = this.nightActions.filter(a => a.actionType === 'WOLF_KILL');
    const wolfTargetCounts = new Map<string, number>();
    wolfVotes.forEach(v => {
      if (v.targetId) {
        wolfTargetCounts.set(v.targetId, (wolfTargetCounts.get(v.targetId) || 0) + 1);
      }
    });

    let wolfVictimId: string | null = null;
    let maxWolfVotes = 0;
    let isWolfTie = false;

    wolfTargetCounts.forEach((count, targetId) => {
      if (count > maxWolfVotes) {
        maxWolfVotes = count;
        wolfVictimId = targetId;
        isWolfTie = false;
      } else if (count === maxWolfVotes && count > 0) {
        isWolfTie = true;
      }
    });

    // En cas d'égalité, aucune victime pour les loups
    if (isWolfTie) {
      wolfVictimId = null;
    }

    // 3. Potion de soin de la sorcière
    const witchHeal = this.nightActions.find(a => a.actionType === 'WITCH_HEAL');
    const witch = Array.from(this.players.values()).find(p => p.role === Role.WITCH);
    let wolfVictimSaved = false;

    if (witchHeal && witch && !witch.roleState.witchHealUsed && wolfVictimId) {
      witch.roleState.witchHealUsed = true;
      wolfVictimSaved = true;
    }

    // Détermination de la mort par les loups
    const deathsToApply = new Map<string, string>(); // userId -> cause

    if (wolfVictimId && !wolfVictimSaved) {
      if (wolfVictimId === protectedUserId) {
        // Sauvé par le protecteur !
      } else {
        deathsToApply.set(wolfVictimId, 'Dévoré(e) par la meute de loups-garous');
      }
    }

    // 4. Attaque du Loup blanc
    const whiteWolfAction = this.nightActions.find(a => a.actionType === 'WHITE_WOLF_KILL');
    if (whiteWolfAction?.targetId) {
      const wwTargetId = whiteWolfAction.targetId;
      if (wwTargetId === protectedUserId) {
        // Sauvé par le protecteur contre l'attaque nocturne !
      } else {
        deathsToApply.set(wwTargetId, 'Égorgé(e) par le Loup blanc');
      }
    }

    // 5. Potion de poison de la sorcière
    const witchPoison = this.nightActions.find(a => a.actionType === 'WITCH_POISON');
    if (witchPoison?.targetId && witch && !witch.roleState.witchPoisonUsed) {
      witch.roleState.witchPoisonUsed = true;
      deathsToApply.set(witchPoison.targetId, 'Empoisonné(e) par la mystérieuse potion de la Sorcière');
    }

    // 6. Application des morts et effet en chaîne des amoureux
    this.applyDeaths(deathsToApply);

    // 7. Passage à l'annonce de l'aube
    this.schedulePhaseTransition(3000, () => {
      this.announceDawn();
    });
  }

  /**
   * Applique les morts, gère le chagrin des amoureux et prépare le tir du chasseur
   */
  private applyDeaths(deathsToApply: Map<string, string>): void {
    const queue = Array.from(deathsToApply.entries());

    while (queue.length > 0) {
      const [userId, cause] = queue.shift()!;
      const player = this.players.get(userId);
      if (player && player.alive) {
        player.alive = false;
        player.deathRound = this.roundNumber;
        player.deathCause = cause;

        const record: DeathRecord = {
          userId: player.userId,
          pseudonym: player.pseudonym,
          role: this.settings.revealExactRoleOnDeath ? player.role : undefined,
          cause
        };
        this.recentDeaths.push(record);
        this.allDeaths.push(record);

        // Effet amoureux : si l'un meurt, l'autre meurt de chagrin
        if (player.loverId) {
          const lover = this.players.get(player.loverId);
          if (lover && lover.alive) {
            queue.push([lover.userId, `Mort(e) de chagrin après la perte de son amour ${player.pseudonym}`]);
          }
        }

        // Effet Chasseur : si le chasseur meurt, il doit tirer !
        if (player.role === Role.HUNTER) {
          this.hunterPendingShooterId = player.userId;
        }
      }
    }
  }

  /**
   * Annonce du lever du soleil et des victimes de la nuit
   */
  public announceDawn(): void {
    this.setPhase(Phase.DAWN_ANNOUNCEMENT, 6);

    this.schedulePhaseTransition(6000, () => {
      // Si le chasseur est mort pendant la nuit, il tire avant les débats !
      if (this.hunterPendingShooterId) {
        this.startDeathEffects();
      } else {
        const hasWinner = this.checkWinCondition();
        if (!hasWinner) {
          this.startDiscussion();
        }
      }
    });
  }

  /**
   * Démarre la phase de tir du Chasseur (DEATH_EFFECTS)
   */
  public startDeathEffects(): void {
    if (!this.hunterPendingShooterId) {
      const hasWinner = this.checkWinCondition();
      if (!hasWinner) {
        this.startDiscussion();
      }
      return;
    }

    const hunterDuration = 20; // 20s pour tirer
    this.setPhase(Phase.DEATH_EFFECTS, hunterDuration);

    this.schedulePhaseTransition(hunterDuration * 1000, () => {
      // Expiration du tir du chasseur (aucun tir effectué)
      this.hunterPendingShooterId = undefined;
      const hasWinner = this.checkWinCondition();
      if (!hasWinner) {
        this.startDiscussion();
      }
    });
  }

  /**
   * Soumission du tir ultime du Chasseur
   */
  public submitHunterShot(hunterId: string, targetId: string): { success: boolean; message?: string } {
    if (this.phase !== Phase.DEATH_EFFECTS || this.hunterPendingShooterId !== hunterId) {
      return { success: false, message: 'Ce n\'est pas le moment pour le Chasseur de tirer.' };
    }
    const hunter = this.players.get(hunterId);
    if (!hunter || hunter.role !== Role.HUNTER) {
      return { success: false, message: 'Seul le Chasseur peut effectuer ce tir.' };
    }
    const target = this.players.get(targetId);
    if (!target || !target.alive) {
      return { success: false, message: 'La cible doit être un joueur vivant.' };
    }

    this.hunterPendingShooterId = undefined;

    // Appliquer la mort de la cible
    const deaths = new Map<string, string>();
    deaths.set(target.userId, `Abattu(e) par le tir désespéré du Chasseur ${hunter.pseudonym}`);
    this.applyDeaths(deaths);

    const hasWinner = this.checkWinCondition();
    if (!hasWinner) {
      // Si la cible était aussi le second amoureux ou un autre rôle, on poursuit vers la discussion
      this.schedulePhaseTransition(3000, () => {
        this.startDiscussion();
      });
    }
    return { success: true };
  }

  /**
   * Démarre la phase de discussion du village
   */
  public startDiscussion(): void {
    const discussionDuration = this.settings.discussionDurationSeconds || 60;
    this.setPhase(Phase.DISCUSSION, discussionDuration);

    this.schedulePhaseTransition(discussionDuration * 1000, () => {
      this.startVoting();
    });
  }

  /**
   * Démarre la phase de vote
   */
  public startVoting(): void {
    this.votes.clear();
    const votingDuration = this.settings.votingDurationSeconds || 45;
    this.setPhase(Phase.VOTING, votingDuration);

    this.schedulePhaseTransition(votingDuration * 1000, () => {
      this.resolveVote();
    });
  }

  /**
   * Soumission d'un vote par un joueur vivant
   */
  public submitVote(voterId: string, targetId: string): { success: boolean; message?: string } {
    if (this.phase !== Phase.VOTING) {
      return { success: false, message: 'Le vote n\'est pas ouvert.' };
    }
    const voter = this.players.get(voterId);
    if (!voter || !voter.alive) {
      return { success: false, message: 'Les joueurs morts ne peuvent pas voter.' };
    }
    if (voterId === targetId) {
      return { success: false, message: 'Il est interdit de voter contre soi-même.' };
    }
    const target = this.players.get(targetId);
    if (!target || !target.alive) {
      return { success: false, message: 'La cible du vote doit être un joueur vivant.' };
    }

    // Le joueur peut modifier son vote avant la fin du temps imparti
    this.votes.set(voterId, targetId);

    // Si tous les joueurs vivants ont voté, on peut résoudre sans attendre la fin du chrono
    const aliveCount = Array.from(this.players.values()).filter(p => p.alive).length;
    if (this.votes.size === aliveCount) {
      this.resolveVote();
    }

    return { success: true };
  }

  /**
   * Résolution du vote diurne
   */
  public resolveVote(): void {
    this.stopTimer();
    this.setPhase(Phase.VOTE_RESOLUTION, 4);

    const voteCounts = new Map<string, number>();
    this.votes.forEach(targetId => {
      voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
    });

    let maxVotes = 0;
    let victimId: string | null = null;
    let isTie = false;

    voteCounts.forEach((count, targetId) => {
      if (count > maxVotes) {
        maxVotes = count;
        victimId = targetId;
        isTie = false;
      } else if (count === maxVotes && count > 0) {
        isTie = true;
      }
    });

    this.recentDeaths = [];

    // Règle stricte en cas d'égalité ou de zéro vote : aucun joueur n'est éliminé !
    if (isTie || !victimId || maxVotes === 0) {
      // Aucun condamné
    } else {
      const condemned = this.players.get(victimId);
      if (condemned && condemned.alive) {
        const deaths = new Map<string, string>();
        deaths.set(condemned.userId, `Condamné(e) au bûcher par le vote du village (${maxVotes} voix)`);
        this.applyDeaths(deaths);
      }
    }

    this.schedulePhaseTransition(4000, () => {
      if (this.hunterPendingShooterId) {
        this.startDeathEffects();
      } else {
        const hasWinner = this.checkWinCondition();
        if (!hasWinner) {
          // Passage au round suivant et nuit suivante
          this.roundNumber++;
          this.startNightActions();
        }
      }
    });
  }

  /**
   * Vérification des conditions de victoire (Section 8)
   */
  public checkWinCondition(): boolean {
    const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);
    
    // Cas où tout le monde est mort simultanément (Draw)
    if (alivePlayers.length === 0) {
      this.winnerCamp = 'DRAW';
      this.winnerMessage = 'Tous les habitants et monstres ont péri dans l\'obscurité. C\'est une égalité macabre.';
      this.setPhase(Phase.GAME_OVER, 0);
      return true;
    }

    const livingClassicWolves = alivePlayers.filter(p => p.role === Role.WEREWOLF);
    const livingSpyWolves = alivePlayers.filter(p => p.role === Role.WOLF_SPY);
    const livingWhiteWolves = alivePlayers.filter(p => p.role === Role.WHITE_WOLF);

    const packCount = livingClassicWolves.length + livingSpyWolves.length;
    const whiteWolfCount = livingWhiteWolves.length;
    const nonPackCount = alivePlayers.length - packCount; // Villageois + Loup blanc

    // Condition 1 : Victoire du Loup Blanc (dernier joueur survivant)
    if (whiteWolfCount === 1 && alivePlayers.length === 1) {
      this.winnerCamp = Camp.INDEPENDENT;
      this.winnerMessage = 'Le Loup blanc est le dernier survivant ! Il règne en solitaire sur les ruines du village.';
      this.setPhase(Phase.GAME_OVER, 0);
      return true;
    }

    // Condition 2 : Victoire des Loups-garous (meute)
    // Parité ou supériorité avec les autres joueurs, ET le Loup blanc doit être éliminé
    if (packCount > 0 && packCount >= nonPackCount && whiteWolfCount === 0) {
      this.winnerCamp = Camp.WEREWOLVES;
      this.winnerMessage = 'La meute de Loups-Garous a submergé le village ! Ils dévorent les derniers survivants.';
      this.setPhase(Phase.GAME_OVER, 0);
      return true;
    }

    // Condition 3 : Victoire du Village
    // Tous les loups classiques, le loup espion ET le loup blanc doivent être éliminés
    if (packCount === 0 && whiteWolfCount === 0 && alivePlayers.length > 0) {
      this.winnerCamp = Camp.VILLAGE;
      this.winnerMessage = 'Le Village a triomphé ! Toutes les bêtes maléfiques ont été anéanties.';
      this.setPhase(Phase.GAME_OVER, 0);
      return true;
    }

    // Si les loups classiques sont morts mais que le loup blanc survit, le village n'a PAS encore gagné !
    return false;
  }

  /**
   * Modifie la phase et met à jour les horodatages
   */
  private setPhase(newPhase: Phase, durationSeconds: number): void {
    this.phase = newPhase;
    this.phaseStartedAt = Date.now();
    this.phaseEndsAt = Date.now() + durationSeconds * 1000;
    this.notifyPhaseChange();
  }

  /**
   * Génère l'état client STRICTEMENT sécurisé et filtré pour un utilisateur donné
   */
  public getClientState(userId: string): ClientGameState {
    const player = this.players.get(userId);
    const now = Date.now();
    const timeRemainingSeconds = Math.max(0, Math.ceil((this.phaseEndsAt - now) / 1000));

    // Liste publique des joueurs
    const publicPlayers: ClientPublicPlayer[] = Array.from(this.players.values()).map(p => {
      const isDead = !p.alive;
      let revealedRole: Role | undefined = undefined;

      // Un rôle n'est révélé publiquement QUE si le joueur est mort (avec paramètre actif) OU à la fin du jeu
      if (this.phase === Phase.GAME_OVER) {
        revealedRole = p.role;
      } else if (isDead && this.settings.revealExactRoleOnDeath) {
        revealedRole = p.role;
      }

      return {
        userId: p.userId,
        pseudonym: p.pseudonym,
        avatar: p.avatar,
        alive: p.alive,
        connected: true,
        isDead,
        revealedRole,
        deathCause: isDead ? p.deathCause : undefined,
        hasVoted: this.votes.has(p.userId)
      };
    });

    const baseState: ClientGameState = {
      gameId: this.id,
      roomId: this.roomId,
      phase: this.phase,
      roundNumber: this.roundNumber,
      phaseStartedAt: this.phaseStartedAt,
      phaseEndsAt: this.phaseEndsAt,
      timeRemainingSeconds,
      players: publicPlayers,
      winnerCamp: this.winnerCamp,
      winnerMessage: this.winnerMessage,
      recentDeaths: this.recentDeaths,
      hunterMustShoot: this.phase === Phase.DEATH_EFFECTS && this.hunterPendingShooterId === userId,
      hunterId: this.hunterPendingShooterId
    };

    // Si le jeu est terminé, on révèle tous les rôles publiquement
    if (this.phase === Phase.GAME_OVER) {
      baseState.allRevealedRoles = {};
      this.players.forEach(p => {
        baseState.allRevealedRoles![p.userId] = {
          role: p.role,
          camp: p.camp,
          pseudonym: p.pseudonym
        };
      });
    }

    // Données secrètes propres au joueur
    if (player) {
      baseState.myRole = player.role;
      baseState.myCamp = player.camp;

      // Amoureux
      if (player.loverId) {
        const lover = this.players.get(player.loverId);
        if (lover) {
          baseState.myLover = {
            userId: lover.userId,
            pseudonym: lover.pseudonym,
            alive: lover.alive
          };
        }
      }

      // Alliés loups : uniquement pour Loups classiques et Loup espion.
      // Le Loup blanc n'est JAMAIS inclus et ne voit AUCUN allié loup !
      if (player.role === Role.WEREWOLF || player.role === Role.WOLF_SPY) {
        baseState.werewolfAllies = Array.from(this.players.values())
          .filter(p => (p.role === Role.WEREWOLF || p.role === Role.WOLF_SPY) && p.userId !== player.userId)
          .map(p => ({
            userId: p.userId,
            pseudonym: p.pseudonym,
            role: p.role
          }));
      }

      // Historique de vision de la Voyante
      if (player.role === Role.SEER) {
        baseState.seerInspectionHistory = player.roleState.seerInspected;
      }

      // Historique d'enquête du Loup espion
      if (player.role === Role.WOLF_SPY) {
        baseState.spyInspectionHistory = player.roleState.spyInspected;
      }

      // État de la Sorcière
      if (player.role === Role.WITCH) {
        const wolfVotes = this.nightActions.filter(a => a.actionType === 'WOLF_KILL');
        let wolfVictimId: string | undefined = undefined;
        let wolfVictimName: string | undefined = undefined;

        if (wolfVotes.length > 0) {
          const counts = new Map<string, number>();
          wolfVotes.forEach(v => {
            if (v.targetId) counts.set(v.targetId, (counts.get(v.targetId) || 0) + 1);
          });
          let max = 0;
          let isTie = false;
          counts.forEach((c, tid) => {
            if (c > max) { max = c; wolfVictimId = tid; isTie = false; }
            else if (c === max) { isTie = true; }
          });
          if (isTie) wolfVictimId = undefined;
        }

        if (wolfVictimId) {
          const target = this.players.get(wolfVictimId);
          wolfVictimName = target?.pseudonym;
        }

        baseState.witchState = {
          healAvailable: !player.roleState.witchHealUsed,
          poisonAvailable: !player.roleState.witchPoisonUsed,
          wolfVictimId: !player.roleState.witchHealUsed ? wolfVictimId : undefined,
          wolfVictimName: !player.roleState.witchHealUsed ? wolfVictimName : undefined
        };
      }

      // Dernière cible du Protecteur
      if (player.role === Role.BODYGUARD) {
        baseState.guardLastProtectedId = player.roleState.lastProtectedUserId;
      }
    }

    return baseState;
  }
}
