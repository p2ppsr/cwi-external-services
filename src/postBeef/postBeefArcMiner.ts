import axios from 'axios'
import { Readable } from 'stream'
import { Chain, CwiError, ERR_BAD_REQUEST,  randomBytesHex } from 'cwi-base'
import { PostBeefResultApi, PostBeefResultForTxidApi } from '../Api/CwiExternalServicesApi'
import {
    ERR_EXTSVS_DOUBLE_SPEND,
    ERR_EXTSVS_FAILURE,
    ERR_EXTSVS_FEE,
    ERR_EXTSVS_GENERIC,
    ERR_EXTSVS_INVALID_TRANSACTION,
    ERR_EXTSVS_MERKLEROOT_INVALID,
    ERR_EXTSVS_SECURITY
} from '../base/ERR_EXTSVS_errors'
import { Beef } from '@bsv/sdk'

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
    beef: number[] | Beef,
    txids: string[],
    chain: Chain,
    miner?: ArcMinerApi
)
: Promise<PostBeefResultApi>
{
    const m = miner || chain === 'main' ? arcMinerTaalMainDefault : arcMinerTaalTestDefault

    const r1 = await postBeefToArcMiner(beef, txids, m)
    if (r1.status === 'success') return r1
    const datas: object = { r1: r1.data }

    const obeef = Array.isArray(beef) ? Beef.fromBinary(beef) : beef

    // 2024-12-15 Testing still fails to consistently accept multiple new transactions in one Beef.
    // Earlier testing seemed to confirm it worked. Did they break it??
    // This has to work eventually, but for now, break multiple new transactions into
    // individual atomic beefs and send them.
    // Clearly they updated their code since the atomic beef spec wasn't written until after
    // the original tests were done...
    {
        if (obeef.atomicTxid === undefined) {
            const abeef = obeef.toBinaryAtomic(txids[txids.length -1])
            const r2 = await postBeefToArcMiner(abeef, txids, m)
            datas['r2'] = r2.data
            r2.data = datas
            if (r2.status === 'success') return r2
        }
    }

    const r3: PostBeefResultApi = {
        name: m.name,
        status: 'success',
        data: {},
        txids: []
    }
    for (const txid of txids) {
        const ab = obeef.toBinaryAtomic(txid)
        const b = Beef.fromBinary(ab)
        const rt = await postBeefToArcMiner(b, [txid], m)
        if (rt.status === 'error') r3.status = 'error'
        r3.data![txid] = rt.data
        r3.txids.push(rt.txids[0])
    }
    datas['r3'] = r3.data
    r3.data = datas
    return r3
}

export interface ArcMinerApi {
    name: string
    url: string
    apiKey?: string
    deploymentId?: string
}

export async function postBeefToArcMiner(
    beef: number[] | Beef,
    txids: string[],
    miner: ArcMinerApi
)
: Promise<PostBeefResultApi>
{
    const m = {...miner}

    let url = ''

    let r: PostBeefResultApi | undefined = undefined
    let beefBinary = Array.isArray(beef) ? beef : beef.toBinary()
    beef = Array.isArray(beef) ? Beef.fromBinary(beef) : beef


    // HACK to resolve ARC error when row has zero leaves.
    beef.addComputedLeaves()
    beefBinary = beef.toBinary()

    try {
        const length = beefBinary.length

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
                this.push(Buffer.from(beefBinary as number[]))
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

        r = makePostBeefResult(dd, miner, beefBinary, txids)

    } catch (err: unknown) {
        console.log(err)
        const error = new ERR_EXTSVS_FAILURE(url, CwiError.fromUnknown(err))
        r = makeErrorResult(error, miner, beefBinary, txids)
    }

    return r
}

export function makePostBeefResult(dd: ArcMinerPostBeefDataApi, miner: ArcMinerApi, beef: number[], txids: string[]) : PostBeefResultApi {
    let r: PostBeefResultApi
    switch (dd.status) {
        case 200: // Success
            r = makeSuccessResult(dd, miner, beef, txids)
            break
        case 400: // Bad Request
            r = makeErrorResult(new ERR_BAD_REQUEST(), miner, beef, txids, dd)
            break
        case 401: // Security Failed
            r = makeErrorResult(new ERR_EXTSVS_SECURITY(), miner, beef, txids, dd)
            break
        case 409: // Generic Error
        case 422: // RFC 7807 Error
        case 460: // Not Extended Format
        case 467: // Mined Ancestor Missing
        case 468: // Invalid BUMPs
            r = makeErrorResult(new ERR_EXTSVS_GENERIC(dd.title), miner, beef, txids, dd)
            break
        case 461: // Malformed Transaction
        case 463: // Malformed Transaction
        case 464: // Invalid Outputs
            r = makeErrorResult(new ERR_EXTSVS_INVALID_TRANSACTION(), miner, beef, txids, dd)
            break
        case 462: // Invalid Inputs
            if (dd.txid)
                r = makeErrorResult(new ERR_EXTSVS_DOUBLE_SPEND(dd.txid, dd.title), miner, beef, txids, dd)

            else
                r = makeErrorResult(new ERR_EXTSVS_GENERIC(dd.title), miner, beef, txids, dd)
            break
        case 465: // Fee Too Low
        case 473: // Cumulative Fee Validation Failed
            r = makeErrorResult(new ERR_EXTSVS_FEE(), miner, beef, txids, dd)
            break
        case 469: // Invalid Merkle Root
            r = makeErrorResult(new ERR_EXTSVS_MERKLEROOT_INVALID(), miner, beef, txids, dd)
            break
        default:
            r = makeErrorResult(new ERR_EXTSVS_GENERIC(dd.title), miner, beef, txids, dd)
            break
    }
    return r
}

function makeSuccessResult(
    dd: ArcMinerPostBeefDataApi,
    miner: ArcMinerApi,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    beef: number[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    txids: string[]
): PostBeefResultApi {
    const r: PostBeefResultApi = {
        status: 'success',
        name: miner.name,
        data: dd,
        txids: []
    }
    for (let i = 0; i < txids.length; i++) {
        const rt: PostBeefResultForTxidApi = {
            txid: txids[i],
            status: 'success'
        }
        if (dd.txid === txids[i]) {
            rt.alreadyKnown = !!dd.txStatus && ['SEEN_ON_NETWORK', 'MINED'].indexOf(dd.txStatus) >= 0
            rt.txid = dd.txid
            rt.blockHash = dd.blockHash
            rt.blockHeight = dd.blockHeight
            rt.merklePath = dd.merklePath
        }
        r.txids.push(rt)
    }
    return r
}

export function makeErrorResult(
    error: CwiError,
    miner: ArcMinerApi,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    beef: number[],
    txids: string[],
    dd?: ArcMinerPostBeefDataApi
): PostBeefResultApi {
    const r: PostBeefResultApi = {
        status: 'error',
        name: miner.name,
        error,
        data: dd,
        txids: []
    }
    for (let i = 0; i < txids.length; i++) {
        const rt: PostBeefResultForTxidApi = {
            txid: txids[i],
            status: 'error'
        }
        if (dd?.txid === txids[i]) {
            rt.alreadyKnown = !!dd.txStatus && ['SEEN_ON_NETWORK', 'MINED'].indexOf(dd.txStatus) >= 0
            rt.txid = dd.txid
            rt.blockHash = dd.blockHash
            rt.blockHeight = dd.blockHeight
            rt.merklePath = dd.merklePath
        }
        r.txids.push(rt)
    }
    return r
}