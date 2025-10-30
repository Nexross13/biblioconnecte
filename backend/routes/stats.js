const express = require('express');
const statsController = require('../controllers/statsController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/highlights', authenticate, statsController.getHighlights);
router.get('/public-overview', statsController.getPublicOverview);
router.get('/admin-overview', authenticate, requireAdmin, statsController.getAdminOverview);

module.exports = router;
