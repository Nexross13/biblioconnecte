const express = require('express');
const bookReportController = require('../controllers/bookReportController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', bookReportController.listReports);
router.patch('/:id/close', bookReportController.closeReport);

module.exports = router;
