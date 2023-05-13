import { Chain, ChaintracksClientApi, CwiError, ERR_TXID_INVALID, asBuffer, asString, computeMerkleTreeParent, doubleSha256BE } from "cwi-base"
import { MapiResponseApi, TscMerkleProofApi } from "./Api/MerchantApi"
import axios from 'axios'
import { getMapiTxStatusPayload } from "./merchantApiUtils"
import { GetMerkleProofResultApi, GetMerkleProofServiceApi, GetRawTxResultApi, GetRawTxServiceApi } from "./Api/CwiExternalServicesApi"

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

function computeIndexFromWhatsOnChainProof(proof: WhatsOnChainProof) : number {
    let c = asBuffer(proof.hash)
    let a = ''
    for (let level = 0; level < proof.branches.length; level++) {
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

export interface CwiExternalServicesOptions {
    mainTaalApiKey?: string
    testTaalApiKey?: string
}

export class CwiExternalServices {
    static createDefaultOptions() : CwiExternalServicesOptions {
        const o: CwiExternalServicesOptions = {
            mainTaalApiKey: "mainnet_9596de07e92300c6287e4393594ae39c",
            testTaalApiKey: "testnet_0e6cf72133b43ea2d7861da2a38684e3"
        }
        return o
    }

    options: CwiExternalServicesOptions

    getProofServices: GetMerkleProofServiceApi[]
    getProofServicesIndex = 0

    getRawTxServices: GetRawTxServiceApi[]
    getRawTxServicesIndex = 0

    constructor(options?: CwiExternalServicesOptions) {
        this.options = options || CwiExternalServices.createDefaultOptions()
        
        const proofs: GetMerkleProofServiceApi[] = []
        proofs.push({ name: 'WhatsOnChain', service: CwiExternalServices.getMerkleProofFromWhatsOnChain})
        proofs.push({ name: 'WhatsOnChainTsc', service: CwiExternalServices.getMerkleProofFromWhatsOnChainTsc})
        proofs.push({ name: 'MetaStreme', service: CwiExternalServices.getMerkleProofFromMetastreme})
        proofs.push({ name: 'GorillaPool', service: CwiExternalServices.getMerkleProofFromGorillaPool})
        proofs.push(this.makeTaal())
        this.getProofServices = proofs
        
        const rawTxs: GetRawTxServiceApi[] = []
        rawTxs.push({ name: 'WhatsOnChain', service: CwiExternalServices.getRawTxFromWhatsOnChain})
        this.getRawTxServices = rawTxs
    }

    private makeTaal(): GetMerkleProofServiceApi {
        return {
            name: 'Taal',
            service: (txid: string | Buffer, chain: Chain) => {
                const mainApiKey = this.options.mainTaalApiKey || ''
                const testApiKey = this.options.testTaalApiKey || ''
                return CwiExternalServices.getMerkleProofFromTaal(txid, chain === 'main' ? mainApiKey : testApiKey)
            }
        }
    }

    private nextRawTxServicesIndex() {
        this.getRawTxServicesIndex = (this.getRawTxServicesIndex + 1) % this.getRawTxServices.length
        return this.getRawTxServicesIndex
    }

    async getRawTx(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetRawTxResultApi> {
        
        if (useNext)
            this.nextProofServicesIndex()

        const r0: GetRawTxResultApi = { txid: asString(txid) }

        for (let tries = 0; tries < this.getRawTxServices.length; tries++) {
            const service = this.getRawTxServices[this.getRawTxServicesIndex]
            const r = await service.service(txid, chain)
            if (r.rawTx) {
                const hash = asString(doubleSha256BE(r.rawTx))
                // Confirm transaction hash matches txid
                if (hash === asString(txid)) {
                    // If we have a proof, call it done.
                    r0.rawTx = r.rawTx
                    r0.name = r.name
                    break
                }
                r.error = { name: r.name, err: new ERR_TXID_INVALID() }
                r.rawTx = undefined
            }
            if (r.mapi && !r0.mapi)
                // If we have a mapi response and didn't before...
                r0.mapi = r.mapi
            if (r.error && !r0.error)
                // If we have an error and didn't before...
                r0.error = r.error

            this.nextRawTxServicesIndex()
        }
        return r0
    }

    private nextProofServicesIndex() {
        this.getProofServicesIndex = (this.getProofServicesIndex + 1) % this.getProofServices.length
        return this.getProofServicesIndex
    }

    async getMerkleProof(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetMerkleProofResultApi> {
        
        if (useNext)
            this.nextProofServicesIndex()

        const r0: GetMerkleProofResultApi = {}

        for (let tries = 0; tries < this.getProofServices.length; tries++) {
            const service = this.getProofServices[this.getProofServicesIndex]
            const r = await service.service(txid, chain)
            if (r.proof) {
                // If we have a proof, call it done.
                r0.proof = r.proof
                r0.name = r.name
                break
            }
            if (r.mapi && !r0.mapi)
                // If we have a mapi response and didn't before...
                r0.mapi = r.mapi
            if (r.error && !r0.error)
                // If we have an error and didn't before...
                r0.error = r.error

            this.nextProofServicesIndex()
        }
        return r0
    }

    static async getRawTxFromWhatsOnChain(txid: string | Buffer, chain: Chain): Promise<GetRawTxResultApi> {

        const r: GetRawTxResultApi = { name: 'WoC', txid: asString(txid) }

        try {
            const url = `https://api.whatsonchain.com/v1/bsv/${chain}/tx/${txid}/hex`
            const { data } = await axios.get(url)
            if (!data)
               return r 

            r.rawTx = asBuffer(data)

        } catch (err: unknown) {
            r.error = { name: r.name, err: CwiError.fromUnknown(err) }
        }

        return r
    }

    /**
     * GorillaPool.io MAINNET ONLY
     * 
     * has a mapi transaction status endpoint for mainNet, not for testNet,
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
    static async getMerkleProofFromGorillaPool(txid: string | Buffer, chain: Chain): Promise<GetMerkleProofResultApi> {

        const r: GetMerkleProofResultApi = { name: 'GorillaPool' }

        // Testnet is not currently supported.
        if (chain === 'test') return r

        try {
            const { data } = await axios.get(`https://mapi.gorillapool.io/mapi/tx/${txid}`)

            r.mapi = { name: r.name, resp: data as MapiResponseApi }

            const txStatus = getMapiTxStatusPayload(txid, r.mapi.resp)

            if (txStatus.returnResult !== 'success' || !txStatus.merkleProof)
                return r

            r.proof = txStatus.merkleProof

        } catch (err: unknown) {
            r.error = { name: r.name, err: CwiError.fromUnknown(err) }
        }

        return r
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
    static async getMerkleProofFromTaal(txid: string | Buffer, apiKey: string): Promise<GetMerkleProofResultApi> {

        const r: GetMerkleProofResultApi = { name: 'Taal' }

        try {
            const headers = { headers: { Authorization: apiKey } }

            const { data } = await axios.get(`https://mapi.taal.com/mapi/tx/${txid}?merkleProof=true&merkleFormat=TSC`, headers)
            r.mapi = { name: r.name, resp: data as MapiResponseApi }

            const txStatus = getMapiTxStatusPayload(txid, r.mapi.resp)

            if (txStatus.returnResult !== 'success' || !txStatus.merkleProof)
                return r

            r.proof = txStatus.merkleProof

        } catch (err: unknown) {
            r.error = { name: r.name, err: CwiError.fromUnknown(err) }
        }

        return r
    }

    /**
     * metastreme.com has a partially conforming merkleProof implementation.
     * 
     * Both mainNet and testNet are supported.
     * 
     * Proofs incorrectly included a copy of the computed value instead of "*" along right side of merkle tree.
     * 
     * targetType of hash
     * 
     * @param txid
     * @param chain 
     * @returns 
     */
    static async getMerkleProofFromMetastreme(txid: string | Buffer, chain: Chain): Promise<GetMerkleProofResultApi> {

        const r: GetMerkleProofResultApi = { name: 'Metastreme' }

        try {
            const { data } = await axios.get(`https://bsv-${chain}net.proof.metastreme.com/tx/${txid}/proof`)

                r.proof = data as TscMerkleProofApi

        } catch (err: unknown) {
            r.error = { name: r.name, err: CwiError.fromUnknown(err) }
        }

        return r
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
    static async getMerkleProofFromWhatsOnChain(txid: string | Buffer, chain: Chain): Promise<GetMerkleProofResultApi> {

        const r: GetMerkleProofResultApi = { name: 'WoC' }

        try {
            const { data } = await axios.get(`https://api.whatsonchain.com/v1/bsv/${chain}/tx/${txid}/proof`)
            if (!data || data.length < 1)
               return r 

            r.proof = data.map(d => {
                const wocProof = d as WhatsOnChainProof
                return {
                    index: computeIndexFromWhatsOnChainProof(wocProof),
                    txOrId: wocProof.hash,
                    target: wocProof.merkleRoot,
                    targetType: 'merkleRoot',
                    nodes: wocProof.branches.map(x => x.hash),
                }
            })

        } catch (err: unknown) {
            r.error = { name: r.name, err: CwiError.fromUnknown(err) }
        }

        return r
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
    static async getMerkleProofFromWhatsOnChainTsc(txid: string | Buffer, chain: Chain): Promise<GetMerkleProofResultApi> {

        const r: GetMerkleProofResultApi = { name: 'WoCTsc' }

        try {
            const { data } = await axios.get(`https://api.whatsonchain.com/v1/bsv/${chain}/tx/${txid}/proof/tsc`)
            if (!data || data.length < 1)
               return r 

            r.proof = data.map(d => {
                const wocProof = d as WhatsOnChainProofTsc
                return {
                    index: wocProof.index,
                    txOrId: wocProof.txOrId,
                    target: wocProof.target,
                    targetType: 'hash',
                    nodes: wocProof.nodes
                }
            })

        } catch (err: unknown) {
            r.error = { name: r.name, err: CwiError.fromUnknown(err) }
        }

        return r
    }
}