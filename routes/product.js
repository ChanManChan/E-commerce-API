const express = require('express');
const router = express.Router();

const {
  create,
  findProductById,
  read,
  remove,
  update
} = require('../controllers/product');
const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');
const { findUserById } = require('../controllers/user');

// Only admin should be able to create new product
router.post('/product/create/:userId', requireSignin, isAuth, isAdmin, create);
router.get('/product/:productId', read);
// router.delete("/product/:productId/:userId" <-- "userId" to make sure that we have the correct user with the role of admin.
router.delete(
  '/product/:productId/:userId',
  requireSignin,
  isAuth,
  isAdmin,
  remove
);
router.put(
  '/product/:productId/:userId',
  requireSignin,
  isAuth,
  isAdmin,
  update
);

router.param('userId', findUserById);
router.param('productId', findProductById);

module.exports = router;
