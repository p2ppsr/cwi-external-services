import axios from 'axios'
import { Readable } from 'stream'
import { Chain, CwiError, ERR_BAD_REQUEST,  randomBytesHex } from 'cwi-base'
import { PostBeefResultApi } from '../Api/CwiExternalServicesApi'
import {
    ERR_EXTSVS_DOUBLE_SPEND,
    ERR_EXTSVS_FAILURE,
    ERR_EXTSVS_FEE,
    ERR_EXTSVS_GENERIC,
    ERR_EXTSVS_INVALID_TRANSACTION,
    ERR_EXTSVS_MERKLEROOT_INVALID,
    ERR_EXTSVS_SECURITY
} from '../base/ERR_EXTSVS_errors'

// Documentation:
// https://docs.taal.com/
// https://docs.taal.com/core-products/transaction-processing/arc-endpoints
// https://bitcoin-sv.github.io/arc/api.html

export const arcMinerTaalMainDefault: ArcMinerApi = {
    name: 'TaalArc',
    url: 'https://tapi.taal.com/arc',
}

export const arcMinerTaalTestDefault: ArcMinerApi = {
    name: 'TaalArc',
    url: 'https://arc-test.taal.com',
}

export interface ArcMinerPostBeefDataApi {
    status: number, // 200
    title: string, // "OK",
    extraInfo: string, // ""

    blockHash?: string, // ""
    blockHeight?: number, // 0
    competingTxs?: null,
    merklePath?: string, // ""
    timestamp?: string, // "2024-08-23T12:55:26.229904Z",
    txStatus?: string, // "SEEN_ON_NETWORK",
    txid?: string, // "272b5cdca9a0aa51846df9be29ee366ff85902691d38210e8c4be2fead3823a5",

    type?: string, // url
    detail?: string,
    instance?: string,
}


export async function postBeefToTaalArcMiner(
    beef: number[],
    chain: Chain,
    miner?: ArcMinerApi
)
: Promise<PostBeefResultApi>
{
    const m = miner || chain === 'main' ? arcMinerTaalMainDefault : arcMinerTaalTestDefault
    const r = await postBeefToArcMiner(beef, m)
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

    let r: PostBeefResultApi | undefined = undefined

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
                this.push(Buffer.from(beef))
                this.push(null)
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
        
        if (!data || !data.data || typeof data.data !== 'object')
            throw new ERR_BAD_REQUEST('no response data object')

        const dd = data.data as ArcMinerPostBeefDataApi

        r = makePostBeefResult(dd, miner, beef)

    } catch (err: unknown) {
        console.log(err)
        const error = new ERR_EXTSVS_FAILURE(url, CwiError.fromUnknown(err))
        r = makeErrorResult(error, miner, beef)
    }

    return r
}

export function makePostBeefResult(dd: ArcMinerPostBeefDataApi, miner: ArcMinerApi, beef: number[]) : PostBeefResultApi {
    let r: PostBeefResultApi
    switch (dd.status) {
        case 200: // Success
            r = makeSuccessResult(dd, miner, beef)
            break
        case 400: // Bad Request
            r = makeErrorResult(new ERR_BAD_REQUEST(), miner, beef, dd)
            break
        case 401: // Security Failed
            r = makeErrorResult(new ERR_EXTSVS_SECURITY(), miner, beef, dd)
            break
        case 409: // Generic Error
        case 422: // RFC 7807 Error
        case 460: // Not Extended Format
        case 467: // Mined Ancestor Missing
        case 468: // Invalid BUMPs
            r = makeErrorResult(new ERR_EXTSVS_GENERIC(dd.title), miner, beef, dd)
            break
        case 461: // Malformed Transaction
        case 463: // Malformed Transaction
        case 464: // Invalid Outputs
            r = makeErrorResult(new ERR_EXTSVS_INVALID_TRANSACTION(), miner, beef, dd)
            break
        case 462: // Invalid Inputs
            if (dd.txid)
                r = makeErrorResult(new ERR_EXTSVS_DOUBLE_SPEND(dd.txid, dd.title), miner, beef, dd)

            else
                r = makeErrorResult(new ERR_EXTSVS_GENERIC(dd.title), miner, beef, dd)
            break
        case 465: // Fee Too Low
        case 473: // Cumulative Fee Validation Failed
            r = makeErrorResult(new ERR_EXTSVS_FEE(), miner, beef, dd)
            break
        case 469: // Invalid Merkle Root
            r = makeErrorResult(new ERR_EXTSVS_MERKLEROOT_INVALID(), miner, beef, dd)
            break
        default:
            r = makeErrorResult(new ERR_EXTSVS_GENERIC(dd.title), miner, beef, dd)
            break
    }
    return r
}

function makeSuccessResult(
    dd: ArcMinerPostBeefDataApi,
    miner: ArcMinerApi,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    beef: number[]
): PostBeefResultApi {
    const r: PostBeefResultApi = {
        status: 'success',
        name: miner.name,
        alreadyKnown: !!dd.txStatus && ['SEEN_ON_NETWORK', 'MINED'].indexOf(dd.txStatus) >= 0,
        txid: dd.txid,
        blockHash: dd.blockHash,
        blockHeight: dd.blockHeight,
        merklePath: dd.merklePath,
        data: dd
    }
    return r
}

export function makeErrorResult(
    error: CwiError,
    miner: ArcMinerApi,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    beef: number[],
    dd?: ArcMinerPostBeefDataApi
): PostBeefResultApi {
    const r: PostBeefResultApi = {
        status: 'error',
        name: miner.name,
        error,
        data: dd
    }
    return r
}