# 🐺 Les Loups-Garous — Ombres du Village

Application web multijoueur complète, sécurisée et temps réel inspirée du jeu culte de déduction sociale « Les Loups-Garous de Thiercelieux ».

L'application dispose d'une identité visuelle gothique soignée, d'un moteur de jeu serveur autoritaire orchestrant automatiquement toutes les phases sans maître du jeu humain, d'un moteur audio procédural (Web Audio API) et d'une suite exhaustive de **20 tests automatisés** validant l'intégrité de toutes les mécaniques.

---

## 🏛️ 1. Arborescence du Projet

```
loups-garous-game/
├── package.json                   # Scripts globaux (dev, build, test)
├── schema.sql                     # Schéma DDL PostgreSQL / Supabase complet avec RLS
├── .env.example                   # Variables d'environnement documentées
├── README.md                      # Guide d'installation, règles et déploiement
│
├── server/                        # Backend Node.js / TypeScript / Socket.IO
│   ├── package.json               # Dépendances serveur (express, socket.io, vitest...)
│   ├── tsconfig.json              # Configuration TypeScript serveur
│   ├── .env                       # Variables locales du serveur
│   ├── src/
│   │   ├── index.ts               # Serveur HTTP Express & Socket.IO
│   │   ├── types.ts               # Types partagés, rôles, camps, phases, états
│   │   ├── game/
│   │   │   ├── GameEngine.ts      # Machine à états (12 phases), priorités nocturnes, victoires
│   │   │   └── RoomManager.ts     # Gestion des salons privés, codes d'invitation, bots IA
│   │   └── socket/
│   │       └── socketHandler.ts   # Événements temps réel, isolation des secrets & chats
│   └── tests/
│       └── game.test.ts           # 20 tests automatisés couvrant les 20 spécifications
│
└── client/                        # Frontend React / TypeScript / Vite / Tailwind CSS
    ├── package.json               # Dépendances frontend (react, lucide-react, canvas-confetti...)
    ├── tsconfig.json              # Configuration TypeScript frontend
    ├── vite.config.ts             # Configuration du bundler Vite
    ├── tailwind.config.js         # Thème gothique personnalisé (palette sombre, animations)
    ├── index.html                 # Point d'entrée HTML avec polices gothiques Cinzel & Inter
    └── src/
        ├── main.tsx               # Point d'entrée React
        ├── App.tsx                # Orchestration d'état, sessions invités et routing
        ├── index.css              # Styles Tailwind et défilements gothiques
        ├── types.ts               # Types TypeScript côté client
        ├── services/
        │   ├── socketService.ts   # Client Socket.IO avec Promises typées
        │   └── soundEngine.ts     # Moteur sonore Web Audio API (hurlements, glas, cœur, fusil)
        └── components/
            ├── Header.tsx         # Logo, salon actif, réglage du volume audio, profil
            ├── HomeView.tsx       # Écran d'accueil gothique avec actions principales
            ├── LobbyView.tsx      # Salle d'attente (10 joueurs, prêt, bots IA, chat)
            ├── GameView.tsx       # Plateau du village, actions contextuelles, chat sécurisé
            ├── RoleCard.tsx       # Grimoire et cartes de rôle richement illustrées
            ├── RulesModal.tsx     # Guide interactif des règles, cycles et conditions de victoire
            ├── ProfileModal.tsx   # Personnalisation du pseudonyme et avatar
            ├── CreateRoomModal.tsx# Paramétrage de salon privé (timers, rôles)
            ├── JoinRoomModal.tsx  # Saisie du code d'invitation
            └── PublicRoomsModal.tsx # Explorateur des salons ouverts
```

---

## ⚡ 2. Prérequis & Installation

### Prérequis
- **Node.js** >= 18.0.0 (v20+ ou v24+ recommandé)
- **npm** >= 9.0.0

### Installation des dépendances
À la racine du projet :
```bash
# Installation simultanée du serveur et du client
npm run install:all
```
*(Ou manuellement : `cd server && npm install`, puis `cd ../client && npm install`)*

---

## 🚀 3. Lancement en Développement

Pour lancer le jeu en local :

### Option A : Deux terminaux distincts (Recommandé)

**Terminal 1 — Backend (Port 4000) :**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend (Port 5173) :**
```bash
cd client
npm run dev
```

Ouvrez ensuite votre navigateur sur : **`http://localhost:5173`**

---

## 🧪 4. Exécution de la Suite de Tests (20 Tests Obligatoires)

Le serveur inclut une suite de tests automatisés exhaustive via **Vitest** utilisant une horloge simulée (`vi.useFakeTimers()`) pour tester instantanément les chronomètres de 60s et 45s.

Pour exécuter les 20 tests :
```bash
cd server
npm test
```

### Scénarios validés :
1. ✅ **Distribution exacte de 10 rôles pour 10 joueurs.**
2. ✅ **Impossibilité de lancer avec une composition ou un effectif invalide.**
3. ✅ **Confidentialité absolue des rôles et des enquêtes (zéro fuite réseau).**
4. ✅ **Fonctionnement du vote et de l'égalité (aucun éliminé en cas d'égalité).**
5. ✅ **Potion de soin (sauve la victime) et potion de poison (élimine la cible) de la Sorcière.**
6. ✅ **Protection nocturne par le Protecteur (anti-consécutive et anti-autoprotection).**
7. ✅ **Enquête secrète du Loup espion (découvre le camp mais JAMAIS le rôle exact).**
8. ✅ **Mort du Chasseur et élimination immédiate de sa cible abattue.**
9. ✅ **Lien amoureux de Cupidon et mort en chaîne par chagrin.**
10. ✅ **Condition de victoire du Village.**
11. ✅ **Condition de victoire des Loups-Garous (parité et Loup blanc éliminé).**
12. ✅ **Condition de victoire solitaire du Loup blanc (dernier survivant).**
13. ✅ **Cas où les loups classiques sont morts mais où le Loup blanc survit (pas de victoire village).**
14. ✅ **Rejet des votes doubles (modification autorisée sans doubler la voix).**
15. ✅ **Rejet des actions hors phase.**
16. ✅ **Expiration déterministe des délais de 60s (discussion) et 45s (vote).**
17. ✅ **Reconnexion transparente après une interruption réseau.**
18. ✅ **Refus strict de dépassement de capacité simultané sur la dernière place.**
19. ✅ **Interdiction formelle de vote pour les joueurs morts.**
20. ✅ **Transition terminale systématique vers GAME_OVER avec révélation finale.**

