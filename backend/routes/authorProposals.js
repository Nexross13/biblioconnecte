const express = require('express');
const authorProposalController = require('../controllers/authorProposalController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, authorProposalController.createProposal);
router.get('/', authenticate, requireAdmin, authorProposalController.listProposals);
router.get('/:id', authenticate, requireAdmin, authorProposalController.getProposalById);
router.post('/:id/approve', authenticate, requireAdmin, authorProposalController.approveProposal);
router.post('/:id/reject', authenticate, requireAdmin, authorProposalController.rejectProposal);

module.exports = router;
