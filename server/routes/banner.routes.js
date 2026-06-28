const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/banner.controller');
const { adminAuth } = require('../middleware/auth.middleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'temp'),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname) || '.webp';
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

router.get('/', getAllBanners);
router.post('/', adminAuth, upload.single('image'), createBanner);
router.put('/:id', adminAuth, upload.single('image'), updateBanner);
router.delete('/:id', adminAuth, deleteBanner);

module.exports = router;
