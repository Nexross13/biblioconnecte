const { query } = require('../config/db');

const mapAuthor = (row) =>
  row && {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    biography: row.biography,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const listAuthors = async ({ search } = {}) => {
  const values = [];
  const conditions = [];

  if (search && search.trim().length) {
    values.push(`%${search.trim().toLowerCase()}%`);
    conditions.push(
      `(LOWER(authors.first_name) LIKE $${values.length} OR LOWER(authors.last_name) LIKE $${values.length} OR LOWER(CONCAT(authors.first_name, ' ', authors.last_name)) LIKE $${values.length})`,
    );
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT id, first_name, last_name, biography, created_at, updated_at
     FROM authors
     ${whereClause}
     ORDER BY last_name ASC, first_name ASC`,
    values,
  );
  return result.rows.map(mapAuthor);
};

const findById = async (id) => {
  const result = await query(
    `SELECT id, first_name, last_name, biography, created_at, updated_at
     FROM authors WHERE id = $1`,
    [id],
  );
  return mapAuthor(result.rows[0]);
};

const getAuthorBooks = async (authorId) => {
  const result = await query(
    `SELECT b.id, b.title, b.isbn, b.edition, b.volume, b.volume_title, b.summary
     FROM book_authors ba
     JOIN books b ON b.id = ba.book_id
     WHERE ba.author_id = $1
     ORDER BY b.title ASC`,
    [authorId],
  );
  return result.rows;
};

const createAuthor = async ({ firstName, lastName, biography }) => {
  const result = await query(
    `INSERT INTO authors (first_name, last_name, biography)
     VALUES ($1, $2, $3)
     RETURNING id, first_name, last_name, biography, created_at, updated_at`,
    [firstName, lastName, biography],
  );
  return mapAuthor(result.rows[0]);
};

const updateAuthor = async (id, { firstName, lastName, biography }) => {
  const result = await query(
    `UPDATE authors
     SET first_name = $2,
         last_name = $3,
         biography = $4,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, first_name, last_name, biography, created_at, updated_at`,
    [id, firstName, lastName, biography],
  );
  return mapAuthor(result.rows[0]);
};

const deleteAuthor = async (id) => {
  const result = await query(`DELETE FROM authors WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0];
};

module.exports = {
  listAuthors,
  findById,
  getAuthorBooks,
  createAuthor,
  updateAuthor,
  deleteAuthor,
};
