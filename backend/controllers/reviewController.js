const reviewModel = require('../models/reviewModel');
const {
  getReviewsByBook: getMockReviewsByBook,
  getReviewById: getMockReviewById,
} = require('../data/mockData');

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
      const err = new Error('You can only delete your own reviews');
      err.status = 403;
      throw err;
    }

    if (process.env.USE_MOCKS !== 'true') {
      await reviewModel.deleteReview(reviewId);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listReviewsForBook,
  createReviewForBook,
  updateReview,
  deleteReview,
};
