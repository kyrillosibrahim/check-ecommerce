const express = require('express');
const multer = require('multer');
const path = require('path');
const { getSettings, updateSettings, getHomeProducts } = require('../controllers/settings.controller');
const { adminAuth } = require('../middleware/auth.middleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'temp'),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

router.get('/', getSettings);
router.get('/home-products', getHomeProducts);
router.put('/', adminAuth, upload.fields([
  { name: 'logo',     maxCount: 1 },
  { name: 'logoAr',  maxCount: 1 },
  { name: 'logoEn',  maxCount: 1 },
  { name: 'logoIcon',maxCount: 1 },
]), updateSettings);

module.exports = router;
