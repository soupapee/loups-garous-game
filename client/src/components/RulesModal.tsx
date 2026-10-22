import React, { useState } from 'react';
import { X, Moon, Sun, Shield, Skull, Heart, Trophy, Info } from 'lucide-react';
import { Role } from '../types';
import { RoleCard } from './RoleCard';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ROLES' | 'PHASES' | 'VICTORY'>('ROLES');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-gothic-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gothic-950/80">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif font-black text-xl text-white tracking-wide">
              Règles du Jeu & Grimoire des Rôles
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-800 bg-gothic-950 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('ROLES')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'ROLES'
                ? 'border-red-500 text-white bg-gothic-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-4 h-4 text-red-400" /> Les 10 Rôles du Village
          </button>
          <button
            onClick={() => setActiveTab('PHASES')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'PHASES'
                ? 'border-amber-500 text-white bg-gothic-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-400" /> Déroulement des Phases
          </button>
          <button
            onClick={() => setActiveTab('VICTORY')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'VICTORY'
                ? 'border-indigo-500 text-white bg-gothic-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-indigo-400" /> Conditions de Victoire
          </button>
        </div>

        {/* Contenu avec défilement */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'ROLES' && (
            <div>
              <p className="text-xs text-slate-300 mb-6 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                Chaque partie standard à 10 joueurs réunit exactement ces 10 rôles secrets : 
                <span className="font-semibold text-white"> 2 Loups classiques, 1 Loup blanc, 1 Loup espion, 1 Voyante, 1 Sorcière, 1 Protecteur, 1 Chasseur, 1 Cupidon et 1 Villageois simple.</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(Role).map((r) => (
                  <RoleCard key={r} role={r} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'PHASES' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-indigo-900/50 bg-indigo-950/20">
                <h3 className="font-serif font-bold text-base text-indigo-300 flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-400" /> Nuit 1 : Flèches de Cupidon
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Au commencement, Cupidon désigne deux âmes sœurs. Les deux amoureux sont prévenus secrètement. 
                  Si l'un d'eux périt, le second meurt instantanément de chagrin quelle qu'en soit la cause.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-red-900/50 bg-red-950/20">
                <h3 className="font-serif font-bold text-base text-red-300 flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-red-500" /> La Nuit : Éveil des Pouvoirs
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed space-y-1">
                  Les rôles nocturnes agissent en secret :
                  <br />• <strong>Voyante</strong> : découvre le rôle exact d'un habitant.
                  <br />• <strong>Loup Espion</strong> : sonde le camp (Village, Loups, Indépendant) d'une cible.
                  <br />• <strong>Meute des Loups</strong> : vote secrètement dans leur salon secret pour dévorer une victime (égalité = pas de victime).
                  <br />• <strong>Loup Blanc</strong> : frappe une proie de son choix en solitaire.
                  <br />• <strong>Protecteur</strong> : immunise un habitant (pas deux nuits de suite, pas soi-même).
                  <br />• <strong>Sorcière</strong> : est informée de la victime des loups et peut utiliser son élixir de vie ou sa fiole de poison.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-950/20">
                <h3 className="font-serif font-bold text-base text-amber-300 flex items-center gap-2 mb-2">
                  <Sun className="w-4 h-4 text-amber-400" /> L'Aube & Le Jour (60s Discussion + 45s Vote)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Le glas retentit et les victimes de la nuit sont révélées. Les survivants débattent pendant 60 secondes dans le chat du village. 
                  Puis, le tribunal de vote s'ouvre pendant 45 secondes : chaque habitant vivant vote contre un suspect. Le joueur avec la stricte majorité est envoyé au bûcher.
                  <span className="block mt-1 text-amber-200 font-medium">
                    En cas d'égalité au vote, aucun joueur n'est éliminé.
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/40">
                <h3 className="font-serif font-bold text-base text-slate-300 flex items-center gap-2 mb-2">
                  <Skull className="w-4 h-4 text-slate-400" /> Trépas & Dernier Souffle du Chasseur
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Lorsqu'un joueur meurt, son rôle exact est révélé au village (selon la configuration). Les morts ne peuvent plus parler ni voter. 
                  Si le Chasseur périt, une phase de tir ultime de 20s lui permet d'abattre un joueur avant de trépasser.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'VICTORY' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-blue-900/60 bg-blue-950/30">
                <h4 className="font-serif font-bold text-base text-blue-300 flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-blue-400" /> Victoire du Village
                </h4>
                <p className="text-xs text-slate-300">
                  Le Village l'emporte lorsque <strong>tous les monstres sont anéantis</strong> : tous les Loups classiques, le Loup espion ET le Loup blanc doivent être morts.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-red-900/60 bg-red-950/30">
                <h4 className="font-serif font-bold text-base text-red-400 flex items-center gap-2 mb-1">
                  <Moon className="w-5 h-5 text-red-500" /> Victoire de la Meute des Loups
                </h4>
                <p className="text-xs text-slate-300">
                  La meute gagne lorsqu'elle atteint la <strong>parité ou la supériorité numérique</strong> avec les villageois, à condition expresse que le Loup blanc soit déjà mort.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-400/60 bg-slate-900/50">
                <h4 className="font-serif font-bold text-base text-slate-200 flex items-center gap-2 mb-1">
                  <Skull className="w-5 h-5 text-slate-300" /> Victoire Solitaire du Loup Blanc
                </h4>
                <p className="text-xs text-slate-300">
                  Le Loup blanc ne partage la gloire de personne. Il ne triomphe que s'il est <strong>l'unique et dernier survivant</strong> sur les cendres du village.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pied de modal */}
        <div className="px-6 py-3 border-t border-slate-800 bg-gothic-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-red-900 hover:bg-red-800 text-white transition shadow-lg"
          >
            Fermer le Grimoire
          </button>
        </div>
      </div>
    </div>
  );
};
