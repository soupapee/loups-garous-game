import React from 'react';
import { Camp, Role } from '../types';
import { 
  Moon, 
  Skull, 
  Eye, 
  FlaskConical, 
  Shield, 
  Crosshair, 
  Heart, 
  Users,
  Sparkles
} from 'lucide-react';

interface RoleCardProps {
  role?: Role;
  camp?: Camp;
  isSecret?: boolean;
  compact?: boolean;
  revealed?: boolean;
}

export const ROLE_INFO: Record<Role, {
  name: string;
  camp: Camp;
  campLabel: string;
  campColor: string;
  description: string;
  power: string;
  limitation: string;
  bgGradient: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  [Role.WEREWOLF]: {
    name: 'Loup-Garou Classique',
    camp: Camp.WEREWOLVES,
    campLabel: 'Meute des Loups',
    campColor: 'text-red-500 bg-red-950/80 border-red-700',
    description: 'Bête féroce assoiffée de sang qui se réveille la nuit avec la meute pour dévorer un villageois.',
    power: 'Participe au vote nocturne de la meute et communique secrètement avec ses congénères.',
    limitation: 'Doit trouver un consensus avec la meute ; égalité = pas de victime.',
    bgGradient: 'from-red-950/70 via-gothic-900 to-black',
    borderColor: 'border-red-600/50 shadow-red-900/30',
    icon: <Moon className="w-10 h-10 text-red-500 animate-pulse" />
  },
  [Role.WHITE_WOLF]: {
    name: 'Loup Blanc Solitaire',
    camp: Camp.INDEPENDENT,
    campLabel: 'Solitaire / Indépendant',
    campColor: 'text-slate-200 bg-slate-900/90 border-slate-400',
    description: 'Une bête ancestrale blanche comme l\'hiver. Il ne fait pas partie de la meute et chasse pour son propre règne.',
    power: 'Attaque un joueur de son choix chaque nuit sans devoir consulter la meute.',
    limitation: 'Gagne uniquement s\'il est le tout dernier survivant de la partie.',
    bgGradient: 'from-slate-800/80 via-gothic-900 to-black',
    borderColor: 'border-slate-300 shadow-slate-500/20',
    icon: <Skull className="w-10 h-10 text-slate-200 animate-pulse-slow" />
  },
  [Role.WOLF_SPY]: {
    name: 'Loup Espion',
    camp: Camp.WEREWOLVES,
    campLabel: 'Meute des Loups',
    campColor: 'text-amber-500 bg-amber-950/80 border-amber-700',
    description: 'Rôdeur de la meute capable de sonder les secrets du village tout en votant avec les loups.',
    power: 'Chaque nuit, découvre secrètement le camp d\'un joueur (Village, Loups ou Indépendant).',
    limitation: 'Ne reçoit pas le rôle exact, uniquement l\'allégeance générale.',
    bgGradient: 'from-amber-950/60 via-gothic-900 to-black',
    borderColor: 'border-amber-600/50 shadow-amber-900/30',
    icon: <Eye className="w-10 h-10 text-amber-500 animate-pulse" />
  },
  [Role.SEER]: {
    name: 'Voyante Céleste',
    camp: Camp.VILLAGE,
    campLabel: 'Camp du Village',
    campColor: 'text-sky-400 bg-sky-950/80 border-sky-700',
    description: 'Femme sage aux yeux perçants à qui la lune révèle les plus sombres vérités cachées.',
    power: 'Chaque nuit, perce le secret d\'un joueur vivant et découvre son véritable rôle exact.',
    limitation: 'Une seule vision par nuit. Doit guider le village sans se faire assassiner par les loups.',
    bgGradient: 'from-sky-950/70 via-gothic-900 to-black',
    borderColor: 'border-sky-500/50 shadow-sky-900/30',
    icon: <Eye className="w-10 h-10 text-sky-400" />
  },
  [Role.WITCH]: {
    name: 'Sorcière Guérisseuse',
    camp: Camp.VILLAGE,
    campLabel: 'Camp du Village',
    campColor: 'text-purple-400 bg-purple-950/80 border-purple-700',
    description: 'Alchimiste recluse capable d\'annihiler le poison d\'une morsure ou de foudroyer un ennemi.',
    power: 'Possède 1 Potion de Vie (sauve la cible des loups) et 1 Potion de Mort (empoisonne un joueur).',
    limitation: 'Chaque fiole ne s\'utilise qu\'une seule fois dans toute la partie.',
    bgGradient: 'from-purple-950/70 via-gothic-900 to-black',
    borderColor: 'border-purple-600/50 shadow-purple-900/30',
    icon: <FlaskConical className="w-10 h-10 text-purple-400" />
  },
  [Role.BODYGUARD]: {
    name: 'Protecteur du Village',
    camp: Camp.VILLAGE,
    campLabel: 'Camp du Village',
    campColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-700',
    description: 'Chevalier vigilant qui monte la garde devant la porte d\'un habitant chaque nuit.',
    power: 'Protège une cible vivante contre toute attaque nocturne mortelle des loups.',
    limitation: 'Ne peut pas protéger la même personne deux nuits consécutives. Pas d\'autoprotection.',
    bgGradient: 'from-emerald-950/70 via-gothic-900 to-black',
    borderColor: 'border-emerald-600/50 shadow-emerald-900/30',
    icon: <Shield className="w-10 h-10 text-emerald-400" />
  },
  [Role.HUNTER]: {
    name: 'Chasseur Émérite',
    camp: Camp.VILLAGE,
    campLabel: 'Camp du Village',
    campColor: 'text-orange-400 bg-orange-950/80 border-orange-700',
    description: 'Tireur aguerri dont le mousquet ne quitte jamais la main, même face à la mort.',
    power: 'S\'il est éliminé, tire immédiatement un coup fatal sur le joueur de son choix.',
    limitation: 'Son pouvoir destructeur ne s\'active qu\'au moment précis de son trépas.',
    bgGradient: 'from-orange-950/70 via-gothic-900 to-black',
    borderColor: 'border-orange-600/50 shadow-orange-900/30',
    icon: <Crosshair className="w-10 h-10 text-orange-400" />
  },
  [Role.CUPID]: {
    name: 'Cupidon Mystique',
    camp: Camp.VILLAGE,
    campLabel: 'Camp du Village',
    campColor: 'text-pink-400 bg-pink-950/80 border-pink-700',
    description: 'Arpenteur des cœurs qui tisse un lien indéfectible entre deux âmes lors de la première nuit.',
    power: 'Choisit 2 amoureux lors de la Nuit 1.',
    limitation: 'Si l\'un des deux amants succombe, l\'autre meurt instantanément de chagrin.',
    bgGradient: 'from-pink-950/70 via-gothic-900 to-black',
    borderColor: 'border-pink-600/50 shadow-pink-900/30',
    icon: <Heart className="w-10 h-10 text-pink-400" />
  },
  [Role.VILLAGER]: {
    name: 'Villageois Probe',
    camp: Camp.VILLAGE,
    campLabel: 'Camp du Village',
    campColor: 'text-blue-300 bg-blue-950/80 border-blue-700',
    description: 'Habitant loyal du village dont les seules armes sont son sens de l\'observation et sa voix.',
    power: 'Participe aux délibérations du conseil et possède une voix capitale lors des votes.',
    limitation: 'Aucun sort nocturne. Doit démasquer les imposteurs par la logique.',
    bgGradient: 'from-blue-950/60 via-gothic-900 to-black',
    borderColor: 'border-blue-600/50 shadow-blue-900/30',
    icon: <Users className="w-10 h-10 text-blue-300" />
  }
};

