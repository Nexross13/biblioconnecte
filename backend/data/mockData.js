const clone = (value) => JSON.parse(JSON.stringify(value));

const stripAccents = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    .toLowerCase();

const normalizeTextForSearch = (value = '') =>
  stripAccents(value).replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeCompactForSearch = (value = '') => stripAccents(value).replace(/[^a-z0-9]+/g, '');

const stripLeadingZeros = (value = '') => value.replace(/\b0+(\d+)/g, '$1');

const users = [
  {
    id: 1,
    login: 'alice',
    firstName: 'Alice',
    lastName: 'Martin',
    email: 'alice@biblio.test',
    role: 'admin',
    canBypassBookProposals: false,
    canBypassAuthorProposals: false,
    dateOfBirth: '1990-03-12',
    createdAt: '2024-01-10T08:00:00.000Z',
  },
  {
    id: 2,
    login: 'benoit',
    firstName: 'Benoit',
    lastName: 'Durand',
    email: 'benoit@biblio.test',
    role: 'moderator',
    canBypassBookProposals: false,
    canBypassAuthorProposals: false,
    dateOfBirth: '1988-07-22',
    createdAt: '2024-01-12T10:15:00.000Z',
  },
  {
    id: 3,
    login: 'test',
    firstName: 'Claire',
    lastName: 'Faure',
    email: 'claire@biblio.test',
    role: 'user',
    canBypassBookProposals: false,
    canBypassAuthorProposals: false,
    dateOfBirth: '1992-11-03',
    createdAt: '2024-02-01T09:05:00.000Z',
  },
];

const authors = [
  {
    id: 1,
    firstName: 'Antoine',
    lastName: 'de Saint-Exupéry',
    biography: 'Aviateur et écrivain français, auteur du Petit Prince.',
    createdAt: '2023-12-10T09:00:00.000Z',
    updatedAt: '2023-12-10T09:00:00.000Z',
  },
  {
    id: 2,
    firstName: 'George',
    lastName: 'Orwell',
    biography: 'Romancier et critique, connu pour 1984.',
    createdAt: '2023-12-15T11:30:00.000Z',
    updatedAt: '2023-12-15T11:30:00.000Z',
  },
];

//const books = []

const books = [
  {
    id: 1,
    title: 'Le Petit Prince',
    isbn: '9780156013987',
    edition: 'Gallimard',
    volume: '1',
    volumeTitle: null,
    releaseDate: '1943-04-06',
    summary: 'Conte poétique et philosophique raconté par un aviateur.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    title: '1984',
    isbn: '9780451524935',
    edition: 'Secker & Warburg',
    volume: '1',
    volumeTitle: null,
    releaseDate: '1949-06-08',
    summary: 'Dystopie décrivant un régime totalitaire.',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 3,
    title: 'Animal Farm',
    isbn: '9780451526342',
    edition: 'Secker & Warburg',
    volume: '1',
    volumeTitle: null,
    releaseDate: '1945-08-17',
    summary: 'Fable politique sur une révolte animale.',
    createdAt: '2024-01-08T00:00:00.000Z',
    updatedAt: '2024-01-08T00:00:00.000Z',
  },
  {
    id: 4,
    title: 'Astérix',
    isbn: '9782012101379',
    edition: 'Dargaud',
    volume: '1',
    volumeTitle: 'Astérix le Gaulois',
    releaseDate: '1959-10-29',
    summary: 'Première aventure d’Astérix et Obélix dans le village armoricain résistant à Rome.',
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 5,
    title: 'Astérix',
    isbn: '9782012101386',
    edition: 'Dargaud',
    volume: '2',
    volumeTitle: 'La Serpe d’or',
    releaseDate: '1960-01-01',
    summary:
      'Astérix et Obélix partent à Lutèce pour trouver une nouvelle serpe indispensable au druide Panoramix.',
    createdAt: '2024-01-11T00:00:00.000Z',
    updatedAt: '2024-01-11T00:00:00.000Z',
  },
];

const authorBooks = [
  { bookId: 1, authorId: 1 },
  { bookId: 2, authorId: 2 },
  { bookId: 3, authorId: 2 },
  { bookId: 4, authorId: 1 },
  { bookId: 5, authorId: 1 },
];

