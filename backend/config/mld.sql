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
-- PASSWORD RESET CODES
-- =====================================================================
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user ON password_reset_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expiration ON password_reset_codes (expires_at);

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
  publication_date DATE,
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
  publication_date DATE,
  summary          TEXT,
  author_names     TEXT[] NOT NULL DEFAULT '{}',
  genre_names      TEXT[] NOT NULL DEFAULT '{}',
  cover_image_path TEXT,
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
-- =====================================================================
-- SEED : ADDITIONAL AUTHORS (Mangas, BD, Comics, Documentaires, etc.)
-- =====================================================================

INSERT INTO authors (first_name, last_name, biography)
VALUES
-- Mangakas
('Eiichiro', 'Oda', 'Mangaka japonais, créateur du célèbre manga "One Piece".'),
('Masashi', 'Kishimoto', 'Auteur japonais du manga "Naruto".'),
('Akira', 'Toriyama', 'Créateur de "Dragon Ball" et "Dr. Slump".'),
('Hajime', 'Isayama', 'Auteur de "L’Attaque des Titans" (Shingeki no Kyojin).'),
('Tite', 'Kubo', 'Mangaka connu pour la série "Bleach".'),
('Yoshihiro', 'Togashi', 'Auteur de "Hunter x Hunter" et "Yu Yu Hakusho".'),
('Naoko', 'Takeuchi', 'Créatrice du manga "Sailor Moon".'),
('Rumiko', 'Takahashi', 'Auteure de "Inuyasha" et "Ranma ½".'),
('Kentaro', 'Miura', 'Auteur de "Berserk", manga culte dark fantasy.'),
('CLAMP', '', 'Collectif féminin de mangakas japonais connu pour "Card Captor Sakura" et "XXXHolic".'),
('Kohei', 'Horikoshi', 'Auteur de "My Hero Academia".'),
('Gege', 'Akutami', 'Créateur de "Jujutsu Kaisen".'),
('Koyoharu', 'Gotouge', 'Auteure du manga à succès "Demon Slayer: Kimetsu no Yaiba".'),
('Hiromu', 'Arakawa', 'Auteure japonaise de "Fullmetal Alchemist".'),
('Makoto', 'Yukimura', 'Auteur de "Vinland Saga".'),
('Sui', 'Ishida', 'Créateur de "Tokyo Ghoul".'),
('Tsugumi', 'Ohba', 'Scénariste de "Death Note" et "Bakuman".'),
('Takeshi', 'Obata', 'Dessinateur de "Death Note" et "Platinum End".'),
('Junji', 'Ito', 'Maître japonais de l’horreur, auteur de "Uzumaki" et "Tomie".'),
('Yana', 'Toboso', 'Auteure de "Black Butler" (Kuroshitsuji).'),

-- Auteurs de bande dessinée franco-belge
('Hergé', '', 'Créateur belge de "Tintin".'),
('René', 'Goscinny', 'Scénariste français de "Astérix" et "Lucky Luke".'),
('Albert', 'Uderzo', 'Dessinateur français, co-créateur d’Astérix.'),
('Peyo', '', 'Créateur belge des "Schtroumpfs".'),
('André', 'Franquin', 'Auteur de "Gaston Lagaffe" et "Spirou et Fantasio".'),
('Morris', '', 'Créateur de "Lucky Luke".'),
('Jean', 'Van Hamme', 'Scénariste belge de "Thorgal" et "XIII".'),
('Grzegorz', 'Rosinski', 'Dessinateur polonais de "Thorgal".'),
('Enki', 'Bilal', 'Auteur et dessinateur franco-serbe de science-fiction.'),
('Moebius', '', 'Nom d’artiste de Jean Giraud, auteur de "L’Incal" et "Arzach".'),
('Philippe', 'Druillet', 'Dessinateur français de science-fiction, co-fondateur de Métal Hurlant.'),
('Gotlib', '', 'Auteur humoristique français de "Rubrique-à-Brac".'),
('Zep', '', 'Créateur suisse de "Titeuf".'),
('Lewis', 'Trondheim', 'Auteur français prolifique de bande dessinée.'),
('Joann', 'Sfar', 'Auteur de "Le Chat du Rabbin" et "Donjon".'),
('Marjane', 'Satrapi', 'Auteure franco-iranienne de "Persepolis".'),
('Riad', 'Sattouf', 'Auteur franco-syrien de "L’Arabe du futur".'),
('Christophe', 'Blain', 'Auteur de "Quai d’Orsay" et "Isaac le pirate".'),
('Florent', 'Maudoux', 'Auteur français de "Freaks’ Squeele".'),
('Benoît', 'Sokal', 'Auteur belge de "Canardo" et concepteur du jeu "Syberia".'),

