'use strict';

process.env.NODE_ENV = 'test';
process.env.USE_MOCKS = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_EMAILS = 'alice@biblio.test';

const test = require('node:test');
const assert = require('node:assert/strict');

const authController = require('../controllers/authController');
const bookController = require('../controllers/bookController');
const bookProposalController = require('../controllers/bookProposalController');
const authorController = require('../controllers/authorController');
const genreController = require('../controllers/genreController');
const userController = require('../controllers/userController');
const libraryController = require('../controllers/libraryController');
const reviewController = require('../controllers/reviewController');
const mockPasswordResets = require('../data/mockPasswordResets');

const createMockReq = (overrides = {}) => ({
  headers: {},
  query: {},
  params: {},
  body: {},
  user: { id: 1 },
  ...overrides,
});

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  res.send = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

const callController = async (controller, reqOverrides = {}, res = createMockRes()) => {
  const req = createMockReq(reqOverrides);
  await controller(req, res, (err) => {
    if (err) {
      throw err;
    }
  });
  return res;
};

const expectReject = async (controllerCall, verifier) => {
  await assert.rejects(async () => {
    await controllerCall();
  }, verifier);
};

test.beforeEach(() => {
  mockPasswordResets.clear();
});

/* Auth controller */

test('authController.register crée un utilisateur mock', async () => {
  const res = await callController(authController.register, {
    body: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@biblio.test',
      password: 'secret',
      dateOfBirth: '1991-04-20',
    },
  });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.user.email, 'john@biblio.test');
  assert.equal(res.body.user.role, 'user');
  assert.equal(res.body.user.dateOfBirth, '1991-04-20');
  assert.equal(res.body.token, 'mock-jwt-token');
});

