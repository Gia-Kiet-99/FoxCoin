const express = require('express');
const router = express.Router();

const walletModel = require('../../model/wallet');
const blockModel = require('../../model/blockchain');

//send transaction
router.post('/send', (req, res) => {
  const { myAddress, receivedAddress, amount } = req.body;
  console.log({ myAddress, receivedAddress, amount });

  const transaction = blockModel.sendTransaction(myAddress, receivedAddress, amount);
  if (transaction) {
    res.json(transaction);
  } else {
    res.status(400).json({
      error_message: "Public key does not exist"
    })
  }
})

router.get('/:address', (req, res) => {
  const address = req.params.address;
  const balance = walletModel.getBalance(address, blockModel.getUnspentTxOuts());
  res.json({ balance });
})

module.exports = router;