-- Comics américains
('Stan', 'Lee', 'Créateur emblématique de Marvel, co-créateur de Spider-Man, Hulk, Iron Man.'),
('Jack', 'Kirby', 'Légendaire dessinateur, co-créateur des Avengers, X-Men, Fantastic Four.'),
('Bob', 'Kane', 'Créateur de Batman.'),
('Bill', 'Finger', 'Co-créateur méconnu de Batman.'),
('Jerry', 'Siegel', 'Co-créateur de Superman.'),
('Joe', 'Shuster', 'Co-créateur de Superman.'),
('Alan', 'Moore', 'Auteur de "Watchmen", "V for Vendetta".'),
('Frank', 'Miller', 'Auteur et dessinateur de "The Dark Knight Returns" et "Sin City".'),
('Neil', 'Adams', 'Dessinateur américain ayant redéfini Batman et Green Lantern.'),
('Todd', 'McFarlane', 'Créateur de "Spawn".'),
('Brian Michael', 'Bendis', 'Scénariste de "Ultimate Spider-Man" et "Jessica Jones".'),
('Grant', 'Morrison', 'Auteur écossais de "Batman: Arkham Asylum" et "The Invisibles".'),
('Jim', 'Lee', 'Dessinateur sud-coréen-américain de "X-Men" et "Batman: Hush".'),
('Gail', 'Simone', 'Scénariste américaine de "Wonder Woman" et "Batgirl".'),
('Robert', 'Kirkman', 'Créateur de "The Walking Dead" et "Invincible".'),

-- Auteurs de livres documentaires, essais, sciences et société
('Yuval Noah', 'Harari', 'Historien israélien, auteur de "Sapiens" et "Homo Deus".'),
('Stephen', 'Hawking', 'Astrophysicien britannique, auteur de "Une brève histoire du temps".'),
('Carl', 'Sagan', 'Astronome américain, vulgarisateur de "Cosmos".'),
('Richard', 'Dawkins', 'Biologiste britannique, auteur du "Gène égoïste".'),
('Pierre', 'Rabhi', 'Agriculteur et essayiste français, pionnier de l’agroécologie.'),
('Françoise', 'Héritier', 'Anthropologue française, spécialiste des rapports hommes/femmes.'),
('Simone', 'de Beauvoir', 'Philosophe et écrivaine féministe, auteure du "Deuxième sexe".'),
('Hannah', 'Arendt', 'Philosophe politique, auteure de "Les origines du totalitarisme".'),
('Noam', 'Chomsky', 'Linguiste et penseur politique américain.'),
('Dominique', 'Moïsi', 'Politologue français, auteur de "La géopolitique des émotions".'),
('Michel', 'Serres', 'Philosophe et historien des sciences français.'),
('Jared', 'Diamond', 'Auteur américain de "Effondrement" et "De l’inégalité parmi les sociétés".'),
('Naomi', 'Klein', 'Journaliste canadienne, auteure de "No Logo" et "La Stratégie du choc".'),
('Greta', 'Thunberg', 'Militante écologiste suédoise, auteure du "Climate Book".'),

-- Auteurs jeunesse, illustrateurs et conteurs
('Roald', 'Dahl', 'Auteur britannique de "Charlie et la chocolaterie".'),
('C. S.', 'Lewis', 'Auteur des "Chroniques de Narnia".'),
('Lewis', 'Carroll', 'Auteur de "Alice au pays des merveilles".'),
('Antoine', 'de Saint-Exupéry', 'Auteur français du "Petit Prince".'),
('Michael', 'Ende', 'Auteur allemand de "L’Histoire sans fin".'),
('J. M.', 'Barrie', 'Créateur de "Peter Pan".'),
('Dr.', 'Seuss', 'Auteur américain de livres pour enfants.'),
('Beatrix', 'Potter', 'Auteure et illustratrice de "Pierre Lapin".'),
('Jean', 'de La Fontaine', 'Poète et fabuliste français du XVIIe siècle.'),
('Charles', 'Perrault', 'Auteur des contes classiques comme "Cendrillon" et "Le Petit Chaperon rouge".'),
('Hans Christian', 'Andersen', 'Auteur danois de contes célèbres ("La Petite Sirène", "Le Vilain Petit Canard").'),
('Jacob', 'Grimm', 'Co-collecteur des contes populaires allemands.'),
('Wilhelm', 'Grimm', 'Co-collecteur des contes populaires allemands.'),

