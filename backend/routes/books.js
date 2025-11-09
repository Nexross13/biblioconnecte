const express = require('express');
const bookController = require('../controllers/bookController');
const reviewController = require('../controllers/reviewController');
const bookReportController = require('../controllers/bookReportController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, bookController.listBooks);
router.get('/:id/series-prefill', authenticate, bookController.getSeriesPrefill);
router.get('/:id', authenticate, bookController.getBookById);
router.get('/:id/authors', authenticate, bookController.getBookAuthors);
router.get('/:id/genres', authenticate, bookController.getBookGenres);
router.post('/', authenticate, bookController.createBook);
router.put('/:id', authenticate, requireAdmin, bookController.updateBook);
router.delete('/:id', authenticate, requireAdmin, bookController.deleteBook);

router.get('/:bookId/reviews', authenticate, reviewController.listReviewsForBook);
router.post('/:bookId/reviews', authenticate, reviewController.createReviewForBook);
router.post('/:bookId/reports', authenticate, bookReportController.createReport);

module.exports = router;
