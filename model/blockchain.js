const SHA256 = require('crypto-js').SHA256;
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const _ = require('lodash');

const { COINBASE_AMOUNT, processTransactions, getCoinbaseTransaction } = require('./transaction');
const { createTransaction, findUnspentTxOuts, getBalance, getPrivateFromWallet, getPublicFromWallet } = require('./wallet');
const { addToTransactionPool, getTransactionPool, updateTransactionPool } = require('./transaction-pool');
const IOUtil = require('../util/io');

class Block {
  /**
   * 
   * @param {index} index 
   * @param {hash} hash 
   * @param {previousHash} previousHash 
   * @param {timestamp} timestamp 
   * @param {data} data 
   * @param {difficulty} difficulty 
   * @param {nonce} nonce 
   */
  constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

const BLOCK_GENERATION_INTERVAL = 60; // second
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10; // block
const BLOCKCHAIN_LOCATION = "database/blockchain.json";

const genesisTransaction = {
  'txIns': [{ 'signature': '', 'txOutId': '', 'txOutIndex': 0 }],
  'txOuts': [{
    'address': '049e95da2a3244a6989e2a153d11beecc02d42a70a27c498903d1e10c2add98ef612d267b52edd2474feb9e8ec560d1a541026b60d31cfaeee3cd3085a27cb3193',
    'amount': COINBASE_AMOUNT
  }],
  'id': '230e3648aab43f05c3156593142b19e3cfb11e9fe02e906b8eba8e83fd720cd1'
};
const genesisBlock = new Block(0,
  "00007be28019f2541ff830240da685f6899dada1870cadb812f9eeed9cc7a854",
  "", 1620142630, [genesisTransaction], 16, 69586
);

// GET blockchain data from DATABASE
let blockchain = [];
let unspentTxOuts = [];

function initialBlockChain() {
  const jsonBlocks = IOUtil.readJSON(BLOCKCHAIN_LOCATION);
  if (jsonBlocks) {
    blockchain = JSON.parse(jsonBlocks);
    for (const block of blockchain) {
      unspentTxOuts = processTransactions(block.data, unspentTxOuts, block.index);
    }
  } else {
    blockchain = [genesisBlock];
    unspentTxOuts = processTransactions(blockchain[0].data, [], 0);
  }
}

initialBlockChain();

function getUnspentTxOuts() {
  return _.cloneDeep(unspentTxOuts);
}

// and txPool should be only updated at the same time
const setUnspentTxOuts = (newUnspentTxOut) => {
  console.log(`replacing unspentTxouts with: ${newUnspentTxOut}`);
  unspentTxOuts = newUnspentTxOut;
};

/*------------------------------------- Block function -------------------------------------*/
function getBlock(index) {
  return blockchain[index];
}

function calculateHash(index, previousHash, timestamp, data, difficulty, nonce) {
  return SHA256(index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce).toString();
}

function calculateHashForBlock(block) {
  return calculateHash(block.index, block.previousHash, block.timestamp, block.data,
    block.difficulty, block.nonce);
}

const hexToBinary = (s) => {
  let ret = '';
  const lookupTable = {
    '0': '0000', '1': '0001', '2': '0010', '3': '0011', '4': '0100',
    '5': '0101', '6': '0110', '7': '0111', '8': '1000', '9': '1001',
    'a': '1010', 'b': '1011', 'c': '1100', 'd': '1101',
    'e': '1110', 'f': '1111'
  };
  for (let i = 0; i < s.length; i = i + 1) {
    if (lookupTable[s[i]]) {
      ret += lookupTable[s[i]];
    } else {
      return null;
    }
  }
  return ret;
};

function hashMatchesDifficulty(hash, difficulty) {
  const hashInBinary = hexToBinary(hash);
  const requiredPrefix = '0'.repeat(difficulty);
  return hashInBinary.startsWith(requiredPrefix);
}

function findBlock(index, previousHash, timestamp, data, difficulty) {
  let nonce = 0;
  let hash = "";
  while (true) {
    hash = calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
    }
    nonce++;
  }
}

