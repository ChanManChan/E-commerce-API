const express = require('express');
const router = express.Router();
const {
  signup,
  signin,
  signout,
  requireSignin,
  googleLogin,
  facebookLogin,
} = require('../controllers/auth');
const { userSignupValidator } = require('../validator');

router.post('/signup', userSignupValidator, signup);
router.post('/signin', signin);
router.get('/signout', signout);

// Google and Facebook
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);

// router.get('/hello', requireSignin, (req, res) => {
//   // RESULT :-
//   // UnauthorizedError: No authorization token was found
//   res.send('Checking requireSignin controller method.');
// });

module.exports = router;
