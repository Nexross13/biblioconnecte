# Biblioconnecte
Plateforme de gestion pour bibliothèque connectée : catalogues, comptes lecteurs, partage entre amis et automatisation des prêts via une API Node.js et une interface React moderne.

## Sommaire
- [Backend](#backend)
  - [Présentation](#présentation)
  - [Fonctionnalités-clés](#fonctionnalités-clés)
  - [Architecture](#architecture)
  - [Prérequis](#prérequis)
  - [Installation](#installation)
  - [Configuration de l’environnement](#configuration-de-lenvironnement)
  - [Documentation API](#documentation-api)
  - [Scripts npm (backend)](#scripts-npm-backend)
  - [Tests](#tests)
  - [Conventions de développement](#conventions-de-développement)
  - [Contribution](#contribution)
  - [Licence](#licence)
- [Frontend](#frontend)
  - [Démarrage rapide](#démarrage-rapide)
  - [Scripts npm (frontend)](#scripts-npm-frontend)
  - [Stack technique](#stack-technique)
  - [Structure principale](#structure-principale)
  - [Authentification](#authentification)
  - [Conventions (frontend)](#conventions-frontend)
  - [Variables d’environnement](#variables-denvironnement)

## Backend

### Présentation
BiblioConnecte propose un système de bibliothèque connectée permettant à chacun d’enregistrer sa propre collection de livres et de la consulter à tout moment, où qu’il se trouve. Les bibliothèques peuvent être partagées avec des amis pour faciliter la découverte et l’échange de références. La plateforme est collaborative : chaque utilisateur peut enrichir la base de données commune avec de nouveaux ouvrages.

### Fonctionnalités-clés
- Authentification sécurisée des membres et gestion des profils.
- Création, consultation et partage de bibliothèques personnelles.
- Catalogue collaboratif alimenté par la communauté (ajout et mise à jour de livres).
- Soumission de nouveaux ouvrages pour validation avec contrôle final par un administrateur.
- Suivi des états d’un ouvrage : non possédé (par défaut), souhaité, dans ma bibliothèque, prêté (avec mémo sur l’emprunteur).
- Journalisation et sécurisation des accès via Express, JWT, Helmet et CORS.

### Architecture
- `backend/` : service Node.js/Express organisant les contrôleurs, modèles, routes et utilitaires.
  - `config/` : configuration de la base de données et variables d’environnement.
  - `controllers/`, `routes/`, `models/`, `middleware/`, `utils/` : logique métier et couches de l’API.
  - `data/` : ressources d’intégration (fixtures, seeders ou scripts SQL).
  - `assets/books/` : couvertures de livres (fichier `.jpg`, `.jpeg`, `.png` ou `.webp` nommé avec l’ISBN, ex. `9780451524935.jpg`).
  - `assets/profile/` : avatars utilisateurs (fichier `.jpg`, `.jpeg`, `.png` ou `.webp` nommé avec l’identifiant utilisateur, ex. `1.jpg`).
- `frontend/` : application React (voir section dédiée).

### Prérequis
- Node.js 18+
- npm 9+
- Accès à une base PostgreSQL (locale ou distante)

### Installation
1. Cloner le dépôt puis se placer dans le dossier du projet.
2. Installer les dépendances backend :
   ```bash
   cd backend
   npm install
   ```
3. Vérifier la configuration de la base de données (voir section suivante).

### Configuration de l’environnement
- Copier `backend/.env.example` vers `.env.local` et renseigner les variables (connexion PostgreSQL, clés JWT, etc.).  
- Ne jamais committer de secrets ; conserver les fichiers `.env.local` en local uniquement.
- Les données d’exemple ou scripts SQL doivent être placés dans `backend/resources/`.
- Renseigner `ADMIN_EMAILS` (liste séparée par des virgules) pour désigner les comptes pouvant valider les propositions de livres.
- Configurer les variables SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, etc.) ainsi que `EMAIL_FROM` pour permettre l’envoi d’e-mails transactionnels (notifications, réinitialisation de mot de passe).
- Ajuster `PASSWORD_RESET_CODE_TTL_MINUTES` si le délai de validité du code doit différer des 15 minutes par défaut.

### Documentation API
- La spécification OpenAPI est disponible dans `backend/docs/openapi.yaml`.
- Une interface Swagger UI est exposée sur `http://localhost:3000/api-docs` (après `npm run dev` ou `npm start`).
- Les couvertures importées sont servies via `http://localhost:3000/assets/books/<ISBN>.(jpg|jpeg|png|webp)`.
 - Les avatars sont servis via `http://localhost:3000/assets/profile/<userId>.(jpg|jpeg|png|webp)`.

### Scripts npm (backend)
Depuis le dossier `backend/` :
- `npm run dev` : lance le serveur avec `nodemon` pour rechargement à chaud (`index.js`).
- `npm start` : démarre le serveur en production avec Node.js.
- `npm test` : exécute la suite de tests (Node.js test runner) en mode `--test`.

### Tests
- Les tests sont regroupés dans `backend/__tests__/`, en miroir de la structure `src/`.
- Utiliser Jest (`jest --runInBand`) pour la validation des services et intégrations.
- Lancer `npm test` avant chaque demande de fusion ; les échecs doivent bloquer les livraisons.

### Conventions de développement
- Respecter l’ECMAScript moderne, indentation 2 espaces, guillemets simples.
- Centraliser les utilitaires partagés dans `backend/src/common/` pour limiter les duplications.
- Configurer ESLint (`eslint:recommended`) couplé à Prettier et exécuter `npm run lint` avant d’ouvrir une PR.
- Rédiger des commits `<scope>: <action>` en impératif (ex. `catalog: ajouter prêt`).

### Contribution
1. Créer une branche depuis `main`.
2. Implémenter la fonctionnalité en ajoutant tests et documentation associés.
3. Vérifier `npm test` (et `npm run lint` une fois disponible).
4. Ouvrir une PR avec description, captures ou exemples d’API et attendre une revue.

### Licence
Ce projet est distribué sous licence ISC (voir `backend/package.json`).

---

## Frontend

### Démarrage rapide
```bash
cd frontend
npm install
cp .env.example .env.local   # adapter VITE_API_URL si nécessaire
npm run dev
```

L’interface tourne sur `http://localhost:5173` et consomme l’API exposée par le backend (`http://localhost:3000/api/v1` par défaut).

### Scripts npm (frontend)
- `npm run dev` : démarre Vite avec rechargement à chaud.
- `npm run build` : génère le bundle optimisé pour la prod.
- `npm run preview` : sert le bundle construit pour validation locale.
- `npm run lint` : exécute ESLint avec la configuration du projet.

### Stack technique
- React 19 + Vite 5
- React Router DOM pour la navigation client
- @tanstack/react-query (et Devtools) pour le cache et la synchronisation réseau
- Tailwind CSS avec gestion du mode sombre
- Axios pour les appels API (session via cookies)
- Context API pour l’état global d’authentification
- react-hot-toast pour les notifications

### Structure principale
```
frontend/src/
├── api/           # Clients HTTP (auth, books, users, library…)
├── components/    # Navbar, Footer, BookCard, FriendList, ReviewCard, Loader, etc.
├── context/       # AuthProvider (session + token JWT)
├── hooks/         # useAuth
├── pages/         # Home, Login, Register, Library, Wishlist, BookDetails, Profile, Friends, Dashboard, NotFound
├── styles/        # Tailwind + styles globaux
└── utils/         # formatDate, getAverageRating…
```

### Authentification
- Les tokens JWT renvoyés par `/auth/login` et `/auth/register` sont servis dans un cookie HTTP-only valable 13 mois.
- À l’initialisation, le contexte tente `/auth/me` pour récupérer le profil courant (les cookies sont envoyés automatiquement via Axios `withCredentials`).
- Lorsqu’une demande d’ami est envoyée, le destinataire reçoit un e-mail de notification (SMTP configurable via les variables ci-dessous).
- Lorsqu’une proposition de livre est validée ou refusée, son auteur reçoit un e-mail résumant la décision et les détails soumis.
- Le composant `ProtectedRoute` protège les pages nécessitant une session active.
- Les utilisateurs peuvent mettre à jour leur profil (nom, email, mot de passe) et téléverser une photo depuis l’interface.
- La page de connexion propose un lien « mot de passe oublié » : un code OTP à 6 chiffres est envoyé par e-mail, à saisir avant de définir un nouveau mot de passe.

### Conventions (frontend)
- ESLint + Prettier configurés (voir `npm run lint`).
- Tailwind centralise les styles réutilisés (`btn`, `card`, `input`…).
- Les appels réseau sont isolés dans `src/api/` pour garder les pages légères.
- Le thème (clair/sombre) est mémorisé via un cookie `pref_theme` valable 13 mois.

### Variables d’environnement

| Variable       | Description                                      | Valeur par défaut                |
|----------------|--------------------------------------------------|----------------------------------|
| `VITE_API_URL` | URL de base de l’API backend consommée par React | `http://localhost:3000/api/v1`   |

Créer un fichier `.env.local` (non versionné) d’après `.env.example` pour adapter l’URL selon votre environnement.

### Variables d’environnement (backend)

| Variable         | Description                                                             | Valeur par défaut            |
|------------------|-------------------------------------------------------------------------|------------------------------|
| `FRONTEND_URL`   | Origine autorisée pour CORS + cookies de session (autorise les credentials) | `http://localhost:5173`      |
| `SMTP_HOST`      | Hôte SMTP pour l’envoi d’e-mails (alternative à `SMTP_URL`)                 | —                            |
| `SMTP_PORT`      | Port SMTP (généralement 587)                                                | `587`                        |
| `SMTP_SECURE`    | `true` pour TLS (port 465)                                                   | `false`                      |
| `SMTP_USER`      | Identifiant SMTP                                                             | —                            |
| `SMTP_PASSWORD`  | Mot de passe SMTP                                                            | —                            |
| `SMTP_URL`       | URL de connexion complète (remplace host/port/user/pass)                     | —                            |
| `EMAIL_FROM`     | Adresse expéditrice par défaut                                               | `SMTP_USER`                  |