---

## 🎮 5. Procédure de Test Multijoueur

### Méthode 1 : Test instantané avec Bots IA (Idéal pour 1 personne)
1. Ouvrez l'application sur `http://localhost:5173`.
2. Cliquez sur **« Créer une Partie »** -> **« Créer le Salon »**.
3. Dans la salle d'attente, cliquez sur le bouton violet : **« Remplir avec des Bots (Test 10 Joueurs) »**.
   * Le salon se remplit instantanément avec 9 compagnons contrôlés par le serveur et prêts.
4. Cliquez sur **« Lancer la Partie (10 Joueurs) »**.
5. Vous découvrez immédiatement votre carte de rôle secrète et vivez le cycle complet (Nuit, Pouvoirs, Aube, Débat 60s, Vote 45s, Bûcher, Chasseur, Victoire) !

### Méthode 2 : Multi-navigateurs ou Onglets de Navigation Privée
1. Ouvrez un premier navigateur (ex: Chrome standard) et créez un salon. Notez le code d'invitation (ex: `LG-7K4X`).
2. Ouvrez un second navigateur ou une fenêtre de navigation privée (qui disposera de sa propre session invité distincte).
3. Cliquez sur **« Rejoindre un Salon »**, collez le code `LG-7K4X`.
4. Répétez ou complétez les places restantes avec le bouton Bots IA.
5. Marquez chaque joueur « Prêt », puis l'hôte lance la partie !

---

## 📜 6. Composition des 10 Rôles & Déroulement Nocturne

| Rôle | Camp | Pouvoir Nocturne & Règle Spécifique |
|---|---|---|
| **2x Loups-Garous classiques** | Meute | Décision collective pour dévorer une victime. Égalité = pas de victime. |
| **1x Loup blanc** | Indépendant | Frappe une cible en solo chaque nuit. Doit être le dernier survivant pour gagner. |
| **1x Loup espion** | Meute | Sonde le **camp** d'un habitant (Village, Loups, Indépendant). Participe au vote des loups. |
| **1x Voyante** | Village | Découvre le **rôle exact** d'un habitant vivant chaque nuit. |
| **1x Sorcière** | Village | 1 potion de soin (sauve la victime des loups) + 1 potion de poison (mortelle). Usage unique. |
| **1x Protecteur** | Village | Immunise un joueur contre les assauts de la nuit. Pas 2 nuits de suite, pas soi-même. |
| **1x Chasseur** | Village | Lorsqu'il meurt, il dispose d'un tir vengeur immédiat pour abattre un joueur vivant. |
| **1x Cupidon** | Village | Nuit 1 : lie deux amoureux à la vie à la mort. Si l'un meurt, l'autre meurt de chagrin. |
| **1x Villageois simple** | Village | Débat le jour et vote pour démasquer les imposteurs. |

### Ordre de Priorité de Résolution Nocturne :
1. Application de la protection du Protecteur.
2. Résolution de l'attaque de la meute des loups (annulée si cible protégée OU sauvée par la sorcière).
3. Résolution de l'attaque du Loup blanc (annulée si cible protégée).
4. Résolution de la potion de poison de la Sorcière (mort certaine).
5. Effet d'amoureux en chaîne : si un amoureux meurt, son partenaire succombe immédiatement de chagrin.
6. Effet du Chasseur : si le Chasseur périt pendant la nuit ou le vote, la phase `DEATH_EFFECTS` s'ouvre pour son tir.

---

## 🗄️ 7. Base de Données & Schéma PostgreSQL / Supabase

Le fichier **`schema.sql`** à la racine contient la structure DDL complète pour PostgreSQL ou Supabase :
- Tables : `users`, `rooms`, `room_players`, `games`, `game_players`, `night_actions`, `votes`, `game_events`.
- Contraintes d'intégrité, index de performance sur les clés étrangères et codes d'invitation.
- **Sécurité RLS (Row Level Security)** : politiques interdisant formellement l'accès aux colonnes secrètes (`role_secret`, actions nocturnes non résolues) aux clients non autorisés.

### Import sur Supabase :
1. Connectez-vous à votre dashboard Supabase.
2. Allez dans **SQL Editor** -> **New Query**.
3. Copiez l'intégralité du contenu de `schema.sql` et cliquez sur **Run**.
4. Renseignez `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans votre fichier `.env`.

---

## 🌐 8. Déploiement en Production

### Build de Production
```bash
# Compilation du serveur et du bundle web client
npm run build
```

### Hébergement recommandé
- **Backend (Node.js + Socket.IO) :** Déployable sur Render, Railway, Fly.io, ou VPS Docker.
- **Frontend (SPA Vite/React) :** Déployable sur Vercel, Netlify, Cloudflare Pages, ou servi directement par le serveur Express.
- **Variables d'environnement de production :**
  - `PORT=4000`
  - `NODE_ENV=production`
  - `CORS_ORIGIN=https://votre-domaine-frontend.com`
  - `JWT_SECRET=votre_cle_tres_longue_et_aleatoire`
