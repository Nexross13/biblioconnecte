const reviewModel = require('../models/reviewModel');
const {
  getReviewsByBook: getMockReviewsByBook,
  getReviewById: getMockReviewById,
  getRecentReviews: getMockRecentReviews,
  approveReview: approveMockReview,
} = require('../data/mockData');
const { sendReviewDeletionNotification } = require('../services/emailService');

const listReviewsForBook = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const reviews = getMockReviewsByBook(req.params.bookId);
      return res.json({ reviews });
    }
    const reviews = await reviewModel.listByBook(req.params.bookId);
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

const createReviewForBook = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const { comment } = req.body;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      const err = new Error('Rating must be an integer between 1 and 5');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.status(201).json({
        review: {
          id: 850,
          userId: Number(req.user.id),
          bookId: Number(req.params.bookId),
          rating,
          comment: comment || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const review = await reviewModel.createReview({
      userId: req.user.id,
      bookId: Number(req.params.bookId),
      rating,
      comment,
    });

    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
};

const listRecentReviews = async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit) ? requestedLimit : 20;
    const useMocks = process.env.USE_MOCKS === 'true';
    const reviews = useMocks
      ? getMockRecentReviews({ limit })
      : await reviewModel.listLatest({ limit });
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    const existing =
      process.env.USE_MOCKS === 'true'
        ? getMockReviewById(reviewId)
        : await reviewModel.findById(reviewId);
    if (!existing) {
      const err = new Error('Review not found');
      err.status = 404;
      throw err;
    }

    const ownerId = existing.userId ?? existing.user_id;

    if (Number(ownerId) !== Number(req.user.id)) {
      const err = new Error('You can only update your own reviews');
      err.status = 403;
      throw err;
    }

    const rating =
      req.body.rating === undefined ? existing.rating : Number(req.body.rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      const err = new Error('Rating must be an integer between 1 and 5');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.json({
        review: {
          ...existing,
          rating,
          comment: req.body.comment ?? existing.comment,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const review = await reviewModel.updateReview({
      reviewId,
      rating,
      comment: req.body.comment ?? existing.comment,
    });

    res.json({ review });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    const useMocks = process.env.USE_MOCKS === 'true';
    const existing = useMocks
      ? getMockReviewById(reviewId)
      : await reviewModel.findWithDetails(reviewId);
    if (!existing) {
      const err = new Error('Review not found');
      err.status = 404;
      throw err;
    }

    const ownerId = existing.userId ?? existing.user_id;
    const isOwner = Number(ownerId) === Number(req.user.id);
    const isModerator = Boolean(req.user?.isModerator);

    if (!isOwner && !isModerator) {
      const err = new Error('You do not have permission to delete this review');
      err.status = 403;
      throw err;
    }

    const rawReason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!isOwner && !rawReason.length) {
      const err = new Error('A deletion reason is required for moderators');
      err.status = 400;
      throw err;
    }

    if (!useMocks) {
      await reviewModel.deleteReview(reviewId);
      if (!isOwner && existing.email) {
        sendReviewDeletionNotification({
          reviewer: {
            email: existing.email,
            firstName: existing.first_name,
            lastName: existing.last_name,
          },
          moderator: req.user,
          bookTitle: existing.book_title,
          reason: rawReason,
          comment: existing.comment,
        }).catch((error) => {
          console.error('Unable to send review deletion email', error.message);
        });
      }
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const approveReview = async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    if (!Number.isInteger(reviewId)) {
      const err = new Error('Review id must be a number');
      err.status = 400;
      throw err;
    }

    const useMocks = process.env.USE_MOCKS === 'true';

    if (useMocks) {
      const updated = approveMockReview({ reviewId, moderatorId: Number(req.user.id) });
      if (!updated) {
        const err = new Error('Review not found');
        err.status = 404;
        throw err;
      }
      return res.json({ review: updated });
    }

    const review = await reviewModel.approveReview({
      reviewId,
      moderatorId: req.user.id,
    });

    if (!review) {
      const err = new Error('Review not found');
      err.status = 404;
      throw err;
    }

    res.json({ review });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listReviewsForBook,
  createReviewForBook,
  updateReview,
  deleteReview,
  listRecentReviews,
  approveReview,
};