function getCurrentTimestamp() {
  return Math.round(new Date().getTime() / 1000);
}

function isValidTimestamp(newBlock, previousBlock) {
  return (previousBlock.timestamp - 60 < newBlock.timestamp)
    && (newBlock.timestamp - 60 < getCurrentTimestamp());
}

function hasValidHash(block) {
  if (calculateHashForBlock(block) !== block.hash) {
    console.log('invalid hash, got:' + block.hash);
    return false;
  }

  if (!hashMatchesDifficulty(block.hash, block.difficulty)) {
    console.log('block difficulty not satisfied. Expected: ' + block.difficulty + 'got: ' + block.hash);
  }
  return true;
}

function isValidBlock(newBlock, previousBlock) {
  if (!isValidBlockStructure(newBlock)) {
    console.log(`Invalid structure of block at index: ${newBlock.index}`);
    return false;
  }
  if (newBlock.index !== previousBlock.index + 1) {
    console.log("Invalid index");
    return false;
  } else if (newBlock.previousHash !== previousBlock.hash) {
    console.log("Invalid previous hash");
    return false;
  } else if (!hasValidHash(newBlock)) {
    console.log('invalid hash');
    return false;
  } else if (!isValidTimestamp(newBlock, previousBlock)) {
    console.log("Invalid timestamp");
    return false;
  }
  return true;
}

function isValidBlockStructure(block) {
  return typeof block.index === 'number'
    && typeof block.hash === 'string'
    && typeof block.previousHash === 'string'
    && typeof block.timestamp === 'number'
    && typeof block.data === 'object';
}

/*----------------------- Chain function ----------------------*/
function getDifficulty(chain) {
  const latestBlock = chain[chain.length - 1];
  if (latestBlock.index !== 0 && latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0) {
    return getAdjustedDifficulty(latestBlock, chain);
  }
  return latestBlock.difficulty;
}

function getAdjustedDifficulty(latestBlock, chain) {
  const prevAdjustedDifficulty = chain[chain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const expectedTime = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
  const takenTime = latestBlock.timestamp - prevAdjustedDifficulty.timestamp;

  if (takenTime < expectedTime / 2) {
    return prevAdjustedDifficulty.difficulty + 1;
  } else if (takenTime > expectedTime * 2) {
    return prevAdjustedDifficulty.difficulty - 1;
  } else {
    return prevAdjustedDifficulty.difficulty;
  }
}

function generateRawNextBlock(blockData) {
  const previousBlock = getLatestBlock();
  const previousHash = previousBlock.hash;
  const index = previousBlock.index + 1;
  const timestamp = getCurrentTimestamp();
  // const hash = calculateHash(index, previousHash, timestamp, blockData);
  const difficulty = getDifficulty(getBlockChain());
  const newBlock = findBlock(index, previousHash, timestamp, blockData, difficulty);
  console.log(newBlock);

  console.log("Adding block to chain");
  if (addBlockToChain(newBlock)) {
    console.log("Broadcast latest block");
    //save new blockchain to file
    IOUtil.writeJSON(BLOCKCHAIN_LOCATION, JSON.stringify(blockchain, null, 2));
    //broadcast latest block
    broadcastLatest();
    return newBlock;
  }
  console.log("Add block to chain fail");
  return null;
}

function generateNextBlock(myAddress) {
  const transactionPool = getTransactionPool();
  /**
   * only mine block if transaction pool is not empty
   */
  if (transactionPool.length > 0) {
    console.log("Create coinbase transaction");
    const newBlockIndex = getLatestBlock().index + 1;

    const coinbaseTx = getCoinbaseTransaction(myAddress, newBlockIndex);
    const blockData = [coinbaseTx].concat(transactionPool);

    console.log("Mining new block...");
    return generateRawNextBlock(blockData);
  } else {
    return null;
  }
}

function getMyUnspentTransactionOutputs() {
  const myAddress = getPublicFromWallet();
  return findUnspentTxOuts(myAddress, getUnspentTxOuts());
}

function getAccountBalance() {
  const myAddress = getPublicFromWallet();
  return getBalance(myAddress, getUnspentTxOuts());
}

function sendTransaction(myAddress, receivedAddress, amount) {
  try {
    console.log("Get private key from wallet");
    const privateKey = getPrivateFromWallet(myAddress);
    console.log('Private key: ' + privateKey);
    let newTransaction = null;
    if (privateKey) {
      console.log("Creating transaction...");
      newTransaction = createTransaction(myAddress, receivedAddress, amount, privateKey, getUnspentTxOuts(), getTransactionPool());
      console.log("Adding transaction to pool");
      addToTransactionPool(newTransaction, getUnspentTxOuts());
      console.log("Broadcast transaction pool");
      broadcastTransactionPool();
    }
    return newTransaction;
  } catch (error) {
    console.log(error);
    return null;
  }
}

function getBlockChain() {
  return blockchain;
}

function getLatestBlock() {
  return blockchain[blockchain.length - 1];
}

function addBlock(newBlock) {
  if (isValidBlock(newBlock, getLatestBlock())) {
    blockchain.push(newBlock);
  }
}

function isValidChain(blockchain) {
  const isValidGenesis = (block) => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock)
  };

  if (!isValidGenesis(blockchain[0])) {
    return null;
  }

  let aUnspentTxOuts = [];
  for (let i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    if (i !== 0 && !isValidBlock(blockchain[i], blockchain[i - 1])) {
      return null;
    }

    aUnspentTxOuts = processTransactions(currentBlock.data, aUnspentTxOuts, currentBlock.index);
    if (aUnspentTxOuts === null) {
      console.log("Invalid transaction in blockchain");
      return false;
    }
  }

  return aUnspentTxOuts;
}

