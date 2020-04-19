const express = require('express');
const router = express.Router();
const {
  signup,
  signin,
  signout,
  googleLogin,
  facebookLogin,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth');
const {
  userSignupValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validator');

router.post('/signup', userSignupValidator, signup);
router.post('/signin', signin);
router.get('/signout', signout);

// Google and Facebook
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);

// Forgot & Reset password routes
router.put('/forgot-password', forgotPasswordValidator, forgotPassword);
router.put('/reset-password', resetPasswordValidator, resetPassword);

module.exports = router;
