import { asString, Chain, CwiError, ERR_BAD_REQUEST, MapiResponseApi } from "cwi-base"
import { MapiCallbackApi, PostRawTxResultApi } from "../Api/CwiExternalServicesApi"
import axios from "axios"
import { getMapiPostTxPayload } from "../base/merchantApiUtils"
import { ERR_EXTSVS_ALREADY_MINED, ERR_EXTSVS_DOUBLE_SPEND, ERR_EXTSVS_FAILURE, ERR_EXTSVS_INVALID_TRANSACTION, ERR_EXTSVS_MAPI_MISSING } from "../base/ERR_EXTSVS_errors"

export interface PostTransactionMapiMinerApi {
    name: string
    url: string
    authType: 'none' | 'bearer'
    authToken?: string
}

const mainMapiMinerGorillaPool: PostTransactionMapiMinerApi = {
    name: 'GorillaPool',
    url: 'https://mapi.gorillapool.io/mapi',
    authType: 'none'
}

const mainMapiMinerTaal: PostTransactionMapiMinerApi = {
    name: 'Taal',
    url: 'https://api.taal.com/mapi',
    authType: 'bearer',
}

const testMapiMinerTaal: PostTransactionMapiMinerApi = {
    name: 'Taal',
    url: 'https://api.taal.com/mapi',
    authType: 'bearer',
}

export async function postRawTxToGorillaPool(txid: string | Buffer, rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi) : Promise<PostRawTxResultApi> {
    if (chain === 'test') return { name: 'GorillaPool', status: 'error', error: new ERR_BAD_REQUEST('GorillaPool does not support testNet.') }
    return await postRawTxToMapiMiner(txid, rawTx, mainMapiMinerGorillaPool, callback)
}

export function postRawTxToTaal(txid: string | Buffer, rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi, apiKey?: string) : Promise<PostRawTxResultApi> {
    const miner = {...(chain === 'main' ? mainMapiMinerTaal : testMapiMinerTaal)}
    if (apiKey)
        miner.authToken = apiKey
    return postRawTxToMapiMiner(txid, rawTx, miner, callback)
}

export async function postRawTxToMapiMiner(
    txid: string | Buffer,
    rawTx: string | Buffer,
    miner: PostTransactionMapiMinerApi,
    callback?: MapiCallbackApi)
: Promise<PostRawTxResultApi>
{

    let callbackToken: string | undefined = undefined
    let mapi: MapiResponseApi | undefined = undefined

    let url = ''

    try {
        let callbackUrl: string | undefined = undefined

        if (callback?.url) {
            callbackUrl = callback.url
            callbackToken = await callback.getId()
        }

        const headers = {
            'Content-Type': 'application/json'
        }
        if (miner.authType === 'bearer') {
            headers['Authorization'] = `Bearer ${miner.authToken}`
        }

        url = `${miner.url}/tx`

        const data = await axios.post(
            url,
            {
                rawtx: asString(rawTx),
                callbackUrl,
                callbackToken,
                merkleProof: !!callback,
                merkleFormat: 'TSC',
                dsCheck: !!callback
            },
            {
                headers,
                validateStatus: () => true
            }
        )
        
        if (!data) throw new ERR_BAD_REQUEST('no response object')

        const makeDescription = data => {
            const dd = data.data
            const errorData = {
                status: data.status,
                statusText: data.statusText,
                data: undefined
            }
            if (dd) try {
                errorData.data = JSON.parse(JSON.stringify(dd))
            } catch { /* */ }
            const description = JSON.stringify(errorData)
            return description
        }

        if (data.status !== 200 || !data.data) {
            throw new ERR_BAD_REQUEST(makeDescription(data))
        }

        mapi = data.data

        if (!mapi || data.data.message) throw new ERR_EXTSVS_MAPI_MISSING(makeDescription(data))
            
        const payload = getMapiPostTxPayload(mapi, txid)

        if (payload.conflictedWith) throw new ERR_EXTSVS_DOUBLE_SPEND(asString(txid), makeDescription(data))

        // TODO: This is a kludge. Protocol should encode this explicitly.
        // "resultDescription": "" | "Transaction already mined into block" | "Already known"
        const d = (payload?.resultDescription || '').toLowerCase()
        const alreadyMined = d.indexOf('already mined') > -1
        const alreadyKnown = alreadyMined || d.indexOf('already known') > -1
        
        if (alreadyMined) {
            // This transaction was previously broadcast and already exists in the block chain
            throw new ERR_EXTSVS_ALREADY_MINED(makeDescription(data))
        }

        if (payload.returnResult !== 'success') {
            if (payload.resultDescription === 'Missing inputs')
                throw new ERR_EXTSVS_DOUBLE_SPEND(asString(txid), makeDescription(data))
            throw new ERR_EXTSVS_INVALID_TRANSACTION(makeDescription(data))
        }

        const r: PostRawTxResultApi = {
            status: 'success',
            payload: payload,
            alreadyKnown,
            callbackID: callbackToken,
            name: miner.name,
            mapi: mapi
        }

        return r

    } catch (err: unknown) {
        return {
            status: 'error',
            error: new ERR_EXTSVS_FAILURE(url, CwiError.fromUnknown(err)),
            callbackID: callbackToken,
            name: miner.name,
            mapi
        }
    }
}
