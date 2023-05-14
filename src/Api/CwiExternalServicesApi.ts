import { Chain, CwiError } from "cwi-base"
import { MapiResponseApi, TscMerkleProofApi } from "./MerchantApi"

export type GetMerkleProofServiceApi = (txid: string | Buffer, chain: Chain) => Promise<GetMerkleProofResultApi>

export type GetRawTxServiceApi = (txid: string | Buffer, chain: Chain) => Promise<GetRawTxResultApi>

export interface MapiCallbackApi {
    id: string
    url: string
}

export type PostRawTxServiceApi = (rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi) => Promise<PostRawTxResultApi>

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

export interface GetRawTxResultApi {
    /**
     * The name of the service returning the rawTx, or undefined if no rawTx
     */
    name?: string
    /**
     * Transaction hash or rawTx (and of initial request)
     */
    txid: string
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

export interface PostRawTxResultApi {
    /**
     * The name of the service to which the transaction was submitted for processing
     */
    name: string
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
     * The first exception error that occurred during processing, if any.
     * @param name the service that triggered the exception
     */
    error?: CwiError
}