test('authController.register rejette les champs manquants', async () => {
  await expectReject(
    () =>
      callController(authController.register, {
        body: { firstName: 'John' },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Missing registration fields');
      return true;
    },
  );
});

test('authController.login renvoie un jeton mock', async () => {
  const res = await callController(authController.login, {
    body: { email: 'alice@biblio.test', password: 'secret' },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.token, 'mock-jwt-token');
  assert.equal(res.body.user.email, 'alice@biblio.test');
  assert.equal(res.body.user.role, 'admin');
});

test('authController.login renvoie 401 pour un utilisateur inconnu', async () => {
  await expectReject(
    () =>
      callController(authController.login, {
        body: { email: 'ghost@biblio.test', password: 'secret' },
      }),
    (err) => {
      assert.equal(err.status, 401);
      assert.equal(err.message, 'Invalid credentials');
      return true;
    },
  );
});

test('authController.me retourne le profil mock', async () => {
  const res = await callController(authController.me, {
    user: { id: 1 },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.id, 1);
  assert.equal(res.body.user.role, 'admin');
});

test('authController.me renvoie 404 si utilisateur inexistant', async () => {
  await expectReject(
    () =>
      callController(authController.me, {
        user: { id: 999 },
      }),
    (err) => {
      assert.equal(err.status, 404);
      assert.equal(err.message, 'User not found');
      return true;
    },
  );
});

test("authController.requestPasswordReset renvoie un message générique", async () => {
  const email = 'alice@biblio.test';

  const res = await callController(authController.requestPasswordReset, {
    body: { email },
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    message: 'If an account matches this email, we have sent a verification code.',
  });

  const stored = mockPasswordResets.peek(email);
  assert.ok(stored);
  assert.equal(stored.email, email);
  assert.match(stored.code, /^\d{6}$/);
});

test("authController.verifyPasswordResetCode accepte un code valide", async () => {
  const email = 'alice@biblio.test';
  await callController(authController.requestPasswordReset, {
    body: { email },
  });

  const stored = mockPasswordResets.peek(email);
  assert.ok(stored, 'le code doit être stocké dans le mock');

  const res = await callController(authController.verifyPasswordResetCode, {
    body: { email, code: stored.code },
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { valid: true });
});

test("authController.verifyPasswordResetCode rejette un code invalide", async () => {
  const email = 'alice@biblio.test';
  await callController(authController.requestPasswordReset, {
    body: { email },
  });

  await expectReject(
    () =>
      callController(authController.verifyPasswordResetCode, {
        body: { email, code: '000000' },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Code expiré ou invalide');
      return true;
    },
  );
});

test("authController.resetPassword consomme le code et accepte un nouveau mot de passe", async () => {
  const email = 'alice@biblio.test';
  await callController(authController.requestPasswordReset, {
    body: { email },
  });
  const stored = mockPasswordResets.peek(email);
  assert.ok(stored);

  const res = await callController(authController.resetPassword, {
    body: { email, code: stored.code, password: 'nouveauPass123' },
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'Password updated successfully' });
  assert.equal(mockPasswordResets.peek(email), null);
});

test("authController.resetPassword exige un mot de passe robuste", async () => {
  const email = 'alice@biblio.test';
  await callController(authController.requestPasswordReset, {
    body: { email },
  });
  const stored = mockPasswordResets.peek(email);
  assert.ok(stored);

  await expectReject(
    () =>
      callController(authController.resetPassword, {
        body: { email, code: stored.code, password: '123' },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Le nouveau mot de passe doit contenir au moins 8 caractères');
      return true;
    },
  );
});

/* Book controller */

test('bookController.listBooks renvoie des ouvrages mockés', async () => {
  const res = await callController(bookController.listBooks, {
    query: { limit: '2', offset: '0' },
  });

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.books));
  assert.ok(res.body.books.length > 0);
  assert.deepEqual(res.body.pagination, { limit: 2, offset: 0, count: res.body.books.length });
});

test('bookController.getBookById renvoie un ouvrage avec auteurs et genres', async () => {
  const res = await callController(bookController.getBookById, { params: { id: 1 } });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.book.id, 1);
  assert.ok(Array.isArray(res.body.book.authors));
  assert.ok(Array.isArray(res.body.book.genres));
});

test('bookController.getBookById renvoie 404 si absent', async () => {
  await expectReject(
    () => callController(bookController.getBookById, { params: { id: 999 } }),
    (err) => {
      assert.equal(err.status, 404);
      assert.equal(err.message, 'Book not found');
      return true;
    },
  );
});

test('bookController.createBook requiert un titre', async () => {
  await expectReject(
    () =>
      callController(bookController.createBook, {
        body: { isbn: '123' },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Title is required');
      return true;
    },
  );
});

test('bookController.createBook crée un livre et normalise les relations', async () => {
  const res = await callController(bookController.createBook, {
    body: {
      title: 'Nouveau Livre',
      authorIds: ['1', '2'],
      genreIds: [1, 2],
    },
  });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.book.title, 'Nouveau Livre');
  assert.ok(Array.isArray(res.body.book.authors));
  assert.ok(Array.isArray(res.body.book.genres));
});
/* Book proposal controller */

test('bookProposalController.createProposal soumet une proposition', async () => {
  const res = await callController(bookProposalController.createProposal, {
    user: { id: 7 },
    body: {
      title: 'Nouveau Livre',
      isbn: '1234567890',
      releaseDate: '2024-02-29',
    },
  });

  assert.equal(res.statusCode, 202);
  assert.equal(res.body.proposal.title, 'Nouveau Livre');
  assert.equal(res.body.proposal.status, 'pending');
  assert.equal(res.body.proposal.submittedBy.id, 7);
  assert.equal(res.body.proposal.decidedBy, null);
  assert.equal(res.body.proposal.releaseDate, '2024-02-29');
  assert.equal(res.body.message, 'Livre envoyé pour validation par un administrateur');
});

test('bookProposalController.listProposals refuse un non-admin', async () => {
  await expectReject(
    () =>
      callController(bookProposalController.listProposals, {
        user: { id: 3 },
      }),
    (err) => {
      assert.equal(err.status, 403);
      return true;
    },
  );
});

test('bookProposalController.listProposals retourne la liste mock pour un admin', async () => {
  const res = await callController(bookProposalController.listProposals, {
    user: { id: 1, isAdmin: true },
  });

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.proposals));
  assert.ok(res.body.proposals.length >= 1);
  assert.equal(res.body.pagination.count, res.body.proposals.length);
  assert.ok(res.body.proposals.some((proposal) => proposal.status === 'pending'));
});

test('bookProposalController.getProposalById renvoie une proposition mock', async () => {
  const res = await callController(bookProposalController.getProposalById, {
    user: { id: 2 },
    params: { id: 201 },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.proposal.id, 201);
  assert.equal(res.body.proposal.submittedBy.id, 2);
});

test('bookProposalController.approveProposal retourne une proposition mock approuvée', async () => {
  const creation = await callController(bookProposalController.createProposal, {
    user: { id: 8 },
    body: { title: 'Livre à valider' },
  });

  const res = await callController(bookProposalController.approveProposal, {
    user: { id: 1, isAdmin: true },
    params: { id: creation.body.proposal.id },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.proposal.status, 'approved');
  assert.equal(res.body.proposal.decidedBy.id, 1);
  assert.equal(res.body.book.title, 'Livre à valider');
});

test('bookProposalController.rejectProposal retourne une proposition mock rejetée', async () => {
  const creation = await callController(bookProposalController.createProposal, {
    user: { id: 9 },
    body: { title: 'Livre refusé' },
  });

  const res = await callController(bookProposalController.rejectProposal, {
    user: { id: 1, isAdmin: true },
    params: { id: creation.body.proposal.id },
    body: { reason: 'Déjà présent' },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.proposal.status, 'rejected');
  assert.equal(res.body.proposal.decidedBy.id, 1);
  assert.equal(res.body.proposal.rejectionReason, 'Déjà présent');
});

test('bookController.updateBook met à jour un livre mock', async () => {
  const res = await callController(bookController.updateBook, {
    params: { id: 1 },
    body: { title: 'Titre modifié' },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.book.title, 'Titre modifié');
});

test('bookController.updateBook renvoie 404 si inexistant', async () => {
  await expectReject(
    () =>
      callController(bookController.updateBook, {
        params: { id: 999 },
        body: { title: 'Test' },
      }),
    (err) => {
      assert.equal(err.status, 404);
      assert.equal(err.message, 'Book not found');
      return true;
    },
  );
});

test('bookController.deleteBook renvoie 204 en mode mock', async () => {
  const res = createMockRes();
  await bookController.deleteBook(
    createMockReq({ params: { id: 1 } }),
    res,
    (err) => {
      if (err) throw err;
    },
  );
  assert.equal(res.statusCode, 204);
});

/* Author controller */

test('authorController.listAuthors renvoie la liste mock', async () => {
  const res = await callController(authorController.listAuthors);
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.authors));
});

test('authorController.getAuthorById renvoie un auteur', async () => {
  const res = await callController(authorController.getAuthorById, { params: { id: 1 } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.author.id, 1);
});

test('authorController.getAuthorById renvoie 404 si absent', async () => {
  await expectReject(
    () => callController(authorController.getAuthorById, { params: { id: 999 } }),
    (err) => {
      assert.equal(err.status, 404);
      assert.equal(err.message, 'Author not found');
      return true;
    },
  );
});

test('authorController.getAuthorBooks renvoie les livres mock', async () => {
  const res = await callController(authorController.getAuthorBooks, { params: { id: 1 } });
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.books));
});

test('authorController.createAuthor requiert nom et prénom', async () => {
  await expectReject(
    () => callController(authorController.createAuthor, { body: { firstName: 'Jean' } }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'firstName and lastName are required');
      return true;
    },
  );
});

test('authorController.createAuthor crée un auteur mock', async () => {
  const res = await callController(authorController.createAuthor, {
    body: { firstName: 'Jean', lastName: 'Fort' },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.author.firstName, 'Jean');
});

test('authorController.updateAuthor renvoie un auteur mis à jour', async () => {
  const res = await callController(authorController.updateAuthor, {
    params: { id: 1 },
    body: { biography: 'Bio mise à jour' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.author.biography, 'Bio mise à jour');
});

test('authorController.updateAuthor renvoie 404 si introuvable', async () => {
  await expectReject(
    () =>
      callController(authorController.updateAuthor, {
        params: { id: 999 },
        body: { biography: 'Test' },
      }),
    (err) => {
      assert.equal(err.status, 404);
      assert.equal(err.message, 'Author not found');
      return true;
    },
  );
});

test('authorController.deleteAuthor renvoie 204 en mock', async () => {
  const res = createMockRes();
  await authorController.deleteAuthor(
    createMockReq({ params: { id: 1 } }),
    res,
    (err) => {
      if (err) throw err;
    },
  );
  assert.equal(res.statusCode, 204);
});

/* Genre controller */

test('genreController.listGenres renvoie les genres mock', async () => {
  const res = await callController(genreController.listGenres);
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.genres));
});

test('genreController.getGenreBooks renvoie les livres associés', async () => {
  const res = await callController(genreController.getGenreBooks, { params: { id: 1 } });
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.books));
});

