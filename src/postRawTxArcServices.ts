import axios from 'axios'
import { Chain, CwiError, ERR_BAD_REQUEST, MapiResponseApi, asString, doubleSha256BE } from 'cwi-base'
import { MapiCallbackApi, PostRawTxResultApi } from './Api/CwiExternalServicesApi'
import { ERR_EXTSVS_ALREADY_MINED, ERR_EXTSVS_DOUBLE_SPEND, ERR_EXTSVS_FAILURE, ERR_EXTSVS_INVALID_TRANSACTION, ERR_EXTSVS_INVALID_TXID, ERR_EXTSVS_MAPI_MISSING } from './ERR_EXTSVS_errors'
import { checkMapiResponse, createMapiPostTxResponse, getMapiPostTxPayload } from './merchantApiUtils'

export interface PostTransactionArcMinerApi {
    name: string
    url: string
    authType: 'none' | 'bearer'
    authToken?: string
}

const mainArcMinerTaal: PostTransactionArcMinerApi = {
    name: 'Taal',
    url: 'https://api.taal.com/mapi',
    authType: 'bearer',
}

const testArcMinerTaal: PostTransactionArcMinerApi = {
    name: 'Taal',
    url: 'https://api.taal.com/mapi',
    authType: 'bearer',
}

export function postRawTxToTaal(txid: string | Buffer, rawTx: string | Buffer, chain: Chain, apiKey?: string) : Promise<PostRawTxResultApi> {
    const miner = {...(chain === 'main' ? mainArcMinerTaal : testArcMinerTaal)}
    if (apiKey)
        miner.authToken = apiKey
    return postRawTxToArcMiner(txid, rawTx, miner)
}

export async function postRawTxToArcMiner(txid: string | Buffer, rawTx: string | Buffer, miner: PostTransactionArcMinerApi)
: Promise<PostRawTxResultApi>
{

    let url = ''

    try {
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
                merkleFormat: 'TSC',
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


        if (data.data.message) throw new ERR_EXTSVS_MAPI_MISSING(makeDescription(data))
            
        // TODO: This is a kludge. Protocol should encode this explicitly.
        // "resultDescription": "" | "Transaction already mined into block" | "Already known"
        
        const r: PostRawTxResultApi = {
            status: 'success',
            name: miner.name,
        }

        return r

    } catch (err: unknown) {
        return {
            status: 'error',
            error: new ERR_EXTSVS_FAILURE(url, CwiError.fromUnknown(err)),
            name: miner.name,
        }
    }
}