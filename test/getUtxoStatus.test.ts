
import * as dotenv from 'dotenv';
import { getUtxoStatusFromWhatsOnChain } from '../src/getUtxoStatusServices';
 dotenv.config();

describe("getUtxoStatus", () => {

    test("WhatsOnChain valid script", async () => {
        const script = '76A9141401B7D9599A6ADDC95B8419688DFC5F1F6CEAC388AC'
        // const script = '76A91490C52A563D0D1E53A0FCDA9C1385C514EB36635288AC'
        const chain = 'test'
        const p = await getUtxoStatusFromWhatsOnChain(script, chain, 'script')
        expect(p).toBeTruthy()
        expect(p.name).toBe('WoC')
        expect(p.status).toBe('success')
        expect(p.isUtxo).toBe(true)
        expect(p.error).toBeUndefined()
    }, 100000)

    test("WhatsOnChain invalid script", async () => {
        const script = '76A914E7A03FA347DB9B9D9876F5515789DC7EA213A60288AC'
        //const script = '76A9148DAC1E33248179A104CBCE157C82C292DB1852AC88AC'
        //const script = '86A91490C52A563D0D1E53A0FCDA9C1385C514EB36635288AC'
        const chain = 'test'
        const p = await getUtxoStatusFromWhatsOnChain(script, chain, 'script')
        expect(p).toBeTruthy()
        expect(p.status).toBe('success')
        expect(p.isUtxo).toBe(false)
        expect(p.error).toBeUndefined()
    }, 100000)
})