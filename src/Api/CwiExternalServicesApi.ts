import { Chain, CwiError } from "cwi-base"
import { MapiPostTxPayloadApi, MapiResponseApi, TscMerkleProofApi } from "cwi-base"

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

    /**
     * Attempts to determine the UTXO status of a transaction output.
     * 
     * Cycles through configured transaction processing services attempting to get a valid response.
     * 
     * @param output transaction output identifier in format determined by `outputFormat`.
     * @param chain which chain to post to, all of rawTx's inputs must be unspent on this chain.
     * @param outputFormat optional, supported values:
     *      'hashLE' little-endian sha256 hash of output script
     *      'hashBE' big-endian sha256 hash of output script
     *      'script' entire transaction output script
     *      undefined if asBuffer length of `output` is 32 then 'hashBE`, otherwise 'script'.
     * @param useNext optional, forces skip to next service before starting service requests cycle.
     */
    getUtxoStatus(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetUtxoStatusResultApi>

}

export type GetUtxoStatusOutputFormatApi = 'hashLE' | 'hashBE' | 'script'

export type GetUtxoStatusServiceApi = (output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi) => Promise<GetUtxoStatusResultApi>

export type GetMerkleProofServiceApi = (txid: string | Buffer, chain: Chain) => Promise<GetMerkleProofResultApi>

export type GetRawTxServiceApi = (txid: string | Buffer, chain: Chain) => Promise<GetRawTxResultApi>

/**
 * An API that enables unique callback IDs to be generated for potentially multiple independent
 * callback clients.
 */
export interface MapiCallbackApi {
    /**
     * Each call to this method generates a unique callbackID string and creates a record of the
     * circumstances under which it was generated.
     *
     * @returns A unique callbackID string, e.g. randomBytesBase64(12)
     */
    getId: () => Promise<string>
    /**
     * The public url to which callbacks will occur.
     * 
     * Callback requests must include a previously `getId` generated callbackID which must match
     * an already existing callback record.
     */
    url: string
}

export type PostRawTxServiceApi = (txid: string | Buffer, rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi) => Promise<PostRawTxResultApi>

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
 * Properties on array items of result returned from `CwiExternalServicesApi` function `postRawTx`.
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
     * Raw mapi response including stringified payload
     */
    mapi?: MapiResponseApi
    /**
     * Parsed and signature verified mapi payload
     */
    payload?: MapiPostTxPayloadApi
    /**
     * When status is 'error', provides code and description
     * 
     * Specific potential errors:
     * ERR_BAD_REQUEST
     * ERR_EXTSVS_DOUBLE_SPEND
     * ERR_EXTSVS_ALREADY_MINED (description has error details)
     * ERR_EXTSVS_INVALID_TRANSACTION (description has error details)
     * ERR_EXTSVS_TXID_INVALID (service response txid doesn't match rawTx)
     * ERR_EXTSVS_MAPI_SIGNATURE_INVALID
     * ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING
     * ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE
     * ERR_EXTSVS_MAPI_MISSING (description has service request error details)
     */
    error?: CwiError
    /**
     * if true, the transaction was already known to this service. Usually treat as a success.
     * 
     * Potentially stop posting to additional transaction processors.
     */
    alreadyKnown?: boolean
}

export interface GetUtxoStatusDetailsApi {
    /**
     * if isUtxo, the block height containing the matching unspent transaction output
     * 
     * typically there will be only one, but future orphans can result in multiple values
     */
    height?: number
    /**
     * if isUtxo, the transaction hash (txid) of the transaction containing the matching unspent transaction output
     * 
     * typically there will be only one, but future orphans can result in multiple values
     */
    txid?: string
    /**
     * if isUtxo, the output index in the transaction containing of the matching unspent transaction output
     * 
     * typically there will be only one, but future orphans can result in multiple values
     */
    index?: number
    /**
     * if isUtxo, the amount of the matching unspent transaction output
     * 
     * typically there will be only one, but future orphans can result in multiple values
     */
    amount?: number
}

export interface GetUtxoStatusResultApi {
    /**
     * The name of the service to which the transaction was submitted for processing
     */
    name: string
    /**
     * 'success' - the operation was successful, non-error results are valid.
     * 'error' - the operation failed, error may have relevant information.
     */
    status: 'success' | 'error'
    /**
     * When status is 'error', provides code and description
     */ 
    error?: CwiError
    /**
     * true if the output is associated with at least one unspent transaction output
     */
    isUtxo?: boolean
    /**
     * Additional details about occurances of this output script as a utxo.
     * 
     * Normally there will be one item in the array but due to the possibility of orphan races
     * there could be more than one block in which it is a valid utxo.
     */
    details: GetUtxoStatusDetailsApi[]
}