const express = require('express');
const bookProposalController = require('../controllers/bookProposalController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, bookProposalController.createProposal);
router.get('/', authenticate, requireAdmin, bookProposalController.listProposals);
router.get('/mine', authenticate, bookProposalController.listMyProposals);
router.get('/:id', authenticate, bookProposalController.getProposalById);
router.post('/:id/approve', authenticate, requireAdmin, bookProposalController.approveProposal);
router.post('/:id/reject', authenticate, requireAdmin, bookProposalController.rejectProposal);

module.exports = router;
