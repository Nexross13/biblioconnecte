# Biblioconnecte
Plateforme de gestion pour bibliothèque connectée : catalogues, comptes lecteurs et automatisation des prêts via une API Node.js.

## Sommaire
- [Présentation](#présentation)
- [Fonctionnalités-clés](#fonctionnalités-clés)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration de l’environnement](#configuration-de-lenvironnement)
- [Scripts npm](#scripts-npm)
- [Tests](#tests)
- [Conventions de développement](#conventions-de-développement)
- [Contribution](#contribution)
- [Licence](#licence)

## Présentation
BiblioConnecte propose un système de bibliothèque connectée permettant à chacun d’enregistrer sa propre collection de livres et de la consulter à tout moment, où qu’il se trouve. Les bibliothèques peuvent être partagées avec des amis pour faciliter la découverte et l’échange de références. La plateforme est collaborative : chaque utilisateur peut enrichir la base de données commune avec de nouveaux ouvrages.

## Fonctionnalités-clés
- Authentification sécurisée des membres et gestion des profils.
- Création, consultation et partage de bibliothèques personnelles.
- Catalogue collaboratif alimenté par la communauté (ajout et mise à jour de livres).
- Suivi des états d’un ouvrage : non possédé (par défaut), souhaité, dans ma bibliothèque, prêté (avec mémo sur l’emprunteur).
- Journalisation et sécurisation des accès via Express, JWT, Helmet et CORS.

## Architecture
- `backend/` : service Node.js/Express organisant les contrôleurs, modèles, routes et utilitaires.
  - `config/` : configuration de la base de données et variables d’environnement.
  - `controllers/`, `routes/`, `models/`, `middleware/`, `utils/` : logique métier et couches de l’API.
  - `data/` : ressources d’intégration (fixtures, seeders ou scripts SQL).
- `frontend/` : espace réservé à l’interface web (en cours de mise en place).

## Prérequis
- Node.js 18+
- npm 9+
- Accès à une base PostgreSQL (locale ou distante)

## Installation
1. Cloner le dépôt puis se placer dans le dossier du projet.
2. Installer les dépendances backend :
   ```bash
   cd backend
   npm install
   ```
3. Vérifier la configuration de la base de données (voir section suivante).

## Configuration de l’environnement
- Copier `backend/.env.example` vers `.env.local` et renseigner les variables (connexion PostgreSQL, clés JWT, etc.).  
- Ne jamais committer de secrets ; conserver les fichiers `.env.local` en local uniquement.
- Les données d’exemple ou scripts SQL doivent être placés dans `backend/resources/`.

## Documentation API
- La spécification OpenAPI est disponible dans `backend/docs/openapi.yaml`.
- Une interface Swagger UI est exposée sur `http://localhost:3000/api-docs` (après `npm run dev` ou `npm start`).

## Scripts npm
Depuis le dossier `backend/` :
- `npm run dev` : lance le serveur avec `nodemon` pour rechargement à chaud (`index.js`).
- `npm start` : démarre le serveur en production avec Node.js.
- `npm test` : exécute la suite de tests (Node.js test runner) en mode `--test`.

## Tests
- Les tests seront regroupés dans `backend/__tests__/`, en miroir de la structure `src/`.
- Utiliser Jest (`jest --runInBand`) pour la validation des services et intégrations.
- Lancer `npm test` avant chaque demande de fusion ; les échecs doivent bloquer les livraisons.

## Conventions de développement
- Respecter l’ECMAScript moderne, indentation 2 espaces, guillemets simples.
- Centraliser les utilitaires partagés dans `backend/src/common/` pour limiter les duplications.
- Configurer ESLint (`eslint:recommended`) couplé à Prettier et exécuter `npm run lint` avant d’ouvrir une PR.
- Rédiger des commits `<scope>: <action>` en impératif (ex. `catalog: ajouter prêt`).

## Contribution
1. Créer une branche depuis `main`.
2. Implémenter la fonctionnalité en ajoutant tests et documentation associés.
3. Vérifier `npm test` (et `npm run lint` une fois disponible).
4. Ouvrir une PR avec description, captures ou exemples d’API et attendre une revue.

## Licence
Ce projet est distribué sous licence ISC (voir `backend/package.json`).