export const RoleCard: React.FC<RoleCardProps> = ({ role, compact = false, isSecret = false }) => {
  if (isSecret || !role) {
    return (
      <div className="relative rounded-2xl p-5 border border-slate-700 bg-gradient-to-b from-gothic-900 to-gothic-950 shadow-2xl flex flex-col items-center justify-center text-center overflow-hidden min-h-[220px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
        <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center mb-3 bg-gothic-950 shadow-inner">
          <Moon className="w-8 h-8 text-slate-500 animate-pulse-slow" />
        </div>
        <h4 className="font-serif text-lg font-bold text-slate-400 tracking-wider">Identité Secrète</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Votre destinée sera révélée au commencement de la nuit.</p>
      </div>
    );
  }

  const info = ROLE_INFO[role];

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r ${info.bgGradient} ${info.borderColor} shadow-lg`}>
        <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0">
          {info.icon}
        </div>
        <div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${info.campColor}`}>
            {info.campLabel}
          </span>
          <h4 className="font-serif font-bold text-sm text-white mt-0.5">{info.name}</h4>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl p-6 border-2 bg-gradient-to-b ${info.bgGradient} ${info.borderColor} shadow-2xl overflow-hidden`}>
      {/* Ornements gothiques en filigrane */}
      <div className="absolute top-2 right-2 opacity-15 pointer-events-none">
        <Sparkles className="w-24 h-24 text-white" />
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border tracking-wide uppercase ${info.campColor}`}>
          {info.campLabel}
        </span>
        <div className="p-2 rounded-xl bg-black/50 border border-white/10 shadow-inner">
          {info.icon}
        </div>
      </div>

      <h3 className="font-serif text-2xl font-black text-white tracking-wide mb-2 drop-shadow-md">
        {info.name}
      </h3>

      <p className="text-sm text-slate-300 leading-relaxed mb-4 italic">
        « {info.description} »
      </p>

      <div className="space-y-3 pt-3 border-t border-white/10">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Pouvoir Nocturne
          </span>
          <p className="text-xs text-slate-200 bg-black/40 p-2.5 rounded-lg border border-white/5">
            {info.power}
          </p>
        </div>

        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-rose-400/90 flex items-center gap-1.5 mb-1">
            <Skull className="w-3.5 h-3.5" /> Contrainte / Victoire
          </span>
          <p className="text-xs text-slate-300 bg-black/40 p-2.5 rounded-lg border border-white/5">
            {info.limitation}
          </p>
        </div>
      </div>
    </div>
  );
};
