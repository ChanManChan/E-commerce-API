const express = require('express');
const router = express.Router();

const {
  create,
  findProductById,
  read,
  remove,
  update,
  list,
  listRelated,
  listCategories,
  listBySearch,
  photo,
  listSearch,
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
router.get('/products', list);
router.get('/products/search', listSearch);
router.get('/products/related/:productId', listRelated);
router.get('/products/categories', listCategories);

// The categories and price range etc. (filters) will be sent through the request body therefore we use "post" method
router.post('/products/by/search', listBySearch);
// this 'photo' method will act as a middleware whenever we need a photo for the product we fetch.
router.get('/product/photo/:productId', photo);

router.param('userId', findUserById);
router.param('productId', findProductById);

module.exports = router;
