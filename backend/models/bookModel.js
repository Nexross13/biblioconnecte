const { query } = require('../config/db');

const mapBook = (row) =>
  row && {
    id: row.id,
    title: row.title,
    isbn: row.isbn,
    edition: row.edition,
    volume: row.volume,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const listBooks = async ({ search, limit = 25, offset = 0 } = {}) => {
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    conditions.push(`(LOWER(b.title) LIKE $${values.length} OR LOWER(b.summary) LIKE $${values.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  values.push(limit, offset);

  const result = await query(
    `SELECT b.id, b.title, b.isbn, b.edition, b.volume, b.summary, b.created_at, b.updated_at
     FROM books b
     ${whereClause}
     ORDER BY b.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return result.rows.map(mapBook);
};

const findById = async (id) => {
  const result = await query(
    `SELECT b.id, b.title, b.isbn, b.edition, b.volume, b.summary, b.created_at, b.updated_at
     FROM books b
     WHERE b.id = $1`,
    [id],
  );
  return mapBook(result.rows[0]);
};

const createBook = async ({ title, isbn, edition, volume, summary }) => {
  const result = await query(
    `INSERT INTO books (title, isbn, edition, volume, summary)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, isbn, edition, volume, summary, created_at, updated_at`,
    [title, isbn, edition, volume, summary],
  );
  return mapBook(result.rows[0]);
};

const updateBook = async (id, { title, isbn, edition, volume, summary }) => {
  const result = await query(
    `UPDATE books
     SET title = $2,
         isbn = $3,
         edition = $4,
         volume = $5,
         summary = $6,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, title, isbn, edition, volume, summary, created_at, updated_at`,
    [id, title, isbn, edition, volume, summary],
  );
  return mapBook(result.rows[0]);
};

const deleteBook = async (id) => {
  const result = await query(`DELETE FROM books WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0];
};

const getBookAuthors = async (bookId) => {
  const result = await query(
    `SELECT a.id, a.first_name, a.last_name, a.biography
     FROM book_authors ba
     JOIN authors a ON a.id = ba.author_id
     WHERE ba.book_id = $1
     ORDER BY a.last_name ASC`,
    [bookId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    biography: row.biography,
  }));
};

const getBookGenres = async (bookId) => {
  const result = await query(
    `SELECT g.id, g.name
     FROM book_genres bg
     JOIN genres g ON g.id = bg.genre_id
     WHERE bg.book_id = $1
     ORDER BY g.name ASC`,
    [bookId],
  );
  return result.rows.map((row) => ({ id: row.id, name: row.name }));
};

const setBookAuthors = async (bookId, authorIds = []) => {
  await query(`DELETE FROM book_authors WHERE book_id = $1`, [bookId]);
  const uniqueAuthorIds = [...new Set(authorIds)];
  if (!uniqueAuthorIds.length) {
    return [];
  }

  const values = uniqueAuthorIds
    .map((_, index) => `($1, $${index + 2})`)
    .join(', ');

  await query(`INSERT INTO book_authors (book_id, author_id) VALUES ${values}`, [
    bookId,
    ...uniqueAuthorIds,
  ]);

  return getBookAuthors(bookId);
};

const setBookGenres = async (bookId, genreIds = []) => {
  await query(`DELETE FROM book_genres WHERE book_id = $1`, [bookId]);
  const uniqueGenreIds = [...new Set(genreIds)];
  if (!uniqueGenreIds.length) {
    return [];
  }

  const values = uniqueGenreIds
    .map((_, index) => `($1, $${index + 2})`)
    .join(', ');

  await query(`INSERT INTO book_genres (book_id, genre_id) VALUES ${values}`, [
    bookId,
    ...uniqueGenreIds,
  ]);

  return getBookGenres(bookId);
};

module.exports = {
  listBooks,
  findById,
  createBook,
  updateBook,
  deleteBook,
  getBookAuthors,
  getBookGenres,
  setBookAuthors,
  setBookGenres,
};