const genres = [
  { id: 1, name: 'Fiction', createdAt: '2023-12-01T00:00:00.000Z' },
  { id: 2, name: 'Classique', createdAt: '2023-12-02T00:00:00.000Z' },
  { id: 3, name: 'Philosophie', createdAt: '2023-12-03T00:00:00.000Z' },
];

const bookGenres = [
  { bookId: 1, genreId: 1 },
  { bookId: 1, genreId: 3 },
  { bookId: 2, genreId: 1 },
  { bookId: 2, genreId: 2 },
  { bookId: 3, genreId: 1 },
  { bookId: 4, genreId: 1 },
  { bookId: 5, genreId: 1 },
];

const libraryItems = [
  { userId: 1, bookId: 1, addedAt: '2024-03-01T12:00:00.000Z' },
  { userId: 1, bookId: 2, addedAt: '2024-03-05T17:20:00.000Z' },
  { userId: 1, bookId: 4, addedAt: '2024-03-06T09:15:00.000Z' },
  { userId: 1, bookId: 5, addedAt: '2024-03-07T08:45:00.000Z' },
];

const wishlistItems = [
  { userId: 1, bookId: 3, addedAt: '2024-03-10T08:35:00.000Z' },
];

const reviews = [
  {
    id: 1,
    userId: 2,
    bookId: 1,
    rating: 5,
    comment: 'Un classique touchant qui fait réfléchir.',
    createdAt: '2024-03-12T10:00:00.000Z',
    updatedAt: '2024-03-12T10:00:00.000Z',
    moderationStatus: 'approved',
    moderatedBy: 1,
    moderatedAt: '2024-03-12T10:30:00.000Z',
  },
  {
    id: 2,
    userId: 1,
    bookId: 2,
    rating: 4,
    comment: 'Vision glaçante mais brillante.',
    createdAt: '2024-03-15T11:45:00.000Z',
    updatedAt: '2024-03-15T11:45:00.000Z',
    moderationStatus: 'pending',
    moderatedBy: null,
    moderatedAt: null,
  },
];

const friendships = [
  {
    requesterId: 2,
    addresseeId: 3,
    status: 'pending',
    requestedAt: '2024-02-10T11:30:00.000Z',
  },
];

const bookProposals = [
  {
    id: 201,
    title: 'La Horde du Contrevent',
    isbn: '9782702143438',
    edition: 'La Volte',
    volume: '1',
    volumeTitle: null,
    releaseDate: '2001-01-15',
    summary: 'Une aventure SF/heroic fantasy suivant la 34e Horde face aux vents.',
    status: 'pending',
    submittedBy: 2,
    submittedAt: '2024-04-01T10:00:00.000Z',
    updatedAt: '2024-04-01T10:00:00.000Z',
    decidedBy: null,
    decidedAt: null,
    rejectionReason: null,
    authorNames: ['Alain Damasio'],
    genreNames: ['Science-fiction', 'Fantasy'],
    coverImagePath: null,
  },
  {
    id: 202,
    title: 'Hyperion',
    isbn: '9782221088303',
    edition: 'Robert Laffont',
    volume: '1',
    volumeTitle: null,
    releaseDate: '1989-05-26',
    summary: 'Premier tome des Cantos d’Hyperion de Dan Simmons.',
    status: 'approved',
    submittedBy: 3,
    submittedAt: '2024-03-05T09:30:00.000Z',
    updatedAt: '2024-03-06T16:35:00.000Z',
    decidedBy: 1,
    decidedAt: '2024-03-06T16:35:00.000Z',
    rejectionReason: null,
    authorNames: ['Dan Simmons'],
    genreNames: ['Science-fiction'],
    coverImagePath: null,
  },
  {
    id: 203,
    title: 'Dune - Les Origines',
    isbn: '9782266137321',
    edition: 'Pocket',
    volume: '1',
    volumeTitle: null,
    releaseDate: '2003-08-01',
    summary: 'Spin-off de l’univers Dune écrit par Brian Herbert et Kevin J. Anderson.',
    status: 'rejected',
    submittedBy: 2,
    submittedAt: '2024-02-18T14:45:00.000Z',
    updatedAt: '2024-02-19T08:12:00.000Z',
    decidedBy: 1,
    decidedAt: '2024-02-19T08:12:00.000Z',
    rejectionReason: 'Doublon déjà présent dans le catalogue.',
    authorNames: ['Brian Herbert', 'Kevin J. Anderson'],
    genreNames: ['Science-fiction'],
    coverImagePath: null,
  },
];

