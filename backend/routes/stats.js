const express = require('express');
const statsController = require('../controllers/statsController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/highlights', authenticate, statsController.getHighlights);

module.exports = router;
