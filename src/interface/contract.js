 

import   Web3  from 'web3'

const minterface = require('./CortexArtAbi.json')
const mainAddress = window.mainAddress // publicJs中统一设置

 let  obj  = {
  web3: {},
  managerContract: {},
  address: ''
}

if (window.walletModel === 1 && window.ctxWeb3) {
  const wallet_web3 =  new Web3(window.ctxWeb3.currentProvider)
  const managerContract = new wallet_web3.eth.Contract(minterface, mainAddress)
  obj = {wallet_web3, managerContract}
}

const testAbi = [
  {
   "constant": false,
   "inputs": [
    {
     "name": "_v",
     "type": "uint256"
    }
   ],
   "name": "func",
   "outputs": [],
   "payable": false,
   "stateMutability": "nonpayable",
   "type": "function"
  },
  {
   "constant": true,
   "inputs": [],
   "name": "i",
   "outputs": [
    {
     "name": "",
     "type": "uint256"
    }
   ],
   "payable": false,
   "stateMutability": "view",
   "type": "function"
  }
 ]

 const testAddress = '0x4e363ec5DE554cC5F3b930211C61716fbaCA240c'


if (window.walletModel === 2 && window.web3) {
  const wallet_web3 =  new Web3(window.web3.currentProvider)
  const managerContract = new wallet_web3.eth.Contract(minterface, mainAddress)
  // const managerContract2 = new wallet_web3.eth.Contract(testAbi, testAddress)
  obj = {wallet_web3, managerContract}
}


window.web3Object = obj

export const web3Object = {...obj}

