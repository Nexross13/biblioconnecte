const express = require('express');
const genreController = require('../controllers/genreController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, genreController.listGenres);
router.get('/:id/books', authenticate, genreController.getGenreBooks);
router.post('/', authenticate, genreController.createGenre);
router.delete('/:id', authenticate, genreController.deleteGenre);

module.exports = router;
