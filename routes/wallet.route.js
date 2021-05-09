const express = require('express')
const router = express.Router();


router.get('/', (req,res) => {
  res.render('wallet/home');
})


module.exports = router;