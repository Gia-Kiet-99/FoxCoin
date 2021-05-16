const express = require('express');
const router = express.Router();

const blockModel = require('../../model/blockchain');

router.get('/:id', (req, res) => {
  const id = req.params.id;

  let isConfirmed = false;
  let { transaction, blockIndex } = blockModel.findTransaction(id);

  let allTransaction = [];
  if (transaction) {
    isConfirmed = true;
    const blockchain = blockModel.getBlockChain();
    for (let i = 0; i < blockIndex; i++) {
      allTransaction.push(...(blockchain[i].data));
    }
  } else {
    transaction = txPoolModel.getTransactionPool().find(tx => tx.id === id);
    allTransaction = blockModel.getBlockChain().map(block => block.data).flat();
  }
  
  const txIns = transaction.txIns;
  const unspentTxOutsOfTransaction = [];

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

  res.json({
    transaction: transaction,
    status: isConfirmed,
    blockIndex: blockIndex,
    unspentTxOutsOfTransaction: unspentTxOutsOfTransaction
  })
})


module.exports = router;