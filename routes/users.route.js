var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/auth', (req, res) => {
  const email = req.query.email;
  // console.log("email: " + email);
  res.render('user/auth', { title: 'Authentication', email });
});

router.post('/auth', (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;
  if (email) {
    //sign up
    res.send({email, password});
  } else {
    //sign in
    const publicKey = req.body.publicKey;
    // res.send({publicKey, password});
    res.render('wallet/home');
  }
});

module.exports = router;
