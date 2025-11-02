# BiblioConnecte

Plateforme sociale pour lectrices et lecteurs : gérez votre bibliothèque personnelle, suivez vos amis, partagez vos coups de cœur et proposez de nouveaux titres. L’application comprend une API Node.js/Express et un frontend React/Vite.

---

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Architecture & Stack](#architecture--stack)
3. [Mise en route rapide](#mise-en-route-rapide)
4. [Configuration des environnements](#configuration-des-environnements)
5. [Scripts de développement](#scripts-de-développement)
6. [Tests & Qualité](#tests--qualité)
7. [Déploiement](#déploiement)
8. [Contribution](#contribution)
9. [Licence](#licence)

---

## Fonctionnalités

- **Authentification sécurisée** : inscription / connexion par email + mot de passe, prise en charge du SSO Google OAuth 2.0.
- **Gestion de bibliothèque personnelle** : ajout de livres, wishlist, suivi des prêts.
- **Dimension sociale** : demandes d’amis, partage de bibliothèques, fil d’activité, avis/commentaires (arrivent bientôt).
- **Catalogue collaboratif** : proposition de nouveaux ouvrages, validation par les administrateurs, statistiques publiques.
- **Notifications email** : demandes d’amis, décisions sur les propositions, réinitialisation de mot de passe via code OTP.
- **Documentation intégrée** : Swagger UI sur `/api-docs`, specification OpenAPI (`backend/docs/openapi.yaml`).

---

## Architecture & Stack

```
backend/   # API REST Node.js/Express
frontend/  # SPA React 19 (Vite)
```

### Backend
- Node.js 18+, Express 5, JWT.
- PostgreSQL, requêtes via `pg`.
- Tests avec le test runner Node (`node --test`) et mocks intégrés pour le mode démo.
- Nodemailer pour l’envoi d’e-mails (SMTP configurable).

### Frontend
- React 19, Vite 5, TailwindCSS.
- React Router 7, TanStack Query 5.
- AuthContext maison, Google Identity Services via `@react-oauth/google`.
- ESLint + Prettier.

---

## Mise en route rapide

### Prérequis
- Node.js 18+
- npm 9+ (ou pnpm/yarn équivalent)
- PostgreSQL (local ou distant)
- Un compte Google Cloud (pour OAuth) et un service SMTP

### Cloner & installer

```bash
git clone https://github.com/votre-compte/biblioconnecte.git
cd biblioconnecte

# Backend
cd backend
npm install
cp .env.example .env.local   # renseigner les variables, voir section suivante

# Frontend
cd ../frontend
npm install
cp .env.example .env.local   # renseigner VITE_API_URL & VITE_GOOGLE_CLIENT_ID
```

---

## Configuration des environnements

### Backend (`backend/.env.local`)

| Variable | Description | Exemple |
| --- | --- | --- |
| `PORT` | Port HTTP de l’API | `3000` |
| `NODE_ENV` | Environnement (`development` | `production`) | `development` |
| `DATABASE_URL` | URL de connexion PostgreSQL complète | `postgres://user:pass@host:5432/biblioconnecte` |
| `JWT_SECRET` | Secret pour signer les JWT | `super-secret` |
| `FRONTEND_URL` | Origine autorisée pour CORS + cookies | `http://localhost:5173` |
| `ADMIN_EMAILS` | Liste d’emails admin (séparés par virgules) | `alice@biblio.test,bob@biblio.test` |
| `USE_MOCKS` | `true` pour bypasser PostgreSQL (démo) | `false` |
| `SMTP_*` / `SMTP_URL` / `EMAIL_FROM` | Paramètres SMTP | voir `.env.example` |
| `PASSWORD_RESET_CODE_TTL_MINUTES` | Durée de validité du code OTP | `15` |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google (Web) | `123.apps.googleusercontent.com` |


### Frontend (`frontend/.env.local`)

| Variable | Description | Exemple |
| --- | --- | --- |
| `VITE_API_URL` | URL de base de l’API | `http://localhost:3000/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID Google (même que backend) | `123.apps.googleusercontent.com` |

---

## Scripts de développement

### Backend

| Commande | Description |
| --- | --- |
| `npm run dev` | Démarre l’API avec `nodemon` (hot reload) |
| `npm start` | Lance l’API en mode production |
| `npm test` | Exécute la suite de tests |

### Frontend

| Commande | Description |
| --- | --- |
| `npm run dev` | Lancement Vite avec HMR |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualisation du build localement |
| `npm run lint` | Vérification ESLint |

---

## Tests & Qualité

- **Backend** : `npm test` (mode mocks activé) → couvre contrôleurs et flux OTP / Google.
- **Frontend** : lint (`npm run lint`). Ajoute Jest/Testing Library au besoin.
- **CI suggérée** :
  1. `npm ci` (backend & frontend)
  2. `npm test` (backend), `npm run lint` (frontend)
  3. `npm run build` (frontend)

---

## Déploiement

### Backend
1. Provisionner une base PostgreSQL et exécuter les migrations.
2. Déployer le code (docker, PM2, systemd…) puis `npm ci --production`.
3. Fournir un fichier `.env` complet (cf. plus haut) et vérifier :
   - accès base, SMTP, JWT, Google OAuth.
   - `GOOGLE_CLIENT_ID` identique sur front/back.
4. Servir l’API derrière un reverse proxy HTTPS (Nginx/Traefik).  
   L’endpoint de santé `/api/v1/health` peut être utilisé pour les probes.

### Frontend
1. `npm ci && npm run build`.
2. Déployer le dossier `frontend/dist/` sur un serveur statique (Nginx, Netlify, Vercel…).
3. Configurer les rewrites SPA : `/* -> /index.html`.
4. Définir `VITE_API_URL` et `VITE_GOOGLE_CLIENT_ID` dans l’environnement de build.
5. Vérifier les pages essentielles : login/email, login Google, mot de passe oublié, consultation catalogue.

### Checklist post-déploiement
- [ ] Admin seedé et accès confirmé.
- [ ] Reset mot de passe → email reçu.
- [ ] Connexion Google validée (compte email vérifié).
- [ ] Accès `/api-docs` opérationnel.
- [ ] Assets (couvertures, avatars) servis correctement.
- [ ] Sauvegardes PostgreSQL planifiées & rotation des secrets.

---

## Contribution

1. Créer une branche à partir de `main`.
2. Implémenter la fonctionnalité + tests + documentation.
3. Vérifier `npm test`, `npm run lint`, `npm run build`.
4. Ouvrir une PR avec :
   - résumé des changements
   - décisions importantes
   - captures ou exemples pour nouvelles API

Commits recommandés : `scope: message` (ex. `auth: ajouter google oauth`).  
Les PR doivent obtenir une relecture et un pipeline vert avant fusion.

---

## Licence

Projet sous licence ISC (voir `backend/package.json`).  
© BiblioConnecte — communauté de lecteurs passionnés.
