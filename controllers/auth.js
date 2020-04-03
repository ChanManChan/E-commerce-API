const User = require('../models/user');
const { errorHandler } = require('../helpers/dbErrorHandler');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt'); //for authorization check

exports.signup = (req, res) => {
  console.log('REQUEST BODY FROM CONTROLLER: ', req.body);
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(500).json({
        error: errorHandler(err)
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({
      user
    });
  });
};

exports.signin = (req, res) => {
  // find the user based on email
  const { email, password } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User with that email does not exist. Please signup.'
      });
    }
    // if user is found, make sure the email and password match
    // Create authenticate method in User model.
    if (!user.authenticate(password)) {
      return res.status(401).json({ error: "Email and password don't match" });
    }
    // generate a signed token with userId and secret
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    // Persist the token as 't' in cookie with expiry date
    res.cookie('t', token, { expire: new Date() + 9999 });
    // return response with user and token to frontEnd client
    const { _id, name, email, role } = user;
    return res.json({ token, user: { _id, name, email, role } });
  });
};

exports.signout = (req, res) => {
  res.clearCookie('t');
  res.json({
    message: 'Signout success.'
  });
};

// for this expressJwt to work, cookieParser should be installed.
// we can use this (requireSignin) as a middleware to protect any routes.
exports.requireSignin = expressJwt({
  // if the token is valid, express-jwt appends the verified users id in an auth key to the request object.
  secret: process.env.JWT_SECRET,
  // with this we can access auth._id to check the currently signed in user's id
  userProperty: 'auth'
});

// PROTECT RESOURCES FOR AUTHENTICATED (isAuth) AND ADMIN (isAdmin) USERS
exports.isAuth = (req, res, next) => {
  // 'req.profile' is the user we fetch from the route parameter and 'req.auth' is from expressJwt({userProperty: 'auth'}).
  // using 'requireSignin' as middleware in the route, we get this response :- "UnauthorizedError: No authorization token was found", if the user is not signed in.
  let user = req.profile && req.auth && req.profile._id.toString() === req.auth._id;
  if (!user) return res.status(403).json({ error: 'Access denied' });
  next();
};

// Admin
exports.isAdmin = (req, res, next) => {
  // role : 0 <-- regular user
  //  role : 1 <-- admin user
  if (req.profile.role === 0)
    return res.status(403).json({ error: 'Admin resource, Access denied.' });
  next();
};
