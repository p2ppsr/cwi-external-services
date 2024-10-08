import { asString, identityKeyFromPrivateKey, MapiResponseApi } from "cwi-base";

import { MapiCallbackPayloadApi, MapiPostTxPayloadApi, MapiTxidReturnResultApi, MapiTxStatusPayloadApi } from "cwi-base/src/Api/MerchantApi";
import {
    ERR_EXTSVS_MAPI_SIGNATURE_INVALID,
    ERR_EXTSVS_MAPI_UNSUPPORTED_ENCODING,
    ERR_EXTSVS_MAPI_UNSUPPORTED_MIMETYPE,
    ERR_EXTSVS_MAPI_UNSUPPORTED_RETURNRESULT,
    ERR_EXTSVS_TXID_INVALID
} from "./ERR_EXTSVS_errors"
import { PrivateKey, PublicKey, Signature } from "@bsv/sdk";

export function createMapiPostTxResponse(txid: string, key: string, resultDescription: string, returnResult = "success")
: { mapi: MapiResponseApi, payloadData: MapiPostTxPayloadApi }
{
    const publicKey = identityKeyFromPrivateKey(key)            

    const payloadData: MapiPostTxPayloadApi = {
        apiVersion: "1.5.0",
        timestamp: new Date().toISOString(),
        txid,
        returnResult,
        resultDescription,
        minerId: publicKey
    }

    const payload = JSON.stringify(payloadData)
    
    const mapi: MapiResponseApi = {
        payload,
        signature: signMapiPayload(payload, key),
        publicKey
    }
    
    return { mapi, payloadData }
}
/**
 * Verifies the payload signature on a mAPI response object
 *
 * @throws ERR_EXTSVS_MAPI_SIGNATURE_INVALID if signature fails to validate.
 *
 * https://github.com/bitcoin-sv-specs/brfc-misc/tree/master/jsonenvelope
 */
export function checkMapiResponse(response: MapiResponseApi) {
    // Check the format and signature
    const signature = Signature.fromDER(response.signature, 'hex')
    const publicKey = PublicKey.fromString(response.publicKey)
    const ok = publicKey.verify(response.payload, signature, 'utf8')
    if (!ok)
        throw new ERR_EXTSVS_MAPI_SIGNATURE_INVALID()
}

export function signMapiPayload(payload: string, privateKey: string) : string {
    const key = PrivateKey.fromString(privateKey, 'hex')
    const signature = key.sign(payload, 'utf8').toDER('hex') as string
    return signature
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