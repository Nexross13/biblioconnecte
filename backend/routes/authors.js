const express = require('express')
const authorController = require('../controllers/authorController')
const { authenticate } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/', authenticate, authorController.listAuthors)

module.exports = router
