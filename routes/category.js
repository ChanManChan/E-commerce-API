const express = require('express');
const router = express.Router();
const {
  create,
  findCategoryById,
  read,
  update,
  remove,
  list
} = require('../controllers/category');
const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');
const { findUserById } = require('../controllers/user');

// Only admin should be able to create new category
router.post('/category/create/:userId', requireSignin, isAuth, isAdmin, create);
router.get('/category/:categoryId', read);
router.put(
  '/category/:categoryId/:userId',
  requireSignin,
  isAuth,
  isAdmin,
  update
);
router.delete(
  '/category/:categoryId/:userId',
  requireSignin,
  isAuth,
  isAdmin,
  remove
);
router.get('/categories', list);

router.param('userId', findUserById);
router.param('categoryId', findCategoryById);

module.exports = router;
