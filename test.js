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

const { getLatestBlock } = require('./model/blockchain')