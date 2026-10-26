# Guide Frontend — TaskFlow

Guide de l'application React qui consomme l'API NestJS de gestion de tâches
(`../back-end`). Il décrit la configuration réellement présente dans ce dépôt,
la couche API, le flux d'authentification, les écrans et le déploiement Docker.

> ✅ État vérifié : `bun run build`, `bun run lint` et `bun run type-check`
> passent. Le backend doit tourner sur `http://localhost:3000` et accepter
> l'origine `http://localhost:5173` (`TRUSTED_ORIGINS`).

## Sommaire

1. [Aperçu](#1-aperçu)
2. [Démarrage rapide](#2-démarrage-rapide)
3. [Variables d'environnement](#3-variables-denvironnement)
4. [Configuration vérifiée](#4-configuration-vérifiée)
5. [Architecture du projet](#5-architecture-du-projet)
6. [Couche API](#6-couche-api)
7. [Authentification](#7-authentification)
8. [Routes et écrans](#8-routes-et-écrans)
9. [Scripts](#9-scripts)
10. [Docker](#10-docker)
11. [Intégration avec le backend](#11-intégration-avec-le-backend)
12. [Dépannage](#12-dépannage)
13. [Checklist de validation](#13-checklist-de-validation)

---

## 1. Aperçu

| Élément          | Version / choix                          |
| ---------------- | ---------------------------------------- |
| React            | 19.3                                     |
| TypeScript       | 6.0                                      |
| Vite             | 8.3                                      |
| Tailwind CSS     | 4.3 (plugin Vite `@tailwindcss/vite`)    |
| DaisyUI          | 5.7 (plugin Tailwind `@plugin "daisyui"`) |
| Routage          | React Router 7                           |
| Formulaires      | React Hook Form 7 + Zod 4                |
| HTTP             | Axios 1.20                               |
| Notifications    | React Hot Toast 2.6                      |
| Authentification | Better Auth (token Bearer)               |

Fonctionnalités :

- inscription et connexion par email / mot de passe ;
- session restaurée au rechargement de la page ;
- liste des tâches de l'utilisateur connecté ;
- création d'une tâche (titre, description, priorité) ;
- filtres « toutes / en cours / terminées » et par priorité ;
- changement de statut (terminée / réactivée) ;
- suppression avec confirmation ;
- routes protégées et redirection automatique sur `401`.

### Prérequis

- Node.js ≥ 20 ou Bun ≥ 1.2 (le projet utilise `bun.lock`).
- Le backend NestJS démarré sur le port `3000`.

---

## 2. Démarrage rapide

### 2.1 Backend

```bash
cd ../back-end
bun install
docker compose up -d db   # PostgreSQL local sur le port 5434
bun run db:push           # crée / met à jour les tables
bun run dev
```

Le `.env` du backend pointe par défaut sur ce PostgreSQL local :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/nestjs-restaurant?schema=public
```

La ligne Neon est conservée en commentaire dans `.env` si tu souhaites la
réactiver plus tard. Attention : le port 5434 évite les conflits avec d'autres
PostgreSQL déjà présents sur 5432/5433.

Le backend expose :

- l'API sur `http://localhost:3000` ;
- Swagger sur `http://localhost:3000/docs` ;
- un health check sur `http://localhost:3000/health`.

Dans le `.env` du backend, l'origine du frontend doit être autorisée :

```env
TRUSTED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 2.2 Frontend

```bash
cd front-end
bun install
cp .env.example .env
bun run dev
```

Ouvrir <http://localhost:5173>.

---

## 3. Variables d'environnement

Fichier `.env` (copié depuis `.env.example`) :

```env
VITE_API_URL=
VITE_PROXY_TARGET=http://localhost:3000
```

| Variable            | Rôle                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| `VITE_API_URL`      | Base des requêtes Axios. **Vide = même origine** (proxy Vite).       |
| `VITE_PROXY_TARGET` | Cible serveur du proxy Vite. Non exposée au navigateur.              |

Pourquoi une URL vide ? Le backend ne configure pas explicitement
`app.enableCors(...)`. En passant par le proxy, le navigateur ne voit qu'une
seule origine : aucune configuration CORS n'est nécessaire et il n'y a pas de
préflight.

```
Navigateur ──► http://localhost:5173 ──proxy──► http://localhost:3000
```

> Seules les variables préfixées par `VITE_` sont injectées dans le bundle par
> Vite. Ne jamais y placer de secret : tout est visible côté client.

Si le backend est exposé sur un autre domaine (et que CORS est configuré), on
peut renseigner une URL absolue :

```env
VITE_API_URL=https://api.exemple.com
```

---

## 4. Configuration vérifiée

### 4.1 `vite.config.ts`

```typescript
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3000'

  const proxy = {
    '/api': { target: proxyTarget, changeOrigin: true },
    '/tasks': { target: proxyTarget, changeOrigin: true },
    '/examples': { target: proxyTarget, changeOrigin: true },
  }

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, host: true, proxy },
    preview: { port: 5173, host: true, proxy },
  }
})
```

Points importants :

- `host: true` permet l'accès depuis un conteneur ou le réseau local ;
- le proxy est défini aussi pour `preview` (utilisé par l'image Docker) ;
- `/api` couvre les routes Better Auth (`/api/auth/*`), `/tasks` et
  `/examples` couvrent les modules NestJS.

### 4.2 Tailwind CSS 4 + DaisyUI 5 (`src/index.css`)

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

Avec Tailwind 4, DaisyUI s'active via `@plugin "daisyui"`. L'ancien import
`@import "daisyui/src/base/full.css"` ne correspond pas à l'arborescence du
paquet installé et empêchait le chargement des composants.

### 4.3 TypeScript

`tsconfig.app.json` active deux options qui imposent des règles de code :

| Option                | Conséquence                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| `erasableSyntaxOnly`  | Interdit les `enum`, `namespace` et propriétés de constructeur.          |
| `verbatimModuleSyntax`| Oblige `import type { ... }` pour les types.                             |
| `noUnusedLocals`      | Un import ou une variable inutilisée fait échouer le build.              |

C'est pourquoi les priorités sont une union de chaînes et non un `enum` :

```typescript
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
```

Le script `type-check` utilise `tsc -b` : `tsc --noEmit` seul ignorait les
projets référencés (`tsconfig.app.json` / `tsconfig.node.json`) et ne vérifiait
donc pas réellement `src/`.

### 4.4 `index.html`

- `lang="fr"` ;
- titre « TaskFlow · Gestion de tâches » ;
- point de montage `#root` et entrée `/src/main.tsx`.

---

## 5. Architecture du projet

```
src/
├── components/
│   ├── Layout.tsx            # Navbar + zone de contenu (Outlet)
│   └── ProtectedRoute.tsx    # Garde de route (session requise)
├── hooks/
│   └── useAuth.ts            # Accès au contexte d'authentification
├── lib/
│   ├── api.ts                # Instance Axios, token Bearer, erreurs
│   └── auth-context.ts       # Contexte React + type AuthContextValue
├── pages/
│   ├── Login.tsx             # Connexion
│   ├── Register.tsx          # Inscription
│   └── Tasks.tsx             # CRUD des tâches
├── providers/
│   └── AuthProvider.tsx      # État de session (user, loading, actions)
├── services/
│   ├── auth.service.ts       # /api/auth/*
│   ├── tasks.service.ts      # /tasks
│   └── examples.service.ts   # /examples (module de démonstration)
├── types/
│   └── api.ts                # Types User, Session, Task, DTO…
├── App.tsx                   # Router + Toaster + AuthProvider
├── index.css                 # Tailwind + DaisyUI
└── main.tsx                  # Point d'entrée React
```

---

## 6. Couche API

### 6.1 Instance Axios (`src/lib/api.ts`)

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_STORAGE_KEY = 'tasks.auth.token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Ajoute le token Bearer à chaque requête
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → purge du token + redirection vers /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearStoredToken();
      // redirection sauf sur /login et /register
    }
    return Promise.reject(error);
  },
);
```

Le token est conservé dans `localStorage` sous la clé `tasks.auth.token`.

> Le token est un token de session opaque généré par Better Auth (plugin
> `bearer`), pas un JWT à décoder. Il est envoyé dans l'en-tête
> `Authorization: Bearer <token>`.

### 6.2 Services

`authService` :

| Méthode       | Requête                        | Réponse                         |
| ------------- | ------------------------------ | ------------------------------- |
| `signUp`      | `POST /api/auth/sign-up/email` | `{ token, user }`               |
| `signIn`      | `POST /api/auth/sign-in/email` | `{ token, user }`               |
| `getSession`  | `GET /api/auth/get-session`    | `{ session, user }` ou `null`  |
| `signOut`     | `POST /api/auth/revoke-session` puis `POST /api/auth/sign-out` | session révoquée + cookie nettoyé |

`tasksService` :

| Méthode       | Requête                        | Corps / paramètres                          |
| ------------- | ------------------------------ | ------------------------------------------- |
| `findAll`     | `GET /tasks`                   | query `priority` (optionnel)                |
| `findOne`     | `GET /tasks/:id`               | —                                           |
| `create`      | `POST /tasks`                  | `{ title, description?, priority }`         |
| `update`      | `PATCH /tasks/:id`             | `{ title?, description?, priority?, completed? }` |
| `complete`    | `PATCH /tasks/:id/completed`   | force `completed = true`                    |
| `remove`      | `DELETE /tasks/:id`            | —                                           |

À retenir sur les filtres :

- le backend n'accepte en query que `priority` (`ListTaskDto`) ;
- il n'existe **pas** de filtre serveur `completed` : le filtre « en cours /
  terminées » est appliqué côté client dans `Tasks.tsx` ;
- `PATCH /tasks/:id/completed` ne fait que passer à `true`. Pour réactiver une
  tâche, l'application utilise `PATCH /tasks/:id` avec `{ completed: false }`.

> Le endpoint canonique de Better Auth est `/api/auth/get-session` — et non
> `/api/auth/session`, qui renvoie `404`. Sans session valide il répond
> `200` avec un corps `null`. La route miroir NestJS `/auth/session` existe
> aussi et renvoie `401` quand aucune session n'est trouvée.
>
> `signOut` envoie un corps JSON vide (`{}`) : le handler Better Auth répond
> `415 Unsupported Media Type` si le `POST` n'a ni corps ni bon content-type.
>
> ⚠️ `/api/auth/sign-out` ne supprime que le **cookie** de session. Comme cette
> application utilise un token Bearer, `authService.signOut()` appelle d'abord
> `POST /api/auth/revoke-session` avec `{ token }` pour invalider réellement la
> session côté serveur, puis `sign-out` pour le cookie. Sans cela, le token
> resterait valide jusqu'à son expiration même après déconnexion dans l'UI.

Toutes les routes `/tasks` sont protégées par `SessionGuard` et exigent le
token Bearer.

### 6.3 Types principaux (`src/types/api.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SessionResponse {
  session: Session;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

`User.name` est nullable en base : les affichages utilisent un repli sur
l'email (`user.name || user.email`).

> `getSession` renvoie `null` (HTTP 200) lorsqu'il n'y a pas de session
> valide ; le type de retour est donc `SessionResponse | null`.

---

## 7. Authentification

### 7.1 Flux

1. **Inscription** — `POST /api/auth/sign-up/email` avec
   `{ email, password, name }`. La réponse contient `token` et `user`.
2. **Connexion** — `POST /api/auth/sign-in/email` avec `{ email, password }`.
3. Le token est stocké dans `localStorage`, l'utilisateur dans l'état React.
4. **Rechargement** — `AuthProvider` lit le token puis appelle
   `GET /api/auth/get-session`. Une réponse `null` purge le token.
5. **Déconnexion** — `POST /api/auth/revoke-session` (révocation du token),
   puis `POST /api/auth/sign-out` avec un corps `{}`, puis purge locale même
   si l'appel échoue.

### 7.2 Contexte (`AuthProvider` + `useAuth`)

`AuthProvider` expose :

```typescript
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

`ProtectedRoute` affiche un spinner pendant `loading`, puis redirige vers
`/login` si `user` est `null`.

### 7.3 Règles de mot de passe

Better Auth applique une longueur minimale par défaut de **8 caractères**.
Les schémas Zod du frontend utilisent la même limite pour éviter les allers-
retours inutiles.

---

## 8. Routes et écrans

| Route       | Accès       | Composant  |
| ----------- | ----------- | ---------- |
| `/login`    | public      | `Login`    |
| `/register` | public      | `Register` |
| `/`         | protégé     | redirige vers `/tasks` |
| `/tasks`    | protégé     | `Tasks` dans `Layout` |
| `*`         | —           | redirige vers `/tasks` |

### Écrans

- **Login / Register** : React Hook Form + `zodResolver`, validation locale,
  messages d'erreur API via `getApiErrorMessage`, notification toast, bouton
  désactivé pendant la soumission.
- **Tasks** :
  - chargement des tâches via `useEffect` (avec annulation si le composant est
    démonté ou le filtre change) ;
  - compteur total / en cours ;
  - onglets « Toutes / En cours / Terminées » (filtrage local) ;
  - sélecteur de priorité (filtrage serveur) ;
  - modale de création DaisyUI ;
  - case à cocher pour terminer / réactiver ;
  - suppression avec `window.confirm`.
- **Layout** : navbar, avatar avec initiales, menu de déconnexion.

Le state de chargement n'est volontairement pas modifié de façon synchrone
dans le corps de l'effet : la règle ESLint
`react-hooks/set-state-in-effect` l'interdit.

---

## 9. Scripts

| Commande             | Effet                                                    |
| -------------------- | -------------------------------------------------------- |
| `bun run dev`        | Vite en mode développement, port 5173, HMR               |
| `bun run build`      | `tsc -b` puis `vite build` → `dist/`                     |
| `bun run preview`    | Sert `dist/` sur le port 5173 avec le même proxy         |
| `bun run lint`       | ESLint (TypeScript + React Hooks + React Refresh)        |
| `bun run type-check` | Vérification TypeScript des deux projets référencés      |

Ordre recommandé avant livraison :

```bash
bun run type-check && bun run lint && bun run build
```

---

## 10. Docker

### 10.1 `Dockerfile` (build de production)

Multi-stage Bun :

1. installation avec `bun.lock` (`bun install --frozen-lockfile`) ;
2. build Vite avec les arguments `VITE_API_URL` / `VITE_PROXY_TARGET` ;
3. image d'exécution contenant `dist/`, `package.json`, `bun.lock` et
   `vite.config.ts` (nécessaire au proxy de `vite preview`).

```bash
docker build -t taskflow-frontend .
docker run --rm -p 5173:5173 \
  -e VITE_PROXY_TARGET=http://host.docker.internal:3000 \
  taskflow-frontend
```

> L'image de production utilise `vite preview` pour rester simple et conserver
> le proxy. Pour une mise en production réelle, servir `dist/` avec Nginx et
> proxyfier `/api`, `/tasks` et `/examples` vers le backend.

### 10.2 `Dockerfile.dev`

Monte le code en volume et lance `vite --host 0.0.0.0` pour le hot-reload.
Le `node_modules` du conteneur est préservé via un volume anonyme.

### 10.3 `docker-compose.yml`

Trois services + PostgreSQL :

- `db` : PostgreSQL 17 avec healthcheck ;
- `backend` : build depuis `../back-end`, applique `bun run db:push` puis
  démarre l'API, avec `TRUSTED_ORIGINS=http://localhost:5173,...` ;
- `frontend-dev` : hot-reload sur <http://localhost:5173> ;
- `frontend-prod` : profil `production`, sert le build sur le même port.

Commandes :

```bash
# Développement complet
docker compose up --build frontend-dev

# Production (preview)
docker compose --profile production up --build frontend-prod

# Logs
docker compose logs -f frontend-dev

# Arrêt
docker compose down

# Arrêt + suppression de la base
docker compose down -v
```

Les noms de fichiers copiés dans les images sont `bun.lock` (et non
`bun.lockb`) : c'est le lockfile réellement généré par cette version de Bun.

---

## 11. Intégration avec le backend

### 11.1 Origines de confiance

Better Auth vérifie l'en-tête `Origin` des requêtes sensibles. Le backend lit :

```typescript
const trustedOrigins =
  process.env.TRUSTED_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [
    'http://localhost:3000',
  ];
```

Sans `http://localhost:5173` dans cette liste, l'inscription et la connexion
peuvent répondre `403 Invalid origin`. Le fichier `../back-end/.env` et
`../back-end/.env.example` ont été mis à jour en conséquence.

### 11.2 CORS

Le backend n'appelle pas `app.enableCors(...)`. Deux options :

1. **Recommandée** — passer par le proxy Vite (`VITE_API_URL` vide) : le
   navigateur reste sur `http://localhost:5173`, aucun CORS n'est requis.
2. **Accès direct** — renseigner `VITE_API_URL=http://localhost:3000`, activer
   CORS côté NestJS et autoriser l'origine du frontend :

```typescript
app.enableCors({
  origin: ['http://localhost:5173'],
  credentials: true,
});
```

### 11.3 Résumé des routes utilisées

| Domaine | URL frontend (proxy)      | Backend réel              | Auth |
| ------- | ------------------------- | ------------------------- | ---- |
| Auth    | `/api/auth/sign-up/email` | `/api/auth/sign-up/email` | non  |
| Auth    | `/api/auth/sign-in/email` | `/api/auth/sign-in/email` | non  |
| Auth    | `/api/auth/get-session`   | `/api/auth/get-session`   | Bearer |
| Auth    | `/api/auth/sign-out`      | `/api/auth/sign-out`      | Bearer |
| Auth    | `/api/auth/revoke-session` | `/api/auth/revoke-session` | Bearer |
| Tâches  | `/tasks`                  | `/tasks`                  | Bearer |
| Tâches  | `/tasks/:id`              | `/tasks/:id`              | Bearer |
| Tâches  | `/tasks/:id/completed`    | `/tasks/:id/completed`    | Bearer |

> Le backend expose aussi des routes miroir `/auth/*` (contrôleur NestJS
> documenté dans Swagger). Le frontend utilise les routes Better Auth
> `/api/auth/*`, conformes à la collection Bruno et au README du backend.

---

## 12. Dépannage

### Le build échoue avec `TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled`

Un `enum` (ou un `namespace`) a été ajouté. Utiliser une union de chaînes :

```typescript
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
```

### `TS1484: ... is a type and must be imported using a type-only import`

`verbatimModuleSyntax` est actif : écrire `import type { User } from ...`.

### `tsc --noEmit` ne signale aucune erreur alors que le build échoue

Le projet racine n'a pas de `files` : il faut `tsc -b` (script `type-check`
déjà corrigé) ou `tsc -b --force`.

### Erreur `403 Invalid origin`

Ajouter l'origine exacte du frontend dans `TRUSTED_ORIGINS` côté backend, puis
redémarrer l'API :

```env
TRUSTED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### `401 Non autorisé`

- vérifier que le token existe dans `localStorage` (`tasks.auth.token`) ;
- vérifier que le header `Authorization: Bearer <token>` est bien envoyé
  (intercepteur Axios) ;
- la session a peut-être expiré : se reconnecter.

### `ECONNREFUSED` / `proxy error` sur `/tasks`

Le proxy ne joint pas le backend. Vérifier :

- que l'API tourne sur le port `3000` ;
- `VITE_PROXY_TARGET` (local : `http://localhost:3000`, Docker :
  `http://backend:3000`) ;
- dans Docker, utiliser le nom de service et non `localhost`.

### Les styles DaisyUI ne s'appliquent pas

Vérifier `src/index.css` :

```css
@import "tailwindcss";
@plugin "daisyui";
```

et que `tailwindcss` + `daisyui` sont bien installés.

### Le filtre « Terminées » ne fonctionne pas côté serveur

C'est normal : `GET /tasks` ne filtre que par `priority`. Le statut est filtré
côté client. Ne pas envoyer `completed` en query en espérant un effet.

### Une tâche ne peut pas être réactivée avec `/completed`

`PATCH /tasks/:id/completed` force `completed = true`. Utiliser
`PATCH /tasks/:id` avec `{ "completed": false }`.

### Trop de requêtes (`429 Too Many Requests`)

Le backend limite à 20 requêtes par minute et par IP. Espacer les tests ou
augmenter la limite dans `ThrottlerModule` côté backend.

### Port 5173 déjà utilisé (Windows)

```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## 13. Checklist de validation

- [ ] Le backend répond sur `http://localhost:3000/health`.
- [ ] `TRUSTED_ORIGINS` contient `http://localhost:5173`.
- [ ] `.env` contient `VITE_API_URL=` (ou une URL absolue volontaire) et
      `VITE_PROXY_TARGET=http://localhost:3000`.
- [ ] `bun run type-check` passe.
- [ ] `bun run lint` passe.
- [ ] `bun run build` génère `dist/`.
- [ ] Inscription puis connexion fonctionnent.
- [ ] La session survit à un rechargement de page.
- [ ] Création, terminaison, réactivation et suppression d'une tâche
      fonctionnent.
- [ ] La déconnexion ramène à `/login` et protège `/tasks`.

## Ressources

- [Vite](https://vite.dev/guide/)
- [React](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [DaisyUI 5](https://daisyui.com/docs/)
- [React Router](https://reactrouter.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Axios](https://axios-http.com/docs/intro)
- [Better Auth](https://www.better-auth.com/docs)
- [NestJS](https://docs.nestjs.com/)
