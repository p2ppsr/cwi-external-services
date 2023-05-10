import { asString, bsv } from "cwi-base";

import { MapiResponseApi, MapiTxidReturnResultApi, MapiTxStatusPayloadApi } from "./Api/MerchantApi";
import {
    ERR_EXTSVS_MAPI_SIGNATURE_INVALID,
    ERR_EXTSVS_MAPI_UNSUPORTED_ENCODING,
    ERR_EXTSVS_MAPI_UNSUPORTED_MIMETYPE,
    ERR_EXTSVS_MAPI_UNSUPORTED_RETURNRESULT,
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
    // Check the format and signature
    const payloadHash = bsv.Hash.sha256(Buffer.from(response.payload));
    const signature = new bsv.Sig().fromString(response.signature);
    const publicKey = new bsv.PubKey().fromString(response.publicKey);
    if (bsv.Ecdsa.verify(payloadHash, signature, publicKey) !== true) {
        throw new ERR_EXTSVS_MAPI_SIGNATURE_INVALID()
    }
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
        throw new ERR_EXTSVS_MAPI_UNSUPORTED_MIMETYPE(response.mimetype)
    if (response.encoding && response.encoding !== "UTF-8")
        throw new ERR_EXTSVS_MAPI_UNSUPORTED_ENCODING(response.encoding)
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
export function getMapiTxStatusPayload(txid: string | Buffer, response: MapiResponseApi): MapiTxStatusPayloadApi {
    const payload = getMapiJsonResponsePayload<MapiTxStatusPayloadApi>(response);
    txid = asString(txid)
    if (payload.txid !== txid)
        throw new ERR_EXTSVS_TXID_INVALID(asString(txid), payload.txid)
    if (payload.returnResult !== 'success' && payload.returnResult !== 'failure')
        throw new ERR_EXTSVS_MAPI_UNSUPORTED_RETURNRESULT(payload.returnResult)
    return payload;
}

export function checkMapiResponseForTxid(response: MapiResponseApi, txid: string | Buffer) : boolean {
    const payload = getMapiJsonResponsePayload<MapiTxidReturnResultApi>(response)
    if (payload.txid !== asString(txid))
        throw new ERR_EXTSVS_TXID_INVALID(asString(txid), payload.txid)
    if (payload.returnResult !== 'success')
        throw new ERR_EXTSVS_MAPI_UNSUPORTED_RETURNRESULT(payload.returnResult)
    return true
}