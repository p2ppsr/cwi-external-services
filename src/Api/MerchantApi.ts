export interface MapiResponseApi {
    /**
     * Contents of the envelope.
     * Validate using signature and publicKey.
     * encoding and mimetype may assist with decoding validated payload.
     */
    payload: string
    /**
     * signature producted by correpsonding private key on payload data
     */
    signature: string
    /**
     * public key to use to verify signature of payload data
     */
    publicKey: string
    /**
     * encoding of the payload data
     */
    encoding?: string // "UTF-8", "base64"
    /**
     * mime type of the payload data
     */
    mimetype?: string // "application/json", "image/jpeg"
}

/**
 * As defined in https://github.com/bitcoin-sv-specs/brfc-merchantapi/blob/master/README.md
 */
export interface TscMerkleProofApi {
    /**
     * The most efficient way of confirming a proof should also be the most common,
     * when the containing block's height is known.
     */
    height?: number
    /**
     * Index of transaction in its block. First transaction is index zero.
     */
    index: number
    /**
     * Full transaction (length > 32 bytes) or just its double SHA256 hash (length === 32 bytes).
     * If string, encoding is hex.
     */
    txOrId: string | Buffer
    /**
     * Merkle root (length === 32) or serialized block header containing it (length === 80).
     * If string, encoding is hex.
     */
    target: string | Buffer
    /**
     * Merkle tree sibling hash values required to compute root from txid.
     * Duplicates (sibling hash === computed hash) are indicated by "*" or type byte === 1.
     * type byte === 2...
     * Strings are encoded as hex.
     */
    nodes: string[] | Buffer
    targetType?: "hash" | "header" | "merkleRoot" | "height"
    proofType?: "branch" | "tree"
    composite?: boolean
}

/**
 * As defined in https://github.com/bitcoin-sv-specs/brfc-merchantapi/blob/master/README.md
 */
export interface MapiTxStatusPayloadApi {
    apiVersion: string // "1.5.0"
    timestamp: string // "2022-11-04T11:15:05.1234567Z"
    txid: string // hex encoded transaction hash
    returnResult: string // "success"
    blockHash: string // hex encoded block hash
    blockHeight: number
    confirmations: number
    minerId: string // hex encoded public key
    txSecondMempoolExpiry: number // 0
    merkleProof?: TscMerkleProofApi 
}

/**
 * As defined in https://github.com/bitcoin-sv-specs/brfc-merchantapi/blob/master/README.md
 */
export interface MapiCallbackPayloadApi {
    apiVersion: string // "1.5.0"
    timestamp: string // "2022-11-04T11:15:05.1234567Z"
    blockHash: string // hex encoded block hash
    blockHeight: number
    callbackTxId: string // hex encoded transaction hash
    callbackReason: string // "merkleProof" or ""
    callbackPayload: string // stringified mapi payload of type determined by callbackReason
}

/**
 * Used to parse payloads when only confirmation that a miner acknowledges a specific txid matters.
 */
export interface MapiTxidReturnResultApi {
    apiVersion?: string // "1.5.0"
    timestamp?: string // "2022-11-04T11:15:05.1234567Z"
    txid: string // hex encoded transaction hash
    returnResult: string // "success" | "failure"
}

/* Most recent, 2023-05-17, payload from mapi_responses table.
{
    "apiVersion": "1.5.0",
    "timestamp": "2023-05-16T23:29:52.0703348Z",
    "txid": "bac1aa272527df17a6151b6365d2062536ebd0bef9d2fd114247a2e162f5eb48",
    "returnResult": "success",
    "resultDescription": "",
    "minerId": "030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e",
    "currentHighestBlockHash": "00000000000004e382da3ae133702f2b51e9bc4921d1804a705976708f4a7bfd",
    "currentHighestBlockHeight": 1552242,
    "txSecondMempoolExpiry": 0,
    "warnings": [],
    "failureRetryable": false
}
{
    "apiVersion":"1.5.0",
    "timestamp":"2023-02-08T00:08:21.281829Z",
    "txid":"e3a1c7519cd1fd6045a4fb77a15771f20d46c4008ab379a37bef93caac4e5d9d",
    "returnResult":"success",
    "resultDescription":"Transaction already mined into block" | "Already known"
    "minerId":"030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e",
    "currentHighestBlockHash":"000000000000014184a602349be8d97fd87d6e1ee4f66a26ca6974371f5e2247",
    "currentHighestBlockHeight":1535997,"txSecondMempoolExpiry":0,"failureRetryable":false
}
*/

/**
 * As defined in https://github.com/bitcoin-sv-specs/brfc-merchantapi/blob/master/README.md
 */
export interface MapiPostTxPayloadApi {
    apiVersion: string // "1.5.0"
    timestamp: string // "2022-11-04T11:15:05.1234567Z"
    txid: string // hex encoded transaction hash
    returnResult: string // "success"
    resultDescription: string // ""
    minerId: string // hex encoded public key
    currentHighestBlockHash?: string // "00000000000001f6c0cb9038ac6eadbc1738dc9f86be50cca6724ef7a6e2f157"
    currentHighestBlockHeight?: number // 1558364
    txSecondMempoolExpiry?: number // 0
    failureRetryable?: boolean
    warnings?: unknown[] // any DSNT protocol warnings provided by the system
    conflictedWith?: unknown[] // list of double spend transactions
}
