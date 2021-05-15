// const db = require('./util/db');

// class Block {
//   /**
//    * 
//    * @param {index} index 
//    * @param {hash} hash 
//    * @param {previousHash} previousHash 
//    * @param {timestamp} timestamp 
//    * @param {data} data 
//    * @param {difficulty} difficulty 
//    * @param {nonce} nonce 
//    */
//   constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
//     this.index = index;
//     this.hash = hash;
//     this.previousHash = previousHash;
//     this.timestamp = timestamp;
//     this.data = data;
//     this.difficulty = difficulty;
//     this.nonce = nonce;
//   }
// }

// const genesisTransaction = {
//   'txIns': [{ 'signature': '', 'txOutId': '', 'txOutIndex': 0 }],
//   'txOuts': [{
//     'address': '049e95da2a3244a6989e2a153d11beecc02d42a70a27c498903d1e10c2add98ef612d267b52edd2474feb9e8ec560d1a541026b60d31cfaeee3cd3085a27cb3193',
//     'amount': 50
//   }],
//   'id': '230e3648aab43f05c3156593142b19e3cfb11e9fe02e906b8eba8e83fd720cd1'
// };

// const genesisBlock = new Block(0,
//   "00007be28019f2541ff830240da685f6899dada1870cadb812f9eeed9cc7a854",
//   "", 1620142630, [genesisTransaction], 16, 69586
// );



// async function add() {
//   await db('block').insert({
//     id: genesisBlock.index,
//     hash: genesisBlock.hash,
//     previousHash: genesisBlock.previousHash,
//     transactions: JSON.stringify([genesisTransaction]),
//     timestamp: 1620142630,
//     difficulty: 16,
//     nonce: 69586
//   });
// }

// add().then(() => console.log("done"));

// const { getLatestBlock } = require('./model/blockchain')
// const RandomString = require('randomstring')
// console.log(RandomString.generate({length: 64, charset: 'hex'}));

// function mineBlock(myAddress) {
//   if ($('#table-rows').html().trim()) {
//     $('#mine-button').html('<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>&nbsp;&nbsp;Mining...')
//     $.ajax({
//       url: `http://localhost:${PORT}/api/blocks/mineBlock`,
//       type: 'POST',
//       dataType: 'json',
//       data: JSON.stringify({ myAddress: myAddress }),
//       contentType: 'application/json'
//     }).done(data => {
//       console.log(data);
//       Swal.fire({
//         icon: 'success',
//         title: "Congratulation! You've mined a block and got 50 coin",
//         showConfirmButton: false,
//         timer: 1500
//       });
//       $('#balance').text(data.balance);
//       $('#mine-button').html('<strong>MINE BLOCKS</strong>');
//     }).fail(error => {
//       console.log(error);
//       $('#mine-button').html('<strong>MINE BLOCKS</strong>');
//     })
//   } else {
//     const Toast = Swal.mixin({
//       toast: true,
//       position: 'bottom-start',
//       showConfirmButton: false,
//       timer: 3000,
//       timerProgressBar: false,
//       didOpen: (toast) => {
//         toast.addEventListener('mouseenter', Swal.stopTimer)
//         toast.addEventListener('mouseleave', Swal.resumeTimer)
//       }
//     })
//     Toast.fire({
//       icon: 'warning',
//       title: 'Transaction pool is empty'
//     })
//   }
// }

// const Websocket = require('ws');

// const socket = new Websocket.Server({port: 8080});
// console.log(socket.options.port);

// socket.onmessage = function (event) {
//   console.log(event.target._url);
// }

// socket.send("ws://localhost:4001")

// event._socket._host
// event.target._url
const nodeUrls = ["dinh","gia", "kiet"];

function isConnectedToNode(url) {
  return nodeUrls.find(node => node === url) ? true : false;
}

console.log(isConnectedToNode("kiet"));


function updateBalanceIfReceiveNewBlock(newBlock) {
  const minedTxs = newBlock.data;
  const myAddress = $('#my-address').text();
  const currentBalance = parseInt($('#balance').text());
  const sentAmount = minedTxs.reduce((allTxIns, tx) => allTxIns.concat(tx.txIns), [])
    .reduce((amount, txIn) => {

    }, 0)
  const receivedAmount = minedTxs.reduce((allTxOuts, tx) => allTxOuts.concat(tx.txOuts), [])
    .reduce((amount, txOut) => {
      if (txOut.address === myAddress) {
        amount += txOut.amount;
      }
      return amount;
    }, 0);
  $('#balance').text(newBalance);
}



const transactionLiElements = "";
      for (let i = 1; i < transactions.length; i++) {
        transactionLiElements += createTransactionElement();
      }

      $('#transaction-list').append(coinbaseLiElement);