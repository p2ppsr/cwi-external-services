//import { MapiResponseApi, TscMerkleProofApi } from './Api/CwiExternalServicesApi'
//import { computeMerkleTreeParent, computeRootFromMerkleProofNodes, getMapiTxStatusPayload } from './spvVerifierUtils'
//import { asBuffer, asString, Chain } from '@cwi/chaintracks-base'

import { asBuffer, asString, Chain, computeMerkleTreeParent, computeRootFromMerkleProofNodes } from '@cwi/base'
import axios from 'axios'
import { MapiResponseApi, TscMerkleProofApi } from './Api/MerchantApi'
import { getMapiTxStatusPayload } from './merchantApiUtils'

/**
 * GorillaPool.io has a mapi transaction status endpoint for mainNet, not for testNet,
 * and does NOT return merkle proofs...
 * 
 * mapiResponse is signed and has txStatus payload.
 * {
 *   apiVersion: "",
 *   timestamp: "2023-03-23T02:14:39.362Z",
 *   txid: "9c31ed1dea4ec1aae0475addc0a74eaed68b718d9983d42b111c387d6696a949",
 *   returnResult: "success",
 *   resultDescription: "",
 *   blockHash: "00000000000000000e155235fd83a8757c44c6299e63104fb12632368f3f0cc9",
 *   blockHeight: 700000,
 *   confirmations: 84353,
 *   minerId: "03ad780153c47df915b3d2e23af727c68facaca4facd5f155bf5018b979b9aeb83",
 *   txSecondMempoolExpiry: 0,
 * }
 * 
 * @param txid 
 * @returns 
 */
export async function getMerkleProofFromGorillaPool(txid: string | Buffer) : Promise<TscMerkleProofApi | undefined> {

    try {
        const { data } = await axios.get(`https://mapi.gorillapool.io/mapi/tx/${txid}`)
        const mapiResponse = data as MapiResponseApi

        const txStatus = getMapiTxStatusPayload(txid, mapiResponse)

        if (txStatus.returnResult !== 'success' || !txStatus.merkleProof)
            return undefined
        
        const proof = txStatus.merkleProof
            
        switch (proof.targetType) {
            case "header":
                // pull out just the merkle root of the header
                proof.target = asString(asBuffer(proof.target).subarray(36, 68).reverse());
                proof.targetType = "merkleRoot"
                break;
            case "merkleRoot":
                // no action needed
                break;
            default:
                // we can't lookup height or block hash, so hope for the best...
                return proof
        }
        
        const computedRoot = computeRootFromMerkleProofNodes(proof.index, txid, proof.nodes)

        if (computedRoot.equals(Buffer.alloc(32)) || !computedRoot.equals(asBuffer(proof.target)))
            return undefined

        return proof

    } catch { /* ignore */ }

    return undefined
}

/**
 * Taal.com has the most functional txStatus and merkleProof endpoint for both mainNet and testNet
 * 
 * Proofs use targetType "header" which is converted to "merkleRoot".
 * 
 * Proofs correctly use duplicate computed node value symbol "*".
 * 
 * An apiKey must be used and must correspond to the target chain: mainNet or testNet.
 * 
 * @param txid 
 * @param apiKey 
 * @returns 
 */
export async function getMerkleProofFromTaal(txid: string | Buffer, apiKey: string) : Promise<TscMerkleProofApi | undefined> {

    try {
        const headers = { headers: { Authorization: apiKey } }

        const { data } = await axios.get(`https://mapi.taal.com/mapi/tx/${txid}?merkleProof=true&merkleFormat=TSC`, headers)
        const mapiResponse = data as MapiResponseApi

        const txStatus = getMapiTxStatusPayload(txid, mapiResponse)

        if (txStatus.returnResult !== 'success' || !txStatus.merkleProof)
            return undefined
        
        const proof = txStatus.merkleProof
            
        switch (proof.targetType) {
            case "header":
                // pull out just the merkle root of the header
                proof.target = asString(asBuffer(proof.target).subarray(36, 68).reverse());
                proof.targetType = "merkleRoot"
                break;
            case "merkleRoot":
                // no action needed
                break;
            default:
                // we can't lookup height or block hash, so hope for the best...
                return proof
        }
        
        const computedRoot = computeRootFromMerkleProofNodes(proof.index, txid, proof.nodes)

        if (computedRoot.equals(Buffer.alloc(32)) || !computedRoot.equals(asBuffer(proof.target)))
            return undefined

        return proof

    } catch { /* ignore */ }

    return undefined
}

/**
 * metastreme.com has a partially conforming merkleProof implementation.
 * 
 * Both mainNet and testNet are supported.
 * 
 * Proofs incorrectly included a copy of the computed value instead of "*" along right side of merkle tree.
 * 
 * targetType of hash is used which prevents automatic proof checking as the target root value isn't known
 * without a lookup request.
 * 
 * @param txid
 * @param chain 
 * @returns 
 */
