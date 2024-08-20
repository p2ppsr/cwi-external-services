import axios from 'axios'
import { Readable } from 'stream'
import { Chain, CwiError, ERR_BAD_REQUEST,  ERR_NOT_IMPLEMENTED,  randomBytesHex } from 'cwi-base'
import {  PostBeefResultApi } from '../Api/CwiExternalServicesApi'
import {  ERR_EXTSVS_FAILURE,  ERR_EXTSVS_MAPI_MISSING } from '../base/ERR_EXTSVS_errors'

// Documentation:
// https://docs.taal.com/
// https://docs.taal.com/core-products/transaction-processing/arc-endpoints
// https://bitcoin-sv.github.io/arc/api.html

export const arcMinerTaalMainDefault: ArcMinerApi = {
    name: 'TaalArc',
    url: 'https://tapi.taal.com/arc',
}

export async function postBeefToTaalArcMiner(
    beef: number[],
    chain: Chain,
    miner?: ArcMinerApi
)
: Promise<PostBeefResultApi>
{
    if (chain === 'test' && !miner) throw new ERR_NOT_IMPLEMENTED()
    const r = await postBeefToArcMiner(beef, miner || arcMinerTaalMainDefault)
    return r
}

export interface ArcMinerApi {
    name: string
    url: string
    apiKey?: string
    deploymentId?: string
}

export async function postBeefToArcMiner(
    beef: number[],
    miner: ArcMinerApi
)
: Promise<PostBeefResultApi>
{
    const m = {...miner}

    let url = ''

    try {
        const length = beef.length

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
                this.push(beef)
            }
        })

        url = `${miner.url}/v1/tx`

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
        
        const r: PostBeefResultApi = {
            status: 'success',
            name: miner.name,
        }

        return r

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