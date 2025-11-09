const { query } = require('../config/db');

const listGenres = async () => {
  const result = await query(
    `SELECT id, name, created_at
     FROM genres
     ORDER BY name ASC`,
  );
  return result.rows.map((row) => ({ id: row.id, name: row.name, createdAt: row.created_at }));
};

const getGenreBooks = async (genreId) => {
  const result = await query(
    `SELECT b.id, b.title, b.isbn, b.edition, b.volume, b.volume_title
     FROM book_genres bg
     JOIN books b ON b.id = bg.book_id
     WHERE bg.genre_id = $1
     ORDER BY b.title ASC`,
    [genreId],
  );
  return result.rows;
};

const createGenre = async ({ name }) => {
  const result = await query(
    `INSERT INTO genres (name)
     VALUES ($1)
     RETURNING id, name, created_at`,
    [name],
  );
  return { id: result.rows[0].id, name: result.rows[0].name, createdAt: result.rows[0].created_at };
};

const deleteGenre = async (id) => {
  const result = await query(`DELETE FROM genres WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0];
};

module.exports = {
  listGenres,
  getGenreBooks,
  createGenre,
  deleteGenre,
};
