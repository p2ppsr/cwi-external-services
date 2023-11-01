import { asBuffer, asString, bsv } from "cwi-base";

import { MapiCallbackPayloadApi, MapiPostTxPayloadApi, MapiResponseApi, MapiTxidReturnResultApi, MapiTxStatusPayloadApi } from "cwi-base/src/Api/MerchantApi";
import {
    ERR_EXTSVS_MAPI_SIGNATURE_INVALID,
    ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING,
    ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE,
    ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT,
    ERR_EXTSVS_TXID_INVALID
} from "./ERR_EXTSVS_errors";

/**
 * Verifies the payload signature on a mAPI response object
 *
 * Throws an error if signature fails to validate.
 *
 * https://github.com/bitcoin-sv-specs/brfc-misc/tree/master/jsonenvelope
 */
export function checkMapiResponse(response: MapiResponseApi) {
    try {
        // Check the format and signature
        const payloadHash = bsv.Hash.sha256(Buffer.from(response.payload));
        const signature = new bsv.Sig().fromString(response.signature);
        const publicKey = new bsv.PubKey().fromString(response.publicKey);
        if (bsv.Ecdsa.verify(payloadHash, signature, publicKey) !== true) {
            throw new ERR_EXTSVS_MAPI_SIGNATURE_INVALID()
        }
    } catch (eu: unknown) {
        throw new ERR_EXTSVS_MAPI_SIGNATURE_INVALID()
    }
}

export function signMapiPayload(payload: string, privateKey: string) : string {
    const payloadHash = bsv.Hash.sha256(Buffer.from(payload));
    const key = bsv.PrivKey.fromBn(bsv.Bn.fromBuffer(asBuffer(privateKey)))
    const signature = bsv.Ecdsa.sign(payloadHash, bsv.KeyPair.fromPrivKey(key))
    return signature.toString()
}

/**
 * Parses a mAPI mimetype 'application/json' response payload after verifying the envelope signature.
 *
 * Throws on verification errors.
 *
 * @param mAPI response
 * @returns parse JSON payload object
 */
export function getMapiJsonResponsePayload<T>(response: MapiResponseApi): T {
    checkMapiResponse(response);
    if (response.mimetype && response.mimetype !== "application/json")
        throw new ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE(response.mimetype)
    if (response.encoding && response.encoding !== "UTF-8")
        throw new ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING(response.encoding)
    const payload = <T>JSON.parse(response.payload);
    return payload;
}

/**
 * Validates the mapi response signature and parses payload as transaction status.
 * 
 * Throws an error if payload txid doesn't match requested txid.
 * 
 * Throws an error if payload returnResult is not 'success' or 'failure'.
 * 
 * 'failure' indicates the txid is unknown to the service.
 * 
 * 'success' indicates the txid is known to the service and status was returned.
 * 
 * @param txid hash of transaction whose status was requested
 * @param response 
 * @returns 
 */
export function getMapiTxStatusPayload(txid: string | Buffer | undefined, response: MapiResponseApi): MapiTxStatusPayloadApi {
    const payload = getMapiJsonResponsePayload<MapiTxStatusPayloadApi>(response);
    if (txid) {
        txid = asString(txid)
        if (payload.txid !== txid)
            throw new ERR_EXTSVS_TXID_INVALID(asString(txid), payload.txid)
    }
    if (payload.returnResult !== 'success' && payload.returnResult !== 'failure')
        throw new ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT(payload.returnResult)
    return payload;
}

export function getMapiCallbackPayload(txid: string | Buffer | undefined, response: MapiResponseApi): MapiCallbackPayloadApi {
    const payload = getMapiJsonResponsePayload<MapiCallbackPayloadApi>(response);
    if (txid) {
        txid = asString(txid)
        if (payload.callbackTxId !== txid)
            throw new ERR_EXTSVS_TXID_INVALID(asString(txid), payload.callbackTxId)
    }
    return payload;
}

export function verifyMapiResponseForTxid<T extends MapiTxidReturnResultApi>(response: MapiResponseApi, txid?: string | Buffer, checkFailure?: boolean): T {
    const payload = getMapiJsonResponsePayload<T>(response)
    if (txid) {
        if (payload.txid !== asString(txid))
            throw new ERR_EXTSVS_TXID_INVALID(asString(txid), payload.txid)
    }
    if (payload.returnResult === 'success')
        return payload
    if (checkFailure && payload.returnResult !== 'failure')
        throw new ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT(payload.returnResult)
    return payload;
}

export function getMapiPostTxPayload(response: MapiResponseApi, txid?: string | Buffer, checkFailure?: boolean) : MapiPostTxPayloadApi {
    const payload = verifyMapiResponseForTxid<MapiPostTxPayloadApi>(response, txid, checkFailure)
    return payload
}

export function checkMapiResponseForTxid(response: MapiResponseApi, txid?: string | Buffer) : boolean {
    const payload = verifyMapiResponseForTxid<MapiTxidReturnResultApi>(response, txid, false)
    return payload.returnResult === 'success'
}