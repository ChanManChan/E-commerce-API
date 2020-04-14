const express = require('express');
const router = express.Router();
const { requireSignin, isAuth } = require('../controllers/auth');
const { findUserById } = require('../controllers/user');
const { generateToken, processPayment } = require('../controllers/braintree');

router.get('/braintree/getToken/:userId', requireSignin, isAuth, generateToken);
router.post(
  '/braintree/payment/:userId',
  requireSignin,
  isAuth,
  processPayment
);

router.param('userId', findUserById);
module.exports = router;
