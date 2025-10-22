const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, userController.listUsers);
router.get('/:id', authenticate, userController.getUserById);
router.get('/:id/friends', authenticate, userController.listFriends);
router.post('/:id/friends', authenticate, userController.requestFriend);
router.put('/:id/friends/:friendId/accept', authenticate, userController.acceptFriend);
router.delete('/:id/friends/:friendId', authenticate, userController.removeFriend);

module.exports = router;
