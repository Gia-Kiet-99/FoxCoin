module.exports = function (req, res, next) {
  const user = req.session.user;
  if (user) {
    next();
  } else {
    res.redirect('/users/auth');
  }
}
