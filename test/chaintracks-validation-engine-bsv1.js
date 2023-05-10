/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { utils } = require('cwi-base')

const getMerkleTreeParent = (leftNode, rightNode) => {
  // swap endianness before concatenating
  const leftConc = Buffer.from(leftNode, 'hex').reverse()
  const rightConc = Buffer.from(rightNode, 'hex').reverse()

  // concatenate leaves
  const concat = Buffer.concat([leftConc, rightConc])

  // hash the concatenation
  //const hash = bsv.crypto.Hash.sha256sha256(concat)
  const hash = utils.doubleSha256HashLE(concat)

  // swap endianness at the end and convert to hex string
  return Buffer.from(hash, 'hex').reverse().toString('hex')
}

/**
 * Returns a Promise that resolves if the merkle proof is valid, otherwise
 * the Promise should reject with an error
 *
 * @param {Object} params All parameters are passed in an object
 * @param {Object} params.proof The TSC-format merkle proof to validate. txOrid is always a TXID, and targetType is always merkleRoot.
 *
 * @returns {boolean} The Promise that resolves or rejects
 */
const checkMerkleProof = ({ proof }) => {
  const nodes = proof.nodes // different nodes used in the merkle proof
  let index = proof.index // index of node in current layer (will be changed on every iteration)
  let c = proof.txOrId // first calculated node is the txid of the tx to prove

  nodes.forEach(p => {
    // Check if the node is the left or the right child
    const cIsLeft = index % 2 === 0

    // Check for duplicate hash - this happens if the node (p) is
    // the last element of an uneven merkle tree layer
    if (p === '*') {
      if (!cIsLeft) { // this shouldn't happen...
        throw new Error('invalid duplicate on left hand side according to index value')
      }
      p = c
    }

    // Calculate the parent node
    if (cIsLeft) {
      // Concatenate left leaf (c) with right leaf (p)
      c = getMerkleTreeParent(c, p)
    } else {
      // Concatenate left leaf (p) with right leaf (c)
      c = getMerkleTreeParent(p, c)
    }

    // We need integer division here with remainder dropped.
    // Javascript does floating point math by default so we
    // need to use Math.floor to drop the fraction.
    // In most languages we would use: i = i / 2;
    index = Math.floor(index / 2)
  })

  // c is now the calculated merkle root
  return c === proof.target
}

module.exports = {
  checkMerkleProof
}