# cwi-external-services

Implementations of external service APIs.

Standardized service APIs for use within CWI.

## API

<!--#region ts2md-api-merged-here-->
Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

### Interfaces

| | |
| --- | --- |
| [CwiExternalServicesApi](#interface-cwiexternalservicesapi) | [MapiPostTxPayloadApi](#interface-mapiposttxpayloadapi) |
| [CwiExternalServicesOptions](#interface-cwiexternalservicesoptions) | [MapiResponseApi](#interface-mapiresponseapi) |
| [GetMerkleProofResultApi](#interface-getmerkleproofresultapi) | [MapiTxStatusPayloadApi](#interface-mapitxstatuspayloadapi) |
| [GetRawTxResultApi](#interface-getrawtxresultapi) | [MapiTxidReturnResultApi](#interface-mapitxidreturnresultapi) |
| [GetUtxoStatusDetailsApi](#interface-getutxostatusdetailsapi) | [PostRawTxResultApi](#interface-postrawtxresultapi) |
| [GetUtxoStatusResultApi](#interface-getutxostatusresultapi) | [PostTransactionMapiMinerApi](#interface-posttransactionmapiminerapi) |
| [MapiCallbackApi](#interface-mapicallbackapi) | [TscMerkleProofApi](#interface-tscmerkleproofapi) |
| [MapiCallbackPayloadApi](#interface-mapicallbackpayloadapi) |  |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

#### Interface: CwiExternalServicesApi

##### Description

Defines standard interfaces to access functionality implemented by external transaction processing services.

```ts
export interface CwiExternalServicesApi {
    getRawTx(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetRawTxResultApi>;
    getMerkleProof(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetMerkleProofResultApi>;
    postRawTx(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi[]>;
    getUtxoStatus(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetUtxoStatusResultApi>;
}
```

<details>

<summary>Interface CwiExternalServicesApi Details</summary>

##### Interface CwiExternalServicesApi Method getMerkleProof

Attempts to obtain the merkle proof associated with a 32 byte transaction hash (txid).

Cycles through configured transaction processing services attempting to get a valid response.

On success:
Result txid is the requested transaction hash
Result proof will be the merkle proof.
Result name will be the responding service's identifying name.
Returns result without incrementing active service.

On failure:
Result txid is the requested transaction hash
Result mapi will be the first mapi response obtained (service name and response), or null
Result error will be the first error thrown (service name and CwiError), or null
Increments to next configured service and tries again until all services have been tried.

```ts
getMerkleProof(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetMerkleProofResultApi>
```

<details>

<summary>Interface CwiExternalServicesApi Method getMerkleProof Details</summary>

###### txid

transaction hash for which proof is requested

###### chain

which chain to look on

###### useNext

optional, forces skip to next service before starting service requests cycle.

</details>

##### Interface CwiExternalServicesApi Method getRawTx

Attempts to obtain the raw transaction bytes associated with a 32 byte transaction hash (txid).

Cycles through configured transaction processing services attempting to get a valid response.

On success:
Result txid is the requested transaction hash
Result rawTx will be Buffer containing raw transaction bytes.
Result name will be the responding service's identifying name.
Returns result without incrementing active service.

On failure:
Result txid is the requested transaction hash
Result mapi will be the first mapi response obtained (service name and response), or null
Result error will be the first error thrown (service name and CwiError), or null
Increments to next configured service and tries again until all services have been tried.

```ts
getRawTx(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetRawTxResultApi>
```

<details>

<summary>Interface CwiExternalServicesApi Method getRawTx Details</summary>

###### txid

transaction hash for which raw transaction bytes are requested

###### chain

which chain to look on

###### useNext

optional, forces skip to next service before starting service requests cycle.

</details>

##### Interface CwiExternalServicesApi Method getUtxoStatus

Attempts to determine the UTXO status of a transaction output.

Cycles through configured transaction processing services attempting to get a valid response.

```ts
getUtxoStatus(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetUtxoStatusResultApi>
```

<details>

<summary>Interface CwiExternalServicesApi Method getUtxoStatus Details</summary>

###### output

transaction output identifier in format determined by `outputFormat`.

###### chain

which chain to post to, all of rawTx's inputs must be unspent on this chain.

###### outputFormat

optional, supported values:
'hashLE' little-endian sha256 hash of output script
'hashBE' big-endian sha256 hash of output script
'script' entire transaction output script
undefined if asBuffer length of `output` is 32 then 'hashBE`, otherwise 'script'.

###### useNext

optional, forces skip to next service before starting service requests cycle.

</details>

##### Interface CwiExternalServicesApi Method postRawTx

Attempts to post a new transaction to each configured external transaction processing service.

Asynchronously posts the transaction simultaneously to all the configured services.

```ts
postRawTx(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi[]>
```

<details>

<summary>Interface CwiExternalServicesApi Method postRawTx Details</summary>

###### Returns

an array of `PostRawTxResultApi` objects with results of posting to each service

###### rawTx

new raw transaction to post for processing

###### chain

which chain to post to, all of rawTx's inputs must be unspent on this chain.

###### callback

optional, controls whether and how each service is to make transaction status update callbacks.

</details>

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: MapiCallbackApi

##### Description

An API that enables unique callback IDs to be generated for potentially multiple independent
callback clients.

```ts
export interface MapiCallbackApi {
    getId: () => Promise<string>;
    url: string;
}
```

<details>

<summary>Interface MapiCallbackApi Details</summary>

##### Interface MapiCallbackApi Property getId

Each call to this method generates a unique callbackID string and creates a record of the
circumstances under which it was generated.

```ts
getId: () => Promise<string>
```

##### Interface MapiCallbackApi Property url

The public url to which callbacks will occur.

Callback requests must include a previously `getId` generated callbackID which must match
an already existing callback record.

```ts
url: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: GetMerkleProofResultApi

##### Description

Properties on result returned from `CwiExternalServicesApi` function `getMerkleProof`.

```ts
export interface GetMerkleProofResultApi {
    name?: string;
    proof?: TscMerkleProofApi | TscMerkleProofApi[];
    mapi?: {
        name?: string;
        resp: MapiResponseApi;
    };
    error?: {
        name?: string;
        err: CwiError;
    };
}
```

<details>

<summary>Interface GetMerkleProofResultApi Details</summary>

##### Interface GetMerkleProofResultApi Property error

The first exception error that occurred during processing, if any.

```ts
error?: {
    name?: string;
    err: CwiError;
}
```

##### Interface GetMerkleProofResultApi Property mapi

The first valid mapi response received from a service, if any.
Relevant when no proof was received.

```ts
mapi?: {
    name?: string;
    resp: MapiResponseApi;
}
```

##### Interface GetMerkleProofResultApi Property name

The name of the service returning the proof, or undefined if no proof

```ts
name?: string
```

##### Interface GetMerkleProofResultApi Property proof

Multiple proofs may be returned when a transaction also appears in
one or more orphaned blocks

```ts
proof?: TscMerkleProofApi | TscMerkleProofApi[]
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: GetRawTxResultApi

##### Description

Properties on result returned from `CwiExternalServicesApi` function `getRawTx`.

```ts
export interface GetRawTxResultApi {
    txid: string;
    name?: string;
    rawTx?: Buffer;
    mapi?: {
        name?: string;
        resp: MapiResponseApi;
    };
    error?: {
        name?: string;
        err: CwiError;
    };
}
```

<details>

<summary>Interface GetRawTxResultApi Details</summary>

##### Interface GetRawTxResultApi Property error

The first exception error that occurred during processing, if any.

```ts
error?: {
    name?: string;
    err: CwiError;
}
```

##### Interface GetRawTxResultApi Property mapi

The first valid mapi response received from a service, if any.
Relevant when no proof was received.

```ts
mapi?: {
    name?: string;
    resp: MapiResponseApi;
}
```

##### Interface GetRawTxResultApi Property name

The name of the service returning the rawTx, or undefined if no rawTx

```ts
name?: string
```

##### Interface GetRawTxResultApi Property rawTx

Multiple proofs may be returned when a transaction also appears in
one or more orphaned blocks

```ts
rawTx?: Buffer
```

##### Interface GetRawTxResultApi Property txid

Transaction hash or rawTx (and of initial request)

```ts
txid: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: PostRawTxResultApi

##### Description

Properties on array items of result returned from `CwiExternalServicesApi` function `postRawTx`.

```ts
export interface PostRawTxResultApi {
    name: string;
    callbackID?: string;
    status: "success" | "error";
    mapi?: MapiResponseApi;
    payload?: MapiPostTxPayloadApi;
    error?: CwiError;
    alreadyKnown?: boolean;
}
```

<details>

<summary>Interface PostRawTxResultApi Details</summary>

##### Interface PostRawTxResultApi Property alreadyKnown

if true, the transaction was already known to this service. Usually treat as a success.

Potentially stop posting to additional transaction processors.

```ts
alreadyKnown?: boolean
```

##### Interface PostRawTxResultApi Property callbackID

callbackID associated with this request

```ts
callbackID?: string
```

##### Interface PostRawTxResultApi Property error

When status is 'error', provides code and description

Specific potential errors:
ERR_BAD_REQUEST
ERR_EXTSVS_DOUBLE_SPEND
ERR_EXTSVS_ALREADY_MINED (description has error details)
ERR_EXTSVS_INVALID_TRANSACTION (description has error details)
ERR_EXTSVS_TXID_INVALID (service response txid doesn't match rawTx)
ERR_EXTSVS_MAPI_SIGNATURE_INVALID
ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING
ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE
ERR_EXTSVS_MAPI_MISSING (description has service request error details)

```ts
error?: CwiError
```

##### Interface PostRawTxResultApi Property mapi

Raw mapi response including stringified payload

```ts
mapi?: MapiResponseApi
```

##### Interface PostRawTxResultApi Property name

The name of the service to which the transaction was submitted for processing

```ts
name: string
```

##### Interface PostRawTxResultApi Property payload

Parsed and signature verified mapi payload

```ts
payload?: MapiPostTxPayloadApi
```

##### Interface PostRawTxResultApi Property status

'success' - The transaction was accepted for processing

```ts
status: "success" | "error"
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: GetUtxoStatusDetailsApi

```ts
export interface GetUtxoStatusDetailsApi {
    height?: number;
    txid?: string;
    index?: number;
    amount?: number;
}
```

<details>

<summary>Interface GetUtxoStatusDetailsApi Details</summary>

##### Interface GetUtxoStatusDetailsApi Property amount

```ts
amount?: number
```

##### Interface GetUtxoStatusDetailsApi Property height

```ts
height?: number
```

##### Interface GetUtxoStatusDetailsApi Property index

```ts
index?: number
```

##### Interface GetUtxoStatusDetailsApi Property txid

```ts
txid?: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: GetUtxoStatusResultApi

```ts
export interface GetUtxoStatusResultApi {
    name: string;
    status: "success" | "error";
    error?: CwiError;
    isUtxo?: boolean;
    details: GetUtxoStatusDetailsApi[];
}
```

<details>

<summary>Interface GetUtxoStatusResultApi Details</summary>

##### Interface GetUtxoStatusResultApi Property details

```ts
details: GetUtxoStatusDetailsApi[]
```

##### Interface GetUtxoStatusResultApi Property error

```ts
error?: CwiError
```

##### Interface GetUtxoStatusResultApi Property isUtxo

```ts
isUtxo?: boolean
```

##### Interface GetUtxoStatusResultApi Property name

```ts
name: string
```

##### Interface GetUtxoStatusResultApi Property status

```ts
status: "success" | "error"
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: MapiResponseApi

```ts
export interface MapiResponseApi {
    payload: string;
    signature: string;
    publicKey: string;
    encoding?: string;
    mimetype?: string;
}
```

<details>

<summary>Interface MapiResponseApi Details</summary>

##### Interface MapiResponseApi Property encoding

```ts
encoding?: string
```

##### Interface MapiResponseApi Property mimetype

```ts
mimetype?: string
```

##### Interface MapiResponseApi Property payload

```ts
payload: string
```

##### Interface MapiResponseApi Property publicKey

```ts
publicKey: string
```

##### Interface MapiResponseApi Property signature

```ts
signature: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: TscMerkleProofApi

##### Description

As defined in https://github.com/bitcoin-sv-specs/brfc-merchantapi/blob/master/README.md

```ts
export interface TscMerkleProofApi {
    height?: number;
    index: number;
    txOrId: string | Buffer;
    target: string | Buffer;
    nodes: string[] | Buffer;
    targetType?: "hash" | "header" | "merkleRoot" | "height";
    proofType?: "branch" | "tree";
    composite?: boolean;
}
```

<details>

<summary>Interface TscMerkleProofApi Details</summary>

##### Interface TscMerkleProofApi Property composite

```ts
composite?: boolean
```

##### Interface TscMerkleProofApi Property height

The most efficient way of confirming a proof should also be the most common,
when the containing block's height is known.

```ts
height?: number
```

##### Interface TscMerkleProofApi Property index

Index of transaction in its block. First transaction is index zero.

```ts
index: number
```

##### Interface TscMerkleProofApi Property nodes

Merkle tree sibling hash values required to compute root from txid.
Duplicates (sibling hash === computed hash) are indicated by "*" or type byte === 1.
type byte === 2...
Strings are encoded as hex.

```ts
nodes: string[] | Buffer
```

##### Interface TscMerkleProofApi Property proofType

```ts
proofType?: "branch" | "tree"
```

##### Interface TscMerkleProofApi Property target

Merkle root (length === 32) or serialized block header containing it (length === 80).
If string, encoding is hex.

```ts
target: string | Buffer
```

##### Interface TscMerkleProofApi Property targetType

```ts
targetType?: "hash" | "header" | "merkleRoot" | "height"
```

##### Interface TscMerkleProofApi Property txOrId

Full transaction (length > 32 bytes) or just its double SHA256 hash (length === 32 bytes).
If string, encoding is hex.

```ts
txOrId: string | Buffer
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: MapiTxStatusPayloadApi

##### Description

As defined in https://github.com/bitcoin-sv-specs/brfc-merchantapi/blob/master/README.md

```ts
export interface MapiTxStatusPayloadApi {
    apiVersion: string;
    timestamp: string;
    txid: string;
    returnResult: string;
    blockHash: string;
    blockHeight: number;
    confirmations: number;
    minerId: string;
    txSecondMempoolExpiry: number;
    merkleProof?: TscMerkleProofApi;
}
```

<details>

<summary>Interface MapiTxStatusPayloadApi Details</summary>

##### Interface MapiTxStatusPayloadApi Property apiVersion

```ts
apiVersion: string
```

##### Interface MapiTxStatusPayloadApi Property blockHash

```ts
blockHash: string
```

##### Interface MapiTxStatusPayloadApi Property blockHeight

```ts
blockHeight: number
```

##### Interface MapiTxStatusPayloadApi Property confirmations

```ts
confirmations: number
```

##### Interface MapiTxStatusPayloadApi Property merkleProof

```ts
merkleProof?: TscMerkleProofApi
```

##### Interface MapiTxStatusPayloadApi Property minerId

```ts
minerId: string
```

##### Interface MapiTxStatusPayloadApi Property returnResult

```ts
returnResult: string
```

##### Interface MapiTxStatusPayloadApi Property timestamp

```ts
timestamp: string
```

##### Interface MapiTxStatusPayloadApi Property txSecondMempoolExpiry

```ts
txSecondMempoolExpiry: number
```

##### Interface MapiTxStatusPayloadApi Property txid

```ts
txid: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: MapiCallbackPayloadApi

##### Description

As defined in https://github.com/bitcoin-sv-specs/brfc-merchantapi/blob/master/README.md

```ts
export interface MapiCallbackPayloadApi {
    apiVersion: string;
    timestamp: string;
    blockHash: string;
    blockHeight: number;
    callbackTxId: string;
    callbackReason: string;
    callbackPayload: string;
}
```

<details>

<summary>Interface MapiCallbackPayloadApi Details</summary>

##### Interface MapiCallbackPayloadApi Property apiVersion

```ts
apiVersion: string
```

##### Interface MapiCallbackPayloadApi Property blockHash

```ts
blockHash: string
```

##### Interface MapiCallbackPayloadApi Property blockHeight

```ts
blockHeight: number
```

##### Interface MapiCallbackPayloadApi Property callbackPayload

```ts
callbackPayload: string
```

##### Interface MapiCallbackPayloadApi Property callbackReason

```ts
callbackReason: string
```

##### Interface MapiCallbackPayloadApi Property callbackTxId

```ts
callbackTxId: string
```

##### Interface MapiCallbackPayloadApi Property timestamp

```ts
timestamp: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: MapiTxidReturnResultApi

##### Description

Used to parse payloads when only confirmation that a miner acknowledges a specific txid matters.

```ts
export interface MapiTxidReturnResultApi {
    apiVersion?: string;
    timestamp?: string;
    txid: string;
    returnResult: string;
}
```

<details>

<summary>Interface MapiTxidReturnResultApi Details</summary>

##### Interface MapiTxidReturnResultApi Property apiVersion

```ts
apiVersion?: string
```

##### Interface MapiTxidReturnResultApi Property returnResult

```ts
returnResult: string
```

##### Interface MapiTxidReturnResultApi Property timestamp

```ts
timestamp?: string
```

##### Interface MapiTxidReturnResultApi Property txid

```ts
txid: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: MapiPostTxPayloadApi

##### Description

As defined in https://github.com/bitcoin-sv-specs/brfc-merchantapi/blob/master/README.md

```ts
export interface MapiPostTxPayloadApi {
    apiVersion: string;
    timestamp: string;
    txid: string;
    returnResult: string;
    resultDescription: string;
    minerId: string;
    currentHighestBlockHash?: string;
    currentHighestBlockHeight?: number;
    txSecondMempoolExpiry?: number;
    failureRetryable?: boolean;
    warnings?: unknown[];
    conflictedWith?: unknown[];
}
```

<details>

<summary>Interface MapiPostTxPayloadApi Details</summary>

##### Interface MapiPostTxPayloadApi Property apiVersion

```ts
apiVersion: string
```

##### Interface MapiPostTxPayloadApi Property conflictedWith

```ts
conflictedWith?: unknown[]
```

##### Interface MapiPostTxPayloadApi Property currentHighestBlockHash

```ts
currentHighestBlockHash?: string
```

##### Interface MapiPostTxPayloadApi Property currentHighestBlockHeight

```ts
currentHighestBlockHeight?: number
```

##### Interface MapiPostTxPayloadApi Property failureRetryable

```ts
failureRetryable?: boolean
```

##### Interface MapiPostTxPayloadApi Property minerId

```ts
minerId: string
```

##### Interface MapiPostTxPayloadApi Property resultDescription

```ts
resultDescription: string
```

##### Interface MapiPostTxPayloadApi Property returnResult

```ts
returnResult: string
```

##### Interface MapiPostTxPayloadApi Property timestamp

```ts
timestamp: string
```

##### Interface MapiPostTxPayloadApi Property txSecondMempoolExpiry

```ts
txSecondMempoolExpiry?: number
```

##### Interface MapiPostTxPayloadApi Property txid

```ts
txid: string
```

##### Interface MapiPostTxPayloadApi Property warnings

```ts
warnings?: unknown[]
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: PostTransactionMapiMinerApi

```ts
export interface PostTransactionMapiMinerApi {
    name: string;
    url: string;
    authType: "none" | "bearer";
    authToken?: string;
}
```

<details>

<summary>Interface PostTransactionMapiMinerApi Details</summary>

##### Interface PostTransactionMapiMinerApi Property authToken

```ts
authToken?: string
```

##### Interface PostTransactionMapiMinerApi Property authType

```ts
authType: "none" | "bearer"
```

##### Interface PostTransactionMapiMinerApi Property name

```ts
name: string
```

##### Interface PostTransactionMapiMinerApi Property url

```ts
url: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: CwiExternalServicesOptions

```ts
export interface CwiExternalServicesOptions {
    mainTaalApiKey?: string;
    testTaalApiKey?: string;
}
```

<details>

<summary>Interface CwiExternalServicesOptions Details</summary>

##### Interface CwiExternalServicesOptions Property mainTaalApiKey

```ts
mainTaalApiKey?: string
```

##### Interface CwiExternalServicesOptions Property testTaalApiKey

```ts
testTaalApiKey?: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Classes

| | |
| --- | --- |
| [CwiExternalServices](#class-cwiexternalservices) | [ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE](#class-err_extsvs_mapi_unsupported_mimetype) |
| [ERR_EXTSVS_ALREADY_MINED](#class-err_extsvs_already_mined) | [ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT](#class-err_extsvs_mapi_unsupported_returnresult) |
| [ERR_EXTSVS_BLOCK_HASH_MISSING](#class-err_extsvs_block_hash_missing) | [ERR_EXTSVS_MERKLEPROOF_NODE_TYPE](#class-err_extsvs_merkleproof_node_type) |
| [ERR_EXTSVS_BLOCK_HEIGHT_MISSING](#class-err_extsvs_block_height_missing) | [ERR_EXTSVS_MERKLEPROOF_PARSING](#class-err_extsvs_merkleproof_parsing) |
| [ERR_EXTSVS_DOUBLE_SPEND](#class-err_extsvs_double_spend) | [ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE](#class-err_extsvs_merkleproof_taget_type) |
| [ERR_EXTSVS_ENVELOPE_DEPTH](#class-err_extsvs_envelope_depth) | [ERR_EXTSVS_MERKLEPROOF_UNSUPPORTED](#class-err_extsvs_merkleproof_unsupported) |
| [ERR_EXTSVS_INVALID_TRANSACTION](#class-err_extsvs_invalid_transaction) | [ERR_EXTSVS_MERKLEROOT_INVALID](#class-err_extsvs_merkleroot_invalid) |
| [ERR_EXTSVS_MAPI_MISSING](#class-err_extsvs_mapi_missing) | [ERR_EXTSVS_MERKLEROOT_MISSING](#class-err_extsvs_merkleroot_missing) |
| [ERR_EXTSVS_MAPI_SIGNATURE_INVALID](#class-err_extsvs_mapi_signature_invalid) | [ERR_EXTSVS_TXID_INVALID](#class-err_extsvs_txid_invalid) |
| [ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING](#class-err_extsvs_mapi_unsupported_encoding) | [ServiceCollection](#class-servicecollection) |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

#### Class: ERR_EXTSVS_TXID_INVALID

##### Description

Expected txid ${expected} doesn't match proof txid ${actual}

```ts
export class ERR_EXTSVS_TXID_INVALID extends CwiError {
    constructor(expected?: string, actual?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_TXID_INVALID Details</summary>

##### Class ERR_EXTSVS_TXID_INVALID Constructor 

```ts
constructor(expected?: string, actual?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_BLOCK_HASH_MISSING

##### Description

Header for block hash ${hash} was not found.

```ts
export class ERR_EXTSVS_BLOCK_HASH_MISSING extends CwiError {
    constructor(hash?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_BLOCK_HASH_MISSING Details</summary>

##### Class ERR_EXTSVS_BLOCK_HASH_MISSING Constructor 

```ts
constructor(hash?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_BLOCK_HEIGHT_MISSING

##### Description

Header for block height ${height} was not found.

```ts
export class ERR_EXTSVS_BLOCK_HEIGHT_MISSING extends CwiError {
    constructor(height?: number) 
}
```

<details>

<summary>Class ERR_EXTSVS_BLOCK_HEIGHT_MISSING Details</summary>

##### Class ERR_EXTSVS_BLOCK_HEIGHT_MISSING Constructor 

```ts
constructor(height?: number) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_ENVELOPE_DEPTH

##### Description

Exceeded max envelope depth ${maxDepth}

```ts
export class ERR_EXTSVS_ENVELOPE_DEPTH extends CwiError {
    constructor(maxDepth: number) 
}
```

<details>

<summary>Class ERR_EXTSVS_ENVELOPE_DEPTH Details</summary>

##### Class ERR_EXTSVS_ENVELOPE_DEPTH Constructor 

```ts
constructor(maxDepth: number) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEROOT_INVALID

##### Description

Expected merkleRoot ${expected} doesn't match computed ${actual}

```ts
export class ERR_EXTSVS_MERKLEROOT_INVALID extends CwiError {
    constructor(expected?: string, actual?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_MERKLEROOT_INVALID Details</summary>

##### Class ERR_EXTSVS_MERKLEROOT_INVALID Constructor 

```ts
constructor(expected?: string, actual?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEROOT_MISSING

##### Description

MerkleRoot ${merkleRoot} was not found in active chain.

```ts
export class ERR_EXTSVS_MERKLEROOT_MISSING extends CwiError {
    constructor(merkleRoot?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_MERKLEROOT_MISSING Details</summary>

##### Class ERR_EXTSVS_MERKLEROOT_MISSING Constructor 

```ts
constructor(merkleRoot?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE

##### Description

Unsupported merkle proof target type ${targetType}.

```ts
export class ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE extends CwiError {
    constructor(targetType?: string | number) 
}
```

<details>

<summary>Class ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE Details</summary>

##### Class ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE Constructor 

```ts
constructor(targetType?: string | number) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEPROOF_NODE_TYPE

##### Description

Unsupported merkle proof node type ${nodeType}.

```ts
export class ERR_EXTSVS_MERKLEPROOF_NODE_TYPE extends CwiError {
    constructor(nodeType?: string | number) 
}
```

<details>

<summary>Class ERR_EXTSVS_MERKLEPROOF_NODE_TYPE Details</summary>

##### Class ERR_EXTSVS_MERKLEPROOF_NODE_TYPE Constructor 

```ts
constructor(nodeType?: string | number) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEPROOF_PARSING

##### Description

Merkle proof parsing error.

```ts
export class ERR_EXTSVS_MERKLEPROOF_PARSING extends CwiError {
    constructor() 
}
```

<details>

<summary>Class ERR_EXTSVS_MERKLEPROOF_PARSING Details</summary>

##### Class ERR_EXTSVS_MERKLEPROOF_PARSING Constructor 

```ts
constructor() 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEPROOF_UNSUPPORTED

##### Description

Merkle proof unsuported feature ${feature}.

```ts
export class ERR_EXTSVS_MERKLEPROOF_UNSUPPORTED extends CwiError {
    constructor(feature?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_MERKLEPROOF_UNSUPPORTED Details</summary>

##### Class ERR_EXTSVS_MERKLEPROOF_UNSUPPORTED Constructor 

```ts
constructor(feature?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MAPI_MISSING

##### Description

Required Mapi response is missing.

```ts
export class ERR_EXTSVS_MAPI_MISSING extends CwiError {
    constructor(description?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_MAPI_MISSING Details</summary>

##### Class ERR_EXTSVS_MAPI_MISSING Constructor 

```ts
constructor(description?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MAPI_SIGNATURE_INVALID

##### Description

Mapi response signature is invalid.

```ts
export class ERR_EXTSVS_MAPI_SIGNATURE_INVALID extends CwiError {
    constructor() 
}
```

<details>

<summary>Class ERR_EXTSVS_MAPI_SIGNATURE_INVALID Details</summary>

##### Class ERR_EXTSVS_MAPI_SIGNATURE_INVALID Constructor 

```ts
constructor() 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE

##### Description

mAPI response unsupported mimetype ${mimeType}

```ts
export class ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE extends CwiError {
    constructor(mimeType?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE Details</summary>

##### Class ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE Constructor 

```ts
constructor(mimeType?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING

##### Description

mAPI response unsupported encoding ${encoding}

```ts
export class ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING extends CwiError {
    constructor(encoding?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING Details</summary>

##### Class ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING Constructor 

```ts
constructor(encoding?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT

##### Description

mAPI response unsupported returnResult ${result}

```ts
export class ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT extends CwiError {
    constructor(result?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT Details</summary>

##### Class ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT Constructor 

```ts
constructor(result?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_INVALID_TRANSACTION

##### Description

Transaction is invalid.

```ts
export class ERR_EXTSVS_INVALID_TRANSACTION extends CwiError {
    constructor(description?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_INVALID_TRANSACTION Details</summary>

##### Class ERR_EXTSVS_INVALID_TRANSACTION Constructor 

```ts
constructor(description?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_DOUBLE_SPEND

##### Description

Transaction is a double spend.

```ts
export class ERR_EXTSVS_DOUBLE_SPEND extends CwiError {
    constructor() 
}
```

<details>

<summary>Class ERR_EXTSVS_DOUBLE_SPEND Details</summary>

##### Class ERR_EXTSVS_DOUBLE_SPEND Constructor 

```ts
constructor() 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_ALREADY_MINED

##### Description

Transaction was already mined.

```ts
export class ERR_EXTSVS_ALREADY_MINED extends CwiError {
    constructor(description?: string) 
}
```

<details>

<summary>Class ERR_EXTSVS_ALREADY_MINED Details</summary>

##### Class ERR_EXTSVS_ALREADY_MINED Constructor 

```ts
constructor(description?: string) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ServiceCollection

```ts
export class ServiceCollection<T> {
    services: {
        name: string;
        service: T;
    }[];
    _index: number;
    constructor() 
    add(s: {
        name: string;
        service: T;
    }): ServiceCollection<T> 
    get name() 
    get service() 
    get allServices() 
    get count() 
    get index() 
    next(): number 
}
```

<details>

<summary>Class ServiceCollection Details</summary>

##### Class ServiceCollection Constructor 

```ts
constructor() 
```

##### Class ServiceCollection Property _index

```ts
_index: number
```

##### Class ServiceCollection Property services

```ts
services: {
    name: string;
    service: T;
}[]
```

##### Class ServiceCollection Method add

```ts
add(s: {
    name: string;
    service: T;
}): ServiceCollection<T> 
```

##### Class ServiceCollection Method next

```ts
next(): number 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: CwiExternalServices

```ts
export class CwiExternalServices implements CwiExternalServicesApi {
    static createDefaultOptions(): CwiExternalServicesOptions 
    options: CwiExternalServicesOptions;
    constructor(options?: CwiExternalServicesOptions) 
    async getUtxoStatus(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetUtxoStatusResultApi> 
    async postRawTx(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi[]> 
    async getRawTx(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetRawTxResultApi> 
    async getMerkleProof(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetMerkleProofResultApi> 
}
```

<details>

<summary>Class CwiExternalServices Details</summary>

##### Class CwiExternalServices Constructor 

```ts
constructor(options?: CwiExternalServicesOptions) 
```

##### Class CwiExternalServices Property options

```ts
options: CwiExternalServicesOptions
```

##### Class CwiExternalServices Method createDefaultOptions

```ts
static createDefaultOptions(): CwiExternalServicesOptions 
```

##### Class CwiExternalServices Method getMerkleProof

```ts
async getMerkleProof(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetMerkleProofResultApi> 
```

##### Class CwiExternalServices Method getRawTx

```ts
async getRawTx(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetRawTxResultApi> 
```

##### Class CwiExternalServices Method getUtxoStatus

```ts
async getUtxoStatus(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetUtxoStatusResultApi> 
```

##### Class CwiExternalServices Method postRawTx

```ts
async postRawTx(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi[]> 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Functions

| | |
| --- | --- |
| [checkMapiResponse](#function-checkmapiresponse) | [getProofFromGorillaPool](#function-getprooffromgorillapool) |
| [checkMapiResponseForTxid](#function-checkmapiresponsefortxid) | [getProofFromMetastreme](#function-getprooffrommetastreme) |
| [checkMerkleProof](#function-checkmerkleproof) | [getProofFromTaal](#function-getprooffromtaal) |
| [getMapiCallbackPayload](#function-getmapicallbackpayload) | [getProofFromWhatsOnChain](#function-getprooffromwhatsonchain) |
| [getMapiJsonResponsePayload](#function-getmapijsonresponsepayload) | [getProofFromWhatsOnChainTsc](#function-getprooffromwhatsonchaintsc) |
| [getMapiPostTxPayload](#function-getmapiposttxpayload) | [getRawTxFromWhatsOnChain](#function-getrawtxfromwhatsonchain) |
| [getMapiTxStatusPayload](#function-getmapitxstatuspayload) | [getSpentStatusForOutpoint](#function-getspentstatusforoutpoint) |
| [getMerkleProofFromGorillaPool](#function-getmerkleprooffromgorillapool) | [getUtxoStatusFromWhatsOnChain](#function-getutxostatusfromwhatsonchain) |
| [getMerkleProofFromMetastreme](#function-getmerkleprooffrommetastreme) | [postRawTxToGorillaPool](#function-postrawtxtogorillapool) |
| [getMerkleProofFromTaal](#function-getmerkleprooffromtaal) | [postRawTxToMapiMiner](#function-postrawtxtomapiminer) |
| [getMerkleProofFromWhatsOnChain](#function-getmerkleprooffromwhatsonchain) | [postRawTxToTaal](#function-postrawtxtotaal) |
| [getMerkleProofFromWhatsOnChainTsc](#function-getmerkleprooffromwhatsonchaintsc) | [verifyMapiResponseForTxid](#function-verifymapiresponsefortxid) |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

#### Function: checkMapiResponse

##### Description

Verifies the payload signature on a mAPI response object

Throws an error if signature fails to validate.

https://github.com/bitcoin-sv-specs/brfc-misc/tree/master/jsonenvelope

```ts
export function checkMapiResponse(response: MapiResponseApi) 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMapiJsonResponsePayload

##### Description

Parses a mAPI mimetype 'application/json' response payload after verifying the envelope signature.

Throws on verification errors.

```ts
export function getMapiJsonResponsePayload<T>(response: MapiResponseApi): T 
```

<details>

<summary>Function getMapiJsonResponsePayload Details</summary>

##### Returns

parse JSON payload object

###### mAPI

response</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMapiTxStatusPayload

##### Description

Validates the mapi response signature and parses payload as transaction status.

Throws an error if payload txid doesn't match requested txid.

Throws an error if payload returnResult is not 'success' or 'failure'.

'failure' indicates the txid is unknown to the service.

'success' indicates the txid is known to the service and status was returned.

```ts
export function getMapiTxStatusPayload(txid: string | Buffer | undefined, response: MapiResponseApi): MapiTxStatusPayloadApi 
```

<details>

<summary>Function getMapiTxStatusPayload Details</summary>

###### txid

hash of transaction whose status was requested</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMapiCallbackPayload

```ts
export function getMapiCallbackPayload(txid: string | Buffer | undefined, response: MapiResponseApi): MapiCallbackPayloadApi 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: verifyMapiResponseForTxid

```ts
export function verifyMapiResponseForTxid<T extends MapiTxidReturnResultApi>(response: MapiResponseApi, txid?: string | Buffer, checkFailure?: boolean): T 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMapiPostTxPayload

```ts
export function getMapiPostTxPayload(response: MapiResponseApi, txid?: string | Buffer, checkFailure?: boolean): MapiPostTxPayloadApi 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: checkMapiResponseForTxid

```ts
export function checkMapiResponseForTxid(response: MapiResponseApi, txid?: string | Buffer): boolean 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMerkleProofFromGorillaPool

##### Description

GorillaPool.io has a mapi transaction status endpoint for mainNet, not for testNet,
and does NOT return merkle proofs...

mapiResponse is signed and has txStatus payload.
{
  apiVersion: "",
  timestamp: "2023-03-23T02:14:39.362Z",
  txid: "9c31ed1dea4ec1aae0475addc0a74eaed68b718d9983d42b111c387d6696a949",
  returnResult: "success",
  resultDescription: "",
  blockHash: "00000000000000000e155235fd83a8757c44c6299e63104fb12632368f3f0cc9",
  blockHeight: 700000,
  confirmations: 84353,
  minerId: "03ad780153c47df915b3d2e23af727c68facaca4facd5f155bf5018b979b9aeb83",
  txSecondMempoolExpiry: 0,
}

```ts
export async function getMerkleProofFromGorillaPool(txid: string | Buffer): Promise<TscMerkleProofApi | undefined> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMerkleProofFromTaal

##### Description

Taal.com has the most functional txStatus and merkleProof endpoint for both mainNet and testNet

Proofs use targetType "header" which is converted to "merkleRoot".

Proofs correctly use duplicate computed node value symbol "*".

An apiKey must be used and must correspond to the target chain: mainNet or testNet.

```ts
export async function getMerkleProofFromTaal(txid: string | Buffer, apiKey: string): Promise<TscMerkleProofApi | undefined> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMerkleProofFromMetastreme

##### Description

metastreme.com has a partially conforming merkleProof implementation.

Both mainNet and testNet are supported.

Proofs incorrectly included a copy of the computed value instead of "*" along right side of merkle tree.

targetType of hash is used which prevents automatic proof checking as the target root value isn't known
without a lookup request.

```ts
export async function getMerkleProofFromMetastreme(txid: string | Buffer, chain: Chain): Promise<TscMerkleProofApi | undefined> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMerkleProofFromWhatsOnChain

##### Description

WhatOnChain.com has their own "hash/pos/R/L" proof format and a more TSC compliant proof format.

The "/proof" endpoint returns an object for each node with "hash" and "pos" properties. "pos" can have values "R" or "L".
Normally "pos" indicates which side of a concatenation the provided "hash" goes with one exception! EXCEPTION: When the
provided should be "*" indicating edge-of-the-tree-duplicate-computed-value, they include the expected computed value and the pos value
is always "L", even when it should really be "R". This only matters if you are trying to compute index from the "R" and "L" values.

```ts
export async function getMerkleProofFromWhatsOnChain(txid: string | Buffer, chain: Chain): Promise<TscMerkleProofApi | undefined> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMerkleProofFromWhatsOnChainTsc

##### Description

WhatOnChain.com has their own "hash/pos/R/L" proof format and a more TSC compliant proof format.

The "/proof/tsc" endpoint is much closer to the TSC specification. It provides "index" directly and each node is just the provided hash value.
The "targetType" is unspecified and thus defaults to block header hash, requiring a Chaintracks lookup to get the merkleRoot...
Duplicate hash values are provided in full instead of being replaced by "*".

```ts
export async function getMerkleProofFromWhatsOnChainTsc(txid: string | Buffer, chain: Chain): Promise<TscMerkleProofApi | undefined> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: checkMerkleProof

##### Description

Implement merkle proof per https://tsc.bitcoinassociation.net/standards/merkle-proof-standardised-format/

We extend the current standard by implementing targetType 'height' (binary value 3).
This extension avoids the need to maintain a merkleroot or block hash index for all headers,
reducing the space required by 50%.

Other extensions are not currently supported.

Supports partial and full binary format as well as hex strings.

External Assumptions:
1. The raw transaction is in-hand and is either duplicated in the proof or matches the starting hash
   used to evaluate the merkle tree branch.

Checking the proof verifies these claims:
1. The merkleRoot determined by the targetType is confirmed to match a block header on the active chain.
2. Computing a merkleRoot value starting with the transaction hash, using the proof nodes yields a
   match for the target value.

Implications:
1. The transaction in-hand is valid and was included in a block on the active chain.

```ts
export async function checkMerkleProof(txid: string | Buffer, proof: TscMerkleProofApi | Buffer, chaintracks: ChaintracksClientApi): Promise<BlockHeader> 
```

<details>

<summary>Function checkMerkleProof Details</summary>

##### Returns

The block header containing the verified merkleRoot

###### txid

the transaction hash of the in-hand transaction to which this proof applies.</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: postRawTxToGorillaPool

```ts
export async function postRawTxToGorillaPool(txid: string | Buffer, rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: postRawTxToTaal

```ts
export function postRawTxToTaal(txid: string | Buffer, rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi, apiKey?: string): Promise<PostRawTxResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: postRawTxToMapiMiner

```ts
export async function postRawTxToMapiMiner(txid: string | Buffer, rawTx: string | Buffer, miner: PostTransactionMapiMinerApi, callback?: MapiCallbackApi): Promise<PostRawTxResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getRawTxFromWhatsOnChain

```ts
export async function getRawTxFromWhatsOnChain(txid: string | Buffer, chain: Chain): Promise<GetRawTxResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getProofFromGorillaPool

##### Description

GorillaPool.io MAINNET ONLY

has a mapi transaction status endpoint for mainNet, not for testNet,
and does NOT return merkle proofs...

mapiResponse is signed and has txStatus payload.
{
  apiVersion: "",
  timestamp: "2023-03-23T02:14:39.362Z",
  txid: "9c31ed1dea4ec1aae0475addc0a74eaed68b718d9983d42b111c387d6696a949",
  returnResult: "success",
  resultDescription: "",
  blockHash: "00000000000000000e155235fd83a8757c44c6299e63104fb12632368f3f0cc9",
  blockHeight: 700000,
  confirmations: 84353,
  minerId: "03ad780153c47df915b3d2e23af727c68facaca4facd5f155bf5018b979b9aeb83",
  txSecondMempoolExpiry: 0,
}

```ts
export async function getProofFromGorillaPool(txid: string | Buffer, chain: Chain): Promise<GetMerkleProofResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getProofFromTaal

##### Description

Taal.com has the most functional txStatus and merkleProof endpoint for both mainNet and testNet

Proofs use targetType "header" which is converted to "merkleRoot".

Proofs correctly use duplicate computed node value symbol "*".

An apiKey must be used and must correspond to the target chain: mainNet or testNet.

```ts
export async function getProofFromTaal(txid: string | Buffer, apiKey: string): Promise<GetMerkleProofResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getProofFromMetastreme

##### Description

metastreme.com has a partially conforming merkleProof implementation.

Both mainNet and testNet are supported.

Proofs incorrectly included a copy of the computed value instead of "*" along right side of merkle tree.

targetType of hash

```ts
export async function getProofFromMetastreme(txid: string | Buffer, chain: Chain): Promise<GetMerkleProofResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getProofFromWhatsOnChain

##### Description

WhatOnChain.com has their own "hash/pos/R/L" proof format and a more TSC compliant proof format.

The "/proof" endpoint returns an object for each node with "hash" and "pos" properties. "pos" can have values "R" or "L".
Normally "pos" indicates which side of a concatenation the provided "hash" goes with one exception! EXCEPTION: When the
provided should be "*" indicating edge-of-the-tree-duplicate-computed-value, they include the expected computed value and the pos value
is always "L", even when it should really be "R". This only matters if you are trying to compute index from the "R" and "L" values.

```ts
export async function getProofFromWhatsOnChain(txid: string | Buffer, chain: Chain): Promise<GetMerkleProofResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getProofFromWhatsOnChainTsc

##### Description

WhatOnChain.com has their own "hash/pos/R/L" proof format and a more TSC compliant proof format.

The "/proof/tsc" endpoint is much closer to the TSC specification. It provides "index" directly and each node is just the provided hash value.
The "targetType" is unspecified and thus defaults to block header hash, requiring a Chaintracks lookup to get the merkleRoot...
Duplicate hash values are provided in full instead of being replaced by "*".

```ts
export async function getProofFromWhatsOnChainTsc(txid: string | Buffer, chain: Chain): Promise<GetMerkleProofResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getUtxoStatusFromWhatsOnChain

```ts
export async function getUtxoStatusFromWhatsOnChain(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi): Promise<GetUtxoStatusResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getSpentStatusForOutpoint

##### Description

Attempts to validate whether or not an outpoint has been spent by using the WhatsOnChain API

```ts
export async function getSpentStatusForOutpoint(outpoint: string, chain: Chain): Promise<boolean> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Types

| |
| --- |
| [GetMerkleProofServiceApi](#type-getmerkleproofserviceapi) |
| [GetRawTxServiceApi](#type-getrawtxserviceapi) |
| [GetUtxoStatusOutputFormatApi](#type-getutxostatusoutputformatapi) |
| [GetUtxoStatusServiceApi](#type-getutxostatusserviceapi) |
| [PostRawTxServiceApi](#type-postrawtxserviceapi) |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

#### Type: GetUtxoStatusOutputFormatApi

```ts
export type GetUtxoStatusOutputFormatApi = "hashLE" | "hashBE" | "script"
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Type: GetUtxoStatusServiceApi

```ts
export type GetUtxoStatusServiceApi = (output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi) => Promise<GetUtxoStatusResultApi>
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Type: GetMerkleProofServiceApi

```ts
export type GetMerkleProofServiceApi = (txid: string | Buffer, chain: Chain) => Promise<GetMerkleProofResultApi>
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Type: GetRawTxServiceApi

```ts
export type GetRawTxServiceApi = (txid: string | Buffer, chain: Chain) => Promise<GetRawTxResultApi>
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Type: PostRawTxServiceApi

```ts
export type PostRawTxServiceApi = (txid: string | Buffer, rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi) => Promise<PostRawTxResultApi>
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

<!--#endregion ts2md-api-merged-here-->

## License

The license for the code in this repository is the Open BSV License.