const Tx = require('ethereumjs-tx')
const Web3Utils = require('web3-utils')

import {web3Object} from './contract'
const adminAddress = '0x17Eb9e0c2924338FfEED678E7DB0363d9D5Ba3bB'
// const adminAddress = '0x4e363ec5DE554cC5F3b930211C61716fbaCA240c'
const adminPvtKey = Buffer.from('2fcd47ef9d97fc48b9b11ba252aedfa8947463a34025501c548379e56f8c5ee3', 'hex')

export async function sendCoin(extraData, from){
  let nonce = await web3Object.wallet_web3.eth.getTransactionCount(adminAddress, 'pending')
  const txObj = {
    nonce:Web3Utils.toHex(nonce),
    gasPrice: Web3Utils.toHex(1000000000),// 1000 maxwell
    gasLimit: Web3Utils.toHex(1000000), // calculation of gas and gas Price is skipped here
    to: window.mainAddress,
    value: Web3Utils.toHex('0'),
    data: extraData,
  }

  var tx = new Tx(txObj);
  tx.sign(adminPvtKey)
  var serializedTx = '0x' + tx.serialize().toString('hex')

  return await web3Object.wallet_web3.eth.sendSignedTransaction(serializedTx)
}
// 向我们的钱包发送交易
export async function sendTransactionInCtxwallet(extraData, address, value, fn){
  let nonce = await web3Object.wallet_web3.eth.getTransactionCount(adminAddress, 'pending')
  window.ctxWeb3.eth.sendTransaction(
    {
      from: address,
      to: window.mainAddress,
      value: Web3Utils.toHex(value * window.defaultUnit),
      gas: Web3Utils.toHex(1000000),
      gasPrice: Web3Utils.toHex(1000000000),
      nonce: Web3Utils.toHex(nonce),
      data: extraData
    }, setIn)
    // 监听交易结果
    async function setIn(err, hashTx){
      if (err != null) {
        fn(err, null)
      }
      window.ctxWeb3.eth.getTransactionReceipt(hashTx, (err2, res) => {
        console.log(err2, res)
        if (err2 != null || res != null) {
          fn(err2, res)
        } else {
          setTimeout(() => {
            setIn(null, hashTx)
          }, 50)
        }
      })
    }
  // return await web3Object.wallet_web3.eth.sendSignedTransaction(serializedTx)
}