-- Auteurs contemporains variés
('Toshikazu', 'Kawaguchi', 'Auteur japonais de "Tant que le café est encore chaud".'),
('Elif', 'Shafak', 'Romancière turque, auteure de "10 Minutes et 38 secondes dans ce monde étrange".'),
('Sally', 'Rooney', 'Auteure irlandaise de "Normal People".'),
('Madeline', 'Miller', 'Auteure américaine de "Circé".'),
('Donna', 'Haraway', 'Philosophe et biologiste féministe américaine.'),
('Pierre', 'Ducrozet', 'Auteur français de "Le Grand Vertige".'),
('Camille', 'Laurens', 'Romancière française contemporaine.'),
('Virginie', 'Despentes', 'Écrivaine française, auteure de "Vernon Subutex".'),
('Christophe', 'Galfard', 'Physicien et vulgarisateur scientifique français.'),
('Sylvain', 'Tesson', 'Écrivain-voyageur français, auteur de "Dans les forêts de Sibérie".'),
('Laurent', 'Gounelle', 'Auteur français de romans de développement personnel.'),
('Marc', 'Levy', 'Romancier français, auteur de "Et si c’était vrai".'),
('Guillaume', 'Musso', 'Auteur français de romans à suspense et à succès.'),
('Yasmina', 'Reza', 'Dramaturge et romancière française.'),
('Bernard', 'Werber', 'Auteur français de science-fiction et de philosophie.'),
('Joël', 'Dicker', 'Romancier suisse, auteur de "La Vérité sur l’affaire Harry Quebert".'),
('Jean-Christophe', 'Grangé', 'Auteur de thrillers français, "Les Rivières pourpres".'),
('Camilla', 'Läckberg', 'Romancière suédoise de polar.'),
('Karin', 'Slaughter', 'Auteure américaine de thrillers policiers.'),
('Tana', 'French', 'Romancière irlandaise de polars psychologiques.'),
('Patricia', 'Cornwell', 'Auteure américaine de la série "Kay Scarpetta".'),
('Michael', 'Connelly', 'Auteur américain de romans policiers ("Harry Bosch").');


-- =====================================================================
-- SEED : BOOKS
-- =====================================================================

INSERT INTO books (title, isbn, edition, volume, publication_date, summary)
VALUES
('L’Étranger', '9782070360024', 'Gallimard', NULL, '1942-05-19', 'Roman philosophique d’Albert Camus explorant l’absurdité de la condition humaine.'),
('1984', '9780451524935', 'Secker & Warburg', NULL, '1949-06-08', 'Roman dystopique où le gouvernement contrôle la pensée et la vérité.'),
('Orgueil et Préjugés', '9780141439518', 'Penguin Classics', NULL, '1813-01-28', 'Comédie romantique et critique sociale de la noblesse anglaise.'),
('Vingt mille lieues sous les mers', '9782253006329', 'Hetzel', NULL, '1870-06-20', 'Aventure sous-marine avec le capitaine Nemo à bord du Nautilus.'),
('Les Misérables', '9782070409181', 'Gallimard', NULL, '1862-04-03', 'Roman social et historique explorant la justice, la misère et la rédemption.'),
('Crime et Châtiment', '9782070360025', 'Gallimard', NULL, '1866-01-01', 'Chef-d’œuvre de la littérature russe sur la culpabilité et la morale.'),
('Frankenstein', '9780143131847', 'Penguin Classics', NULL, '1818-01-01', 'Roman gothique sur la création de la vie et la responsabilité scientifique.'),
('Les Aventures de Sherlock Holmes', '9780007350858', 'HarperCollins', NULL, '1892-10-14', 'Recueil d’enquêtes du détective emblématique créé par Conan Doyle.'),
('Le Comte de Monte-Cristo', '9782253009405', 'Calmann-Lévy', NULL, '1845-08-28', 'Roman d’aventure et de vengeance d’Alexandre Dumas.'),
('Le Seigneur des Anneaux : La Communauté de l’Anneau', '9780261102385', 'Allen & Unwin', '1', '1954-07-29', 'Premier tome de la trilogie de J. R. R. Tolkien sur la quête de l’anneau unique.'),
('Harry Potter à l’école des sorciers', '9780747532699', 'Bloomsbury', '1', '1997-06-26', 'Premier tome de la célèbre saga de J. K. Rowling.'),
('Le Nom du vent', '9788401337208', 'DAW Books', '1', '2007-03-27', 'Roman de fantasy suivant le parcours de Kvothe, un héros légendaire.'),
('Mistborn : L’Empire Ultime', '9780765311788', 'Tor Books', '1', '2006-07-17', 'Roman de fantasy épique dans un monde gouverné par un tyran immortel.'),
('Game of Thrones', '9780553573404', 'Bantam Spectra', '1', '1996-08-06', 'Premier tome de la saga de fantasy "Le Trône de fer" de George R. R. Martin.'),
('Fahrenheit 451', '9781451673319', 'Ballantine Books', NULL, '1953-10-19', 'Roman d’anticipation dénonçant la censure et la perte de la culture.'),
('Fondation', '9782070378570', 'Gallimard', '1', '1951-01-01', 'Cycle de science-fiction d’Isaac Asimov sur la chute d’un empire galactique.'),
('L’Alchimiste', '9780061122415', 'HarperOne', NULL, '1988-01-01', 'Conte philosophique sur la quête de soi et le destin.'),
('Shining', '9780307743657', 'Doubleday', NULL, '1977-01-28', 'Roman d’horreur psychologique dans un hôtel isolé enneigé.'),
('La Servante écarlate', '9780385490818', 'McClelland & Stewart', NULL, '1985-09-01', 'Roman dystopique sur une société totalitaire et patriarcale.'),
('Les Cerfs-volants de Kaboul', '9781594631931', 'Riverhead Books', NULL, '2003-05-29', 'Roman poignant sur l’amitié et la rédemption en Afghanistan.');

