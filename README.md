# cwi-external-services

Implementations of external service APIs. 

Standardized service APIs for use within CWI.

## API

<!--#region ts2md-api-merged-here-->

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

### Interfaces

| | |
| --- | --- |
| [BsvExchangeRateApi](#interface-bsvexchangerateapi) | [GetScriptHistoryResultApi](#interface-getscripthistoryresultapi) |
| [ChaintracksChainTrackerOptions](#interface-chaintrackschaintrackeroptions) | [GetUtxoStatusDetailsApi](#interface-getutxostatusdetailsapi) |
| [ChaintracksServiceClientOptions](#interface-chaintracksserviceclientoptions) | [GetUtxoStatusResultApi](#interface-getutxostatusresultapi) |
| [CwiExternalServicesApi](#interface-cwiexternalservicesapi) | [MapiCallbackApi](#interface-mapicallbackapi) |
| [CwiExternalServicesOptions](#interface-cwiexternalservicesoptions) | [MapiCallbackPayloadApi](#interface-mapicallbackpayloadapi) |
| [ExchangeRatesIoApi](#interface-exchangeratesioapi) | [MapiPostTxPayloadApi](#interface-mapiposttxpayloadapi) |
| [FiatExchangeRatesApi](#interface-fiatexchangeratesapi) | [MapiTxStatusPayloadApi](#interface-mapitxstatuspayloadapi) |
| [GetEnvelopeOptionsApi](#interface-getenvelopeoptionsapi) | [MapiTxidReturnResultApi](#interface-mapitxidreturnresultapi) |
| [GetMerkleProofResultApi](#interface-getmerkleproofresultapi) | [PostRawTxResultApi](#interface-postrawtxresultapi) |
| [GetRawTxResultApi](#interface-getrawtxresultapi) | [PostTransactionMapiMinerApi](#interface-posttransactionmapiminerapi) |
| [GetScriptHistoryDetailsApi](#interface-getscripthistorydetailsapi) |  |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

#### Interface: MapiTxStatusPayloadApi

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

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: MapiCallbackPayloadApi

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

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: MapiTxidReturnResultApi

Used to parse payloads when only confirmation that a miner acknowledges a specific txid matters.

```ts
export interface MapiTxidReturnResultApi {
    apiVersion?: string;
    timestamp?: string;
    txid: string;
    returnResult: string;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: MapiPostTxPayloadApi

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

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: ExchangeRatesIoApi

```ts
export interface ExchangeRatesIoApi {
    success: boolean;
    timestamp: number;
    base: "EUR" | "USD";
    date: string;
    rates: Record<string, number>;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: CwiExternalServicesOptions

```ts
export interface CwiExternalServicesOptions {
    mainTaalApiKey?: string;
    testTaalApiKey?: string;
    bsvExchangeRate: BsvExchangeRateApi;
    bsvUpdateMsecs: number;
    fiatExchangeRates: FiatExchangeRatesApi;
    fiatUpdateMsecs: number;
    disableMapiCallback?: boolean;
    exchangeratesapiKey?: string;
    chaintracksFiatExchangeRatesUrl?: string;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: CwiExternalServicesApi

Defines standard interfaces to access functionality implemented by external transaction processing services.

```ts
export interface CwiExternalServicesApi {
    getBsvExchangeRate(): Promise<number>;
    getFiatExchangeRate(currency: "USD" | "GBP" | "EUR", base?: "USD" | "GBP" | "EUR"): Promise<number>;
    getRawTx(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetRawTxResultApi>;
    getTransaction(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<Transaction>;
    getTransactionOutput(vout: number, txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<TransactionOutput>;
    getMerkleProof(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetMerkleProofResultApi>;
    postRawTx(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi[]>;
    getUtxoStatus(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetUtxoStatusResultApi>;
}
```

<details>

<summary>Interface CwiExternalServicesApi Details</summary>

##### Method getBsvExchangeRate

Approximate exchange rate US Dollar / BSV, USD / BSV

This is the US Dollar price of one BSV

```ts
getBsvExchangeRate(): Promise<number>
```

##### Method getFiatExchangeRate

Approximate exchange rate currency per base.

```ts
getFiatExchangeRate(currency: "USD" | "GBP" | "EUR", base?: "USD" | "GBP" | "EUR"): Promise<number>
```

##### Method getMerkleProof

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

Argument Details

+ **txid**
  + transaction hash for which proof is requested
+ **chain**
  + which chain to look on
+ **useNext**
  + optional, forces skip to next service before starting service requests cycle.

##### Method getRawTx

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

Argument Details

+ **txid**
  + transaction hash for which raw transaction bytes are requested
+ **chain**
  + which chain to look on
+ **useNext**
  + optional, forces skip to next service before starting service requests cycle.

##### Method getTransaction

Typically uses getRawTx to lookup a raw transaction to return a parsed `Transaction`.

```ts
getTransaction(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<Transaction>
```

Argument Details

+ **txid**
  + transaction hash for which raw transaction bytes are requested
+ **chain**
  + which chain to look on
+ **useNext**
  + optional, forces skip to next service before starting service requests cycle.

Throws

ERR_INVALID_PARAMETER if txid does not exist, or can't be found, on chain.

##### Method getTransactionOutput

Typically uses getTransaction to obtain a parsed `Transaction` and returns a specific `TransactionOutput`.

```ts
getTransactionOutput(vout: number, txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<TransactionOutput>
```

Argument Details

+ **vout**
  + the index (zero based) of the output to be returned
+ **txid**
  + transaction hash for which raw transaction bytes are requested
+ **chain**
  + which chain to look on
+ **useNext**
  + optional, forces skip to next service before starting service requests cycle.

Throws

ERR_INVALID_PARAMETER if txid does not exist, or can't be found, on chain, or if vout is invalid.

##### Method getUtxoStatus

Attempts to determine the UTXO status of a transaction output.

Cycles through configured transaction processing services attempting to get a valid response.

```ts
getUtxoStatus(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetUtxoStatusResultApi>
```

Argument Details

+ **output**
  + transaction output identifier in format determined by `outputFormat`.
+ **chain**
  + which chain to post to, all of rawTx's inputs must be unspent on this chain.
+ **outputFormat**
  + optional, supported values:
'hashLE' little-endian sha256 hash of output script
'hashBE' big-endian sha256 hash of output script
'script' entire transaction output script
undefined if asBuffer length of `output` is 32 then 'hashBE`, otherwise 'script'.
+ **useNext**
  + optional, forces skip to next service before starting service requests cycle.

##### Method postRawTx

Attempts to post a new transaction to each configured external transaction processing service.

Asynchronously posts the transaction simultaneously to all the configured services.

```ts
postRawTx(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi[]>
```

Returns

an array of `PostRawTxResultApi` objects with results of posting to each service

Argument Details

+ **rawTx**
  + new raw transaction to post for processing
+ **chain**
  + which chain to post to, all of rawTx's inputs must be unspent on this chain.
+ **callback**
  + optional, controls whether and how each service is to make transaction status update callbacks.

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: MapiCallbackApi

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

##### Property getId

Each call to this method generates a unique callbackID string and creates a record of the
circumstances under which it was generated.

```ts
getId: () => Promise<string>
```

##### Property url

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

##### Property error

The first exception error that occurred during processing, if any.

```ts
error?: {
    name?: string;
    err: CwiError;
}
```

##### Property mapi

The first valid mapi response received from a service, if any.
Relevant when no proof was received.

```ts
mapi?: {
    name?: string;
    resp: MapiResponseApi;
}
```

##### Property name

The name of the service returning the proof, or undefined if no proof

```ts
name?: string
```

##### Property proof

Multiple proofs may be returned when a transaction also appears in
one or more orphaned blocks

```ts
proof?: TscMerkleProofApi | TscMerkleProofApi[]
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: GetRawTxResultApi

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

##### Property error

The first exception error that occurred during processing, if any.

```ts
error?: {
    name?: string;
    err: CwiError;
}
```

##### Property mapi

The first valid mapi response received from a service, if any.
Relevant when no proof was received.

```ts
mapi?: {
    name?: string;
    resp: MapiResponseApi;
}
```

##### Property name

The name of the service returning the rawTx, or undefined if no rawTx

```ts
name?: string
```

##### Property rawTx

Multiple proofs may be returned when a transaction also appears in
one or more orphaned blocks

```ts
rawTx?: Buffer
```

##### Property txid

Transaction hash or rawTx (and of initial request)

```ts
txid: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: PostRawTxResultApi

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

##### Property alreadyKnown

if true, the transaction was already known to this service. Usually treat as a success.

Potentially stop posting to additional transaction processors.

```ts
alreadyKnown?: boolean
```

##### Property callbackID

callbackID associated with this request

```ts
callbackID?: string
```

##### Property error

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

##### Property mapi

Raw mapi response including stringified payload

```ts
mapi?: MapiResponseApi
```

##### Property name

The name of the service to which the transaction was submitted for processing

```ts
name: string
```

##### Property payload

Parsed and signature verified mapi payload

```ts
payload?: MapiPostTxPayloadApi
```

##### Property status

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

##### Property amount

if isUtxo, the amount of the matching unspent transaction output

typically there will be only one, but future orphans can result in multiple values

```ts
amount?: number
```

##### Property height

if isUtxo, the block height containing the matching unspent transaction output

typically there will be only one, but future orphans can result in multiple values

```ts
height?: number
```

##### Property index

if isUtxo, the output index in the transaction containing of the matching unspent transaction output

typically there will be only one, but future orphans can result in multiple values

```ts
index?: number
```

##### Property txid

if isUtxo, the transaction hash (txid) of the transaction containing the matching unspent transaction output

typically there will be only one, but future orphans can result in multiple values

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

##### Property details

Additional details about occurances of this output script as a utxo.

Normally there will be one item in the array but due to the possibility of orphan races
there could be more than one block in which it is a valid utxo.

```ts
details: GetUtxoStatusDetailsApi[]
```

##### Property error

When status is 'error', provides code and description

```ts
error?: CwiError
```

##### Property isUtxo

true if the output is associated with at least one unspent transaction output

```ts
isUtxo?: boolean
```

##### Property name

The name of the service to which the transaction was submitted for processing

```ts
name: string
```

##### Property status

'success' - the operation was successful, non-error results are valid.
'error' - the operation failed, error may have relevant information.

```ts
status: "success" | "error"
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: GetScriptHistoryDetailsApi

```ts
export interface GetScriptHistoryDetailsApi {
    txid: string;
    height?: number;
    fee?: number;
}
```

<details>

<summary>Interface GetScriptHistoryDetailsApi Details</summary>

##### Property fee

the fee paid by the transaction referencing this output script, may be an input or output

typically valid if the transaction has not been mined.

```ts
fee?: number
```

##### Property height

the block height of the transaction referencing this output script, may be an input or output

typically valid if the transaction has been mined.

```ts
height?: number
```

##### Property txid

the hash of the transaction referencing this output script, may be an input or output

```ts
txid: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: GetScriptHistoryResultApi

```ts
export interface GetScriptHistoryResultApi {
    name: string;
    status: "success" | "error";
    error?: CwiError;
    details: GetScriptHistoryDetailsApi[];
}
```

<details>

<summary>Interface GetScriptHistoryResultApi Details</summary>

##### Property details

Additional details about occurances of this output script.

Sorted by decreasing fee, then decreasing height.
i.e. most likely spending transaction first.

```ts
details: GetScriptHistoryDetailsApi[]
```

##### Property error

When status is 'error', provides code and description

```ts
error?: CwiError
```

##### Property name

The name of the service to which the transaction was submitted for processing

```ts
name: string
```

##### Property status

'success' - the operation was successful, non-error results are valid.
'error' - the operation failed, error may have relevant information.

```ts
status: "success" | "error"
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: BsvExchangeRateApi

```ts
export interface BsvExchangeRateApi {
    timestamp: Date;
    base: "USD";
    rate: number;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: FiatExchangeRatesApi

```ts
export interface FiatExchangeRatesApi {
    timestamp: Date;
    base: "USD";
    rates: Record<string, number>;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: ChaintracksServiceClientOptions

```ts
export interface ChaintracksServiceClientOptions {
    useAuthrite: boolean;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: GetEnvelopeOptionsApi

```ts
export interface GetEnvelopeOptionsApi {
    chaintracks?: ChaintracksClientApi;
    maxRecursionDepth?: number;
    minProofLevel?: number;
}
```

<details>

<summary>Interface GetEnvelopeOptionsApi Details</summary>

##### Property minProofLevel

Use to generate test envelopes.
If set to a number greater than zero,
proofs will be ignored until that level.
The first level is zero.
userId must be undefined.

```ts
minProofLevel?: number
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Interface: ChaintracksChainTrackerOptions

```ts
export interface ChaintracksChainTrackerOptions {
    maxRetries?: number;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Classes

| | |
| --- | --- |
| [ChaintracksChainTracker](#class-chaintrackschaintracker) | [ERR_EXTSVS_MAPI_SIGNATURE_INVALID](#class-err_extsvs_mapi_signature_invalid) |
| [ChaintracksServiceClient](#class-chaintracksserviceclient) | [ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING](#class-err_extsvs_mapi_unsupported_encoding) |
| [CwiExternalServices](#class-cwiexternalservices) | [ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE](#class-err_extsvs_mapi_unsupported_mimetype) |
| [ERR_EXTSVS_ALREADY_MINED](#class-err_extsvs_already_mined) | [ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT](#class-err_extsvs_mapi_unsupported_returnresult) |
| [ERR_EXTSVS_BLOCK_HASH_MISSING](#class-err_extsvs_block_hash_missing) | [ERR_EXTSVS_MERKLEPROOF_NODE_TYPE](#class-err_extsvs_merkleproof_node_type) |
| [ERR_EXTSVS_BLOCK_HEIGHT_MISSING](#class-err_extsvs_block_height_missing) | [ERR_EXTSVS_MERKLEPROOF_PARSING](#class-err_extsvs_merkleproof_parsing) |
| [ERR_EXTSVS_DOUBLE_SPEND](#class-err_extsvs_double_spend) | [ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE](#class-err_extsvs_merkleproof_taget_type) |
| [ERR_EXTSVS_ENVELOPE_DEPTH](#class-err_extsvs_envelope_depth) | [ERR_EXTSVS_MERKLEPROOF_UNSUPPORTED](#class-err_extsvs_merkleproof_unsupported) |
| [ERR_EXTSVS_FAILURE](#class-err_extsvs_failure) | [ERR_EXTSVS_MERKLEROOT_INVALID](#class-err_extsvs_merkleroot_invalid) |
| [ERR_EXTSVS_INVALID_TRANSACTION](#class-err_extsvs_invalid_transaction) | [ERR_EXTSVS_MERKLEROOT_MISSING](#class-err_extsvs_merkleroot_missing) |
| [ERR_EXTSVS_INVALID_TXID](#class-err_extsvs_invalid_txid) | [ERR_EXTSVS_TXID_INVALID](#class-err_extsvs_txid_invalid) |
| [ERR_EXTSVS_MAPI_MISSING](#class-err_extsvs_mapi_missing) | [ServiceCollection](#class-servicecollection) |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

#### Class: ERR_EXTSVS_FAILURE

Expected txid ${expected} doesn't match proof txid ${actual}

```ts
export class ERR_EXTSVS_FAILURE extends CwiError {
    constructor(public url: string, public cwiError?: CwiError, description?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_TXID_INVALID

Expected txid ${expected} doesn't match proof txid ${actual}

```ts
export class ERR_EXTSVS_TXID_INVALID extends CwiError {
    constructor(expected?: string, actual?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_BLOCK_HASH_MISSING

Header for block hash ${hash} was not found.

```ts
export class ERR_EXTSVS_BLOCK_HASH_MISSING extends CwiError {
    constructor(hash?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_BLOCK_HEIGHT_MISSING

Header for block height ${height} was not found.

```ts
export class ERR_EXTSVS_BLOCK_HEIGHT_MISSING extends CwiError {
    constructor(height?: number) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_ENVELOPE_DEPTH

Exceeded max envelope depth ${maxDepth}

```ts
export class ERR_EXTSVS_ENVELOPE_DEPTH extends CwiError {
    constructor(maxDepth: number) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEROOT_INVALID

Expected merkleRoot ${expected} doesn't match computed ${actual}

```ts
export class ERR_EXTSVS_MERKLEROOT_INVALID extends CwiError {
    constructor(expected?: string, actual?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEROOT_MISSING

MerkleRoot ${merkleRoot} was not found in active chain.

```ts
export class ERR_EXTSVS_MERKLEROOT_MISSING extends CwiError {
    constructor(merkleRoot?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE

Unsupported merkle proof target type ${targetType}.

```ts
export class ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE extends CwiError {
    constructor(targetType?: string | number) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEPROOF_NODE_TYPE

Unsupported merkle proof node type ${nodeType}.

```ts
export class ERR_EXTSVS_MERKLEPROOF_NODE_TYPE extends CwiError {
    constructor(nodeType?: string | number) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEPROOF_PARSING

Merkle proof parsing error.

```ts
export class ERR_EXTSVS_MERKLEPROOF_PARSING extends CwiError {
    constructor() 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MERKLEPROOF_UNSUPPORTED

Merkle proof unsuported feature ${feature}.

```ts
export class ERR_EXTSVS_MERKLEPROOF_UNSUPPORTED extends CwiError {
    constructor(feature?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MAPI_MISSING

Required Mapi response is missing.

```ts
export class ERR_EXTSVS_MAPI_MISSING extends CwiError {
    constructor(description?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MAPI_SIGNATURE_INVALID

Mapi response signature is invalid.

```ts
export class ERR_EXTSVS_MAPI_SIGNATURE_INVALID extends CwiError {
    constructor() 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE

mAPI response unsupported mimetype ${mimeType}

```ts
export class ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE extends CwiError {
    constructor(mimeType?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING

mAPI response unsupported encoding ${encoding}

```ts
export class ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING extends CwiError {
    constructor(encoding?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT

mAPI response unsupported returnResult ${result}

```ts
export class ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT extends CwiError {
    constructor(result?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_INVALID_TRANSACTION

Transaction is invalid.

```ts
export class ERR_EXTSVS_INVALID_TRANSACTION extends CwiError {
    constructor(description?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_INVALID_TXID

Txid of broadcast transaction doesn't match returned txid.

```ts
export class ERR_EXTSVS_INVALID_TXID extends CwiError {
    constructor(description?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_DOUBLE_SPEND

Transaction with txid of ${txid} is a double spend.

This class does not include `spendingTransactions`, see `ERR_DOUBLE_SPEND` if required.

```ts
export class ERR_EXTSVS_DOUBLE_SPEND extends CwiError {
    constructor(public txid: string, description?: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ERR_EXTSVS_ALREADY_MINED

Transaction was already mined.

```ts
export class ERR_EXTSVS_ALREADY_MINED extends CwiError {
    constructor(description?: string) 
}
```

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
    constructor(services?: {
        name: string;
        service: T;
    }[]) 
    add(s: {
        name: string;
        service: T;
    }): ServiceCollection<T> 
    remove(name: string): void 
    get name() 
    get service() 
    get allServices() 
    get count() 
    get index() 
    reset() 
    next(): number 
    clone(): ServiceCollection<T> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: CwiExternalServices

```ts
export class CwiExternalServices implements CwiExternalServicesApi {
    static createDefaultOptions(): CwiExternalServicesOptions 
    options: CwiExternalServicesOptions;
    getMerkleProofServices: ServiceCollection<GetMerkleProofServiceApi>;
    getRawTxServices: ServiceCollection<GetRawTxServiceApi>;
    postRawTxServices: ServiceCollection<PostRawTxServiceApi>;
    getUtxoStatusServices: ServiceCollection<GetUtxoStatusServiceApi>;
    getScriptHistoryServices: ServiceCollection<GetScriptHistoryServiceApi>;
    updateFiatExchangeRateServices: ServiceCollection<UpdateFiatExchangeRateServiceApi>;
    constructor(options?: CwiExternalServicesOptions) 
    async getBsvExchangeRate(): Promise<number> 
    async getFiatExchangeRate(currency: "USD" | "GBP" | "EUR", base?: "USD" | "GBP" | "EUR"): Promise<number> 
    targetCurrencies = ["USD", "GBP", "EUR"];
    async updateFiatExchangeRates(rates?: FiatExchangeRatesApi, updateMsecs?: number): Promise<FiatExchangeRatesApi> 
    get getProofsCount() 
    get getRawTxsCount() 
    get postRawTxsCount() 
    get getUtxoStatsCount() 
    async getUtxoStatus(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetUtxoStatusResultApi> 
    async getScriptHistory(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetScriptHistoryResultApi> 
    async verifyOutput(output: {
        outputScript: Buffer | null;
        amount: number | null;
    }, chain: Chain): Promise<boolean> 
    async postRawTx(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi[]> 
    async getRawTx(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetRawTxResultApi> 
    async getTransaction(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<Transaction> 
    async getTransactionOutput(vout: number, txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<TransactionOutput> 
    async getMerkleProof(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetMerkleProofResultApi> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ChaintracksServiceClient

Connects to a ChaintracksService to implement `ChaintracksClientApi`

```ts
export class ChaintracksServiceClient implements ChaintracksClientApi {
    static createChaintracksServiceClientOptions(): ChaintracksServiceClientOptions 
    authrite?: AuthriteClient;
    options: ChaintracksServiceClientOptions;
    constructor(public chain: Chain, public serviceUrl: string, options?: ChaintracksServiceClientOptions) 
    async subscribeHeaders(listener: HeaderListener): Promise<string> 
    async subscribeReorgs(listener: ReorgListener): Promise<string> 
    async unsubscribe(subscriptionId: string): Promise<boolean> 
    async getJsonOrUndefined<T>(path: string): Promise<T | undefined> 
    async getJson<T>(path: string): Promise<T> 
    async postJsonVoid<T>(path: string, params: T): Promise<void> 
    async addHeaderHex(header: BaseBlockHeaderHex): Promise<void> 
    async startListening(): Promise<void> 
    async listening(): Promise<void> 
    async getChain(): Promise<Chain> 
    async getInfo(wait?: number): Promise<ChaintracksInfoApi> 
    async isListening(): Promise<boolean> 
    async isSynchronized(): Promise<boolean> 
    async getPresentHeight(): Promise<number> 
    async findChainTipHeaderHex(): Promise<BlockHeaderHex> 
    async findChainTipHashHex(): Promise<string> 
    async getHeadersHex(height: number, count: number): Promise<string> 
    async findHeaderHexForHeight(height: number): Promise<BlockHeaderHex | undefined> 
    async findChainWorkHexForBlockHash(hash: string | Buffer): Promise<string | undefined> 
    async findHeaderHexForBlockHash(hash: Buffer | string): Promise<BlockHeaderHex | undefined> 
    async findHeaderHexForMerkleRoot(merkleRoot: Buffer | string, height?: number): Promise<BlockHeaderHex | undefined> 
    async findChainTipHeader(): Promise<BlockHeader> 
    async findChainTipHash(): Promise<Buffer> 
    async findChainWorkForBlockHash(hash: string | Buffer): Promise<Buffer | undefined> 
    async findHeaderForBlockHash(hash: string | Buffer): Promise<BlockHeader | undefined> 
    async getHeaders(height: number, count: number): Promise<Buffer> 
    async findHeaderForHeight(height: number): Promise<BlockHeader | undefined> 
    async findHeaderForMerkleRoot(root: string | Buffer, height?: number): Promise<BlockHeader | undefined> 
    async addHeader(header: BaseBlockHeader | BaseBlockHeaderHex): Promise<void> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Class: ChaintracksChainTracker

```ts
export class ChaintracksChainTracker implements ChainTracker {
    chaintracks: ChaintracksClientApi;
    cache: Record<number, string>;
    options: ChaintracksChainTrackerOptions;
    constructor(chain?: Chain, chaintracks?: ChaintracksClientApi, options?: ChaintracksChainTrackerOptions) 
    async isValidRootForHeight(root: string, height: number): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Functions

| | | |
| --- | --- | --- |
| [checkMapiResponse](#function-checkmapiresponse) | [getMerkleProofFromTaal](#function-getmerkleprooffromtaal) | [postRawTxToGorillaPool](#function-postrawtxtogorillapool) |
| [checkMapiResponseForTxid](#function-checkmapiresponsefortxid) | [getMerkleProofFromWhatsOnChain](#function-getmerkleprooffromwhatsonchain) | [postRawTxToMapiMiner](#function-postrawtxtomapiminer) |
| [checkMerkleProof](#function-checkmerkleproof) | [getMerkleProofFromWhatsOnChainTsc](#function-getmerkleprooffromwhatsonchaintsc) | [postRawTxToTaal](#function-postrawtxtotaal) |
| [createMapiPostTxResponse](#function-createmapiposttxresponse) | [getProofFromGorillaPool](#function-getprooffromgorillapool) | [postRawTxToWhatsOnChain](#function-postrawtxtowhatsonchain) |
| [getEnvelopeForTransaction](#function-getenvelopefortransaction) | [getProofFromMetastreme](#function-getprooffrommetastreme) | [signMapiPayload](#function-signmapipayload) |
| [getExchangeRatesIo](#function-getexchangeratesio) | [getProofFromTaal](#function-getprooffromtaal) | [updateBsvExchangeRate](#function-updatebsvexchangerate) |
| [getMapiCallbackPayload](#function-getmapicallbackpayload) | [getProofFromWhatsOnChain](#function-getprooffromwhatsonchain) | [updateChaintracksFiatExchangeRates](#function-updatechaintracksfiatexchangerates) |
| [getMapiJsonResponsePayload](#function-getmapijsonresponsepayload) | [getProofFromWhatsOnChainTsc](#function-getprooffromwhatsonchaintsc) | [updateExchangeratesapi](#function-updateexchangeratesapi) |
| [getMapiPostTxPayload](#function-getmapiposttxpayload) | [getRawTxFromWhatsOnChain](#function-getrawtxfromwhatsonchain) | [validateScriptHash](#function-validatescripthash) |
| [getMapiTxStatusPayload](#function-getmapitxstatuspayload) | [getScriptHistoryFromWhatsOnChain](#function-getscripthistoryfromwhatsonchain) | [verifyMapiResponseForTxid](#function-verifymapiresponsefortxid) |
| [getMerkleProofFromGorillaPool](#function-getmerkleprooffromgorillapool) | [getSpentStatusForOutpoint](#function-getspentstatusforoutpoint) |  |
| [getMerkleProofFromMetastreme](#function-getmerkleprooffrommetastreme) | [getUtxoStatusFromWhatsOnChain](#function-getutxostatusfromwhatsonchain) |  |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

#### Function: createMapiPostTxResponse

```ts
export function createMapiPostTxResponse(txid: string, key: string, resultDescription: string, returnResult = "success"): {
    mapi: MapiResponseApi;
    payloadData: MapiPostTxPayloadApi;
} 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: checkMapiResponse

Verifies the payload signature on a mAPI response object

```ts
export function checkMapiResponse(response: MapiResponseApi) 
```

<details>

<summary>Function checkMapiResponse Details</summary>

Throws

ERR_EXTSVS_MAPI_SIGNATURE_INVALID if signature fails to validate.

https://github.com/bitcoin-sv-specs/brfc-misc/tree/master/jsonenvelope

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: signMapiPayload

```ts
export function signMapiPayload(payload: string, privateKey: string): string 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMapiJsonResponsePayload

Parses a mAPI mimetype 'application/json' response payload after verifying the envelope signature.

Throws on verification errors.

```ts
export function getMapiJsonResponsePayload<T>(response: MapiResponseApi): T 
```

<details>

<summary>Function getMapiJsonResponsePayload Details</summary>

Returns

parse JSON payload object

Argument Details

+ **mAPI**
  + response

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMapiTxStatusPayload

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

Argument Details

+ **txid**
  + hash of transaction whose status was requested

</details>

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
#### Function: postRawTxToWhatsOnChain

```ts
export async function postRawTxToWhatsOnChain(txid: string | Buffer | undefined, rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi> 
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
#### Function: getScriptHistoryFromWhatsOnChain

```ts
export async function getScriptHistoryFromWhatsOnChain(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi): Promise<GetScriptHistoryResultApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: validateScriptHash

```ts
export function validateScriptHash(output: string | Buffer, outputFormat?: GetUtxoStatusOutputFormatApi): string 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: updateBsvExchangeRate

```ts
export async function updateBsvExchangeRate(rate?: BsvExchangeRateApi, updateMsecs?: number): Promise<BsvExchangeRateApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: updateChaintracksFiatExchangeRates

```ts
export async function updateChaintracksFiatExchangeRates(targetCurrencies: string[], options: CwiExternalServicesOptions): Promise<FiatExchangeRatesApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: updateExchangeratesapi

```ts
export async function updateExchangeratesapi(targetCurrencies: string[], options: CwiExternalServicesOptions): Promise<FiatExchangeRatesApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getExchangeRatesIo

```ts
export async function getExchangeRatesIo(key: string): Promise<ExchangeRatesIoApi> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getMerkleProofFromGorillaPool

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

Returns

The block header containing the verified merkleRoot

Argument Details

+ **txid**
  + the transaction hash of the in-hand transaction to which this proof applies.

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getSpentStatusForOutpoint

Attempts to validate whether or not an outpoint has been spent by using the WhatsOnChain API

```ts
export async function getSpentStatusForOutpoint(outpoint: string, chain: Chain): Promise<boolean> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
#### Function: getEnvelopeForTransaction

A transaction envelope is a tree of inputs where all the leaves are proven transactions.
The trivial case is a single leaf: the envelope for a proven transaction is the rawTx and its proof.

Each branching level of the tree corresponds to an unmined transaction without a proof,
in which case the envelope is:
- rawTx
- mapiResponses from transaction processors (optional)
- inputs object where keys are this transaction's input txids and values are recursive envelope for those txids.    

If storage is defined, any previously unseen txids that are required to build the envelope will be added to the proven_txs table, if they can be proven.

The options.maxRecursionDepth can be set to prevent overly deep and large envelopes. Will throw ERR_EXTSVS_ENVELOPE_DEPTH if exceeded.

```ts
export async function getEnvelopeForTransaction(services: CwiExternalServices, chain: Chain, txid: string | Buffer, options?: GetEnvelopeOptionsApi): Promise<EnvelopeApi> 
```

<details>

<summary>Function getEnvelopeForTransaction Details</summary>

Argument Details

+ **services**
  + used to obtain rawTx and merkleProof data.
+ **chain**
  + the chain on which txid exists.
+ **txid**
  + the transaction hash for which an envelope is requested.
+ **options**
  + default options use babbage cloud chaintracks service, chaintracks is required for envelope creation.

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Types

| |
| --- |
| [GetMerkleProofServiceApi](#type-getmerkleproofserviceapi) |
| [GetRawTxServiceApi](#type-getrawtxserviceapi) |
| [GetScriptHistoryServiceApi](#type-getscripthistoryserviceapi) |
| [GetUtxoStatusOutputFormatApi](#type-getutxostatusoutputformatapi) |
| [GetUtxoStatusServiceApi](#type-getutxostatusserviceapi) |
| [PostRawTxServiceApi](#type-postrawtxserviceapi) |
| [UpdateFiatExchangeRateServiceApi](#type-updatefiatexchangerateserviceapi) |

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
#### Type: GetScriptHistoryServiceApi

```ts
export type GetScriptHistoryServiceApi = (output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi) => Promise<GetScriptHistoryResultApi>
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
#### Type: UpdateFiatExchangeRateServiceApi

```ts
export type UpdateFiatExchangeRateServiceApi = (targetCurrencies: string[], options: CwiExternalServicesOptions) => Promise<FiatExchangeRatesApi>
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