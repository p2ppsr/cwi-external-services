import { Chain, CwiError } from "cwi-base"
import { MapiPostTxResponseApi, MapiResponseApi, TscMerkleProofApi } from "./MerchantApi"

/**
 * Defines standard interfaces to access functionality implemented by external transaction processing services.
 */
export interface CwiExternalServicesApi {
    
    /**
     * Attempts to obtain the raw transaction bytes associated with a 32 byte transaction hash (txid).
     * 
     * Cycles through configured transaction processing services attempting to get a valid response.
     * 
     * On success:
     * Result txid is the requested transaction hash
     * Result rawTx will be Buffer containing raw transaction bytes.
     * Result name will be the responding service's identifying name.
     * Returns result without incrementing active service.
     * 
     * On failure:
     * Result txid is the requested transaction hash
     * Result mapi will be the first mapi response obtained (service name and response), or null
     * Result error will be the first error thrown (service name and CwiError), or null
     * Increments to next configured service and tries again until all services have been tried.
     *
     * @param txid transaction hash for which raw transaction bytes are requested
     * @param chain which chain to look on
     * @param useNext optional, forces skip to next service before starting service requests cycle.
     */
    getRawTx(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetRawTxResultApi>

    /**
     * Attempts to obtain the merkle proof associated with a 32 byte transaction hash (txid).
     * 
     * Cycles through configured transaction processing services attempting to get a valid response.
     * 
     * On success:
     * Result txid is the requested transaction hash
     * Result proof will be the merkle proof.
     * Result name will be the responding service's identifying name.
     * Returns result without incrementing active service.
     * 
     * On failure:
     * Result txid is the requested transaction hash
     * Result mapi will be the first mapi response obtained (service name and response), or null
     * Result error will be the first error thrown (service name and CwiError), or null
     * Increments to next configured service and tries again until all services have been tried.
     *
     * @param txid transaction hash for which proof is requested
     * @param chain which chain to look on
     * @param useNext optional, forces skip to next service before starting service requests cycle.
     */
    getMerkleProof(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetMerkleProofResultApi>

    /**
     * Attempts to post a new transaction to each configured external transaction processing service.
     * 
     * Asynchronously posts the transaction simultaneously to all the configured services.
     *
     * @param rawTx new raw transaction to post for processing
     * @param chain which chain to post to, all of rawTx's inputs must be unspent on this chain.
     * @param callback optional, controls whether and how each service is to make transaction status update callbacks.
     * 
     * @returns an array of `PostRawTxResultApi` objects with results of posting to each service
     */
    postRawTx(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi[]>

}

export type GetMerkleProofServiceApi = (txid: string | Buffer, chain: Chain) => Promise<GetMerkleProofResultApi>

export type GetRawTxServiceApi = (txid: string | Buffer, chain: Chain) => Promise<GetRawTxResultApi>

export interface MapiCallbackApi {
    getId: () => Promise<string>
    url: string
}

export type PostRawTxServiceApi = (rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi) => Promise<PostRawTxResultApi>

/**
 * Properties on result returned from `CwiExternalServicesApi` function `getMerkleProof`.
 */
export interface GetMerkleProofResultApi {
    /**
     * The name of the service returning the proof, or undefined if no proof
     */
    name?: string
    /**
     * Multiple proofs may be returned when a transaction also appears in
     * one or more orphaned blocks
     */
    proof?: TscMerkleProofApi | TscMerkleProofApi[]
    /**
     * The first valid mapi response received from a service, if any.
     * Relevant when no proof was received.
     * @param name the service that generated the mapi response
     */
    mapi?: { name?: string, resp: MapiResponseApi }
    /**
     * The first exception error that occurred during processing, if any.
     * @param name the service that triggered the exception
     */
    error?: { name?: string, err: CwiError }
}

/**
 * Properties on result returned from `CwiExternalServicesApi` function `getRawTx`.
 */
export interface GetRawTxResultApi {
    /**
     * Transaction hash or rawTx (and of initial request)
     */
    txid: string
    /**
     * The name of the service returning the rawTx, or undefined if no rawTx
     */
    name?: string
    /**
     * Multiple proofs may be returned when a transaction also appears in
     * one or more orphaned blocks
     */
    rawTx?: Buffer
    /**
     * The first valid mapi response received from a service, if any.
     * Relevant when no proof was received.
     * @param name the service that generated the mapi response
     */
    mapi?: { name?: string, resp: MapiResponseApi }
    /**
     * The first exception error that occurred during processing, if any.
     * @param name the service that triggered the exception
     */
    error?: { name?: string, err: CwiError }
}

/**
 * Properties on array items of result returned from `CwiExternalServicesApi` function `PostRawTx`.
 */
export interface PostRawTxResultApi {
    /**
     * The name of the service to which the transaction was submitted for processing
     */
    name: string
    /**
     * callbackID associated with this request
     */
    callbackID?: string
    /**
     * 'success' - The transaction was accepted for processing
     */
    status: 'success' | 'error'
    /**
     * The first valid mapi response received from a service, if any.
     * Relevant when no proof was received.
     * @param name the service that generated the mapi response
     */
    mapi?: MapiResponseApi
    /**
     * If mapi, parsed, signature checked mapi payload
     */
    payload?: MapiPostTxResponseApi
    /**
     * The first exception error that occurred during processing, if any.
     */
    error?: CwiError
    /**
     * txid returned in mapi response doesn't match txid of broadcast transaction.
     */
    txidChanged?: boolean
    /**
     * if true, this transaction is already in mempool or mined. Usually treat as a success.
     */
    alreadyKnown?: boolean
    /**
     * if true, at least one of the inputs has already been spent in another transaction.
     */
    doubleSpend?: boolean
}

