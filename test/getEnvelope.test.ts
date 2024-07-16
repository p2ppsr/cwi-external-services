import { toBEEFfromEnvelope } from "../../babbage-sdk-ts/src"
import { toEnvelopeFromBEEF } from "../../babbage-sdk-ts/src/utils/toBEEF"
import { CwiExternalServices, getEnvelopeForTransaction } from "../src"

describe('getEnvelope tests', () => {
    jest.setTimeout(99999999)

    test('0_getEnvelope of mined transaction', async () => {
        const services = new CwiExternalServices()

        {
            const txid = '560df5f44c22d32fa0a3031cee7ad1d87df032a6722c9484dce603ae1a7b618c'
            const r = await getEnvelopeForTransaction(services, 'main', txid)

            expect(r.depth).toBe(0)
            expect(r.proof).toBeTruthy()
            expect(r.rawTx).toBeTruthy()
            expect(r.txid).toBe(txid)
        }
        
    })

    test('1_getEnvelope of unmined transaction', async () => {
        const services = new CwiExternalServices()

        {
            // Must be updated to an unmined transaction txid...
            const txid = 'f2a0702ccbd715cdda5d7ed63e9dce9c1c38608b093cd250863a1704370c15e0'
            const r = await getEnvelopeForTransaction(services, 'main', txid)

            expect(r.depth).toBeGreaterThan(0)
            expect(r.proof).not.toBeTruthy()
            expect(r.rawTx).toBeTruthy()
            expect(r.txid).toBe(txid)
            expect(r.inputs).toBeTruthy()

            const beef = toBEEFfromEnvelope(r)

            const envelope = toEnvelopeFromBEEF(beef.beef)

            expect(envelope.depth).toBeGreaterThan(0)
            expect(envelope.proof).not.toBeTruthy()
            expect(envelope.rawTx).toBeTruthy()
            expect(envelope.txid).toBe(txid)
            expect(envelope.inputs).toBeTruthy()

        }
        
    })
})