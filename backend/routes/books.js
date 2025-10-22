const express = require('express');
const bookController = require('../controllers/bookController');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, bookController.listBooks);
router.get('/:id', authenticate, bookController.getBookById);
router.get('/:id/authors', authenticate, bookController.getBookAuthors);
router.get('/:id/genres', authenticate, bookController.getBookGenres);
router.post('/', authenticate, bookController.createBook);
router.put('/:id', authenticate, bookController.updateBook);
router.delete('/:id', authenticate, bookController.deleteBook);

router.get('/:bookId/reviews', authenticate, reviewController.listReviewsForBook);
router.post('/:bookId/reviews', authenticate, reviewController.createReviewForBook);

module.exports = router;
