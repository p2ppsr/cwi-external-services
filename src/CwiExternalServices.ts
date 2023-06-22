import { Chain, CwiError, ERR_MISSING_PARAMETER, ERR_TXID_INVALID, asString, doubleSha256BE } from "cwi-base"
import { CwiExternalServicesApi, GetMerkleProofResultApi, GetMerkleProofServiceApi, GetRawTxResultApi, GetRawTxServiceApi } from "./Api/CwiExternalServicesApi"
import { MapiCallbackApi, PostRawTxResultApi, PostRawTxServiceApi } from "./Api/CwiExternalServicesApi"
import { ServiceCollection } from "./ServiceCollection"

import { postRawTxToGorillaPool, postRawTxToTaal } from "./postRawTxServices"
import { getRawTxFromWhatsOnChain } from "./getRawTxServices"
import { getProofFromGorillaPool, getProofFromMetastreme, getProofFromTaal, getProofFromWhatsOnChain, getProofFromWhatsOnChainTsc } from "./getProofServices"
import { getMapiPostTxResponse } from "./merchantApiUtils"
import { ERR_EXTSVS_DOUBLE_SPEND } from "./ERR_EXTSVS_errors"
import { MapiPostTxResponseApi } from "./Api/MerchantApi"

export interface CwiExternalServicesOptions {
    mainTaalApiKey?: string
    testTaalApiKey?: string
}

export class CwiExternalServices implements CwiExternalServicesApi {
    static createDefaultOptions() : CwiExternalServicesOptions {
        const o: CwiExternalServicesOptions = {
            mainTaalApiKey: "mainnet_9596de07e92300c6287e4393594ae39c",
            testTaalApiKey: "testnet_0e6cf72133b43ea2d7861da2a38684e3"
        }
        return o
    }

    options: CwiExternalServicesOptions

    getProofs: ServiceCollection<GetMerkleProofServiceApi>
    getRawTxs: ServiceCollection<GetRawTxServiceApi>
    postRawTxs: ServiceCollection<PostRawTxServiceApi>

    constructor(options?: CwiExternalServicesOptions) {
        this.options = options || CwiExternalServices.createDefaultOptions()
        
        this.getProofs = new ServiceCollection<GetMerkleProofServiceApi>()
        .add({ name: 'WhatsOnChain', service: getProofFromWhatsOnChain})
        .add({ name: 'WhatsOnChainTsc', service: getProofFromWhatsOnChainTsc})
        .add({ name: 'MetaStreme', service: getProofFromMetastreme})
        .add({ name: 'GorillaPool', service: getProofFromGorillaPool})
        .add({ name: 'Taal', service: this.makeGetProofFromTaal() })
        
        this.getRawTxs = new ServiceCollection<GetRawTxServiceApi>()
        .add({ name: 'WhatsOnChain', service: getRawTxFromWhatsOnChain})

        this.postRawTxs = new ServiceCollection<PostRawTxServiceApi>()
        .add({ name: 'GorillaPool', service: postRawTxToGorillaPool })
        .add({ name: 'Taal', service: this.makePostRawTxToTaal() })
    }

    private taalApiKey(chain: Chain) {
         const key = chain === 'main' ? this.options.mainTaalApiKey : this.options.testTaalApiKey
         if (!key) throw new ERR_MISSING_PARAMETER(`options.${chain}TallApiKey`, 'valid')
         return key
    }

    private makePostRawTxToTaal() {
        return (rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi) => {
            return postRawTxToTaal(rawTx, chain, callback, this.taalApiKey(chain))
        }
    }

    private makeGetProofFromTaal() {
        return (txid: string | Buffer, chain: Chain) => {
            return getProofFromTaal(txid, this.taalApiKey(chain))
        }
    }

    async postRawTx(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi[]> {
        
        const txid = doubleSha256BE(rawTx)

        return await Promise.all(this.postRawTxs.allServices.map(async service => {
            const r = await service(rawTx, chain, callback)

            // Standardize results while preserving evidence for history logging.
            
            let payload: MapiPostTxResponseApi | undefined
            // If mapi response, confirm signature of payload
            if (r.status === 'success' || !r.error) {
                try {
                    payload = r.mapi ? getMapiPostTxResponse(r.mapi, txid) : undefined
                } catch (e: unknown) {
                    r.status = 'error'
                    r.error = CwiError.fromUnknown(e)
                }
            }
            if (r.status === 'success') {
                // TODO: This is a kludge. Protocol should encode this explicitly.
                // "resultDescription": "" | "Transaction already mined into block" | "Already known"
                const d = (payload?.resultDescription || '').toLowerCase()
                r.alreadyMined = d.indexOf('already mined') > -1
                r.alreadyKnown = r.alreadyMined || d.indexOf('already known') > -1
            } else {
                if (payload) {
                    // TODO: This is a kludge. Protocol should encode this explicitly.
                    // currently mapi has no reliable way of knowing this...
                    if (payload.conflictedWith)
                        r.error = new ERR_EXTSVS_DOUBLE_SPEND()
                }
            }
            return r
        }))
    }

    async getRawTx(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetRawTxResultApi> {
        
        if (useNext)
            this.getRawTxs.next()

        const r0: GetRawTxResultApi = { txid: asString(txid) }

        for (let tries = 0; tries < this.getRawTxs.count; tries++) {
            const service = this.getRawTxs.service
            const r = await service(txid, chain)
            if (r.rawTx) {
                const hash = asString(doubleSha256BE(r.rawTx))
                // Confirm transaction hash matches txid
                if (hash === asString(txid)) {
                    // If we have a match, call it done.
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

            this.getRawTxs.next()
        }
        return r0
    }

    async getMerkleProof(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetMerkleProofResultApi> {
        
        if (useNext)
            this.getProofs.next()

        const r0: GetMerkleProofResultApi = {}

        for (let tries = 0; tries < this.getProofs.count; tries++) {
            const service = this.getProofs.service
            const r = await service(txid, chain)
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

            this.getProofs.next()
        }
        return r0
    }

}
