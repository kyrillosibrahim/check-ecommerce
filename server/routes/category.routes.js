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
router.post('/reorder', express.json(), reorderCategories);
router.post('/', upload.single('image'), createCategory);
router.put('/:id', upload.single('image'), updateCategory);
router.delete('/:id', deleteCategory);

// Subcategory routes
router.post('/:id/subcategories', upload.single('image'), addSubcategory);
router.put('/:id/subcategories/:subId', upload.single('image'), updateSubcategory);
router.delete('/:id/subcategories/:subId', deleteSubcategory);

module.exports = router;