const bookReports = [
  {
    id: 1,
    bookId: 2,
    reportedBy: 3,
    reason: 'Informations inexactes sur la maison d’édition.',
    status: 'open',
    createdAt: '2024-05-10T08:30:00.000Z',
    updatedAt: '2024-05-10T08:30:00.000Z',
    closedAt: null,
    closedBy: null,
  },
  {
    id: 2,
    bookId: 1,
    reportedBy: 2,
    reason: 'Image de couverture inappropriée.',
    status: 'closed',
    createdAt: '2024-04-20T09:00:00.000Z',
    updatedAt: '2024-04-21T09:00:00.000Z',
    closedAt: '2024-04-21T09:00:00.000Z',
    closedBy: 1,
  },
];

const authorProposals = [
  {
    id: 1,
    firstName: 'Nnedi',
    lastName: 'Okorafor',
    biography: 'Autrice nigériano-américaine reconnue pour ses récits afro-futuristes.',
    status: 'pending',
    submittedBy: 2,
    submittedAt: '2024-04-20T09:30:00.000Z',
    decidedBy: null,
    decidedAt: null,
    rejectionReason: null,
  },
  {
    id: 2,
    firstName: 'Ken',
    lastName: 'Liu',
    biography: "Auteur et traducteur sino-américain, figure de l'imaginaire spéculatif.",
    status: 'approved',
    submittedBy: 1,
    submittedAt: '2024-03-15T14:10:00.000Z',
    decidedBy: 1,
    decidedAt: '2024-03-20T08:00:00.000Z',
    rejectionReason: null,
  },
];

const nextAuthorId = () => (authors.length ? Math.max(...authors.map((author) => author.id)) + 1 : 1);

const getUsers = () => clone(users);
const getUserById = (id) => clone(users.find((user) => user.id === Number(id)) || null);
const getAdmins = () => clone(users.filter((user) => user.role === 'admin'));
const setUserRole = (id, role) => {
  const index = users.findIndex((user) => user.id === Number(id));
  if (index === -1) {
    return null;
  }
  users[index].role = role;
  return clone(users[index]);
};

const setUserBypassPermission = (id, canBypass, key = 'canBypassBookProposals') => {
  const index = users.findIndex((user) => user.id === Number(id));
  if (index === -1) {
    return null;
  }
  const allowedKeys = ['canBypassBookProposals', 'canBypassAuthorProposals'];
  const targetKey = allowedKeys.includes(key) ? key : 'canBypassBookProposals';
  users[index][targetKey] = Boolean(canBypass);
  return clone(users[index]);
};

const getFriendships = () => clone(friendships);

const getFriendsOfUser = (userId) => {
  const accepted = friendships.filter(
    (friendship) =>
      friendship.status === 'accepted' &&
      (friendship.requesterId === Number(userId) || friendship.addresseeId === Number(userId)),
  );

  return accepted.map((friendship) => {
    const friendId =
      friendship.requesterId === Number(userId) ? friendship.addresseeId : friendship.requesterId;
    const friend = users.find((user) => user.id === friendId);
    return friend
      ? {
          id: friend.id,
          login: friend.login,
          firstName: friend.firstName,
          lastName: friend.lastName,
          email: friend.email,
          acceptedAt: friendship.acceptedAt,
        }
      : null;
  }).filter(Boolean);
};

