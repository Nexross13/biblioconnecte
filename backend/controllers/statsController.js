const { query } = require('../config/db');
const { mockData } = require('../data/mockData');

const toNumber = (value) => Number(value) || 0;

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toISOString().slice(0, 10);
};

const mapTopReaderRow = (row) =>
  row && {
    user: {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
    },
    totalBooks: Number(row.total_books) || 0,
  };

const mapBookRow = (row) =>
  row && {
    id: row.id,
    isbn: row.isbn,
    title: row.title,
    volume: row.volume,
    volumeTitle: row.volume_title || null,
    releaseDate: normalizeDate(row.publication_date),
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };

const mapPopularGenreRow = (row) => ({
  id: row.id,
  name: row.name,
  bookCount: toNumber(row.book_count),
});

const getHighlights = async (req, res, next) => {
  try {
    const useMocks = process.env.USE_MOCKS === 'true';

    if (useMocks) {
      const { users, libraryItems, books, reviews, authorProposals } = mockData;

      let topReader = null;
      if (libraryItems?.length) {
        const counts = libraryItems.reduce((acc, item) => {
          acc[item.userId] = (acc[item.userId] || 0) + 1;
          return acc;
        }, {});

        const bestUserId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
        const bestUser = users.find((user) => user.id === Number(bestUserId));

        if (bestUser) {
          topReader = {
            user: {
              id: bestUser.id,
              firstName: bestUser.firstName,
              lastName: bestUser.lastName,
              email: bestUser.email,
            },
            totalBooks: counts[bestUserId],
          };
        }
      }

      let topRatedBook = null;
      if (reviews?.length) {
        const ratings = reviews.reduce((acc, review) => {
          const bucket = acc.get(review.bookId) || { total: 0, count: 0 };
          bucket.total += review.rating;
          bucket.count += 1;
          acc.set(review.bookId, bucket);
          return acc;
        }, new Map());

        let best = null;
        ratings.forEach((value, bookId) => {
          const average = value.total / value.count;
          if (
            !best ||
            average > best.average ||
            (average === best.average && value.count > best.count)
          ) {
            best = { bookId, average, count: value.count };
          }
        });

        if (best) {
          const book = books.find((entry) => entry.id === best.bookId);
          if (book) {
            topRatedBook = {
              book: {
                id: book.id,
                isbn: book.isbn,
                title: book.title,
                releaseDate: book.releaseDate || null,
                summary: book.summary,
                createdAt: book.createdAt,
              },
              averageRating: Number(best.average.toFixed(2)),
              totalReviews: best.count,
            };
          }
        }
      }

      const latestBooks = (books || [])
        .slice()
        .sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 5)
        .map((book) => ({
          id: book.id,
          isbn: book.isbn,
          title: book.title,
          volume: book.volume,
          volumeTitle: book.volumeTitle || null,
          releaseDate: book.releaseDate || null,
          summary: book.summary,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt || book.createdAt,
        }));

      return res.json({
        topReader,
        topRatedBook,
        latestBooks,
      });
    }

    const [topReaderResult, topRatedResult, latestBooksResult] = await Promise.all([
      query(
        `SELECT u.id,
                u.first_name,
                u.last_name,
                u.email,
                COUNT(li.book_id) AS total_books
         FROM library_items li
         JOIN users u ON u.id = li.user_id
         GROUP BY u.id, u.first_name, u.last_name, u.email
         ORDER BY total_books DESC, u.last_name ASC
         LIMIT 1`,
      ),
      query(
        `SELECT b.id,
                b.isbn,
                b.title,
                b.volume,
                b.volume_title,
                b.publication_date,
                b.summary,
                b.created_at,
                b.updated_at,
                AVG(r.rating)::numeric(10,2) AS average_rating,
                COUNT(r.id) AS review_count
         FROM reviews r
         JOIN books b ON b.id = r.book_id
         GROUP BY b.id,
                  b.isbn,
                  b.title,
                  b.volume,
                  b.volume_title,
                  b.publication_date,
                  b.summary,
                  b.created_at,
                  b.updated_at
         HAVING COUNT(r.id) > 0
         ORDER BY average_rating DESC, review_count DESC
         LIMIT 1`,
      ),
      query(
        `SELECT id,
                isbn,
                title,
                volume,
                volume_title,
                publication_date,
                summary,
                created_at,
                updated_at
         FROM books
         ORDER BY created_at DESC
         LIMIT 5`,
      ),
    ]);

    const topReader = mapTopReaderRow(topReaderResult.rows[0]);

    const topRatedBookRow = topRatedResult.rows[0];
    const topRatedBook =
      topRatedBookRow &&
      Object.assign(
        {
          book: mapBookRow(topRatedBookRow),
        },
        {
          averageRating: Number(topRatedBookRow.average_rating),
          totalReviews: Number(topRatedBookRow.review_count),
        },
      );

    const latestBooks = latestBooksResult.rows.map(mapBookRow);

    return res.json({
      topReader,
      topRatedBook,
      latestBooks,
    });
  } catch (error) {
    next(error);
  }
};

