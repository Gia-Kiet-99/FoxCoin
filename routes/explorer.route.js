const express = require('express');
const router = express.Router();
const moment = require('moment');

const blockModel = require('../model/blockchain');
const txPoolModel = require('../model/transaction-pool');


router.get('/', (req, res) => {
  const blockchain = blockModel.getBlockChain().map(block => ({
    index: block.index,
    timestamp: moment(block.timestamp * 1000).fromNow(),
    miner: 'undefined',
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
    title: "Explorer",
    blockchain: blockchain.reverse(),
    transactionPool: transactionPool.reverse()
  });
});

router.get('/block/:index', (req, res, next) => {
  const index = parseInt(req.params.index);

  if (blockModel.getLatestBlock().index < index) {
    next();
  } else {
    const block = blockModel.getBlock(index);
    res.render('explorer/block', {
      title: "Block detail"
    });
  }
});

router.get('/transaction/:id', (req, res, next) => {
  const id = req.params.id;
  const confirmedTx = blockModel.getBlockChain().map(block => block.data).flat()
    .find(tx => tx.id === id);
  const unconfirmedTx = txPoolModel.getTransactionPool().find(tx => tx.id === id);

  if (confirmedTx || unconfirmedTx) {
    res.render('explorer/transaction', { title: "Transaction detail" });
  } else {
    next();
  }
});

router.get('/address/:publicKey', (req, res, next) => {
  const publicKey = req.params.publicKey;
  const result = blockModel.getBlockChain().map(block => block.data).flat()
    .map(tx => tx.txOuts).flat().find(txOut => txOut.address === publicKey);

  if(!result) {
    next();
  }

  res.render('explorer/address', { title: "Address detail" });
})


module.exports = router;