const getBooks = ({ search } = {}) => {
  if (!search) {
    return clone(books);
  }

  const normalizedQuery = normalizeTextForSearch(search);
  const normalizedQueryWithoutZeros = stripLeadingZeros(normalizedQuery);
  const compactQuery = normalizeCompactForSearch(search);

  if (!normalizedQuery && !compactQuery) {
    return clone(books);
  }

  return clone(
    books.filter((book) => {
      const values = [
        book.title,
        book.volumeTitle,
        book.summary,
        book.edition,
        book.volume,
        book.isbn,
      ].filter(Boolean);

      if (!values.length) {
        return false;
      }

      const joined = values.join(' ');
      const normalizedHaystack = normalizeTextForSearch(joined);
      const normalizedHaystackWithoutZeros = stripLeadingZeros(normalizedHaystack);
      const compactHaystack = normalizeCompactForSearch(joined);

      if (normalizedQuery && normalizedHaystack.includes(normalizedQuery)) {
        return true;
      }
      if (
        normalizedQueryWithoutZeros &&
        normalizedHaystackWithoutZeros.includes(normalizedQueryWithoutZeros)
      ) {
        return true;
      }
      if (compactQuery && compactHaystack.includes(compactQuery)) {
        return true;
      }
      return false;
    }),
  );
};

const getBookById = (id) => clone(books.find((book) => book.id === Number(id)) || null);

const getAuthors = () => clone(authors);
const getAuthorById = (id) => clone(authors.find((author) => author.id === Number(id)) || null);

const getGenres = () => clone(genres);
const getGenreById = (id) => clone(genres.find((genre) => genre.id === Number(id)) || null);

const getBookAuthors = (bookId) => {
  const matches = authorBooks
    .filter((relation) => relation.bookId === Number(bookId))
    .map((relation) => authors.find((author) => author.id === relation.authorId))
    .filter(Boolean);
  return clone(matches);
};

const getBookGenres = (bookId) => {
  const matches = bookGenres
    .filter((relation) => relation.bookId === Number(bookId))
    .map((relation) => genres.find((genre) => genre.id === relation.genreId))
    .filter(Boolean);
  return clone(matches);
};

const getAuthorBooks = (authorId) => {
  const matches = authorBooks
    .filter((relation) => relation.authorId === Number(authorId))
    .map((relation) => books.find((book) => book.id === relation.bookId))
    .filter(Boolean);
  return clone(matches);
};

const getGenreBooks = (genreId) => {
  const matches = bookGenres
    .filter((relation) => relation.genreId === Number(genreId))
    .map((relation) => books.find((book) => book.id === relation.bookId))
    .filter(Boolean);
  return clone(matches);
};

const getLibraryItems = (userId) => {
  const matches = libraryItems
    .filter((item) => item.userId === Number(userId))
    .map((item) => {
      const book = books.find((bk) => bk.id === item.bookId);
      return book
        ? {
            id: book.id,
            title: book.title,
            isbn: book.isbn,
            edition: book.edition,
            volume: book.volume,
            volumeTitle: book.volumeTitle || null,
            authorNames: getBookAuthors(book.id).map((author) => `${author.firstName} ${author.lastName}`.trim()),
            genreNames: getBookGenres(book.id).map((genre) => genre.name),
            addedAt: item.addedAt,
          }
        : null;
    })
    .filter(Boolean);

  return clone(matches);
};

const getWishlistItems = (userId) => {
  const matches = wishlistItems
    .filter((item) => item.userId === Number(userId))
    .map((item) => {
      const book = books.find((bk) => bk.id === item.bookId);
      return book
        ? {
            id: book.id,
            title: book.title,
            isbn: book.isbn,
            edition: book.edition,
            volume: book.volume,
            volumeTitle: book.volumeTitle || null,
            authorNames: getBookAuthors(book.id).map((author) => `${author.firstName} ${author.lastName}`.trim()),
            genreNames: getBookGenres(book.id).map((genre) => genre.name),
            addedAt: item.addedAt,
          }
        : null;
    })
    .filter(Boolean);

  return clone(matches);
};

const buildReviewPayload = (review, { includeBook = false, includeEmail = false } = {}) => {
  if (!review) {
    return null;
  }

  const author = users.find((user) => user.id === review.userId);
  const moderator = review.moderatedBy
    ? users.find((user) => user.id === review.moderatedBy)
    : null;
  const book = includeBook ? books.find((entry) => entry.id === review.bookId) : null;

  return {
    ...review,
    author: author
      ? {
          firstName: author.firstName,
          lastName: author.lastName,
          ...(includeEmail ? { email: author.email } : {}),
        }
      : null,
    moderator: moderator
      ? {
          firstName: moderator.firstName,
          lastName: moderator.lastName,
        }
      : null,
    book: book
      ? {
          id: book.id,
          title: book.title,
          volume: book.volume,
          volumeTitle: book.volumeTitle || null,
        }
      : null,
  };
};

