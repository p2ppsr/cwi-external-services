import { getMerkleProofFromGorillaPool, getMerkleProofFromMetastreme, getMerkleProofFromTaal, getMerkleProofFromWhatsOnChain } from "../src/getMerkleProof";
import { verifyDojoTransactionProof } from "./verifyDojoTransactionProofs";

import * as dotenv from 'dotenv';
 dotenv.config();

describe("getMerkleProof", () => {
    const mainTaalApiKey = process.env.MAIN_TAAL_API_KEY || ''
    const testTaalApiKey = process.env.TEST_TAAL_API_KEY || ''
    const mainDojoConnection = process.env.MAIN_DOJO_CONNECTION || ''
    const testDojoConnection = process.env.TEST_DOJO_CONNECTION || ''

    // Testnet block 1,542,911 had 12 transactions:
    const txids = [
        '1bcc15d8acf763fb77680e3da14e756c3a1f0cdefb2a5e2f2126888b3eceb21e',
        'c87fb5d591d832120363d8c94e2cf1b881f71c1f2f3320e665645085ab7dd9de',
        '20d190db25281c4b516d64449d5a5d1ddd3f33091e756d3e49570be8d73f4d0c',
        '730c89c9b6c37e8bca618091edf606c65f826dfa9cba774cb8c5e87e0dcf149d',
        '4b02c1d971d7733181b4d9ba47035fa07c0ad8cb3dd44c928f8ff833c74df811',
        '1567821d221c1edf6f67d6c7a3157d8ca9f1ba642555891357d876915c9af7b5',
        '104e61659c42295e55014bcd06f0fcb03f865ab8e1050c6755243bea10bdc607',
        'aeb9a01ca088c306998cf94d7e51b55e2d129a60467eb65189abfad4b7130403',
        'a2d523a5f3d61411047a465ab55ec1f2b66d57358e69d008a002ffd8e8c7cb46',
        'cc783bf92566bc78367007e48cc6faf183096f7a4807027a3cf66b584dae6851',
        'fde05190cb57b4906a98788bea6c1c127af98f014d9ca155948c1431b35b8361',
        '9a4e38ace373720984d9f77dc2fd9dea0e8b660ac6b39ae49a7961621264ec34'
    ]

    const unknownTxid = 'fffe38ace373720984d9f77dc2fd9dea0e8b660ac6b39ae49a7961621264efff'

    test.skip("verify dojo transaction proofs", async () => {
        const r = await verifyDojoTransactionProof(mainDojoConnection, mainTaalApiKey, false)

        expect(r.disagreement).toBe(0)
        expect(r.failedCount).toBe(0)

    }, 400000)

    test.skip("verify staging_dojo transaction proofs", async () => {
        const r = await verifyDojoTransactionProof(testDojoConnection, testTaalApiKey, false)

        expect(r.disagreement).toBe(0)
        expect(r.failedCount).toBe(0)

    }, 400000)

    test("taal unknown txid", async () => {
            const p = await getMerkleProofFromTaal(unknownTxid, testTaalApiKey)
            expect(p).not.toBeTruthy()
    }, 100000)

    test.skip("gorillapool mainNet txid 9c31ed1dea4ec1aae0475addc0a74eaed68b718d9983d42b111c387d6696a949", async () => {
            const p = await getMerkleProofFromGorillaPool('9c31ed1dea4ec1aae0475addc0a74eaed68b718d9983d42b111c387d6696a949')
            expect(p).toBeTruthy()
            expect(p?.index).toBe(10)
    }, 100000)
    
    test("taal testNet txid d542b413afe17d5838e2ae5b7d47441a6d61eaeaa13f709e39133adbfc2ef19b", async () => {
            const p = await getMerkleProofFromTaal('d542b413afe17d5838e2ae5b7d47441a6d61eaeaa13f709e39133adbfc2ef19b', testTaalApiKey)
            expect(p).toBeTruthy()
            expect(p?.index).toBe(1)
    }, 100000)

    test("taal testNet txid fde05190cb57b4906a98788bea6c1c127af98f014d9ca155948c1431b35b8361", async () => {
            const p = await getMerkleProofFromTaal('fde05190cb57b4906a98788bea6c1c127af98f014d9ca155948c1431b35b8361', testTaalApiKey)
            expect(p).toBeTruthy()
            expect(p?.index).toBe(10)
    }, 100000)

    test("WhatsOnChain testNet txid fde05190cb57b4906a98788bea6c1c127af98f014d9ca155948c1431b35b8361", async () => {
            const p = await getMerkleProofFromWhatsOnChain('fde05190cb57b4906a98788bea6c1c127af98f014d9ca155948c1431b35b8361', 'test')
            expect(p).toBeTruthy()
            expect(p?.index).toBe(10)
    }, 100000)

    test("Metastreme testNet txid fde05190cb57b4906a98788bea6c1c127af98f014d9ca155948c1431b35b8361", async () => {
            const p = await getMerkleProofFromMetastreme('fde05190cb57b4906a98788bea6c1c127af98f014d9ca155948c1431b35b8361', 'test')
            expect(p).toBeTruthy()
            expect(p?.index).toBe(10)
    }, 100000)

    test("taal all 12 txs from a testnet block", async () => {
        for (let i = 0; i < txids.length; i++) {
            try {
                const p = await getMerkleProofFromTaal(txids[i], testTaalApiKey)
                expect(p).toBeTruthy()
                expect(p?.index).toBe(i)
            } catch (err) {
                console.log(`taal failed on i=${i}`)
                throw err
            }
            await new Promise(f => setTimeout(f, 500)) // Not too fast to avoid annoying the service.
        }
    }, 100000)

    test("WhatsOnChain all 12 txs from a testnet block", async () => {
        for (let i = 0; i < txids.length; i++) {
            const p = await getMerkleProofFromWhatsOnChain(txids[i], 'test')
            try {
                expect(p).toBeTruthy()
                expect(p?.index).toBe(i)
            } catch (err) {
                console.log(`woc failed on i=${i}`)
                throw err
            }
            await new Promise(f => setTimeout(f, 500)) // Not too fast to avoid annoying the service.
        }
    }, 100000)

    test("Metastreme all 12 txs from a testnet block", async () => {
        for (let i = 0; i < txids.length; i++) {
            const p = await getMerkleProofFromMetastreme(txids[i], 'test')
            try {
                expect(p).toBeTruthy()
                expect(p?.index).toBe(i)
            } catch (err) {
                console.log(`metastreme failed on i=${i}`)
                throw err
            }
            await new Promise(f => setTimeout(f, 500)) // Not too fast to avoid annoying the service.
        }
    }, 100000)
})