-- =====================================================================
-- Schema "biblio" for the BiblioConnecte backend (English conventions)
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS biblio;
SET search_path TO biblio, public;

-- =====================================================================
-- USERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
  id             BIGSERIAL PRIMARY KEY,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  date_of_birth  DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_format CHECK (position('@' IN email) > 1)
);

-- =====================================================================
-- GENRES
-- =====================================================================
CREATE TABLE IF NOT EXISTS genres (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- AUTHORS
-- =====================================================================
CREATE TABLE IF NOT EXISTS authors (
  id         BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name  VARCHAR(100) NOT NULL,
  biography  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- BOOKS
-- =====================================================================
CREATE TABLE IF NOT EXISTS books (
  id         BIGSERIAL PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  isbn       VARCHAR(20) UNIQUE,
  edition    VARCHAR(150),
  volume     VARCHAR(50),
  summary    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- BOOK <-> AUTHOR (many-to-many)
-- =====================================================================
CREATE TABLE IF NOT EXISTS book_authors (
  book_id   BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE,
  author_id BIGINT NOT NULL REFERENCES authors(id) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (book_id, author_id)
);

-- =====================================================================
-- BOOK <-> GENRE (many-to-many)
-- =====================================================================
CREATE TABLE IF NOT EXISTS book_genres (
  book_id  BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE,
  genre_id BIGINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (book_id, genre_id)
);

-- =====================================================================
-- PERSONAL LIBRARY
-- =====================================================================
CREATE TABLE IF NOT EXISTS library_items (
  user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  book_id  BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);

-- =====================================================================
-- WISHLIST
-- =====================================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  book_id  BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);

-- =====================================================================
-- REVIEWS
-- =====================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  book_id    BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 0 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_user_book_unique UNIQUE (user_id, book_id)
);

-- =====================================================================
-- FRIENDSHIPS
-- =====================================================================
CREATE TABLE IF NOT EXISTS friendships (
  requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  addressee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  accepted_at  TIMESTAMPTZ,
  PRIMARY KEY (requester_id, addressee_id),
  CONSTRAINT friendships_pair_unique CHECK (requester_id <> addressee_id)
);

-- =====================================================================
-- BOOK PROPOSALS (community submissions waiting for admin review)
-- =====================================================================
CREATE TABLE IF NOT EXISTS book_proposals (
  id               BIGSERIAL PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  isbn             VARCHAR(20),
  edition          VARCHAR(150),
  volume           VARCHAR(50),
  summary          TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by       BIGINT REFERENCES users(id) ON DELETE SET NULL,
  decided_at       TIMESTAMPTZ,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_book_proposals_status ON book_proposals (status);
CREATE INDEX IF NOT EXISTS idx_book_proposals_submitted_by ON book_proposals (submitted_by);

INSERT INTO genres (name) VALUES
('Roman contemporain'),
('Roman historique'),
('Roman policier'),
('Thriller'),
('Science-fiction'),
('Fantasy'),
('Fantastique'),
('Horreur'),
('Aventure'),
('Romance'),
('Drame'),
('Poésie'),
('Nouvelles'),
('Humoristique'),
('Satire'),
('Dystopie'),
('Uchronie'),
('Fiction psychologique'),
('Littérature classique'),
('Jeunesse / Young Adult'),

('Bande dessinée franco-belge'),
('Comic américain'),
('Roman graphique'),
('Super-héros'),
('BD humoristique'),
('BD d’aventure'),
('BD historique'),
('BD de science-fiction'),
('BD fantastique'),
('BD jeunesse'),
('BD politique / sociale'),

('Shōnen'),
('Shōjo'),
('Seinen'),
('Josei'),
('Kodomo'),
('Isekai'),
('Slice of Life'),
('Sport'),
('Comédie romantique'),
('Horreur / Surnaturel'),
('Historique'),
('Mecha'),
('Arts martiaux'),
('Mystère / Policier'),

('Essai littéraire'),
('Biographie'),
('Autobiographie'),
('Mémoires'),
('Philosophie'),
('Politique'),
('Société'),
('Histoire'),
('Géographie'),
('Économie'),
('Sciences humaines'),
('Psychologie'),
('Éducation / Pédagogie'),
('Développement personnel'),
('Religion / Spiritualité'),
('Écologie / Environnement'),

('Sciences'),
('Mathématiques'),
('Physique'),
('Chimie'),
('Biologie'),
('Astronomie'),
('Informatique'),
('Cybersécurité'),
('Intelligence artificielle'),
('Réseaux / Télécoms'),
('Médecine'),
('Ingénierie'),
('Technologie'),
('Architecture'),

('Art / Histoire de l’art'),
('Musique'),
('Cinéma'),
('Photographie'),
('Théâtre'),
('Mode'),
('Design'),
('Cuisine / Gastronomie'),
('Voyages / Tourisme'),
('Sport'),
('Jeux vidéo'),
('DIY / Loisirs créatifs'),

('Album jeunesse'),
('Conte'),
('Livre illustré'),
('Livre éducatif'),
('Livre d’éveil'),
('Roman ado / YA'),
('Documentaire jeunesse'),

('Développement personnel'),
('Santé / Bien-être'),
('Cuisine'),
('Jardinage'),
('Maison / Décoration'),
('Vie professionnelle'),
('Entrepreneuriat'),
('Gestion / Management'),
('Finance personnelle'),
('Société / Actualité'),
('Droit / Justice'),

('Anthologie'),
('Encyclopédie'),
('Guide pratique'),
('Carnet de voyage'),
('Livre interactif'),
('Livre audio'),
('Artbook'),
('Catalogue d’exposition')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- SEED : AUTHORS
-- =====================================================================

INSERT INTO authors (first_name, last_name, biography)
VALUES
('Albert', 'Camus', 'Écrivain et philosophe français, auteur de "L’Étranger" et "La Peste". Lauréat du prix Nobel de littérature en 1957.'),
('George', 'Orwell', 'Écrivain britannique connu pour "1984" et "La Ferme des animaux", œuvres dystopiques majeures du XXe siècle.'),
('Jane', 'Austen', 'Romancière anglaise du XIXe siècle, célèbre pour "Orgueil et Préjugés".'),
('Jules', 'Verne', 'Précurseur de la science-fiction, auteur de "Vingt mille lieues sous les mers".'),
('Victor', 'Hugo', 'Poète, romancier et dramaturge français, auteur de "Les Misérables" et "Notre-Dame de Paris".'),
('Fyodor', 'Dostoevsky', 'Romancier russe, auteur de "Crime et Châtiment" et "Les Frères Karamazov".'),
('Leo', 'Tolstoy', 'Écrivain russe, auteur de "Guerre et Paix" et "Anna Karénine".'),
('Mary', 'Shelley', 'Auteure britannique, pionnière de la science-fiction avec "Frankenstein".'),
('Arthur', 'Conan Doyle', 'Créateur du célèbre détective Sherlock Holmes.'),
('Charles', 'Dickens', 'Écrivain anglais du XIXe siècle, auteur de "Oliver Twist" et "David Copperfield".'),
('Agatha', 'Christie', 'Reine du roman policier, créatrice d’Hercule Poirot et Miss Marple.'),
('Ernest', 'Hemingway', 'Écrivain américain, prix Nobel, auteur du "Vieil homme et la mer".'),
('Mark', 'Twain', 'Auteur américain de "Tom Sawyer" et "Huckleberry Finn".'),
('Oscar', 'Wilde', 'Écrivain irlandais, célèbre pour "Le Portrait de Dorian Gray".'),
('Franz', 'Kafka', 'Auteur tchèque d’expression allemande, connu pour "La Métamorphose".'),
('George', 'R. R. Martin', 'Auteur américain de fantasy, créateur de la saga "Game of Thrones".'),
('J. K.', 'Rowling', 'Auteure britannique de la série "Harry Potter".'),
('J. R. R.', 'Tolkien', 'Auteur britannique de "Le Seigneur des Anneaux" et "Le Hobbit".'),
('Stephen', 'King', 'Maître du roman d’horreur moderne, auteur de "Ça" et "Shining".'),
('Isaac', 'Asimov', 'Auteur de science-fiction, créateur du cycle des Robots et de Fondation.'),
('Ray', 'Bradbury', 'Écrivain américain, auteur de "Fahrenheit 451".'),
('Philip', 'K. Dick', 'Auteur de science-fiction dystopique, connu pour "Ubik" et "Blade Runner".'),
('H. G.', 'Wells', 'Précurseur du roman de science-fiction, auteur de "La Guerre des mondes".'),
('Suzanne', 'Collins', 'Auteure américaine, créatrice de la trilogie "Hunger Games".'),
('Haruki', 'Murakami', 'Auteur japonais contemporain, célèbre pour "Kafka sur le rivage".'),
('Yukio', 'Mishima', 'Romancier japonais, auteur de "Le Pavillon d’or".'),
('Margaret', 'Atwood', 'Auteure canadienne, connue pour "La Servante écarlate".'),
('Neil', 'Gaiman', 'Auteur britannique de fantasy et BD, créateur de "American Gods".'),
('Terry', 'Pratchett', 'Auteur de fantasy humoristique, connu pour la série "Discworld".'),
('Patrick', 'Rothfuss', 'Auteur américain de fantasy, connu pour "Le Nom du vent".'),
('Brandon', 'Sanderson', 'Auteur de fantasy épique, créateur de "Mistborn" et "Stormlight Archive".'),
('Colleen', 'Hoover', 'Romancière américaine de romance contemporaine.'),
('John', 'Green', 'Auteur américain de romans pour jeunes adultes, dont "Nos étoiles contraires".'),
('Gillian', 'Flynn', 'Auteure de thrillers, connue pour "Gone Girl".'),
('Paulo', 'Coelho', 'Écrivain brésilien, auteur de "L’Alchimiste".'),
('Khaled', 'Hosseini', 'Auteur afghan-américain, connu pour "Les Cerfs-volants de Kaboul".'),
('Muriel', 'Barbery', 'Auteure française de "L’Élégance du hérisson".'),
('Leïla', 'Slimani', 'Romancière franco-marocaine, lauréate du prix Goncourt pour "Chanson douce".'),
('Amélie', 'Nothomb', 'Auteure belge contemporaine, connue pour "Stupeur et tremblements".'),
('Pierre', 'Lemaitre', 'Auteur français de romans policiers et historiques, prix Goncourt.'),
('Michel', 'Houellebecq', 'Écrivain français, auteur de "Soumission" et "Les Particules élémentaires".'),
('Delphine', 'de Vigan', 'Auteure française de "Rien ne s’oppose à la nuit".'),
('Stephenie', 'Meyer', 'Auteure américaine de la saga "Twilight".'),
('Rick', 'Riordan', 'Auteur américain, créateur de "Percy Jackson".'),
('Eoin', 'Colfer', 'Auteur irlandais de fantasy jeunesse, "Artemis Fowl".'),
('Anne', 'Rice', 'Auteure américaine de romans gothiques et fantastiques.'),
('Dan', 'Brown', 'Auteur de thrillers ésotériques, connu pour "Da Vinci Code".'),
('Erin', 'Morgenstern', 'Auteure américaine du roman "Le Cirque des rêves".'),
('Donna', 'Tartt', 'Romancière américaine, prix Pulitzer pour "Le Chardonneret".'),
('Elena', 'Ferrante', 'Auteure italienne anonyme, connue pour "L’amie prodigieuse".');
