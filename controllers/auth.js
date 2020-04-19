const User = require('../models/user');
const { errorHandler } = require('../helpers/dbErrorHandler');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt'); //for authorization check
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const _ = require('lodash');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.signup = (req, res) => {
  console.log('REQUEST BODY FROM CONTROLLER: ', req.body);
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(500).json({
        error: errorHandler(err),
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({
      user,
    });
  });
};

exports.signin = (req, res) => {
  // find the user based on email
  const { email, password } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User with that email does not exist. Please signup.',
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
    message: 'Signout success.',
  });
};

// for this expressJwt to work, cookieParser should be installed.
// we can use this (requireSignin) as a middleware to protect any routes.
exports.requireSignin = expressJwt({
  // if the token is valid, express-jwt appends the verified users id in an auth key to the request object.
  secret: process.env.JWT_SECRET,
  // with this we can access auth._id to check the currently signed in user's id
  userProperty: 'auth',
});

// PROTECT RESOURCES FOR AUTHENTICATED (isAuth) AND ADMIN (isAdmin) USERS
exports.isAuth = (req, res, next) => {
  // 'req.profile' is the user we fetch from the route parameter and 'req.auth' is from expressJwt({userProperty: 'auth'}).
  // using 'requireSignin' as middleware in the route, we get this response :- "UnauthorizedError: No authorization token was found", if the user is not signed in.
  let user =
    req.profile && req.auth && req.profile._id.toString() === req.auth._id;
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

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (req, res) => {
  const { idToken } = req.body;
  client
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then((response) => {
      const { email_verified, name, email } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: '7d',
            });
            const { _id, email, name, role } = user;
            res.cookie('t', token, { expire: new Date() + 9999 });
            return res.json({
              token,
              user: { _id, email, name, role },
            });
          } else {
            let password = email + process.env.JWT_SECRET;
            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) return res.status(400).json({ error: err });
              else {
                const token = jwt.sign(
                  { _id: data._id },
                  process.env.JWT_SECRET,
                  {
                    expiresIn: '7d',
                  }
                );
                const { _id, email, name, role } = data;
                res.cookie('t', token, { expire: new Date() + 9999 });
                return res.json({
                  token,
                  user: { _id, email, name, role },
                });
              }
            });
          }
        });
      } else {
        return res
          .status(400)
          .json({ error: 'Google login failed. Try again' });
      }
    });
};

exports.facebookLogin = (req, res) => {
  const { userID, accessToken } = req.body;
  const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`;
  return fetch(url, {
    method: 'GET',
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      const { email, name } = result;
      User.findOne({ email }).exec((err, user) => {
        if (user) {
          const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
          });
          const { _id, email, name, role } = user;
          res.cookie('t', token, { expire: new Date() + 9999 });
          return res.json({
            token,
            user: { _id, email, name, role },
          });
        } else {
          let password = email + process.env.JWT_SECRET;
          user = new User({ name, email, password });
          user.save((err, data) => {
            if (err) return res.status(400).json({ error: err });
            else {
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                {
                  expiresIn: '7d',
                }
              );
              const { _id, email, name, role } = data;
              res.cookie('t', token, { expire: new Date() + 9999 });
              return res.json({
                token,
                user: { _id, email, name, role },
              });
            }
          });
        }
      });
    })
    .catch((err) => {
      res.status(400).json({ error: err });
    });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err || !user)
      return res
        .status(400)
        .json({ error: 'User with that email does not exist' });
    else {
      const token = jwt.sign(
        { _id: user._id, name: user.name },
        process.env.JWT_RESET_PASSWORD,
        {
          expiresIn: '10m',
        }
      );
      const emailData = {
        to: email,
        from: 'noreply@ecommerce.com',
        subject: 'Password reset link',
        html: `
        <h1>Use the following link to reset your password</h1>
        <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p> 
        <hr/>  
        <p>This email may contain sensitive information</p>
        <p>${process.env.CLIENT_URL}</p>
        `,
      };
      return user.updateOne({ resetPasswordLink: token }, (err, success) => {
        if (err) return res.status(400).json({ error: err });
        else
          sgMail
            .send(emailData)
            .then((sent) =>
              res.json({
                message: `Email has been sent to ${email}. Follow the instructions to reset your password`,
              })
            )
            .catch((err) => res.json({ error: err.message }));
      });
    }
  });
};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;
  if (resetPasswordLink) {
    jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function (
      err,
      decoded
    ) {
      if (err)
        return res.status(400).json({ error: 'Expired link. Try again' });
      User.findOne({ resetPasswordLink }, (err, user) => {
        if (err || !user) return res.status(400).json({ error: err });
        const updatedFields = {
          password: newPassword,
          resetPasswordLink: '',
        };
        user = _.extend(user, updatedFields);
        user.save((err, result) => {
          if (err) return res.status(400).json({ error: err });
          else
            res.json({
              message:
                'Your password has been reset. Login with your new password',
            });
        });
      });
    });
  }
};
