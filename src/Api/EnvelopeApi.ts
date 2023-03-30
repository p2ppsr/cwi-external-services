import { MapiResponseApi, TscMerkleProofApi } from "./MerchantApi"

/**
 * Simplest case of an envelope is a `rawTx` and merkle `proof` that ties the transaction to a known block header.
 * This will be the case for any sufficiently old transaction.
 * 
 * If the transaction has been mined but for some reason the block headers may not be known, an array of `headers` linking
 * known headers to the one needed by the `proof` may be provided. They must be in height order and need to overlap
 * a known header.
 * 
 * If the transaction has not been minded yet but it has been submitted to one or more miners then the mapi responses
 * received, proving that specific miners have received the transaction for processing, are included in the
 * mapiResponses array.
 * Note that the miner reputations must be checked to give weight to these responses.
 * 
 * Additionally, when the transaction hasn't been mined or a `proof` is unavailable and mapi responses proving miner
 * acceptance are unavailable, then all the transactions providing inputs can be submitted in an inputs object.
 * 
 * The keys of the inputs object are the transaction hashes (txids) of each of the input transactions.
 * The value of each inputs object property is another envelope object.
 * 
 * References:
 * Section 2 of https://projectbabbage.com/assets/simplified-payments.pdf
 * https://gist.github.com/ty-everett/44b6a0e7f3d6c48439f9ff26068f8d8b
 */
export interface EnvelopeApi {
    /**
     * Array of 80 byte block headers encoded as 160 character hex strings
     */
    headers?: string[],
    /**
     * double SHA256 hash of serialized rawTx. Optional.
     */
    txid?: string
    /**
     * A valid bitcoin transaction encoded as a hex string.
     */
    rawTx: string,
    /**
     * Either inputs or proof are required.
     */
    proof?: TscMerkleProofApi,
    /**
     * Array of mapi transaction status update responses
     */
    mapiResponses?: MapiResponseApi[]
    /**
     * Either inputs or proof are required.
     */
    inputs?: EnvelopeInputMapApi,
    /**
     * 
     */
    reference?: string
}

export type EnvelopeInputMapApi = Record<string, EnvelopeEvidenceApi>

export interface EnvelopeEvidenceApi {
    /**
     * double SHA256 hash of serialized rawTx. Optional.
     */
    txid?: string
    /**
     * A valid bitcoin transaction encoded as a hex string.
     */
    rawTx: string,
    /**
     * Link up the inputs tree to the root for which child is undefined. 
     */
    child?: EnvelopeEvidenceApi
    /**
     * Either inputs or proof are required.
     */
    proof?: TscMerkleProofApi | Buffer,
    /**
     * Array of mapi transaction status update responses
     */
    mapiResponses?: MapiResponseApi[]
    /**
     * Either inputs or proof are required.
     */
    inputs?: EnvelopeInputMapApi,
}

