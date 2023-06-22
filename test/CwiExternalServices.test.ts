import { CwiExternalServices } from '../src/CwiExternalServices'

describe('CwiExternalServices.test', () => {
    const services: CwiExternalServices = new CwiExternalServices()

    //beforeAll(async () => { })

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

})