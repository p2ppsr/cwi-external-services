import axios from 'axios'
import { Readable } from 'stream'
import { CwiError, ERR_BAD_REQUEST,  asBuffer,  asString, randomBytesHex } from 'cwi-base'
import {  PostRawTxResultApi, RawTxForPost } from '../Api/CwiExternalServicesApi'
import {  ERR_EXTSVS_FAILURE,  ERR_EXTSVS_MAPI_MISSING } from '../base/ERR_EXTSVS_errors'

// Documentation:
// https://docs.taal.com/
// https://docs.taal.com/core-products/transaction-processing/arc-endpoints
// https://bitcoin-sv.github.io/arc/api.html

export interface PostTransactionArcMinerApi {
    name: string
    url: string
    apiKey?: string
    deploymentId?: string
}

export const defaultArcMinerTaal: PostTransactionArcMinerApi = {
    name: 'TaalArc',
    url: 'https://tapi.taal.com/arc',
}

export async function postRawTxToArcMiner(
    txid: string | Buffer,
    rawTx: string | Buffer,
    miner: PostTransactionArcMinerApi,
)
: Promise<PostRawTxResultApi>
{
    const r = (await postRawTxsToArcMiner([{ txid: asString(txid), rawTx: asBuffer(rawTx)}], miner))[0]
    return r
}

export async function postRawTxsToArcMiner(
    txs: RawTxForPost[],
    miner: PostTransactionArcMinerApi
)
: Promise<PostRawTxResultApi[]>
{
    const m = {...miner}

    let url = ''

    try {
        const length = txs.reduce((a, tx) => a + tx.rawTx.length, 0)

        const makeRequestHeaders = () => {
            const headers: Record<string, string> = {
                'Content-Type': 'application/octet-stream',
                'Content-Length': length.toString(),
                'XDeployment-ID': m.deploymentId || `cwi-external-services-${randomBytesHex(16)}`,
            }

            if (m.apiKey) {
                headers['Authorization'] = `Bearer ${m.apiKey}`
            }

            return headers
        }

        const headers = makeRequestHeaders()

        const stream = new Readable({
            read() {
                for (const tx of txs) {
                    this.push(tx.rawTx)
                }
            }
        })

        url = `${miner.url}/v1/txs`

        const data = await axios.post(
            url,
            stream,
            {
                headers,
                maxBodyLength: Infinity,
                validateStatus: () => true,
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

        return [r]

    } catch (err: unknown) {
        console.log(err)
        throw new ERR_EXTSVS_FAILURE(url, CwiError.fromUnknown(err))
        /*
        return {
            status: 'error',
            error: new ERR_EXTSVS_FAILURE(url, CwiError.fromUnknown(err)),
            name: miner.name,
        }
        */
    }
}