const express = require('express');
const libraryController = require('../controllers/libraryController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', libraryController.listWishlistBooks);
router.post('/:bookId', libraryController.addBookToWishlist);
router.delete('/:bookId', libraryController.removeBookFromWishlist);

module.exports = router;