test('genreController.createGenre requiert un nom', async () => {
  await expectReject(
    () => callController(genreController.createGenre, { body: {} }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Genre name is required');
      return true;
    },
  );
});

test('genreController.createGenre crée un genre mock', async () => {
  const res = await callController(genreController.createGenre, {
    body: { name: 'Essai' },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.genre.name, 'Essai');
});

test('genreController.deleteGenre renvoie 204', async () => {
  const res = createMockRes();
  await genreController.deleteGenre(
    createMockReq({ params: { id: 1 } }),
    res,
    (err) => {
      if (err) throw err;
    },
  );
  assert.equal(res.statusCode, 204);
});

/* User controller */

test('userController.listUsers renvoie les utilisateurs mock', async () => {
  const res = await callController(userController.listUsers);
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.users));
});

test('userController.getUserById renvoie un utilisateur', async () => {
  const res = await callController(userController.getUserById, { params: { id: 1 } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.id, 1);
});

test('userController.getUserById renvoie 404 si introuvable', async () => {
  await expectReject(
    () => callController(userController.getUserById, { params: { id: 999 } }),
    (err) => {
      assert.equal(err.status, 404);
      assert.equal(err.message, 'User not found');
      return true;
    },
  );
});

test('userController.listFriends exige un identifiant valide', async () => {
  await expectReject(
    () => callController(userController.listFriends, { params: { id: 'foo' } }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Invalid user identifier');
      return true;
    },
  );
});

test('userController.listFriends rejette les accès tiers', async () => {
  await expectReject(
    () =>
      callController(userController.listFriends, {
        params: { id: 1 },
        user: { id: 2 },
      }),
    (err) => {
      assert.equal(err.status, 403);
      assert.equal(err.message, 'You are not allowed to perform this action');
      return true;
    },
  );
});

test('userController.listFriends renvoie la liste mock', async () => {
  const res = await callController(userController.listFriends, {
    params: { id: 1 },
    user: { id: 1 },
  });
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.friends));
});

