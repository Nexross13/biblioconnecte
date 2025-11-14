# BiblioConnect

Plateforme sociale dédiée aux lectrices et lecteurs : suivez les ouvrages que vous possédez, échangez avec vos ami·e·s, proposez des auteurs/livres à la communauté et consultez des statistiques collaboratives. Le monorepo regroupe une API Node.js/Express, un frontend React/Vite et quelques outils pour automatiser vos appels API.

---

## Sommaire

1. [Vision & fonctionnalités](#vision--fonctionnalités)
2. [Architecture](#architecture)
3. [Démarrage rapide](#démarrage-rapide)
4. [Configuration](#configuration)
5. [Scripts npm](#scripts-npm)
6. [Documentation API & données](#documentation-api--données)
7. [Tests & qualité](#tests--qualité)
8. [Contribution](#contribution)

---

## Vision & fonctionnalités

- **Bibliothèque personnelle** : suivez vos livres, séries et genres, importez des couvertures et signalez les ouvrages manquants.
- **Wishlist & prêts** : notez les livres à emprunter/acheter, gérez les prêts entre ami·e·s et recevez des rappels.
- **Dimension sociale** : retrouvez vos contacts, parcourez leur bibliothèque publique, laissez un avis et signalez du contenu inapproprié.
- **Contributions communautaires** : proposez de nouveaux auteurs ou titres, soumettez des rapports qualité et gardez la base propre.
- **Observabilité & sécurité** : route `/api/v1/health`, CORS restreint, JWT, Google OAuth, SMTP pour les resets de mot de passe et mode mock pour développer sans base PostgreSQL.

---

## Architecture

```
.
├── backend/    # API REST Node.js/Express (mocks + Postgres)
├── frontend/   # SPA React 19 + Vite 7 + Tailwind
├── utils/      # Scripts ponctuels (génération, import, etc.)
└── other/      # Notes et documents de travail
```

### Backend

- Node.js 18+, Express 5, middlewares `helmet`, `cors`, `cookie-parser`, `morgan`.
- Authentification JWT + Google Identity Services, validation avec `express-validator`.
- Stockage PostgreSQL (`pg`) ou mode mock (`USE_MOCKS=true`) alimenté par `backend/data/`.
- Routes regroupées par domaine (`routes/books.js`, `routes/library.js`, etc.) et contrôleurs associés.
- OpenAPI 3.0 dans `backend/docs/openapi.yaml`, servi automatiquement via Swagger UI sur `/api-docs`.
- Assets statiques (`backend/assets/`) servis sur `/assets/*` pour les couvertures, avatars et composants UI.

### Frontend

- React 19, React Router 7, TanStack Query 5, Axios et TailwindCSS.
- Architecture modulaire (`src/api`, `src/context`, `src/pages`, `src/components`).
- Hooks partagés pour l’authentification, la gestion des requêtes API et les interactions temps réel (toast, loaders, etc.).
- Build Vite (ESM) + ESLint + Prettier pour garder un style cohérent (2 espaces, single quotes, trailing commas).

---

## Démarrage rapide

### Prérequis

- Node.js 18 ou supérieur et npm 9+
- PostgreSQL (local, Docker ou service managé) si `USE_MOCKS=false`
- Compte Google Cloud (OAuth) et accès SMTP (reset de mot de passe)

### Installation

```bash
git clone https://github.com/votre-compte/biblioconnecte.git
cd biblioconnecte

# Backend
cd backend
cp .env.example .env.local   # personnaliser les variables
npm install

# Frontend
cd ../frontend
cp .env.example .env.local   # configurez VITE_API_URL & VITE_GOOGLE_CLIENT_ID
npm install
```

### Lancer le projet

```bash
# Terminal 1
cd backend
npm run dev        # API sur http://localhost:3000

# Terminal 2
cd frontend
npm run dev        # Vite sur http://localhost:5173
```

> Besoin de tester sans base ? Passez `USE_MOCKS=true` dans `.env.local` (certaines routes sont alors alimentées par `backend/data/mockData.js`).

---

## Configuration

### Backend (`backend/.env.local`)

| Variable | Description | Exemple |
| --- | --- | --- |
| `PORT` | Port HTTP de l’API | `3000` |
| `NODE_ENV` | `development`, `production` ou `test` | `development` |
| `USE_MOCKS` | `true` pour éviter PostgreSQL et servir les mocks | `false` |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL complète (prioritaire) | `postgres://user:pass@host:5432/biblioconnecte` |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGSSLMODE` | Paramètres utilisés si `DATABASE_URL` est vide | `localhost`, `5432`, … |
| `JWT_SECRET` | Secret signé pour les tokens | `change-me` |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google (Web) | `123.apps.googleusercontent.com` |
| `FRONTEND_URL` | Origine utilisée pour CORS et les liens d’e-mails | `http://localhost:5173` |
| `SESSION_COOKIE_SECURE` | Force le flag `Secure` sur les cookies (`true/false/1/0`) | `false` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` | Paramètres SMTP pour Nodemailer (alternativement `SMTP_URL`) | `smtp.mailtrap.io`, `587`, … |
| `SMTP_URL` | URL complète SMTP (optionnelle, prioritaire sur les champs ci-dessus) | `smtp://user:pass@host:587` |
| `EMAIL_FROM` | Expéditeur des e-mails transactionnels | `no-reply@biblioconnecte.test` |
| `PASSWORD_RESET_CODE_TTL_MINUTES` | Durée de validité des OTP | `15` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Exemple |
| --- | --- | --- |
| `VITE_API_URL` | URL de base de l’API | `http://localhost:3000/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID Google identical au backend | `123.apps.googleusercontent.com` |

---

## Scripts npm

### Backend

| Script | Description |
| --- | --- |
| `npm run dev` | Lance Express avec `nodemon` (hot reload) |
| `npm start` | Lance Express en mode production (`node index.js`) |
| `npm test` | Exécute la suite Node Test Runner (`NODE_ENV=test node --test`) |

### Frontend

| Script | Description |
| --- | --- |
| `npm run dev` | Serveur Vite avec HMR |
| `npm run build` | Build de production dans `frontend/dist` |
| `npm run preview` | Prévisualise le build localement |
| `npm run lint` | Vérifie le code avec ESLint + Prettier |

---

## Documentation API & données

- **OpenAPI / Swagger** : fichier source dans `backend/docs/openapi.yaml`, accessible via `http://localhost:3000/api-docs`.
- **Collections Bruno** : le dossier `bruno/` contient des requêtes prêtes à l’emploi pour explorer les routes (`*.bru`).
- **Assets & mocks** : fichiers d’exemple dans `backend/assets/` et données simulées dans `backend/data/`.
- **Fichiers utilitaires** : scripts ponctuels, requêtes SQL ou analyses sont rangés dans `utils/` et `other/` quand nécessaire.

---

## Tests & qualité

- Les tests backend résident dans `backend/__tests__/` et s’exécutent via `npm test` (Node Test Runner). Adaptez-les pour couvrir les contrôleurs/services avant chaque PR.
- Côté frontend, respectez le linting (`npm run lint`) et ajoutez des tests UI (Jest/Testing Library) dans `src/__tests__` si besoin.
- Avant de pousser, assurez-vous que `npm test`, `npm run lint` (front) et `npm run build` (front) passent afin de garantir l’intégrité CI/CD.
- Respectez les conventions de style définies par ESLint + Prettier (2 espaces, single quotes, trailing commas) sur tout nouveau code.

---

## Contribution

1. Créez une branche à partir de `main` (`feature/nom-fonctionnalite`).
2. Implémentez la fonctionnalité en respectant l’organisation du code (`src/common/` pour les utilitaires partagés, dossiers par domaine).
3. Ajoutez les tests nécessaires et mettez à jour la documentation (README, collections Bruno, OpenAPI).
4. Vérifiez localement : `npm test` (backend), `npm run lint` (frontend), `npm run build` (frontend).
5. Commitez en utilisant le format `scope: message` en français ou anglais (ex. `auth: ajouter reset otp`), puis ouvrez une PR décrivant l’intention, les décisions notables et les vérifications réalisées. Soyez précis !
