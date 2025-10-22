const { query } = require('../config/db');

const listLibraryBooks = async (userId) => {
  const result = await query(
    `SELECT b.id, b.title, b.isbn, b.edition, b.volume, li.added_at
     FROM library_items li
     JOIN books b ON b.id = li.book_id
     WHERE li.user_id = $1
     ORDER BY li.added_at DESC`,
    [userId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    isbn: row.isbn,
    edition: row.edition,
    volume: row.volume,
    addedAt: row.added_at,
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
    `SELECT b.id, b.title, b.isbn, b.edition, b.volume, wi.added_at
     FROM wishlist_items wi
     JOIN books b ON b.id = wi.book_id
     WHERE wi.user_id = $1
     ORDER BY wi.added_at DESC`,
    [userId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    isbn: row.isbn,
    edition: row.edition,
    volume: row.volume,
    addedAt: row.added_at,
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
