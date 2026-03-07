const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  createProduct,
  getAllProducts,
  getProduct,
  getProductById,
  getProductsByIds,
  deleteProduct,
} = require('../controllers/product.controller');

const router = express.Router();

// --- Multer config: store uploads temporarily in /temp ---
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
    fileSize: 10 * 1024 * 1024,   // 10 MB per file
    fieldSize: 10 * 1024 * 1024,  // 10 MB per text field (offers JSON with base64 images)
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

// --- Multer fields for 3 image types ---
const uploadFields = upload.fields([
  { name: 'mainImages', maxCount: 20 },
  { name: 'swiperImages', maxCount: 20 },
  { name: 'normalImages', maxCount: 20 },
]);

// --- Routes ---
router.post('/', uploadFields, createProduct);
router.get('/', getAllProducts);
router.get('/getoneproduct/:id', getProductById);
router.post('/by-ids', getProductsByIds);
router.get('/:category/:slug', getProduct);
router.delete('/:category/:slug', deleteProduct);

module.exports = router;
