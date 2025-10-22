-- =====================================================================
-- Schéma "biblio" : Bibliothèque connectée
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS biblio;
SET search_path TO biblio, public;

-- =====================================================================
-- UTILISATEURS
-- =====================================================================
CREATE TABLE IF NOT EXISTS utilisateur (
  id_utilisateur     BIGSERIAL PRIMARY KEY,
  nom                VARCHAR(100) NOT NULL,
  prenom             VARCHAR(100) NOT NULL,
  email              VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe       TEXT NOT NULL,
  date_naissance     DATE,
  date_creation      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_format CHECK (position('@' IN email) > 1)
);

-- =====================================================================
-- GENRES
-- =====================================================================
CREATE TABLE IF NOT EXISTS genre (
  id_genre   BIGSERIAL PRIMARY KEY,
  nom        VARCHAR(100) NOT NULL UNIQUE
);

-- =====================================================================
-- AUTEURS
-- =====================================================================
CREATE TABLE IF NOT EXISTS auteur (
  id_auteur   BIGSERIAL PRIMARY KEY,
  nom         VARCHAR(100) NOT NULL,
  prenom      VARCHAR(100),
  biographie  TEXT,
  age         INT,
  CONSTRAINT chk_auteur_age CHECK (age IS NULL OR (age >= 0 AND age <= 130))
);

-- =====================================================================
-- LIVRES
-- =====================================================================
CREATE TABLE IF NOT EXISTS livre (
  id_livre    BIGSERIAL PRIMARY KEY,
  titre       VARCHAR(255) NOT NULL,
  isbn        VARCHAR(20) UNIQUE,
  edition     VARCHAR(100),
  tome        INT,
  resume      TEXT,
  date_creation  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_tome_nonneg CHECK (tome IS NULL OR tome >= 0)
);

-- =====================================================================
-- RELATION N..N : LIVRE <-> AUTEUR
-- =====================================================================
CREATE TABLE IF NOT EXISTS livre_auteur (
  id_livre   BIGINT NOT NULL REFERENCES livre(id_livre) ON DELETE CASCADE ON UPDATE CASCADE,
  id_auteur  BIGINT NOT NULL REFERENCES auteur(id_auteur) ON DELETE CASCADE ON UPDATE CASCADE,
  role       VARCHAR(50), -- ex: Auteur, Co-auteur
  ordre      INT,         -- pour trier l’affichage des auteurs
  PRIMARY KEY (id_livre, id_auteur)
);

-- =====================================================================
-- RELATION N..N : LIVRE <-> GENRE
-- =====================================================================
CREATE TABLE IF NOT EXISTS livre_genre (
  id_livre   BIGINT NOT NULL REFERENCES livre(id_livre) ON DELETE CASCADE ON UPDATE CASCADE,
  id_genre   BIGINT NOT NULL REFERENCES genre(id_genre) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (id_livre, id_genre)
);

-- =====================================================================
-- BIBLIOTHÈQUE PERSONNELLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS bibliotheque (
  id_utilisateur  BIGINT NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE ON UPDATE CASCADE,
  id_livre        BIGINT NOT NULL REFERENCES livre(id_livre) ON DELETE CASCADE ON UPDATE CASCADE,
  date_ajout      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_utilisateur, id_livre)
);

-- =====================================================================
-- LISTE DE SOUHAITS
-- =====================================================================
CREATE TABLE IF NOT EXISTS liste_souhait (
  id_utilisateur  BIGINT NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE ON UPDATE CASCADE,
  id_livre        BIGINT NOT NULL REFERENCES livre(id_livre) ON DELETE CASCADE ON UPDATE CASCADE,
  date_ajout      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_utilisateur, id_livre)
);

-- =====================================================================
-- AVIS & NOTES
-- =====================================================================
CREATE TABLE IF NOT EXISTS avis (
  id_avis        BIGSERIAL PRIMARY KEY,
  id_utilisateur BIGINT NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE ON UPDATE CASCADE,
  id_livre       BIGINT NOT NULL REFERENCES livre(id_livre) ON DELETE CASCADE ON UPDATE CASCADE,
  note           SMALLINT NOT NULL CHECK (note BETWEEN 0 AND 5),
  commentaire    TEXT,
  date_avis      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_avis_user_livre UNIQUE (id_utilisateur, id_livre)
);

-- =====================================================================
-- AMITIÉS (relations entre utilisateurs)
-- =====================================================================
CREATE TABLE IF NOT EXISTS amitie (
  id_utilisateur1 BIGINT NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE ON UPDATE CASCADE,
  id_utilisateur2 BIGINT NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE ON UPDATE CASCADE,
  statut          VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  date_demande    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_mise_a_jour TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_utilisateur1, id_utilisateur2),
  CONSTRAINT chk_amitie_pair CHECK (id_utilisateur1 <> id_utilisateur2),
  CONSTRAINT chk_amitie_statut CHECK (statut IN ('en_attente','accepte','refuse'))
);
