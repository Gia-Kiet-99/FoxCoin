const express = require('express')
const router = express.Router();

const authMdw = require('../middleware/auth.mdw');


router.get('/', authMdw, (req, res) => {
  const user = req.session.user;
  console.log("/wallet route");
  console.log(user);

  res.render('wallet/home');
  // res.send('dinh gia kiet')
})


module.exports = router;