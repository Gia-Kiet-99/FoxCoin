const express = require('express');
const router = express.Router();

const blockModel = require('../../model/blockchain');

router.post('/connectToNetwork', (req, res) => {
  blockModel.connectToPeers();
})


module.exports = router;