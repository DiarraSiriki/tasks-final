# TaskFlow — Frontend

Application React de gestion de tâches connectée à l'API NestJS du dossier
`../back-end`.

- **Stack** : React 19, TypeScript, Vite 8, Tailwind CSS 4, DaisyUI 5, Axios,
  React Router 7, React Hook Form + Zod, React Hot Toast.
- **Authentification** : Better Auth (token Bearer stocké côté client).
- **Pages** : connexion, inscription, liste des tâches (création, filtres,
  changement de statut, suppression).

## Démarrage

```bash
# 1. Backend (dossier ../back-end)
cd ../back-end
bun install
docker compose up -d db   # PostgreSQL local sur le port 5434
bun run db:push
bun run dev               # API sur http://localhost:3000

# 2. Frontend (ce dossier)
bun install
cp .env.example .env
bun run dev
```

L'application est disponible sur <http://localhost:5173>. Les appels `/api`,
`/tasks` et `/examples` sont relayés vers `http://localhost:3000` par le proxy
Vite : aucune configuration CORS n'est nécessaire en développement.

## Scripts

| Commande             | Description                                  |
| -------------------- | -------------------------------------------- |
| `bun run dev`        | Serveur de développement (HMR)               |
| `bun run build`      | Vérification TypeScript + build de production |
| `bun run preview`    | Prévisualisation du build sur le port 5173   |
| `bun run lint`       | ESLint                                       |
| `bun run type-check` | Vérification TypeScript seule                |

## Docker

```bash
docker compose up --build frontend-dev   # dev + hot-reload
docker compose --profile production up --build frontend-prod
```

Le `docker-compose.yml` inclut PostgreSQL et le backend (`../back-end`).

## Documentation

Le guide détaillé (configuration, API, authentification, dépannage) se trouve
dans [`FRONTEND_GUIDE.md`](./FRONTEND_GUIDE.md).

> Le backend ne configure pas explicitement `app.enableCors(...)` : en
> développement, passer par le proxy Vite et ajouter `http://localhost:5173`
> à `TRUSTED_ORIGINS` côté backend.
