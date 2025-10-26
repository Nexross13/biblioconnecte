const { query } = require('../config/db');
const { mockData } = require('../data/mockData');

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
    title: row.title,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };

const getHighlights = async (req, res, next) => {
  try {
    const useMocks = process.env.USE_MOCKS === 'true';

    if (useMocks) {
      const { users, libraryItems, books, reviews } = mockData;

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
                title: book.title,
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
          title: book.title,
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
                b.title,
                b.summary,
                b.created_at,
                b.updated_at,
                AVG(r.rating)::numeric(10,2) AS average_rating,
                COUNT(r.id) AS review_count
         FROM reviews r
         JOIN books b ON b.id = r.book_id
         GROUP BY b.id, b.title, b.summary, b.created_at, b.updated_at
         HAVING COUNT(r.id) > 0
         ORDER BY average_rating DESC, review_count DESC
         LIMIT 1`,
      ),
      query(
        `SELECT id,
                title,
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

module.exports = {
  getHighlights,
};
