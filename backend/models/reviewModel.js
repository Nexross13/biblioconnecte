const { query } = require('../config/db');

const listByBook = async (bookId) => {
  const result = await query(
    `SELECT r.id, r.user_id, r.book_id, r.rating, r.comment, r.created_at, r.updated_at,
            u.first_name, u.last_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.book_id = $1
     ORDER BY r.created_at DESC`,
    [bookId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      firstName: row.first_name,
      lastName: row.last_name,
    },
  }));
};

const createReview = async ({ userId, bookId, rating, comment }) => {
  const result = await query(
    `INSERT INTO reviews (user_id, book_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, book_id, rating, comment, created_at, updated_at`,
    [userId, bookId, rating, comment],
  );
  return result.rows[0];
};

const updateReview = async ({ reviewId, rating, comment }) => {
  const result = await query(
    `UPDATE reviews
     SET rating = $2,
         comment = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, book_id, rating, comment, created_at, updated_at`,
    [reviewId, rating, comment],
  );
  return result.rows[0];
};

const deleteReview = async (reviewId) => {
  const result = await query(`DELETE FROM reviews WHERE id = $1 RETURNING id`, [reviewId]);
  return result.rows[0];
};

const findById = async (reviewId) => {
  const result = await query(
    `SELECT r.id, r.user_id, r.book_id, r.rating, r.comment, r.created_at, r.updated_at
     FROM reviews r
     WHERE r.id = $1`,
    [reviewId],
  );
  return result.rows[0];
};

module.exports = {
  listByBook,
  createReview,
  updateReview,
  deleteReview,
  findById,
};
