const { query } = require('../config/db');

const mapReviewRow = (row) => {
  if (!row) {
    return null;
  }

  const review = {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    moderationStatus: row.moderation_status || 'pending',
    moderatedAt: row.moderated_at,
    moderatedBy: row.moderated_by || null,
  };

  if (row.author_first_name || row.author_last_name) {
    review.author = {
      firstName: row.author_first_name,
      lastName: row.author_last_name,
    };
  }

  if (row.moderator_first_name || row.moderator_last_name) {
    review.moderator = {
      firstName: row.moderator_first_name,
      lastName: row.moderator_last_name,
    };
  }

  if (row.book_title) {
    review.book = {
      id: row.book_id,
      title: row.book_title,
      volume: row.volume,
      volumeTitle: row.volume_title || null,
    };
  }

  return review;
};

const listByBook = async (bookId) => {
  const result = await query(
    `SELECT r.id,
            r.user_id,
            r.book_id,
            r.rating,
            r.comment,
            r.created_at,
            r.updated_at,
            r.moderation_status,
            r.moderated_by,
            r.moderated_at,
            u.first_name AS author_first_name,
            u.last_name  AS author_last_name,
            mu.first_name AS moderator_first_name,
            mu.last_name  AS moderator_last_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN users mu ON mu.id = r.moderated_by
     WHERE r.book_id = $1
     ORDER BY r.created_at DESC`,
    [bookId],
  );
  return result.rows.map(mapReviewRow);
};

const createReview = async ({ userId, bookId, rating, comment }) => {
  const result = await query(
    `INSERT INTO reviews (user_id, book_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, book_id, rating, comment, created_at, updated_at, moderation_status, moderated_by, moderated_at`,
    [userId, bookId, rating, comment],
  );
  return result.rows[0];
};

const updateReview = async ({ reviewId, rating, comment }) => {
  const result = await query(
    `UPDATE reviews
     SET rating = $2,
         comment = $3,
         moderation_status = 'pending',
         moderated_by = NULL,
         moderated_at = NULL,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, book_id, rating, comment, created_at, updated_at, moderation_status, moderated_by, moderated_at`,
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
    `SELECT id,
            user_id,
            book_id,
            rating,
            comment,
            created_at,
            updated_at,
            moderation_status,
            moderated_by,
            moderated_at
     FROM reviews
     WHERE id = $1`,
    [reviewId],
  );
  return result.rows[0];
};

const findWithDetails = async (reviewId) => {
  const result = await query(
    `SELECT r.id,
            r.user_id,
            r.book_id,
            r.rating,
            r.comment,
            r.created_at,
            r.updated_at,
            r.moderation_status,
            r.moderated_by,
            r.moderated_at,
            u.first_name,
            u.last_name,
            u.email,
            b.title AS book_title
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN books b ON b.id = r.book_id
     WHERE r.id = $1`,
    [reviewId],
  );
  return result.rows[0];
};

const findByIdWithAuthor = async (reviewId) => {
  const result = await query(
    `SELECT r.id,
            r.user_id,
            r.book_id,
            r.rating,
            r.comment,
            r.created_at,
            r.updated_at,
            r.moderation_status,
            r.moderated_by,
            r.moderated_at,
            u.first_name AS author_first_name,
            u.last_name  AS author_last_name,
            mu.first_name AS moderator_first_name,
            mu.last_name  AS moderator_last_name,
            b.title AS book_title,
            b.volume,
            b.volume_title
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN users mu ON mu.id = r.moderated_by
     JOIN books b ON b.id = r.book_id
     WHERE r.id = $1`,
    [reviewId],
  );
  return mapReviewRow(result.rows[0]);
};

const listLatest = async ({ limit = 20 } = {}) => {
  const cappedLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const result = await query(
    `SELECT r.id,
            r.user_id,
            r.book_id,
            r.rating,
            r.comment,
            r.created_at,
            r.updated_at,
            r.moderation_status,
            r.moderated_by,
            r.moderated_at,
            u.first_name AS author_first_name,
            u.last_name  AS author_last_name,
            u.email,
            mu.first_name AS moderator_first_name,
            mu.last_name  AS moderator_last_name,
            b.title AS book_title,
            b.volume,
            b.volume_title
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN users mu ON mu.id = r.moderated_by
     JOIN books b ON b.id = r.book_id
     ORDER BY r.created_at DESC
     LIMIT $1`,
    [cappedLimit],
  );

  return result.rows.map(mapReviewRow);
};

const approveReview = async ({ reviewId, moderatorId }) => {
  const updateResult = await query(
    `UPDATE reviews
     SET moderation_status = 'approved',
         moderated_by = $2,
         moderated_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [reviewId, moderatorId],
  );

  if (updateResult.rowCount === 0) {
    return null;
  }

  return findByIdWithAuthor(reviewId);
};

module.exports = {
  listByBook,
  createReview,
  updateReview,
  deleteReview,
  findById,
  findWithDetails,
  findByIdWithAuthor,
  listLatest,
  approveReview,
};
