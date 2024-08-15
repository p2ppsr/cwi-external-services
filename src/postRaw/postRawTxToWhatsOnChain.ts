import axios from 'axios'
import { Chain, CwiError, ERR_BAD_REQUEST, asString, doubleSha256BE } from 'cwi-base'
import { MapiCallbackApi, PostRawTxResultApi } from '../Api/CwiExternalServicesApi'
import { ERR_EXTSVS_FAILURE, ERR_EXTSVS_INVALID_TXID } from '../base/ERR_EXTSVS_errors'
import { checkMapiResponse, createMapiPostTxResponse } from '../base/merchantApiUtils'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function postRawTxToWhatsOnChain(txid: string | Buffer | undefined, rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi)
: Promise<PostRawTxResultApi>
{
    let url: string = ''

    try {

        if (!txid) txid = doubleSha256BE(rawTx)
        txid = asString(txid)

        const headers = {
            'Content-Type': 'application/json'
        }
        url = `https://api.whatsonchain.com/v1/bsv/${chain}/tx/raw`

        const key = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        const { mapi, payloadData } = createMapiPostTxResponse(txid, key, `Accepted by ${url}`)
        checkMapiResponse(mapi)
            
        const data = await axios.post(
            url,
            {
                txHex: asString(rawTx)
            },
            {
                headers,
                validateStatus: () => true
            }
        )
        
        // { status: 200, statusText: 'OK', data: 'txid' }
        // { status: 400, statusText: 'Bad Request', data: 'unexpected response code 500: Missing inputs' }
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

        const r: PostRawTxResultApi = {
            status: 'success',
            payload: payloadData,
            alreadyKnown: undefined,
            callbackID: undefined,
            name: 'WoC',
            mapi: mapi
        }

        if (data.status !== 200 || !data.data) {
            const error = new ERR_BAD_REQUEST(makeDescription(data))
            if (-1 < error.description.indexOf("txn-already-known")) {
                r.alreadyKnown = true
                return r
            }
            throw error
        }

        const txidR = <string>data.data
        
        if (txidR != txid) throw new ERR_EXTSVS_INVALID_TXID(makeDescription(data))

        // This transaction was previously broadcast and already exists in the block chain
        // throw new ERR_EXTSVS_ALREADY_MINED(payload.resultDescription)

        // throw new ERR_EXTSVS_INVALID_TRANSACTION(payload.resultDescription)

        return r

    } catch (err: unknown) {
        return {
            status: 'error',
            error: new ERR_EXTSVS_FAILURE(url, CwiError.fromUnknown(err)),
            callbackID: undefined,
            name: 'WoC',
            mapi: undefined
        }
    }
}