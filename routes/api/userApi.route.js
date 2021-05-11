const express = require('express');
const router = express.Router();

const userApi = require('../../model/api/userApi.model');
const walletModel = require('../../model/wallet');
const bcryptUtil = require('../../util/bcrypt');
const usersModel = require('../../model/users.model');
const transactionModel = require('../../model/transaction');
const blockModel = require('../../model/blockchain');
const transactionPoolModel = require('../../model/transaction-pool');
const p2pModel = require('../../model/p2p');
const randomstring = require("randomstring");


router.get('/:email', async (req, res) => {
  const email = req.params.email;
  const ret = await userApi.checkEmailExists(email);
  if (ret) {
    return res.json({
      isEmailExists: true
    })
  }
  res.json({
    isEmailExists: false
  })
})

//sign up
router.post('/', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const key = walletModel.initWallet();
    const hashPassword = await bcryptUtil.hashPassword(password);

    // save user info
    const ids = await usersModel.add({ email, address: key.publicKey, password: hashPassword });
    console.log("ids: " + ids[0]);

    // give user 25 coin -> send Transaction
    const address = key.publicKey;
    const newBlockIndex = blockModel.getLatestBlock().index + 1;

    console.log("Create coinbase tx");
    const coinbaseTx = transactionModel.getCoinbaseTransaction(key.publicKey, newBlockIndex);

    console.log("Add transaction to pool");
    transactionPoolModel.addToTransactionPool(coinbaseTx, blockModel.getUnspentTxOuts());

    console.log("broadcast transaction pool");
    p2pModel.broadcastTransactionPool();

    res.json(key);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error_message: "Something went wrong"
    })
  }
})


module.exports = router;