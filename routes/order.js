const express = require('express');
const router = express.Router();

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');
const { findUserById, addOrderToUserHistory } = require('../controllers/user');
const {
  create,
  listOrders,
  getStatusValues,
  findOrderById,
  updateOrderStatus,
} = require('../controllers/order');
const { decreaseQuantity } = require('../controllers/product');

router.post(
  '/order/create/:userId',
  requireSignin,
  isAuth,
  addOrderToUserHistory,
  decreaseQuantity,
  create
);

router.get('/order/list/:userId', requireSignin, isAuth, isAdmin, listOrders);
router.get(
  '/order/status-values/:userId',
  requireSignin,
  isAuth,
  isAdmin,
  getStatusValues
);
router.put(
  '/order/:orderId/status/:userId',
  requireSignin,
  isAuth,
  isAdmin,
  updateOrderStatus
);

router.param('userId', findUserById);
router.param('orderId', findOrderById);

module.exports = router;
