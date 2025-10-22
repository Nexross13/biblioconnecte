const clone = (value) => JSON.parse(JSON.stringify(value));

const users = [
  {
    id: 1,
    firstName: 'Alice',
    lastName: 'Martin',
    email: 'alice@biblio.test',
    createdAt: '2024-01-10T08:00:00.000Z',
  },
  {
    id: 2,
    firstName: 'Benoit',
    lastName: 'Durand',
    email: 'benoit@biblio.test',
    createdAt: '2024-01-12T10:15:00.000Z',
  },
  {
    id: 3,
    firstName: 'Claire',
    lastName: 'Faure',
    email: 'claire@biblio.test',
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

const books = [
  {
    id: 1,
    title: 'Le Petit Prince',
    isbn: '9780156013987',
    edition: 'Gallimard',
    volume: '1',
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
    summary: 'Fable politique sur une révolte animale.',
    createdAt: '2024-01-08T00:00:00.000Z',
    updatedAt: '2024-01-08T00:00:00.000Z',
  },
];

const authorBooks = [
  { bookId: 1, authorId: 1 },
  { bookId: 2, authorId: 2 },
  { bookId: 3, authorId: 2 },
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
];

const libraryItems = [
  { userId: 1, bookId: 1, addedAt: '2024-03-01T12:00:00.000Z' },
  { userId: 1, bookId: 2, addedAt: '2024-03-05T17:20:00.000Z' },
  { userId: 2, bookId: 3, addedAt: '2024-03-02T14:40:00.000Z' },
];

const wishlistItems = [
  { userId: 1, bookId: 3, addedAt: '2024-03-10T08:35:00.000Z' },
  { userId: 2, bookId: 1, addedAt: '2024-03-11T09:15:00.000Z' },
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
  },
  {
    id: 2,
    userId: 1,
    bookId: 2,
    rating: 4,
    comment: 'Vision glaçante mais brillante.',
    createdAt: '2024-03-15T11:45:00.000Z',
    updatedAt: '2024-03-15T11:45:00.000Z',
  },
];

const friendships = [
  {
    requesterId: 1,
    addresseeId: 2,
    status: 'accepted',
    requestedAt: '2024-02-01T09:00:00.000Z',
    acceptedAt: '2024-02-02T10:00:00.000Z',
  },
  {
    requesterId: 2,
    addresseeId: 3,
    status: 'pending',
    requestedAt: '2024-02-10T11:30:00.000Z',
  },
];

const getUsers = () => clone(users);
const getUserById = (id) => clone(users.find((user) => user.id === Number(id)) || null);

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
  const lower = search.toLowerCase();
  return clone(
    books.filter(
      (book) =>
        book.title.toLowerCase().includes(lower) ||
        (book.summary && book.summary.toLowerCase().includes(lower)),
    ),
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
            addedAt: item.addedAt,
          }
        : null;
    })
    .filter(Boolean);

  return clone(matches);
};

const getReviewsByBook = (bookId) => {
  const matches = reviews
    .filter((review) => review.bookId === Number(bookId))
    .map((review) => {
      const author = users.find((user) => user.id === review.userId);
      return {
        ...review,
        author: author
          ? {
              firstName: author.firstName,
              lastName: author.lastName,
            }
          : null,
      };
    });

  return clone(matches);
};

const getReviewById = (reviewId) =>
  clone(reviews.find((review) => review.id === Number(reviewId)) || null);

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
  },
  getUsers,
  getUserById,
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
};
