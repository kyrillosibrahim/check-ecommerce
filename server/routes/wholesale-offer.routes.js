const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  listOffers,
  getOffer,
  createOffer,
  deleteOffer,
} = require('../controllers/wholesale-offer.controller');
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
  limits: {
    fileSize: 10 * 1024 * 1024,
    fieldSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

const uploadFields = upload.fields([
  { name: 'mainImages', maxCount: 20 },
  { name: 'swiperImages', maxCount: 20 },
  { name: 'normalImages', maxCount: 20 },
]);

router.get('/', listOffers);
router.get('/:id', getOffer);
router.post('/', adminAuth, uploadFields, createOffer);
router.delete('/:id', adminAuth, deleteOffer);

module.exports = router;