test('userController.requestFriend refuse les identifiants invalides', async () => {
  await expectReject(
    () =>
      callController(userController.requestFriend, {
        params: { id: 'abc' },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Invalid friend identifier');
      return true;
    },
  );
});

test('userController.requestFriend refuse l’auto-invitation', async () => {
  await expectReject(
    () =>
      callController(userController.requestFriend, {
        params: { id: 1 },
        user: { id: 1 },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'You cannot befriend yourself');
      return true;
    },
  );
});

test('userController.requestFriend crée une demande mock', async () => {
  const res = await callController(userController.requestFriend, {
    params: { id: 2 },
    user: { id: 1 },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.friendship.requesterId, 1);
  assert.equal(res.body.friendship.addresseeId, 2);
});

test('userController.acceptFriend valide l’utilisateur cible', async () => {
  await expectReject(
    () =>
      callController(userController.acceptFriend, {
        params: { id: 'abc', friendId: '1' },
        user: { id: 1 },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Invalid user identifier');
      return true;
    },
  );
});

test('userController.acceptFriend refuse les accès tiers', async () => {
  await expectReject(
    () =>
      callController(userController.acceptFriend, {
        params: { id: 1, friendId: 2 },
        user: { id: 3 },
      }),
    (err) => {
      assert.equal(err.status, 403);
      assert.equal(err.message, 'You are not allowed to perform this action');
      return true;
    },
  );
});

test('userController.acceptFriend accepte une relation mock', async () => {
  const res = await callController(userController.acceptFriend, {
    params: { id: 2, friendId: 1 },
    user: { id: 2 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.friendship.status, 'accepted');
});

test('userController.removeFriend valide les identifiants', async () => {
  await expectReject(
    () =>
      callController(userController.removeFriend, {
        params: { id: 'abc', friendId: '2' },
        user: { id: 1 },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Invalid user identifier');
      return true;
    },
  );
});

test('userController.removeFriend refuse les accès tiers', async () => {
  await expectReject(
    () =>
      callController(userController.removeFriend, {
        params: { id: 1, friendId: 2 },
        user: { id: 3 },
      }),
    (err) => {
      assert.equal(err.status, 403);
      assert.equal(err.message, 'You are not allowed to perform this action');
      return true;
    },
  );
});

test('userController.removeFriend supprime une relation mock', async () => {
  const res = createMockRes();
  await userController.removeFriend(
    createMockReq({ params: { id: 1, friendId: 2 }, user: { id: 1 } }),
    res,
    (err) => {
      if (err) throw err;
    },
  );
  assert.equal(res.statusCode, 204);
});

/* Library controller */

test('libraryController.listLibraryBooks renvoie les livres de la bibliothèque', async () => {
  const res = await callController(libraryController.listLibraryBooks, {
    user: { id: 1 },
  });
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.books));
});

test('libraryController.addBookToLibrary refuse un identifiant invalide', async () => {
  await expectReject(
    () =>
      callController(libraryController.addBookToLibrary, {
        params: { bookId: 'abc' },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Invalid bookId');
      return true;
    },
  );
});

test('libraryController.addBookToLibrary crée une entrée mock', async () => {
  const res = await callController(libraryController.addBookToLibrary, {
    params: { bookId: 1 },
    user: { id: 1 },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.entry.bookId, 1);
});

test('libraryController.removeBookFromLibrary renvoie 204', async () => {
  const res = createMockRes();
  await libraryController.removeBookFromLibrary(
    createMockReq({ params: { bookId: 1 }, user: { id: 1 } }),
    res,
    (err) => {
      if (err) throw err;
    },
  );
  assert.equal(res.statusCode, 204);
});

test('libraryController.listWishlistBooks renvoie la wishlist mock', async () => {
  const res = await callController(libraryController.listWishlistBooks, {
    user: { id: 1 },
  });
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.books));
});

test('libraryController.addBookToWishlist refuse un identifiant invalide', async () => {
  await expectReject(
    () =>
      callController(libraryController.addBookToWishlist, {
        params: { bookId: 'oops' },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Invalid bookId');
      return true;
    },
  );
});

test('libraryController.addBookToWishlist crée une entrée mock', async () => {
  const res = await callController(libraryController.addBookToWishlist, {
    params: { bookId: 2 },
    user: { id: 1 },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.entry.bookId, 2);
});

test('libraryController.removeBookFromWishlist renvoie 204', async () => {
  const res = createMockRes();
  await libraryController.removeBookFromWishlist(
    createMockReq({ params: { bookId: 2 }, user: { id: 1 } }),
    res,
    (err) => {
      if (err) throw err;
    },
  );
  assert.equal(res.statusCode, 204);
});

/* Review controller */

test('reviewController.listReviewsForBook renvoie les critiques mock', async () => {
  const res = await callController(reviewController.listReviewsForBook, {
    params: { bookId: 1 },
  });
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.reviews));
});

test('reviewController.createReviewForBook valide la note', async () => {
  await expectReject(
    () =>
      callController(reviewController.createReviewForBook, {
        params: { bookId: 1 },
        body: { rating: 6 },
        user: { id: 1 },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Rating must be an integer between 1 and 5');
      return true;
    },
  );
});

test('reviewController.createReviewForBook crée une critique mock', async () => {
  const res = await callController(reviewController.createReviewForBook, {
    params: { bookId: 1 },
    body: { rating: 4, comment: 'Super' },
    user: { id: 1 },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.review.rating, 4);
});

test('reviewController.updateReview renvoie 404 si introuvable', async () => {
  await expectReject(
    () =>
      callController(reviewController.updateReview, {
        params: { id: 999 },
        body: { rating: 3 },
        user: { id: 1 },
      }),
    (err) => {
      assert.equal(err.status, 404);
      assert.equal(err.message, 'Review not found');
      return true;
    },
  );
});

test('reviewController.updateReview refuse la modification par un autre utilisateur', async () => {
  await expectReject(
    () =>
      callController(reviewController.updateReview, {
        params: { id: 1 },
        body: { rating: 4 },
        user: { id: 99 },
      }),
    (err) => {
      assert.equal(err.status, 403);
      assert.equal(err.message, 'You can only update your own reviews');
      return true;
    },
  );
});

test('reviewController.updateReview valide la note', async () => {
  await expectReject(
    () =>
      callController(reviewController.updateReview, {
        params: { id: 1 },
        body: { rating: 10 },
        user: { id: 2 },
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'Rating must be an integer between 1 and 5');
      return true;
    },
  );
});

test('reviewController.updateReview met à jour la critique', async () => {
  const res = await callController(reviewController.updateReview, {
    params: { id: 1 },
    body: { rating: 4, comment: 'Nouvelle note' },
    user: { id: 2 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.review.rating, 4);
  assert.equal(res.body.review.comment, 'Nouvelle note');
});

test('reviewController.deleteReview renvoie 404 si introuvable', async () => {
  await expectReject(
    () =>
      callController(reviewController.deleteReview, {
        params: { id: 999 },
        user: { id: 1 },
      }),
    (err) => {
      assert.equal(err.status, 404);
      assert.equal(err.message, 'Review not found');
      return true;
    },
  );
});

test('reviewController.deleteReview refuse la suppression par un autre utilisateur', async () => {
  await expectReject(
    () =>
      callController(reviewController.deleteReview, {
        params: { id: 1 },
        user: { id: 99 },
      }),
    (err) => {
      assert.equal(err.status, 403);
      assert.equal(err.message, 'You can only delete your own reviews');
      return true;
    },
  );
});

test('reviewController.deleteReview supprime une critique mock', async () => {
  const res = createMockRes();
  await reviewController.deleteReview(
    createMockReq({ params: { id: 1 }, user: { id: 2 } }),
    res,
    (err) => {
      if (err) throw err;
    },
  );
  assert.equal(res.statusCode, 204);
});
