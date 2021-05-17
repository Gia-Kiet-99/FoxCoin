const express = require('express');
const router = express.Router();
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const userApi = require('../../model/api/userApi.model');
const walletModel = require('../../model/wallet');
const bcryptUtil = require('../../util/bcrypt');
const usersModel = require('../../model/users.model');
const transactionModel = require('../../model/transaction');
const blockModel = require('../../model/blockchain');
const transactionPoolModel = require('../../model/transaction-pool');


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
    console.log(key);
    const hashPassword = await bcryptUtil.hashPassword(password);

    // save user info
    const ids = await usersModel.add({ email, address: key.publicKey, password: hashPassword });
    // console.log("ids: " + ids[0]);

    // give user 25 coin -> send Transaction
    const address = key.publicKey;
    const newBlockIndex = blockModel.getLatestBlock().index + 1;

    console.log("Create coinbase tx");
    const coinbaseTx = transactionModel.createSignupRewardTransaction(address, newBlockIndex);

    console.log("Add transaction to pool");
    transactionPoolModel.addToTransactionPool(coinbaseTx, blockModel.getUnspentTxOuts());

    console.log("broadcast transaction pool");
    blockModel.broadcastTransactionPool();

    return res.json(key);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error_message: "Something went wrong"
    })
  }
});

router.get('/address/:publicKey', (req, res) => {
  const publicKey = req.params.publicKey;
  // console.log(typeof publicKey);
  const key = ec.keyFromPublic(publicKey, 'hex');
  let totalSent = 0;
  let totalReceived = 0;

  /** allTxInputDetail
   * All input detail of transaction which was sent or reveiced by address
   * (txIn include txOutId, txOutIndex, address, amount)
   * */
  let allTxInputDetail = []; 
  let txOfAddress = [];
  const allTransaction = blockModel.getBlockChain().map(block => block.data).flat();
  for (const tx of allTransaction) {
    if (tx.txIns[0].signature && key.verify(tx.id, tx.txIns[0].signature)) {
      totalSent += tx.txOuts[0].amount;
      txOfAddress.push(tx);
      const inputDetailOfTransaction = blockModel.getTransactionInputDetail(tx, blockModel.getBlockChain())
      allTxInputDetail.push(...inputDetailOfTransaction);
    } else if (tx.txOuts[0].address === publicKey) {
      totalReceived += tx.txOuts[0].amount;
      txOfAddress.push(tx);
      const inputDetailOfTransaction = blockModel.getTransactionInputDetail(tx, blockModel.getBlockChain())
      allTxInputDetail.push(...inputDetailOfTransaction);
    }
  }

  const finalBalance = walletModel.getBalance(publicKey, blockModel.getUnspentTxOuts());

  res.json({
    publicKey,
    totalReceived,
    totalSent,
    finalBalance,
    txOfAddress,
    allTxInputDetail
  });
})


module.exports = router;