function getAccumulatedDifficulty(chain) {
  return chain.reduce((sum, block) => {
    return sum + Math.pow(2, block.difficulty);
  }, 0);
}

const addBlockToChain = (newBlock) => {
  if (isValidBlock(newBlock, getLatestBlock())) {
    const retVal = processTransactions(newBlock.data, getUnspentTxOuts(), newBlock.index);
    if (retVal === null) {
      console.log("error in addBlockToChain(): Invalid transactions");
    } else {
      blockchain.push(newBlock);
      setUnspentTxOuts(retVal);
      updateTransactionPool(unspentTxOuts);
      return true;
    }
  }
  return false;
};

function replaceChain(newChain) {
  const aUnspentTxOuts = isValidChain(newChain);
  const validChain = aUnspentTxOuts !== null;
  if (validChain && getAccumulatedDifficulty(newChain) > getAccumulatedDifficulty(getBlockChain())) {
    console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');

    blockchain = newBlocks;

    setUnspentTxOuts(aUnspentTxOuts);
    updateTransactionPool(unspentTxOuts);
    broadcastLatest();
  } else {
    console.log('Received blockchain invalid');
  }
}

function handleReceivedTransaction(transaction) {
  addToTransactionPool(transaction, getUnspentTxOuts());
}

function findTransaction(id) {
  for (const block of blockchain) {
    for (const tx of block.data) {
      if (tx.id === id) {
        return { transaction: tx, blockIndex: block.index }
      }
    }
  }
  return { transaction: null, blockIndex: NaN }
}

function getTransactionInputDetail(transaction, blockchain) {
  const allTransaction = blockchain.map(block => block.data).flat();

  const txIns = transaction.txIns;
  const inputDetailOfTransaction = [];

  for (const txIn of txIns) {
    const referenceTx = allTransaction.find(tx => tx.id === txIn.txOutId);
    if (referenceTx) {
      inputDetailOfTransaction.push({
        txOutId: txIn.txOutId,
        txOutIndex: txIn.txOutIndex,
        address: referenceTx.txOuts[txIn.txOutIndex].address,
        amount: referenceTx.txOuts[txIn.txOutIndex].amount
      })
    }
  }
  return inputDetailOfTransaction;
}

