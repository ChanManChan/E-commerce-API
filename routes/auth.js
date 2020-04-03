const express = require('express');
const router = express.Router();
const {
  signup,
  signin,
  signout,
  requireSignin
} = require('../controllers/auth');
const { userSignupValidator } = require('../validator');

router.post('/signup', userSignupValidator, signup);
router.post('/signin', signin);
router.get('/signout', signout);

// router.get('/hello', requireSignin, (req, res) => {
//   // RESULT :-
//   // UnauthorizedError: No authorization token was found
//   res.send('Checking requireSignin controller method.');
// });

module.exports = router;