-- =====================================================================
-- SEED : BOOK_AUTHORS
-- =====================================================================

INSERT INTO book_authors (book_id, author_id)
VALUES
(1, 1),   -- L'Étranger → Albert Camus
(2, 2),   -- 1984 → George Orwell
(3, 3),   -- Orgueil et Préjugés → Jane Austen
(4, 4),   -- 20 000 lieues → Jules Verne
(5, 5),   -- Les Misérables → Victor Hugo
(6, 6),   -- Crime et Châtiment → Dostoïevski
(7, 8),   -- Frankenstein → Mary Shelley
(8, 9),   -- Sherlock Holmes → Conan Doyle
(9, 5),   -- Monte Cristo → Victor Hugo (ou Dumas)
(10, 18), -- LOTR → Tolkien
(11, 17), -- Harry Potter → Rowling
(12, 30), -- Le Nom du vent → Rothfuss
(13, 31), -- Mistborn → Sanderson
(14, 16), -- Game of Thrones → GRR Martin
(15, 21), -- Fahrenheit 451 → Bradbury
(16, 20), -- Fondation → Asimov
(17, 35), -- L’Alchimiste → Coelho
(18, 19), -- Shining → Stephen King
(19, 27), -- La Servante écarlate → Margaret Atwood
(20, 36); -- Les Cerfs-volants de Kaboul → Khaled Hosseini

-- =====================================================================
-- SEED : BOOK_GENRES
-- =====================================================================

INSERT INTO book_genres (book_id, genre_id)
VALUES
-- Romans philosophiques, classiques, dystopiques...
(1, 1),   -- L'Étranger → Roman contemporain
(1, 13),  -- L'Étranger → Philosophie
(2, 4),   -- 1984 → Dystopie
(2, 15),  -- 1984 → Science-fiction
(3, 10),  -- Orgueil et Préjugés → Romance
(3, 1),   -- Orgueil et Préjugés → Roman classique
(4, 9),   -- 20 000 lieues sous les mers → Aventure
(4, 15),  -- 20 000 lieues sous les mers → Science-fiction
(5, 1),   -- Les Misérables → Roman historique
(5, 11),  -- Les Misérables → Drame
(6, 1),   -- Crime et Châtiment → Roman psychologique
(6, 11),  -- Crime et Châtiment → Drame
(7, 7),   -- Frankenstein → Fantastique
(7, 15),  -- Frankenstein → Science-fiction
(8, 3),   -- Sherlock Holmes → Policier
(8, 9),   -- Sherlock Holmes → Aventure
(9, 9),   -- Monte Cristo → Aventure
(9, 1),   -- Monte Cristo → Roman classique
(10, 6),  -- Le Seigneur des Anneaux → Fantasy
(10, 9),  -- Le Seigneur des Anneaux → Aventure
(11, 6),  -- Harry Potter → Fantasy
(11, 9),  -- Harry Potter → Aventure
(12, 6),  -- Le Nom du vent → Fantasy
(12, 9),  -- Le Nom du vent → Aventure
(13, 6),  -- Mistborn → Fantasy
(13, 15), -- Mistborn → Science-fiction
(14, 6),  -- Game of Thrones → Fantasy
(14, 1),  -- Game of Thrones → Roman historique
(15, 15), -- Fahrenheit 451 → Science-fiction
(15, 4),  -- Fahrenheit 451 → Dystopie
(16, 15), -- Fondation → Science-fiction
(16, 13), -- Fondation → Philosophie
(17, 1),  -- L’Alchimiste → Roman initiatique
(17, 13), -- L’Alchimiste → Développement personnel
(18, 8),  -- Shining → Horreur
(18, 7),  -- Shining → Fantastique
(19, 4),  -- La Servante écarlate → Dystopie
(19, 15), -- La Servante écarlate → Science-fiction
(20, 1),  -- Les Cerfs-volants de Kaboul → Roman contemporain
(20, 11); -- Les Cerfs-volants de Kaboul → Drame