/* ######################################################################################*/
const WebSocket = require('ws');

const MessageType = {
  QUERY_LATEST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCKCHAIN: 2,
  QUERY_TRANSACTION_POOL: 3,
  RESPONSE_TRANSACTION_POOL: 4,
  QUERY_NODES: 5,
  RESPONSE_NODES: 6,
  NODE_ADDRESS: 7
}

let server;
let myNodeUrl = "";
function initP2PServer(port) {
  if (!server) {
    server = new WebSocket.Server({ port: port });
    server.on('connection', (ws, req) => {
      console.log("Connect to client " + ws._socket.remoteAddress);
      // console.log(req);
      initConnection(ws);
    });
    myNodeUrl = `ws://localhost:${port}`;
    console.log("Websoket server is running at port: " + port);
  }
  return server;
}

function getSockets() {
  // return sockets;
  return [...server.clients];
}

function initConnection(ws) {
  initMessageHandler(ws);
  initErrorHandler(ws);

  console.log("##### Send message to query latest block");
  write(ws, queryChainLengthMsg());

  // query transaction pool only some time after chain query
  setTimeout(() => {
    console.log("##### Send message to query transaction pool");
    broadcast(queryTransactionPoolMsg());
  }, 500);
}

function initMessageHandler(ws) {
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message === null) {
        console.log("Could not parse received JSON message: " + data);
        return;
      }
      console.log("***** Received message: " + JSON.stringify(message));
      switch (message.type) {
        case MessageType.QUERY_LATEST:
          console.log("##### Response latest block to " + ws.url);
          write(ws, responseLatestMsg());
          break;
        case MessageType.QUERY_ALL:
          console.log("##### Response blockchain to " + ws.url);
          write(ws, responseChainMsg());
          break;
        case MessageType.RESPONSE_BLOCKCHAIN:
          const receivedBlocks = JSON.parse(message.data);
          if (receivedBlocks === null) {
            console.log("Invalid blocks received:");
            console.log(message.data);
            break;
          }
          handleBlockChainResponse(receivedBlocks);
          break;
        case MessageType.QUERY_TRANSACTION_POOL:
          write(ws, responseTransactionPoolMsg());
          break;
        case MessageType.RESPONSE_TRANSACTION_POOL:
          const receivedTransactionPool = JSON.parse(message.data);
          if (receivedTransactionPool === null) {
            console.log("Invalid transaction received: " + JSON.parse(message.data));
            break;
          }
          receivedTransactionPool.forEach(transaction => {
            try {
              handleReceivedTransaction(transaction);
              // if no error is thrown, transaction was indeed added to the pool
              // let's broadcast transaction pool
              broadcastTransactionPool();
            } catch (e) {
              console.log(e.message);
            }
          });
          break;
        case MessageType.NODE_ADDRESS:
          const remoteAddress = message.data;
          if (!isConnectedToNode(remoteAddress)) {
            connectToPeer(remoteAddress);
          }
          break;
        default:
          console.log('Message type not found!');
          break;
      }
    } catch (error) {
      console.log('error in function initMessageHandler!', error);
      // throw new Error()
    }
  });
}

function initErrorHandler(ws) {
  function closeConnection(websocket) {
    console.log("Disconnect to peer: " + websocket.url);
    // sockets.splice(sockets.indexOf(websocket), 1);
  };

  ws.on('close', () => closeConnection(ws));
  ws.on('error', () => closeConnection(ws));
}

/* ------------ Send message --------------*/
function write(ws, message) {
  console.log("message", JSON.stringify(message));
  ws.send(JSON.stringify(message));
}

function broadcast(message) {
  server.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      write(client, message);
    }
  });
}

function broadcastLatest() {
  broadcast(responseLatestMsg());
}

function broadcastTransactionPool() {
  broadcast(responseTransactionPoolMsg());
}