const getReviewsByBook = (bookId) => {
  const matches = reviews
    .filter((review) => review.bookId === Number(bookId))
    .map((review) => buildReviewPayload(review));

  return clone(matches);
};

const getReviewById = (reviewId) =>
  clone(reviews.find((review) => review.id === Number(reviewId)) || null);

const getRecentReviews = ({ limit = 20 } = {}) => {
  const normalizedLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const sorted = reviews
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    )
    .slice(0, normalizedLimit)
    .map((review) => buildReviewPayload(review, { includeBook: true, includeEmail: true }));

  return clone(sorted);
};

const approveReview = ({ reviewId, moderatorId }) => {
  const index = reviews.findIndex((review) => review.id === Number(reviewId));
  if (index === -1) {
    return null;
  }
  const timestamp = new Date().toISOString();
  reviews[index] = {
    ...reviews[index],
    moderationStatus: 'approved',
    moderatedBy: Number(moderatorId),
    moderatedAt: timestamp,
  };
  return clone(buildReviewPayload(reviews[index], { includeBook: true }));
};

const nextBookReportId = () =>
  bookReports.length ? Math.max(...bookReports.map((report) => report.id)) + 1 : 1;

const buildBookReportPayload = (report) => {
  if (!report) {
    return null;
  }
  const reporter = users.find((user) => user.id === report.reportedBy);
  const book = books.find((entry) => entry.id === report.bookId);
  const moderator = report.closedBy ? users.find((user) => user.id === report.closedBy) : null;
  return {
    ...report,
    reporter: reporter
      ? {
          id: reporter.id,
          firstName: reporter.firstName,
          lastName: reporter.lastName,
          email: reporter.email,
        }
      : null,
    book: book
      ? {
          id: book.id,
          title: book.title,
          isbn: book.isbn,
        }
      : null,
    moderator: moderator
      ? {
          id: moderator.id,
          firstName: moderator.firstName,
          lastName: moderator.lastName,
        }
      : null,
  };
};

const getBookReports = ({ status } = {}) => {
  let reports = bookReports;
  if (status) {
    reports = reports.filter((report) => report.status === status);
  }
  return clone(reports.map((report) => buildBookReportPayload(report)));
};

const createBookReport = ({ bookId, reportedBy, reason }) => {
  const timestamp = new Date().toISOString();
  const report = {
    id: nextBookReportId(),
    bookId,
    reportedBy,
    reason,
    status: 'open',
    createdAt: timestamp,
    updatedAt: timestamp,
    closedAt: null,
    closedBy: null,
  };
  bookReports.unshift(report);
  return clone(buildBookReportPayload(report));
};

const closeBookReport = ({ reportId, closedBy }) => {
  const index = bookReports.findIndex((report) => report.id === Number(reportId));
  if (index === -1 || bookReports[index].status === 'closed') {
    return null;
  }
  const timestamp = new Date().toISOString();
  bookReports[index] = {
    ...bookReports[index],
    status: 'closed',
    closedBy: Number(closedBy),
    closedAt: timestamp,
    updatedAt: timestamp,
  };
  return clone(buildBookReportPayload(bookReports[index]));
};

const getBookProposals = ({ status } = {}) => {
  let proposals = bookProposals;
  if (status) {
    proposals = proposals.filter((proposal) => proposal.status === status);
  }
  return clone(proposals);
};

const getBookProposalsForUser = (userId) => {
  const proposals = bookProposals.filter((proposal) => proposal.submittedBy === Number(userId));
  return clone(proposals);
};

const getBookProposalById = (id) =>
  clone(bookProposals.find((proposal) => proposal.id === Number(id)) || null);

const nextProposalId = () =>
  bookProposals.length ? Math.max(...bookProposals.map((proposal) => proposal.id)) + 1 : 1;

const nextBookId = () => (books.length ? Math.max(...books.map((book) => book.id)) + 1 : 1);

