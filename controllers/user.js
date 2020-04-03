const User = require('../models/user');

exports.findUserById = (req, res, next, id) => {
  // this 'id' will be coming from the route parameter.
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }
    req.profile = user;
    next();
  });
};
