import { CwiExternalServices } from '../src/CwiExternalServices'

describe('CwiExternalServices.test', () => {
    const services: CwiExternalServices = new CwiExternalServices()

    //beforeAll(async () => { })

    test('testnet 3ab58b16e760915124b55bbcafb5ed941f6216222c40f4520071b022e7dc36ad', async () => {
        const txid = '3ab58b16e760915124b55bbcafb5ed941f6216222c40f4520071b022e7dc36ad'
        const r = await services.getMerkleProof(txid, 'test')
        expect(r).toBeTruthy()
    }, 300000)
})