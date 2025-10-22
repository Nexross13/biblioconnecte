const express = require('express');
const authorController = require('../controllers/authorController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorController.listAuthors);
router.get('/:id', authenticate, authorController.getAuthorById);
router.get('/:id/books', authenticate, authorController.getAuthorBooks);
router.post('/', authenticate, authorController.createAuthor);
router.put('/:id', authenticate, authorController.updateAuthor);
router.delete('/:id', authenticate, authorController.deleteAuthor);

module.exports = router;
