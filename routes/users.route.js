var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/auth', (req, res) => {
  const email = req.query.email || "";
  console.log("email: " + email);
  res.render('user/auth', { title: 'Sign up', email });
})

module.exports = router;
