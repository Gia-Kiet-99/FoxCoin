const express = require('express');
const usersModel = require('../model/users.model');
const router = express.Router();

const walletModel = require('../model/wallet')
const bcryptUtil = require('../util/bcrypt');

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/auth', (req, res) => {
  const email = req.query.email;
  // console.log("email: " + email);
  res.render('user/auth', { title: 'Authentication', email });
});

router.post('/auth', async (req, res, next) => {
  // console.log("Request body: " + req.body);
  const email = req.body.email;
  const password = req.body.password;
  if (email) {
  } else {
    //sign in
    const publicKey = req.body.publicKey;
    // res.send({publicKey, password});
    res.redirect('/wallet');
  }
});

module.exports = router;
