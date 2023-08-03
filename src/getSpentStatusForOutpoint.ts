import { Chain } from "cwi-base"
import axios from 'axios'
import crypto from 'crypto'

/**
 * Attempts to validate whether or not an outpoint has been spent by using the WhatsOnChain API
 * @param {string} outpoint 
 * @param {Chain} chain 
 * @returns {Promise<boolean>}
 */
export async function getSpentStatusForOutpoint(outpoint: string, chain: Chain): Promise<boolean> {

    // Get correct vout from 4 byte vout (todo: validate with Ty)
    function removeLeadingZeros(vout) {
        const withoutLeadingZeros = vout.replace(/^0+/, '');
        return withoutLeadingZeros === '' ? '0' : withoutLeadingZeros;
    }

    try {
        const txid: string = outpoint.substring(0, 64)
        const vout: number = removeLeadingZeros(outpoint.substring(64))
        // Get tx data from WoC
        // TODO: Add correct type for txData
        const txData = `https://api.whatsonchain.com/v1/bsv/${chain}/tx/hash/${txid}`
        const { data: rawTx } = await axios.get(txData)

        // Calculate the script hash for the given txid and vout
        const scriptHash = crypto.createHash('sha256').update(Buffer.from(rawTx.vout[vout].scriptPubKey.hex, 'hex')).digest().reverse().toString('hex')
        const url = `https://api.whatsonchain.com/v1/bsv/${chain}/script/${scriptHash}/history`
    
        const { data } = await axios.get(url)
        if (!data) {
            return false
        }

        // Validate that a spending txid exists that matches the outpoint
        for (const history of data) {
            if (history['tx_hash'] === txid && data.length > 1) {
               return true
            }
        }

    } catch (err: unknown) {
        console.log(err)
    }

    return false
}