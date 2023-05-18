/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios'
import { Chain, CwiError, ERR_BAD_REQUEST, asString, bsv, crypto, randomBytesBase64 } from 'cwi-base'
import { MapiCallbackApi, PostRawTxResultApi } from './Api/CwiExternalServicesApi'
import { MapiResponseApi } from './Api/MerchantApi'

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

export async function postRawTxToGorillaPool(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi) : Promise<PostRawTxResultApi> {
    if (chain === 'test') return { name: 'GorillaPool', status: 'error', error: new ERR_BAD_REQUEST('GorillaPool does not support testNet.') }
    return await postRawTxToMapiMiner(rawTx, mainMapiMinerGorillaPool, callback)
}

export function postRawTxToTaal(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi, apiKey?: string) : Promise<PostRawTxResultApi> {
    const miner = {...(chain === 'main' ? mainMapiMinerTaal : testMapiMinerTaal)}
    if (apiKey)
        miner.authToken = apiKey
    return postRawTxToMapiMiner(rawTx, mainMapiMinerTaal, callback)
}

export async function postRawTxToMapiMiner(rawTx: string | Buffer, miner: PostTransactionMapiMinerApi, callback?: MapiCallbackApi): Promise<PostRawTxResultApi> {

    try {
        let callbackUrl: string | undefined = undefined
        let callbackToken: string | undefined = undefined

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
        const data = await axios.post(
            `${miner.url}/tx`,
            {
                rawtx: asString(rawTx),
                callbackUrl,
                callbackToken,
                merkleProof: true,
                merkleFormat: 'TSC',
                dsCheck: true
            },
            {
                headers,
                validateStatus: () => true
            }
        )
        
        const r: PostRawTxResultApi = {
            name: miner.name,
            status: data?.status === 200 ? 'success' : 'error',
            mapi: data.data ? (<MapiResponseApi>JSON.parse(data.data)) : undefined,
            callbackID: callbackToken
        }

        return r

    } catch (err: unknown) {
        return {
            name: miner.name,
            status: 'error',
            error: CwiError.fromUnknown(err)
        }
    }
}