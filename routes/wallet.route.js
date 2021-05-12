const express = require('express')
const router = express.Router();

const authMdw = require('../middleware/auth.mdw');
const walletModel = require('../model/wallet');
const blockModel = require('../model/blockchain');
const txPoolModel = require('../model/transaction-pool');


router.get('/', authMdw, (req, res) => {
  const user = req.session.user;

  const balance = walletModel.getBalance(user.address, blockModel.getUnspentTxOuts());
  const transactionPool = txPoolModel.getTransactionPool().map(tx => {
    return {
      id: tx.id,
      receiver: tx.txOuts[0].address,
      amount: tx.txOuts[0].amount
    }
  });

  res.render('wallet/home', {
    title: "FoxWallet",
    address: user.address, 
    balance: balance,
    transactionPool: transactionPool
  });
  // res.send('dinh gia kiet')
})


module.exports = router;