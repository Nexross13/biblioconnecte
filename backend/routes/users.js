const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

const PROFILE_DIR = path.join(__dirname, '..', 'assets', 'profile');
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const ensureProfileDir = () => {
  if (!fs.existsSync(PROFILE_DIR)) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
  }
};

const removeExistingProfileImages = (userId) => {
  SUPPORTED_EXTENSIONS.forEach((extension) => {
    const filePath = path.join(PROFILE_DIR, `${userId}${extension}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureProfileDir();
    cb(null, PROFILE_DIR);
  },
  filename: (req, file, cb) => {
    const userId = req.params.id;
    const extensionFromMime = MIME_EXTENSION_MAP[file.mimetype];
    const extensionFromName = path.extname(file.originalname ?? '').toLowerCase();
    const extension = extensionFromMime || extensionFromName;

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      const error = new Error('Unsupported image type for profile picture');
      error.status = 400;
      return cb(error);
    }

    removeExistingProfileImages(userId);
    cb(null, `${userId}${extension}`);
  },
});

const profileImageUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (Object.keys(MIME_EXTENSION_MAP).includes(file.mimetype) || SUPPORTED_EXTENSIONS.includes(path.extname(file.originalname ?? '').toLowerCase())) {
      cb(null, true);
    } else {
      const error = new Error('Invalid image format for profile picture');
      error.status = 400;
      cb(error);
    }
  },
});

router.get('/', authenticate, userController.listUsers);
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, profileImageUpload.single('profileImage'), userController.updateProfile);
router.get('/:id/friends', authenticate, userController.listFriends);
router.post('/:id/friends', authenticate, userController.requestFriend);
router.put('/:id/friends/:friendId/accept', authenticate, userController.acceptFriend);
router.delete('/:id/friends/:friendId', authenticate, userController.removeFriend);

module.exports = router;
