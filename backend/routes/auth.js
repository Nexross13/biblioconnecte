const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/google', authController.loginWithGoogle);
router.post('/password/forgot', authController.requestPasswordReset);
router.post('/password/verify', authController.verifyPasswordResetCode);
router.post('/password/reset', authController.resetPassword);

module.exports = router;
