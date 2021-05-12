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
})


module.exports = router;