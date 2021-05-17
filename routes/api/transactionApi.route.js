const express = require('express');
const router = express.Router();

const blockModel = require('../../model/blockchain');
const txPoolModel = require('../../model/transaction-pool');

router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  let isConfirmed = false;
  let { transaction, blockIndex } = blockModel.findTransaction(id);
  const unspentTxOutsOfTransaction = [];

  let allTransaction = [];
  if (transaction) {
    isConfirmed = true;
    const blockchain = blockModel.getBlockChain();
    for (let i = 0; i < blockIndex; i++) {
      allTransaction.push(...(blockchain[i].data));
    }
    const txIns = transaction.txIns;

    for (const txIn of txIns) {
      const referenceTx = allTransaction.find(tx => tx.id === txIn.txOutId);
      if (referenceTx) {
        unspentTxOutsOfTransaction.push({
          txOutId: txIn.txOutId,
          txOutIndex: txIn.txOutIndex,
          address: referenceTx.txOuts[txIn.txOutIndex].address,
          amount: referenceTx.txOuts[txIn.txOutIndex].amount
        })
      }
    }
  } else {
    transaction = txPoolModel.getTransactionPool().find(tx => tx.id === id);
    if (!transaction) {
      next();
    }
    const unspentTxOuts = blockModel.getUnspentTxOuts();
    let correspondingUTXO;
    for (const txIn of transaction.txIns) {
      correspondingUTXO = unspentTxOuts.find(uTxO => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);
      if (correspondingUTXO) {
        unspentTxOutsOfTransaction.push(correspondingUTXO);
      }
    }
  }

  res.json({
    transaction: transaction,
    status: isConfirmed,
    blockIndex: blockIndex,
    unspentTxOutsOfTransaction: unspentTxOutsOfTransaction
  })
})


module.exports = router;