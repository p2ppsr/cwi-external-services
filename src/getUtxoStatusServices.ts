import { Chain, CwiError, ERR_INTERNAL, ERR_INVALID_PARAMETER, asBuffer, asString, sha256Hash, swapByteOrder } from "cwi-base";
import { GetScriptHistoryResultApi, GetUtxoStatusOutputFormatApi, GetUtxoStatusResultApi } from "./Api/CwiExternalServicesApi";

import axios from 'axios'
import { ERR_EXTSVS_FAILURE } from "./ERR_EXTSVS_errors";

interface WhatsOnChainUtxoStatus {
    value: number
    height: number
    tx_pos: number
    tx_hash: string
}

export async function getUtxoStatusFromWhatsOnChain(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi)
: Promise<GetUtxoStatusResultApi>
{
    
    const r: GetUtxoStatusResultApi = { name: 'WoC', status: 'error', error: new ERR_INTERNAL(), details: [] }

    let url: string = ''

    try {
        
        const scriptHash = validateScriptHash(output, outputFormat)
        
        url = `https://api.whatsonchain.com/v1/bsv/${chain}/script/${scriptHash}/unspent`

        const { data } = await axios.get(url)
        
        if (Array.isArray(data)) {
            if (data.length === 0) {
                r.status = 'success'
                r.error = undefined
                r.isUtxo = false
            } else {
                r.status = 'success'
                r.error = undefined
                r.isUtxo = true
                for (const s of <WhatsOnChainUtxoStatus[]>data) {
                    r.details.push({
                        txid: s.tx_hash,
                        amount: s.value,
                        height: s.height,
                        index: s.tx_pos
                    })
                }
            }
        } else {
            throw new ERR_INTERNAL("data is not an array")
        }

    } catch (eu: unknown) {
        r.error = new ERR_EXTSVS_FAILURE(url, CwiError.fromUnknown(eu))
    }

    return r
}

interface WhatsOnChainScriptHistory {
    fee?: number
    height?: number
    tx_hash: string
}

export async function getScriptHistoryFromWhatsOnChain(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi)
: Promise<GetScriptHistoryResultApi>
{
    
    const r: GetScriptHistoryResultApi = { name: 'WoC', status: 'error', error: new ERR_INTERNAL(), details: [] }

    let url: string = ''

    try {
        
        const scriptHash = validateScriptHash(output, outputFormat)
        
        url = `https://api.whatsonchain.com/v1/bsv/${chain}/script/${scriptHash}/history`

        const { data } = await axios.get(url)
        
        if (Array.isArray(data)) {
            if (data.length === 0) {
                r.status = 'success'
                r.error = undefined
            } else {
                r.status = 'success'
                r.error = undefined
                for (const s of <WhatsOnChainScriptHistory[]>data) {
                    r.details.push({
                        txid: s.tx_hash,
                        height: s.height || undefined,
                        fee: s.fee
                    })
                }
            }
        } else {
            throw new ERR_INTERNAL("data is not an array")
        }

    } catch (eu: unknown) {
        r.error = new ERR_EXTSVS_FAILURE(url, CwiError.fromUnknown(eu))
    }

    return r
}

export function validateScriptHash(output: string | Buffer, outputFormat?: GetUtxoStatusOutputFormatApi) : string {
    let b = asBuffer(output)
    if (!outputFormat) {
        if (b.length === 32)
            outputFormat = 'hashLE'
        else
            outputFormat = 'script'
    }
    switch (outputFormat) {
        case 'hashBE':
            break;
        case 'hashLE':
            b = swapByteOrder(b)
            break;
        case 'script':
            b = sha256Hash(b).reverse()
            break;
        default:
            throw new ERR_INVALID_PARAMETER('outputFormat', `not be ${outputFormat}`)
    }
    return asString(b)
}
