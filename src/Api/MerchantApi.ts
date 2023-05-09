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
 * Used to parse payloads when only confirmation that a miner acknowledges a specific txid matters.
 */
export interface MapiTxidReturnResultApi {
    txid: string // hex encoded transaction hash
    returnResult: string // "success"
}
