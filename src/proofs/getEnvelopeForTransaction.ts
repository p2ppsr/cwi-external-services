import {
    asBsvSdkTx, asString, Chain, ChaintracksClientApi,
    computeRootFromMerkleProofNodes, EnvelopeApi, EnvelopeEvidenceApi,
    ERR_INTERNAL, MapiResponseApi, TscMerkleProofApi, verifyTruthy
} from "cwi-base"
import { CwiExternalServices } from ".."
import { ERR_EXTSVS_ENVELOPE_DEPTH, ERR_EXTSVS_INVALID_TXID, ERR_EXTSVS_MERKLEROOT_MISSING } from "../base/ERR_EXTSVS_errors"
import { ChaintracksServiceClient } from "../base/ChaintracksServiceClient"

export interface GetEnvelopeOptionsApi {
    chaintracks?: ChaintracksClientApi
    maxRecursionDepth?: number
    /**
     * Use to generate test envelopes.
     * If set to a number greater than zero,
     * proofs will be ignored until that level.
     * The first level is zero.
     * userId must be undefined.
     */
    minProofLevel?: number
}

/**
 * A transaction envelope is a tree of inputs where all the leaves are proven transactions.
 * The trivial case is a single leaf: the envelope for a proven transaction is the rawTx and its proof.
 * 
 * Each branching level of the tree corresponds to an unmined transaction without a proof,
 * in which case the envelope is:
 * - rawTx
 * - mapiResponses from transaction processors (optional)
 * - inputs object where keys are this transaction's input txids and values are recursive envelope for those txids.    
 *
 * If storage is defined, any previously unseen txids that are required to build the envelope will be added to the proven_txs table, if they can be proven.
 * 
 * The options.maxRecursionDepth can be set to prevent overly deep and large envelopes. Will throw ERR_EXTSVS_ENVELOPE_DEPTH if exceeded.
 * 
 * @param services used to obtain rawTx and merkleProof data.
 * @param chain the chain on which txid exists.
 * @param txid the transaction hash for which an envelope is requested.
 * @param options default options use babbage cloud chaintracks service, chaintracks is required for envelope creation.
 */
export async function getEnvelopeForTransaction(services: CwiExternalServices, chain: Chain, txid: string | Buffer, options?: GetEnvelopeOptionsApi) : Promise<EnvelopeApi> {
    options ||= {}

    if (!options.chaintracks) {
        options.chaintracks = new ChaintracksServiceClient(chain, `https://npm-registry.babbage.systems:808${chain === 'main' ? '4' : '3'}`)
    }

    const r = await getEnvelopeForTransactionInternal(services, chain, txid, options, 0)
    return r
}

async function getEnvelopeForTransactionInternal(services: CwiExternalServices, chain: Chain, txid: string | Buffer, options: GetEnvelopeOptionsApi, _recursionDepth: number) : Promise<EnvelopeApi> {

    if (options.maxRecursionDepth && options.maxRecursionDepth <= _recursionDepth)
        throw new ERR_EXTSVS_ENVELOPE_DEPTH(options.maxRecursionDepth)

    txid = asString(txid)

    /**
     * Create an envelope branching inputs node
     * @param rawTx 
     * @param inputs 
     * @param mapiResponses 
     * @returns 
     */
    const makeEnvelopeInputsNode = async (rawTx: Buffer, inputs?: Record<string, EnvelopeEvidenceApi>, mapiResponses?: MapiResponseApi[]): Promise<EnvelopeApi> => {
        inputs ||= {}
        const bsvTx = asBsvSdkTx(rawTx)
        // New envelope promises
        const neps: Promise<EnvelopeApi>[] = []
        // Keep track of unique new txids since we can't add to inputs until we have them all.
        const newTxids = new Set<string>()
        for (const input of bsvTx.inputs) {
            const inputTxid = verifyTruthy(input.sourceTXID)
            if (inputs[inputTxid] || newTxids.has(inputTxid)) continue
            newTxids.add(inputTxid)
            const nep = getEnvelopeForTransactionInternal(services, chain, inputTxid, options, _recursionDepth + 1)
            neps.push(nep)
        }
        if (neps.length > 0) {
            const newEnvelopes = await Promise.all<EnvelopeApi>(neps)
            for (const ne of newEnvelopes) {
                if (!ne.txid) throw new ERR_INTERNAL('getEnvelopeForTransaction envelopes must always have txid properties at root level.')
                inputs[ne.txid] = ne
                // Remove redundant value.
                delete ne.txid
            }
        }
        const depth = Object.values(inputs).reduce((m, e) => Math.max(m, e.depth || 0), 0) + 1
        const r: EnvelopeApi = {
            txid: asString(txid),
            depth,
            rawTx: asString(rawTx),
            inputs
        }
        if (mapiResponses) r.mapiResponses = mapiResponses
        return r
    }
    
    const ignoreProofAtThisLevel = _recursionDepth < (options?.minProofLevel || 0)
    
    const rawTx = await services.getRawTx(txid, chain)

    if (rawTx.rawTx === undefined)
        throw new ERR_EXTSVS_INVALID_TXID(`${txid} is not a known txid.`)

    let proof: TscMerkleProofApi | undefined = undefined
    
    if (!ignoreProofAtThisLevel) {
        const proofs = await services.getMerkleProof(txid, chain)
        if (proofs.proof) {
            if (Array.isArray(proofs.proof))
                proof = proofs.proof[0]
            else
                proof = proofs.proof
        }
        if (proof && !proof.height && options.chaintracks) {
            const root = asString(computeRootFromMerkleProofNodes(proof.index, txid, proof.nodes))
            const header = await options.chaintracks.findHeaderHexForMerkleRoot(root)
            if (!header)
                throw new ERR_EXTSVS_MERKLEROOT_MISSING(root)
            proof.height = header.height
        }
    }

    if (proof) {
       return {
        rawTx: asString(rawTx.rawTx),
        txid: txid,
        proof,
        depth: 0
       } 

    }

    // we have a rawTx, but a proof is unavailable
    // create a branching inputs node and recurse on rawTx's inputs.
    return await makeEnvelopeInputsNode(rawTx.rawTx)
}