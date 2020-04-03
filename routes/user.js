const express = require('express');
const router = express.Router();

const { requireSignin, isAdmin, isAuth } = require('../controllers/auth');
const { findUserById, read, update } = require('../controllers/user');

router.get('/secret/:userId', requireSignin, isAuth, isAdmin, (req, res) => {
  // if the request is made to 'secret/:userId', we would like to respond with that user information based on the 'userId'
  // req.profile === because of findUserById method.
  // requireSignin <-- just a signed-in user was enough, didn't have to match the currently authenticated userId to access this route.
  // isAuth <-- requires req.profile._id === req.auth._id (ie. cannot access other user's data by logging themselves in, user can only access his own data with isAuth middleware)
  // isAdmin <-- user has to be an admin to access this resource.
  res.json({ user: req.profile });
});

router.get('/user/:userId', requireSignin, isAuth, read);
router.put('/user/:userId', requireSignin, isAuth, update);

// findUserById will look for the userId route parameter and anytime there is userId in the route this (findUserById) method will run automatically and make the user available in the request object. This will be extremely helpful, especially when we sign the user in, we might want to redirect them to the user dashboard and you want to display the basic information like the name description and so on.
router.param('userId', findUserById);

module.exports = router;
