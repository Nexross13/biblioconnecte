const express = require('express')
const authorController = require('../controllers/authorController')
const { authenticate, requireAdmin } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/', authenticate, authorController.listAuthors)
router.post('/', authenticate, requireAdmin, authorController.createAuthor)
router.get('/:id/books', authenticate, authorController.getAuthorBooks)
router.get('/:id', authenticate, authorController.getAuthorById)
router.put('/:id', authenticate, requireAdmin, authorController.updateAuthor)
router.delete('/:id', authenticate, requireAdmin, authorController.deleteAuthor)

module.exports = router
