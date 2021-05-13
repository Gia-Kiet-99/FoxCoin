const express = require('express');
const router = express.Router();

const blockModel = require('../model/blockchain');
const txPoolModel = require('../model/transaction-pool');


router.get('/', (req, res) => {
  const blockchain = blockModel.getBlockChain().map(block => ({
    index: block.index,
    timestamp: block.timestamp,
    miner: block.miner,
    size: JSON.stringify(block).length
  }));
  const transactionPool = txPoolModel.getTransactionPool().map(tx => {
    return {
      id: tx.id,
      receiver: tx.txOuts[0].address,
      amount: tx.txOuts[0].amount
    }
  });
  res.render('explorer/explorer', {
    blockchain: blockchain.reverse(),
    transactionPool: transactionPool.reverse()
  });
})


module.exports = router;