const getPublicOverview = async (req, res, next) => {
  try {
    const useMocks = process.env.USE_MOCKS === 'true';

    if (useMocks) {
      const {
        users = [],
        books = [],
        authors = [],
        genres = [],
        reviews = [],
        friendships = [],
        libraryItems = [],
        bookProposals = [],
        bookGenres = [],
      } = mockData;

      const now = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const threshold = now - THIRTY_DAYS_MS;

      const counts = {
        members: users.length,
        books: books.length,
        authors: authors.length,
        genres: genres.length,
        reviews: reviews.length,
        pendingProposals: bookProposals.filter((proposal) => proposal.status === 'pending').length,
        pendingAuthorProposals: authorProposals.filter((proposal) => proposal.status === 'pending')
          .length,
        libraryEntries: libraryItems.length,
        acceptedFriendships: friendships.filter((friendship) => friendship.status === 'accepted')
          .length,
      };

      const activity = {
        booksAddedLast30Days: books.filter((book) => {
          const createdAt = book.createdAt ? new Date(book.createdAt).getTime() : 0;
          return createdAt >= threshold;
        }).length,
        newMembersLast30Days: users.filter((user) => {
          const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
          return createdAt >= threshold;
        }).length,
      };

      const recentBooks = books
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 3)
        .map((book) => ({
          id: book.id,
          isbn: book.isbn,
          title: book.title,
          volume: book.volume,
          volumeTitle: book.volumeTitle || null,
          releaseDate: book.releaseDate || null,
          summary: book.summary,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt || book.createdAt,
        }));

      const genreTally = bookGenres.reduce((acc, relation) => {
        acc.set(relation.genreId, (acc.get(relation.genreId) || 0) + 1);
        return acc;
      }, new Map());

      const popularGenres = genres
        .map((genre) => ({
          id: genre.id,
          name: genre.name,
          bookCount: genreTally.get(genre.id) || 0,
        }))
        .sort(
          (a, b) =>
            b.bookCount - a.bookCount || a.name.localeCompare(b.name),
        )
        .slice(0, 3);

      return res.json({
        counts,
        activity,
        recentBooks,
        popularGenres,
      });
    }

    const [
      membersResult,
      booksResult,
      authorsResult,
      genresResult,
      reviewsResult,
      pendingProposalsResult,
      pendingAuthorProposalsResult,
      libraryEntriesResult,
      friendshipsResult,
      booksLast30DaysResult,
      membersLast30DaysResult,
      recentBooksResult,
      popularGenresResult,
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM books'),
      query('SELECT COUNT(*) FROM authors'),
      query('SELECT COUNT(*) FROM genres'),
      query('SELECT COUNT(*) FROM reviews'),
      query("SELECT COUNT(*) FROM book_proposals WHERE status = 'pending'"),
      query("SELECT COUNT(*) FROM author_proposals WHERE status = 'pending'"),
      query('SELECT COUNT(*) FROM library_items'),
      query("SELECT COUNT(*) FROM friendships WHERE status = 'accepted'"),
      query("SELECT COUNT(*) FROM books WHERE created_at >= NOW() - INTERVAL '30 days'"),
      query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"),
      query(
        `SELECT id,
                isbn,
                title,
                volume,
                volume_title,
                publication_date,
                summary,
                created_at,
                updated_at
         FROM books
         ORDER BY created_at DESC
         LIMIT 3`,
      ),
      query(
        `SELECT g.id,
                g.name,
                COUNT(bg.book_id) AS book_count
         FROM genres g
         LEFT JOIN book_genres bg ON bg.genre_id = g.id
         GROUP BY g.id, g.name
         ORDER BY book_count DESC, g.name ASC
         LIMIT 3`,
      ),
    ]);

    const counts = {
      members: toNumber(membersResult.rows[0]?.count),
      books: toNumber(booksResult.rows[0]?.count),
      authors: toNumber(authorsResult.rows[0]?.count),
      genres: toNumber(genresResult.rows[0]?.count),
      reviews: toNumber(reviewsResult.rows[0]?.count),
      pendingProposals: toNumber(pendingProposalsResult.rows[0]?.count),
      pendingAuthorProposals: toNumber(pendingAuthorProposalsResult.rows[0]?.count),
      libraryEntries: toNumber(libraryEntriesResult.rows[0]?.count),
      acceptedFriendships: toNumber(friendshipsResult.rows[0]?.count),
    };

    const activity = {
      booksAddedLast30Days: toNumber(booksLast30DaysResult.rows[0]?.count),
      newMembersLast30Days: toNumber(membersLast30DaysResult.rows[0]?.count),
    };

    const recentBooks = recentBooksResult.rows.map(mapBookRow);
    const popularGenres = popularGenresResult.rows.map(mapPopularGenreRow);

    return res.json({
      counts,
      activity,
      recentBooks,
      popularGenres,
    });
  } catch (error) {
    next(error);
  }
};

const ADMIN_TIMELINE_DAYS = 30;

