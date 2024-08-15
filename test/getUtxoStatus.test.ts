import { getUtxoStatusFromWhatsOnChain } from '../src/status/getUtxoStatusServices';

describe("getUtxoStatus", () => {


    test.skip("WhatsOnChain valid script", async () => {
        // This test requires a real UTXO's locking script to pass.
        // At present, we don't have a UTXO parked for this purpose,
        // so update the script and re-enable to use this test.
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


    test("block 81,191 coinbase output", async () => {
        // On 2024-03-01 2000 BTC and BCH coinbase coins from around 2010 were moved by one transaction on each chain:
        // BTC txid 57029b1d8fdea8e4fec72fdd78f89b6d0630cadcc8c03de07e3736aff28ecc5a, block 81,191
        // BCH txid 2354fc029478991703a69adcf55d80b1986c0003106738c3f3192b9487ec5528
        // This is the BSV block 81,191 coinbase output script which is still a valid UTXO as of 2024-03-04 :-)
        const script = '4104b60f22689f4291dc0aa66454de8451f6cf775487d5319c2e3d9db46ee58ad40d4018a6e7b939977c02dbf264b5a1c7c35d0c5c884e4103a0ed5a7314f3ced6e9ac'
        const chain = 'main'
        const p = await getUtxoStatusFromWhatsOnChain(script, chain, 'script')
        expect(p).toBeTruthy()
        expect(p.name).toBe('WoC')
        expect(p.status).toBe('success')
        expect(p.isUtxo).toBe(true)
        expect(p.error).toBeUndefined()
    }, 100000)
})