

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI(window.ipfsConfig);
const descBuffer = Buffer.from('213123', 'utf-8');

export function ipfsAdd(file) {
  return new Promise(function (resolve, reject)  {
    ipfs.add(file)
    .then(res => resolve(res))
    .catch(res => reject(res))
  })
}
export function ipfsGet(hash) {
  return new Promise(function (resolve, reject)  {
    ipfs.get(hash)
    .then(res => resolve(res))
    .catch(res => reject(res))
  })
}