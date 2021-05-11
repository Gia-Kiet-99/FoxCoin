const express = require('express')
const router = express.Router();

const authMdw = require('../middleware/auth.mdw');
const walletModel = require('../model/wallet');
const blockModel = require('../model/blockchain');


router.get('/', authMdw, (req, res) => {
  const user = req.session.user;
  // console.log(user);
  // console.log(blockModel.getUnspentTxOuts());

  const balance = walletModel.getBalance(user.address, blockModel.getUnspentTxOuts());
  res.render('wallet/home', {
    title: "FoxWallet",
    address: user.address, 
    balance: balance
  });
  // res.send('dinh gia kiet')
})


module.exports = router;