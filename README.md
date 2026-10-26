# TaskFlow — Gestionnaire de tâches

Application full-stack de gestion de tâches : authentification par email / mot de
passe, création et suivi de tâches, et gestion des utilisateurs.

- **Backend** : NestJS 11, Prisma 7, PostgreSQL, Better Auth, Zod, Swagger
- **Frontend** : React 19, Vite 8, TypeScript, Tailwind CSS 4 + DaisyUI

## Structure du projet

```
tasks-final/
├── back-end/     API REST NestJS (auth, tâches, utilisateurs, Prisma)
└── front-end/    Application React (Vite)
```

## Fonctionnalités

- Inscription, connexion et déconnexion (sessions Bearer via Better Auth)
- CRUD des tâches avec priorité (basse, moyenne, haute), filtres et état terminé
- Page **Utilisateurs** : liste des comptes et création d'un utilisateur
- Validation des entrées côté client (Zod) et côté serveur (nestjs-zod)
- Documentation OpenAPI interactive sur `/docs`
- Rate limiting, Helmet, CORS configurable, logs Pino, healthcheck `/health`

## Prérequis

- **Node.js** >= 22.12
- **Bun** 1.2.14 (recommandé, utilisé par les deux projets)
- **PostgreSQL** 17 (local ou via Docker)

## Démarrage rapide

### 1. Backend

```bash
cd back-end
cp .env.example .env
```

Renseigne `DATABASE_URL` et génère un secret :

```bash
openssl rand -base64 32   # à mettre dans BETTER_AUTH_SECRET
```

Puis :

```bash
bun install
bun run db:generate
bun run db:deploy        # applique les migrations existantes
bun run dev               # API sur http://localhost:3000, docs sur /docs
```

Variables principales (voir `back-end/.env.example`) :

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL |
| `BETTER_AUTH_SECRET` | Secret Better Auth (32+ caractères) |
| `BETTER_AUTH_URL` | URL publique du backend |
| `TRUSTED_ORIGINS` | Origines autorisées pour CORS / Better Auth |

### 2. Frontend

Dans un second terminal :

```bash
cd front-end
cp .env.example .env
bun install
bun run dev               # http://localhost:5173
```

En développement, Vite relaie `/api`, `/tasks`, `/users` et `/examples` vers
`http://localhost:3000` : aucune configuration CORS n'est nécessaire.

## Démarrage avec Docker

```bash
cd front-end
cp .env.example .env
# définir BETTER_AUTH_SECRET dans .env (même valeur que le backend)
docker compose up --build
```

- Frontend (dev, hot reload) : http://localhost:5173
- Backend : http://localhost:3000
- PostgreSQL : `localhost:5434`

Profil de prévisualisation du build de production :

```bash
docker compose --profile production up --build frontend-prod
```

## API (résumé)

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/sign-up/email` | Inscription |
| `POST` | `/api/auth/sign-in/email` | Connexion |
| `POST` | `/api/auth/sign-out` | Déconnexion |
| `GET` | `/api/auth/get-session` | Session courante |
| `GET` | `/tasks` | Lister les tâches de l'utilisateur |
| `POST` | `/tasks` | Créer une tâche |
| `GET` | `/tasks/:id` | Détail d'une tâche |
| `PATCH` | `/tasks/:id` | Modifier une tâche |
| `PATCH` | `/tasks/:id/completed` | Marquer comme terminée |
| `DELETE` | `/tasks/:id` | Supprimer une tâche |
| `GET` | `/users` | Lister les utilisateurs |
| `POST` | `/users` | Créer un utilisateur |
| `GET` | `/health` | Healthcheck |

Les routes `/tasks` et `/users` attendent un header
`Authorization: Bearer <token>`. Le token est renvoyé par la connexion.

## Scripts utiles

### Backend

```bash
bun run dev          # démarrage en watch
bun run build        # build de production
bun run start        # exécuter le build
bun run test         # tests Vitest
bun run check        # lint + format (Biome)
bun run db:migrate   # créer/appliquer une migration en dev
bun run db:deploy    # appliquer les migrations en production
bun run db:studio    # Prisma Studio
```

### Frontend

```bash
bun run dev          # serveur Vite
bun run build        # type-check + build
bun run lint         # ESLint
bun run preview      # prévisualiser le build
```

## Tests et vérifications

```bash
# Backend
cd back-end && bun run check && bun run test && bun run build

# Frontend
cd front-end && bun run lint && bun run build
```

## Sécurité

- Les fichiers `.env` ne sont pas versionnés (seuls les `.env.example` le sont).
- Les migrations Prisma sont versionnées ; le client Prisma généré ne l'est pas.
- Les sessions sont stockées côté navigateur dans `localStorage` : en production,
  privilégier un cookie `HttpOnly` ou limiter les risques XSS.
- **Important** : l'ancien `BETTER_AUTH_SECRET` de démonstration a pu être présent
  dans l'historique Git. Génère un nouveau secret avant toute mise en production.

## Licence

Projet pédagogique — voir les dépôts d'origine pour les conditions d'utilisation.
