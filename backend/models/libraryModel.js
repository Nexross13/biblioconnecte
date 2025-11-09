const { query } = require('../config/db');

const listLibraryBooks = async (userId) => {
  const result = await query(
    `SELECT b.id,
            b.title,
            b.isbn,
            b.edition,
            b.volume,
            b.volume_title,
            b.publication_date,
            li.added_at,
            COALESCE(
              ARRAY_REMOVE(
                ARRAY_AGG(DISTINCT NULLIF(TRIM(COALESCE(a.first_name, '') || ' ' || COALESCE(a.last_name, '')), '')),
                NULL
              ),
              ARRAY[]::TEXT[]
            ) AS author_names,
            COALESCE(
              ARRAY_REMOVE(ARRAY_AGG(DISTINCT g.name), NULL),
              ARRAY[]::TEXT[]
            ) AS genre_names
     FROM library_items li
     JOIN books b ON b.id = li.book_id
     LEFT JOIN book_authors ba ON ba.book_id = b.id
     LEFT JOIN authors a ON a.id = ba.author_id
     LEFT JOIN book_genres bg ON bg.book_id = b.id
     LEFT JOIN genres g ON g.id = bg.genre_id
     WHERE li.user_id = $1
     GROUP BY b.id, b.title, b.isbn, b.edition, b.volume, b.volume_title, b.publication_date, li.added_at
     ORDER BY li.added_at DESC`,
    [userId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    isbn: row.isbn,
    edition: row.edition,
    volume: row.volume,
    volumeTitle: row.volume_title || null,
    releaseDate: row.publication_date || null,
    addedAt: row.added_at,
    authorNames: row.author_names,
    genreNames: row.genre_names,
  }));
};

const addLibraryBook = async ({ userId, bookId }) => {
  const result = await query(
    `INSERT INTO library_items (user_id, book_id, added_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, book_id) DO UPDATE SET added_at = EXCLUDED.added_at
     RETURNING user_id, book_id, added_at`,
    [userId, bookId],
  );
  await query('DELETE FROM wishlist_items WHERE user_id = $1 AND book_id = $2', [userId, bookId]);
  return result.rows[0];
};

const removeLibraryBook = async ({ userId, bookId }) => {
  const result = await query(
    `DELETE FROM library_items WHERE user_id = $1 AND book_id = $2 RETURNING user_id, book_id`,
    [userId, bookId],
  );
  return result.rows[0];
};

const listWishlistBooks = async (userId) => {
  const result = await query(
    `SELECT b.id,
            b.title,
            b.isbn,
            b.edition,
            b.volume,
            b.volume_title,
            b.publication_date,
            wi.added_at,
            COALESCE(
              ARRAY_REMOVE(
                ARRAY_AGG(DISTINCT NULLIF(TRIM(COALESCE(a.first_name, '') || ' ' || COALESCE(a.last_name, '')), '')),
                NULL
              ),
              ARRAY[]::TEXT[]
            ) AS author_names,
            COALESCE(
              ARRAY_REMOVE(ARRAY_AGG(DISTINCT g.name), NULL),
              ARRAY[]::TEXT[]
            ) AS genre_names
     FROM wishlist_items wi
     JOIN books b ON b.id = wi.book_id
     LEFT JOIN book_authors ba ON ba.book_id = b.id
     LEFT JOIN authors a ON a.id = ba.author_id
     LEFT JOIN book_genres bg ON bg.book_id = b.id
     LEFT JOIN genres g ON g.id = bg.genre_id
     WHERE wi.user_id = $1
     GROUP BY b.id, b.title, b.isbn, b.edition, b.volume, b.volume_title, b.publication_date, wi.added_at
     ORDER BY wi.added_at DESC`,
    [userId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    isbn: row.isbn,
    edition: row.edition,
    volume: row.volume,
    volumeTitle: row.volume_title || null,
    releaseDate: row.publication_date || null,
    addedAt: row.added_at,
    authorNames: row.author_names,
    genreNames: row.genre_names,
  }));
};

const addWishlistBook = async ({ userId, bookId }) => {
  const result = await query(
    `INSERT INTO wishlist_items (user_id, book_id, added_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, book_id) DO UPDATE SET added_at = EXCLUDED.added_at
     RETURNING user_id, book_id, added_at`,
    [userId, bookId],
  );
  return result.rows[0];
};

const removeWishlistBook = async ({ userId, bookId }) => {
  const result = await query(
    `DELETE FROM wishlist_items WHERE user_id = $1 AND book_id = $2 RETURNING user_id, book_id`,
    [userId, bookId],
  );
  return result.rows[0];
};

module.exports = {
  listLibraryBooks,
  addLibraryBook,
  removeLibraryBook,
  listWishlistBooks,
  addWishlistBook,
  removeWishlistBook,
};
