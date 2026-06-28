const express = require('express');
const multer = require('multer');
const path = require('path');
const fse = require('fs-extra');
const {
  getAllCategories,
  getDetailedCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  reorderCategories,
} = require('../controllers/category.controller');
const { adminAuth } = require('../middleware/auth.middleware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'categories');
fse.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const router = express.Router();

// Category routes
router.get('/', getAllCategories);
router.get('/detailed', getDetailedCategories);
router.post('/reorder', adminAuth, express.json(), reorderCategories);
router.post('/', adminAuth, upload.single('image'), createCategory);
router.put('/:id', adminAuth, upload.single('image'), updateCategory);
router.delete('/:id', adminAuth, deleteCategory);

// Subcategory routes
router.post('/:id/subcategories', adminAuth, upload.single('image'), addSubcategory);
router.put('/:id/subcategories/:subId', adminAuth, upload.single('image'), updateSubcategory);
router.delete('/:id/subcategories/:subId', adminAuth, deleteSubcategory);

module.exports = router;
