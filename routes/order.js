const express = require('express');
const router = express.Router();

const { requireSignin, isAuth } = require('../controllers/auth');
const { findUserById } = require('../controllers/user');
const { create } = require('../controllers/order');

router.post('/order/create/:userId', requireSignin, isAuth, create);

router.param('userId', findUserById);

module.exports = router;
