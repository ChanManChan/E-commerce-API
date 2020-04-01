const User = require('../models/user');
const { errorHandler } = require('../helpers/dbErrorHandler');
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
