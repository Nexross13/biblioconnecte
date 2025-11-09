const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate, requireModerator } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/:id/approve', requireModerator, reviewController.approveReview);
router.get('/moderation-feed', requireModerator, reviewController.listRecentReviews);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
