import { GetMerkleProofResultApi } from '../src/Api/CwiExternalServicesApi'
import { CwiExternalServices } from '../src/CwiExternalServices'

describe('CwiExternalServices.test', () => {
    const services: CwiExternalServices = new CwiExternalServices()

    //beforeAll(async () => { })

    test('getMerkleProof mainnet 461e9163247cf967df672845595e6294231f5e2a0159f45cb2c92669b7a2a062', async () => {
        const txid = '461e9163247cf967df672845595e6294231f5e2a0159f45cb2c92669b7a2a062'
        const count = services.getProofsCount
        const rs: GetMerkleProofResultApi[] = []
        for (let i = 0; i < count; i++) {
            const r = await services.getMerkleProof(txid, 'main', true)
            expect(r).toBeTruthy()
            rs.push(r)
        }
    }, 300000)

    test('getMerkleProof testnet 3ab58b16e760915124b55bbcafb5ed941f6216222c40f4520071b022e7dc36ad', async () => {
        const txid = '3ab58b16e760915124b55bbcafb5ed941f6216222c40f4520071b022e7dc36ad'
        const r = await services.getMerkleProof(txid, 'test')
        expect(r).toBeTruthy()
    }, 300000)

    test('getRawTx mainnet ab9d515f6b9d78f535e2e7c942c9c1d650c299059e8828967f529f5ba0a52ab2', async () => {
        const txid = 'ab9d515f6b9d78f535e2e7c942c9c1d650c299059e8828967f529f5ba0a52ab2'
        const r = await services.getRawTx(txid, 'main')
        expect(Buffer.isBuffer(r.rawTx)).toBe(true)
        expect(r.rawTx?.length).toBe(244)
    }, 300000)

    test('getUtxoStatus', async () => {
        const script = '76A91490C52A563D0D1E53A0FCDA9C1385C514EB36635288AC'
        const chain = 'test'
        const p = await services.getUtxoStatus(script, chain)
        expect(p).toBeTruthy()
        expect(p.name).toBe('WoC')
        expect(p.status).toBe('success')
        expect(p.isUtxo).toBe(true)
        expect(p.error).toBeUndefined()
    }, 300000)
})