export async function getMerkleProofFromMetastreme(txid: string | Buffer, chain: Chain) : Promise<TscMerkleProofApi | undefined> {

    try {
        const { data } = await axios.get(`https://bsv-${chain}net.proof.metastreme.com/tx/${txid}/proof`)
        const proof = data as TscMerkleProofApi
            
        switch (proof.targetType) {
            case "header":
                // pull out just the merkle root of the header
                proof.target = asString(asBuffer(proof.target).subarray(36, 68).reverse());
                proof.targetType = "merkleRoot"
                break;
            case "merkleRoot":
                // no action needed
                break;
            default:
                // we can't lookup height or block hash, so hope for the best...
                return proof
        }
        
        const computedRoot = computeRootFromMerkleProofNodes(proof.index, txid, proof.nodes)

        if (computedRoot.equals(Buffer.alloc(32)) || !computedRoot.equals(asBuffer(proof.target)))
            return undefined

        return proof

    } catch { /* ignore */ }

    return undefined
}

interface WhatsOnChainProofBranch {
    hash: string,
    pos: "R" | "L"
}

interface WhatsOnChainProof {
    blockHash: string,
    branches: WhatsOnChainProofBranch[],
    hash: string,
    merkleRoot: string
}

interface WhatsOnChainProofTsc {
    index: number,
    txOrId: string,
    target: string,
    nodes: string[]
}

function computeIndexFromWhatsOnChainProof(proof: WhatsOnChainProof) {
    let c = asBuffer(proof.hash)
    let a = ''
    for (let level = 0; level < proof.branches.length ; level++) {
        const b = proof.branches[level]
        const p = asBuffer(b.hash)
        const pIsLeft = b.pos === 'L' && !p.equals(c)
        a = (pIsLeft ? '1' : '0') + a
        c = pIsLeft
            ? computeMerkleTreeParent(p, c)
            : computeMerkleTreeParent(c, p);
    }
    return parseInt(a, 2);
}

/**
 * WhatOnChain.com has their own "hash/pos/R/L" proof format and a more TSC compliant proof format.
 * 
 * The "/proof" endpoint returns an object for each node with "hash" and "pos" properties. "pos" can have values "R" or "L".
 * Normally "pos" indicates which side of a concatenation the provided "hash" goes with one exception! EXCEPTION: When the
 * provided should be "*" indicating edge-of-the-tree-duplicate-computed-value, they include the expected computed value and the pos value
 * is always "L", even when it should really be "R". This only matters if you are trying to compute index from the "R" and "L" values.
 * 
 * @param txid
 * @param chain 
 * @returns 
 */
export async function getMerkleProofFromWhatsOnChain(txid: string | Buffer, chain: Chain) : Promise<TscMerkleProofApi | undefined> {

    try {
        const { data } = await axios.get(`https://api.whatsonchain.com/v1/bsv/${chain}/tx/${txid}/proof`)
        if (data.length !== 1)
            return undefined

        const wocProof = data[0] as WhatsOnChainProof

        const proof: TscMerkleProofApi = {
            index: computeIndexFromWhatsOnChainProof(wocProof),
            txOrId: wocProof.hash,
            target: wocProof.merkleRoot,
            targetType: 'merkleRoot',
            nodes: wocProof.branches.map(x => x.hash),
        }

        const computedRoot = computeRootFromMerkleProofNodes(proof.index, txid, proof.nodes)

        if (computedRoot.equals(Buffer.alloc(32)) || !computedRoot.equals(asBuffer(proof.target)))
            return undefined

        return proof

    } catch { /* ignore */ }

    return undefined
}

/**
 * WhatOnChain.com has their own "hash/pos/R/L" proof format and a more TSC compliant proof format.
 * 
 * The "/proof/tsc" endpoint is much closer to the TSC specification. It provides "index" directly and each node is just the provided hash value.
 * The "targetType" is unspecified and thus defaults to block header hash, requiring a Chaintracks lookup to get the merkleRoot...
 * Duplicate hash values are provided in full instead of being replaced by "*".
 * 
 * @param txid
 * @param chain 
 * @returns 
 */
export async function getMerkleProofFromWhatsOnChainTsc(txid: string | Buffer, chain: Chain) : Promise<TscMerkleProofApi | undefined> {

    try {
        const { data } = await axios.get(`https://api.whatsonchain.com/v1/bsv/${chain}/tx/${txid}/proof/tsc`)
        if (data.length !== 1)
            return undefined

        const wocProof = data[0] as WhatsOnChainProofTsc

        const proof: TscMerkleProofApi = {
            index: wocProof.index,
            txOrId: wocProof.txOrId,
            target: wocProof.target,
            targetType: 'hash',
            nodes: wocProof.nodes
        }

        const computedRoot = computeRootFromMerkleProofNodes(proof.index, txid, proof.nodes)

        if (computedRoot.equals(Buffer.alloc(32)) || !computedRoot.equals(asBuffer(proof.target)))
            return undefined

        return proof

    } catch { /* ignore */ }

    return undefined
}