const getAdminOverview = async (req, res, next) => {
  try {
    const useMocks = process.env.USE_MOCKS === 'true';
    const timelineLength = ADMIN_TIMELINE_DAYS;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (timelineLength - 1));
    const startDateISO = startDate.toISOString().slice(0, 10);

    if (useMocks) {
      const {
        users = [],
        books = [],
        bookProposals = [],
        authorProposals: mockAuthorProposals = [],
        bookReports: mockBookReports = [],
      } = mockData;

      const totals = {
        books: books.length,
        members: users.length,
        pendingProposals: bookProposals.filter((proposal) => proposal.status === 'pending').length,
        pendingAuthorProposals: mockAuthorProposals.filter((proposal) => proposal.status === 'pending')
          .length,
        pendingReports: mockBookReports.filter((report) => report.status === 'open').length,
      };

      const dailyBooks = books.reduce((acc, book) => {
        if (!book.createdAt) {
          return acc;
        }
        const key = normalizeDate(book.createdAt);
        if (!key) {
          return acc;
        }
        acc.set(key, (acc.get(key) || 0) + 1);
        return acc;
      }, new Map());

      const dailyMembers = users.reduce((acc, member) => {
        if (!member.createdAt) {
          return acc;
        }
        const key = normalizeDate(member.createdAt);
        if (!key) {
          return acc;
        }
        acc.set(key, (acc.get(key) || 0) + 1);
        return acc;
      }, new Map());

      let cumulativeBooks = books.filter((book) => {
        const created = book.createdAt ? new Date(book.createdAt) : null;
        return created && created < startDate;
      }).length;

      let cumulativeMembers = users.filter((user) => {
        const created = user.createdAt ? new Date(user.createdAt) : null;
        return created && created < startDate;
      }).length;

      const timeline = Array.from({ length: timelineLength }, (_, index) => {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + index);
        const key = current.toISOString().slice(0, 10);
        cumulativeBooks += dailyBooks.get(key) || 0;
        cumulativeMembers += dailyMembers.get(key) || 0;
        return {
          date: key,
          books: cumulativeBooks,
          members: cumulativeMembers,
        };
      });

      return res.json({
        totals,
        timeline,
      });
    }

    const [
      totalBooksResult,
      totalMembersResult,
      pendingProposalsResult,
      pendingAuthorProposalsResult,
      pendingReportsResult,
      initialBooksResult,
      initialMembersResult,
      dailyBooksResult,
      dailyMembersResult,
    ] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM books'),
      query('SELECT COUNT(*) AS count FROM users'),
      query("SELECT COUNT(*) AS count FROM book_proposals WHERE status = 'pending'"),
      query("SELECT COUNT(*) AS count FROM author_proposals WHERE status = 'pending'"),
      query("SELECT COUNT(*) AS count FROM book_reports WHERE status = 'open'"),
      query('SELECT COUNT(*) AS count FROM books WHERE created_at < $1', [startDateISO]),
      query('SELECT COUNT(*) AS count FROM users WHERE created_at < $1', [startDateISO]),
      query(
        `SELECT created_at::date AS date, COUNT(*) AS count
         FROM books
         WHERE created_at >= $1
         GROUP BY created_at::date`,
        [startDateISO],
      ),
      query(
        `SELECT created_at::date AS date, COUNT(*) AS count
         FROM users
         WHERE created_at >= $1
         GROUP BY created_at::date`,
        [startDateISO],
      ),
    ]);

    const totals = {
      books: toNumber(totalBooksResult.rows[0]?.count),
      members: toNumber(totalMembersResult.rows[0]?.count),
      pendingProposals: toNumber(pendingProposalsResult.rows[0]?.count),
      pendingAuthorProposals: toNumber(pendingAuthorProposalsResult.rows[0]?.count),
      pendingReports: toNumber(pendingReportsResult.rows[0]?.count),
    };

    const dailyBooks = dailyBooksResult.rows.reduce((acc, row) => {
      const key = normalizeDate(row.date);
      if (key) {
        acc.set(key, toNumber(row.count));
      }
      return acc;
    }, new Map());

    const dailyMembers = dailyMembersResult.rows.reduce((acc, row) => {
      const key = normalizeDate(row.date);
      if (key) {
        acc.set(key, toNumber(row.count));
      }
      return acc;
    }, new Map());

    let cumulativeBooks = toNumber(initialBooksResult.rows[0]?.count);
    let cumulativeMembers = toNumber(initialMembersResult.rows[0]?.count);

    const timeline = Array.from({ length: timelineLength }, (_, index) => {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + index);
      const key = current.toISOString().slice(0, 10);
      cumulativeBooks += dailyBooks.get(key) || 0;
      cumulativeMembers += dailyMembers.get(key) || 0;
      return {
        date: key,
        books: cumulativeBooks,
        members: cumulativeMembers,
      };
    });

    return res.json({
      totals,
      timeline,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHighlights,
  getPublicOverview,
  getAdminOverview,
};