const createBookProposal = ({
  title,
  isbn,
  edition,
  volume,
  volumeTitle,
  summary,
  releaseDate = null,
  submittedBy,
  authorNames = [],
  genreNames = [],
  coverImagePath = null,
}) => {
  const timestamp = new Date().toISOString();
  const newProposal = {
    id: nextProposalId(),
    title,
    isbn: isbn || null,
    edition: edition || null,
    volume: volume || null,
    volumeTitle: volumeTitle || null,
    summary: summary || null,
    releaseDate: releaseDate || null,
    status: 'pending',
    submittedBy: Number(submittedBy),
    submittedAt: timestamp,
    updatedAt: timestamp,
    decidedBy: null,
    decidedAt: null,
    rejectionReason: null,
    authorNames: authorNames.slice(),
    genreNames: genreNames.slice(),
    coverImagePath: coverImagePath || null,
  };
  bookProposals.push(newProposal);
  return clone(newProposal);
};

const approveBookProposal = ({ id, decidedBy }) => {
  const index = bookProposals.findIndex((proposal) => proposal.id === Number(id));
  if (index === -1) {
    return null;
  }

  const proposal = bookProposals[index];
  if (proposal.status !== 'pending') {
    const error = new Error('Proposal is not pending');
    error.status = 409;
    throw error;
  }

  const timestamp = new Date().toISOString();
  const book = {
    id: nextBookId(),
    title: proposal.title,
    isbn: proposal.isbn,
    edition: proposal.edition,
    volume: proposal.volume,
    volumeTitle: proposal.volumeTitle || null,
    releaseDate: proposal.releaseDate || null,
    summary: proposal.summary,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  books.push({
    id: book.id,
    title: book.title,
    isbn: book.isbn,
    edition: book.edition,
    volume: book.volume,
    volumeTitle: book.volumeTitle || null,
    releaseDate: book.releaseDate,
    summary: book.summary,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  });

  const updatedProposal = {
    ...proposal,
    status: 'approved',
    decidedBy: Number(decidedBy),
    decidedAt: timestamp,
    rejectionReason: null,
    updatedAt: timestamp,
  };

  bookProposals[index] = updatedProposal;

  return {
    proposal: clone(updatedProposal),
    book: clone(book),
  };
};

const rejectBookProposal = ({ id, decidedBy, reason }) => {
  const index = bookProposals.findIndex((proposal) => proposal.id === Number(id));
  if (index === -1) {
    return null;
  }

  const proposal = bookProposals[index];
  if (proposal.status !== 'pending') {
    const error = new Error('Proposal is not pending');
    error.status = 409;
    throw error;
  }

  const timestamp = new Date().toISOString();
  const updatedProposal = {
    ...proposal,
    status: 'rejected',
    decidedBy: Number(decidedBy),
    decidedAt: timestamp,
    rejectionReason: reason || null,
    updatedAt: timestamp,
  };

  bookProposals[index] = updatedProposal;

  return clone(updatedProposal);
};

const updateBookProposal = ({ id, updates = {} }) => {
  const index = bookProposals.findIndex((proposal) => proposal.id === Number(id));
  if (index === -1) {
    return null;
  }

  if (bookProposals[index].status !== 'pending') {
    const error = new Error('Proposal is not pending');
    error.status = 409;
    throw error;
  }

  const fieldMap = {
    title: 'title',
    isbn: 'isbn',
    edition: 'edition',
    volume: 'volume',
    volumeTitle: 'volumeTitle',
    summary: 'summary',
    releaseDate: 'releaseDate',
    authorNames: 'authorNames',
    genreNames: 'genreNames',
  };

  let hasChanges = false;
  const timestamp = new Date().toISOString();
  const nextProposal = { ...bookProposals[index], updatedAt: timestamp };

  Object.entries(fieldMap).forEach(([payloadKey, storageKey]) => {
    if (Object.prototype.hasOwnProperty.call(updates, payloadKey)) {
      nextProposal[storageKey] = updates[payloadKey];
      hasChanges = true;
    }
  });

  if (!hasChanges) {
    return clone(bookProposals[index]);
  }

  bookProposals[index] = nextProposal;
  return clone(nextProposal);
};

const getAuthorProposals = ({ status } = {}) => {
  let proposals = authorProposals;
  if (status) {
    proposals = proposals.filter((proposal) => proposal.status === status);
  }
  return clone(proposals);
};

const nextAuthorProposalId = () =>
  authorProposals.length ? Math.max(...authorProposals.map((proposal) => proposal.id)) + 1 : 1;

const createAuthorProposal = ({ firstName, lastName, biography = null, submittedBy }) => {
  const timestamp = new Date().toISOString();
  const newProposal = {
    id: nextAuthorProposalId(),
    firstName,
    lastName,
    biography: biography || null,
    status: 'pending',
    submittedBy: Number(submittedBy),
    submittedAt: timestamp,
    decidedBy: null,
    decidedAt: null,
    rejectionReason: null,
  };
  authorProposals.push(newProposal);
  return clone(newProposal);
};

const getAuthorProposalById = (id) =>
  clone(authorProposals.find((proposal) => proposal.id === Number(id)) || null);

const approveAuthorProposal = ({ id, decidedBy }) => {
  const index = authorProposals.findIndex((proposal) => proposal.id === Number(id));
  if (index === -1) {
    return null;
  }
  const proposal = authorProposals[index];
  if (proposal.status !== 'pending') {
    const error = new Error('Proposal is not pending');
    error.status = 409;
    throw error;
  }

  const timestamp = new Date().toISOString();
  let author = authors.find(
    (entry) =>
      entry.firstName.toLowerCase() === proposal.firstName.toLowerCase() &&
      entry.lastName.toLowerCase() === proposal.lastName.toLowerCase(),
  );
  if (!author) {
    author = {
      id: nextAuthorId(),
      firstName: proposal.firstName,
      lastName: proposal.lastName,
      biography: proposal.biography || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    authors.push(author);
  } else if (proposal.biography && !author.biography) {
    author.biography = proposal.biography;
    author.updatedAt = timestamp;
  }

  const updatedProposal = {
    ...proposal,
    status: 'approved',
    decidedBy: Number(decidedBy),
    decidedAt: timestamp,
    rejectionReason: null,
  };
  authorProposals[index] = updatedProposal;

  return {
    proposal: clone(updatedProposal),
    author: clone(author),
  };
};

const rejectAuthorProposal = ({ id, decidedBy, reason }) => {
  const index = authorProposals.findIndex((proposal) => proposal.id === Number(id));
  if (index === -1) {
    return null;
  }
  const proposal = authorProposals[index];
  if (proposal.status !== 'pending') {
    const error = new Error('Proposal is not pending');
    error.status = 409;
    throw error;
  }

  const timestamp = new Date().toISOString();
  const updatedProposal = {
    ...proposal,
    status: 'rejected',
    decidedBy: Number(decidedBy),
    decidedAt: timestamp,
    rejectionReason: reason || null,
  };
  authorProposals[index] = updatedProposal;
  return clone(updatedProposal);
};

module.exports = {
  mockData: {
    users,
    authors,
    books,
    authorBooks,
    genres,
    bookGenres,
    libraryItems,
    wishlistItems,
    reviews,
    friendships,
    bookProposals,
    bookReports,
    authorProposals,
  },
  getUsers,
  getUserById,
  getAdmins,
  setUserRole,
  setUserBypassPermission,
  getFriendships,
  getFriendsOfUser,
  getBooks,
  getBookById,
  getBookAuthors,
  getBookGenres,
  getAuthors,
  getAuthorById,
  getAuthorBooks,
  getGenres,
  getGenreById,
  getGenreBooks,
  getLibraryItems,
  getWishlistItems,
  getReviewsByBook,
  getReviewById,
  getRecentReviews,
  approveReview,
  getBookReports,
  createBookReport,
  closeBookReport,
  getBookProposals,
  getBookProposalsForUser,
  getBookProposalById,
  createBookProposal,
  updateBookProposal,
  approveBookProposal,
  rejectBookProposal,
  getAuthorProposals,
  createAuthorProposal,
  getAuthorProposalById,
  approveAuthorProposal,
  rejectAuthorProposal,
};