/*------------- Query message -------------*/
function queryChainLengthMsg() {
  return { type: MessageType.QUERY_LATEST, data: null };
}

function queryAllMsg() {
  return { type: MessageType.QUERY_ALL, data: null };
}

function queryTransactionPoolMsg() {
  return { type: MessageType.QUERY_TRANSACTION_POOL, data: null };
}

function nodeUrlMsg() {
  return { type: MessageType.NODE_ADDRESS, data: myNodeUrl };
}


/*------------  Response message -----------*/
function responseLatestMsg() {
  const latestBlock = getLatestBlock();
  return {
    type: MessageType.RESPONSE_BLOCKCHAIN,
    data: JSON.stringify([latestBlock])
  };
}

function responseChainMsg() {
  return {
    type: MessageType.RESPONSE_BLOCKCHAIN,
    data: JSON.stringify(getBlockChain())
  };
}

function responseTransactionPoolMsg() {
  return {
    type: MessageType.RESPONSE_TRANSACTION_POOL,
    data: JSON.stringify(getTransactionPool())
  };
}


/*-------------- Handle response message ------------*/
function handleBlockChainResponse(receivedBlocks) {
  console.log("Handling block response...");
  if (receivedBlocks.length === 0) {
    console.log("Received block chain size of 0");
    return;
  }
  const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
  // console.log(latestBlockReceived);
  if (!isValidBlockStructure(latestBlockReceived)) {
    console.log("Block structure not valid");
    return;
  }
  const latestBlockHeld = getLatestBlock();
  if (latestBlockReceived.index > latestBlockHeld.index) {
    console.log('blockchain possibly behind. We got: '
      + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
    if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
      if (addBlockToChain(latestBlockReceived)) {
        console.log("Add new block to chain successfully!");
        IOUtil.writeJSON(BLOCKCHAIN_LOCATION, JSON.stringify(blockchain, null, 2));
        console.log("##### Broadcast to response new block to network");
        broadcast(responseLatestMsg());
      }
    } else if (receivedBlocks.length === 1) {
      console.log("We have to query the chain from our peer");
      console.log("##### Broadcast to query new blockchain to network");
      broadcast(queryAllMsg());
    } else {
      console.log("Received blockchain is longer than current blockchain");
      replaceChain(receivedBlocks);
      console.log("Replace blockchain successfully!");
      IOUtil.writeJSON(BLOCKCHAIN_LOCATION, JSON.stringify(blockchain, null, 2));
    }
  } else {
    console.log("Received blockchain is not longer than your blockchain. Do nothing");
  }
}

/* -------------------- Connect to peer ------------------- */
const connectedNodeUrls = [];

function isConnectedToNode(url) {
  return connectedNodeUrls.find(node => node === url) ? true : false;
}

function connectToPeer(url) {
  const ws = new WebSocket(url);

  ws.on('open', () => {
    write(ws, nodeUrlMsg());
    initConnection(ws);
    //Save connected node url
    connectedNodeUrls.push(url);
  });

  ws.on('error', () => {
    console.log('Connection failed');
  });
}

const HOST_LOCATION = 'database/host.json';

function connectToPeers() {
  const jsonString = IOUtil.readJSON(HOST_LOCATION);
  if (jsonString.trim()) {
    const hosts = JSON.parse(jsonString);
    for (const host of hosts) {
      if (host === myNodeUrl) continue;
      console.log(`Connecting to ${host}...`);
      connectToPeer(host);
    }
  }
}


module.exports = {
  getLatestBlock, Block, getBlockChain, getUnspentTxOuts, sendTransaction,
  generateRawNextBlock, generateNextBlock, addBlockToChain,
  handleReceivedTransaction, getMyUnspentTransactionOutputs,
  getAccountBalance, isValidBlockStructure, replaceChain, unspentTxOuts,
  connectToPeer,
  broadcastLatest,
  initP2PServer,
  getSockets,
  broadcastTransactionPool,
  connectToPeers,
  getBlock, findTransaction,
  getTransactionInputDetail
}