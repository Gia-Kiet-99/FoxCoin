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

//sign in
router.post('/auth', async (req, res) => {
  const { publicKey, password } = req.body;

  const user = await usersModel.single(publicKey);
  if (user) {
    if (await bcryptUtil.verifyPassword(password, user.password)) {
      //balance of wallet
      // let balance = 0;
      if (!req.session.user) {
        req.session.user = user;
      }
      console.log("redirect to /wallet");
      return res.redirect('/wallet');
    }
  }

  res.render('user/auth', { signin_message: "Invalid public key or password" });
});

module.exports = router;