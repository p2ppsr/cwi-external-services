import { Chain, CwiError, asBuffer, asString } from "cwi-base"
import { GetRawTxResultApi } from "../Api/CwiExternalServicesApi"
import axios from 'axios'

export async function getRawTxFromWhatsOnChain(txid: string | Buffer, chain: Chain): Promise<GetRawTxResultApi> {

    const r: GetRawTxResultApi = { name: 'WoC', txid: asString(txid) }

    try {
        const url = `https://api.whatsonchain.com/v1/bsv/${chain}/tx/${txid}/hex`
        const { data } = await axios.get(url)
        if (!data)
            return r

        r.rawTx = asBuffer(data)

    } catch (err: unknown) {
        r.error = { name: r.name, err: CwiError.fromUnknown(err) }
    }

    return r
}
