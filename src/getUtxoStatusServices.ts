import { Chain, CwiError, ERR_INTERNAL, ERR_INVALID_PARAMETER, asBuffer, asString, sha256Hash, swapByteOrder } from "cwi-base";
import { GetUtxoStatusOutputFormatApi, GetUtxoStatusResultApi } from "./Api/CwiExternalServicesApi";

import axios from 'axios'

interface WhatsOnChainUtxoStatus {
    value: number
    height: number
    tx_pos: number
    tx_hash: string
}

export async function getUtxoStatusFromWhatsOnChain(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi)
: Promise<GetUtxoStatusResultApi>
{
    
    const r: GetUtxoStatusResultApi = { name: 'WoC', status: 'error', error: new ERR_INTERNAL() }

    try {
        
        const scriptHash = validateScriptHash(output, outputFormat)
        
        const url = `https://api.whatsonchain.com/v1/bsv/${chain}/script/${scriptHash}/unspent`

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
                r.txid = []
                r.amount = []
                r.height = []
                r.index = []
                for (const s of <WhatsOnChainUtxoStatus[]>data) {
                    r.txid.push(s.tx_hash)
                    r.amount.push(s.value)
                    r.height.push(s.height)
                    r.index.push(s.tx_pos)
                }
            }
        } else {
            r.error = new ERR_INTERNAL(`Unexpected response from service url ${url}`)
        }

    } catch (eu: unknown) {
        r.error = CwiError.fromUnknown(eu)
    }

    return r
}

function validateScriptHash(output: string | Buffer, outputFormat?: GetUtxoStatusOutputFormatApi) : string {
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
