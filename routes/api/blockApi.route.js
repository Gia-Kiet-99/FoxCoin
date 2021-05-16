const express = require('express');
const router = express.Router();

const blockModel = require('../../model/blockchain');
const walletModel = require('../../model/wallet');


router.post('/mineBlock', (req, res) => {
  const myAddress = req.body.myAddress;
  console.log("My address: " + myAddress);
  const newBlock = blockModel.generateNextBlock(myAddress);
  if (newBlock === null) {
    res.status(400).json('Could not generate block');
  } else {
    const balance = walletModel.getBalance(myAddress, blockModel.getUnspentTxOuts());
    res.json({ newBlock, balance });
  }
});

router.get('/:index', (req, res) => {
  const index = req.params.index;

  const block = blockModel.getBlock(index);
  const allTxInOfBlock = block.data.map(tx => tx.txIns).flat();
  const allTransaction = blockModel.getBlockChain().map(block => block.data).flat();

  const unspentTxOutsOfBlock = [];
  for (let i = 1; i < allTxInOfBlock.length; i++) {
    for (const tx of allTransaction) {
      if (tx.id === allTxInOfBlock[i].txOutId) {
        const txOut = tx.txOuts[allTxInOfBlock[i].txOutIndex];
        unspentTxOutsOfBlock.push({
          txOutId: allTxInOfBlock[i].txOutId,
          txOutIndex: allTxInOfBlock[i].txOutIndex,
          address: txOut.address,
          amount: txOut.amount
        });
        break;
      }
    }
  }
  // console.log(unspentTxOutsOfBlock);
  res.json({ block, unspentTxOutsOfBlock });
})


module.exports = router;