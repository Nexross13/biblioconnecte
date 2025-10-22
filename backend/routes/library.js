const express = require('express');
const libraryController = require('../controllers/libraryController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', libraryController.listLibraryBooks);
router.post('/:bookId', libraryController.addBookToLibrary);
router.delete('/:bookId', libraryController.removeBookFromLibrary);

module.exports = router;
