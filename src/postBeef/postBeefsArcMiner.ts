import axios from 'axios'
import { Readable } from 'stream'
import { Chain, CwiError, ERR_BAD_REQUEST,  randomBytesHex } from 'cwi-base'
import { PostBeefResultApi } from '../Api/CwiExternalServicesApi'
import {
    ERR_EXTSVS_FAILURE,
} from '../base/ERR_EXTSVS_errors'
import { ArcMinerApi, ArcMinerPostBeefDataApi, arcMinerTaalMainDefault, arcMinerTaalTestDefault, makeErrorResult, makePostBeefResult } from './postBeefArcMiner'

// Documentation:
// https://docs.taal.com/
// https://docs.taal.com/core-products/transaction-processing/arc-endpoints
// https://bitcoin-sv.github.io/arc/api.html

export async function postBeefsToTaalArcMiner(
    beefs: number[][],
    txids: string[],
    chain: Chain,
    miner?: ArcMinerApi
)
: Promise<PostBeefResultApi[]>
{
    const m = miner || chain === 'main' ? arcMinerTaalMainDefault : arcMinerTaalTestDefault
    const r = await postBeefsToArcMiner(beefs, txids, m)
    return r
}

export async function postBeefsToArcMiner(
    beefs: number[][],
    txids: string[],
    miner: ArcMinerApi
)
: Promise<PostBeefResultApi[]>
{
    const m = {...miner}

    let url = ''

    const r: PostBeefResultApi[] = []

    try {
        const length = beefs.reduce((s, c) => s + c.length, 0)

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
                for (const beef of beefs)
                    this.push(Buffer.from(beef))
                this.push(null)
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
        
        if (!data || !data.data || typeof data.data !== 'object' || data.status !== 200)
            throw new ERR_BAD_REQUEST('no response data object')

        const dds = data.data as ArcMinerPostBeefDataApi[]

        let i = -1
        for (const dd of dds) {
            i++
            const beef = beefs[i]
            r.push(makePostBeefResult(dd, miner, beef, txids))
        }

    } catch (err: unknown) {
        console.log(err)
        const error = new ERR_EXTSVS_FAILURE(url, CwiError.fromUnknown(err))
        for (const beef of beefs) {
            r.push(makeErrorResult(error, miner, beef, txids))
        }
    }

    return r
}