import { ERR_BAD_REQUEST } from 'cwi-base';
import { CwiExternalServices } from '../src/CwiExternalServices';

describe("postRawTx.test", () => {
    const services: CwiExternalServices = new CwiExternalServices()

    test('postRawTx already mined testnet', async () => {
        const svcs = new CwiExternalServices({
            // Invalid api keys
            mainTaalApiKey: "mainnet_a596de07e92300c6287e4393594ae39c",
            testTaalApiKey: "testnet_0e6cf72133b43ea2d7861da2a38684e3"
        })
        const rawTx = '0200000002761d50a0a0078a1874862c1011ca6b084b2fe137c4f59bbdee6f6b97792c8e4f020000006a4730440220123eeab653ca5b5b5c1d5c315457facf05fb565ec1e708d0929650d60f40912702205654b3645e2cb98a84f5c7335f1b6255d1e93d8f66c918b6385ee09471f0b374412102faeb815c995772d071a7dd24c584dc10f9401790a816ce8ee02a69c9a77fe23afeffffff6c5ec011ea6ebac1194dd66bfae22821bf229ba03e98b4a7eb1c5f2466ca33bf000000008a47304402202b9361042b3af536347d324b04accfe1146e34a58b892c709418784a41c6b295022027507840ec381eade6c8b726b261bbad95a9daf6ac74622ea6ea5dfc7258e7574141047b18f712e04921b20480d28f70c8e1abecb7ba0f06d17b18e11b955427355a9f8c91fab08854d6607a297d8c9427f856699fe1c871bfc3a99f5fbdf6ae5cac21feffffff02e6e61b00000000001976a914cf99ea3fd68f8c50bace9795116acfb083da044f88acb00e4e02000000001976a914cfe18a551615d08e56463a3b027eddcb6218e00688ac2ec51700'
        const r = await svcs.postRawTx(rawTx, 'test', undefined)
        expect(r[1].status).toBe('error')
        expect(r[1].error).toEqual(new ERR_BAD_REQUEST('Unauthorized'))
    }, 300000)

    /**
     * GorillaPool fails testnet
     * taal mapi = {
     *  payload: "{\"apiVersion\":\"1.5.0\",\"timestamp\":\"2023-06-19T10:42:46.4935879Z\",\"txid\":\"b26e89a65a44e3de88cdcce966eb2a09321186f927cf463b980d1535024c4a25\",\"returnResult\":\"success\",\"resultDescription\":\"Transaction already mined into block\",\"minerId\":\"030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e\",\"currentHighestBlockHash\":\"00000000000004f3f65611cf65a2940263bcd74517eb206a70e9151220bf14be\",\"currentHighestBlockHeight\":1557812,\"txSecondMempoolExpiry\":0,\"failureRetryable\":false}",
     *  signature: "304402203b3df2131f56dcc7fa3daa6d6369e1ab9f74eefaccaa0ef35887ed97f5bd8c6102202779bb746bb3f80a1bfb8b8b5e589d8158a6e2d59724188a8e5c99c8003b6f60",
     *  publicKey: "030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e",
     *  encoding: "UTF-8",
     *  mimetype: "application/json",
     * }
     * payload.returnResult = 'success'
     * payload.resultDescription = 'Transaction already mined into block'
     */
    test('postRawTx already mined testnet', async () => {
        const rawTx = '0200000002761d50a0a0078a1874862c1011ca6b084b2fe137c4f59bbdee6f6b97792c8e4f020000006a4730440220123eeab653ca5b5b5c1d5c315457facf05fb565ec1e708d0929650d60f40912702205654b3645e2cb98a84f5c7335f1b6255d1e93d8f66c918b6385ee09471f0b374412102faeb815c995772d071a7dd24c584dc10f9401790a816ce8ee02a69c9a77fe23afeffffff6c5ec011ea6ebac1194dd66bfae22821bf229ba03e98b4a7eb1c5f2466ca33bf000000008a47304402202b9361042b3af536347d324b04accfe1146e34a58b892c709418784a41c6b295022027507840ec381eade6c8b726b261bbad95a9daf6ac74622ea6ea5dfc7258e7574141047b18f712e04921b20480d28f70c8e1abecb7ba0f06d17b18e11b955427355a9f8c91fab08854d6607a297d8c9427f856699fe1c871bfc3a99f5fbdf6ae5cac21feffffff02e6e61b00000000001976a914cf99ea3fd68f8c50bace9795116acfb083da044f88acb00e4e02000000001976a914cfe18a551615d08e56463a3b027eddcb6218e00688ac2ec51700'
        const r = await services.postRawTx(rawTx, 'test', undefined)
        expect(r[0].status).toBe('error')
    }, 300000)

    
    /**
     * GorillaPool:
     * payload.txid = ''
     * payload.returnResult = "failure"
     * payload.resultDescription = "ERROR: 257: txn-already-known"
     * 
     * Taal:
     * payload.returnResult = 'success'
     * payload.resultDescription = 'Transaction already mined into block'
     */
    test('postRawTx already mined mainnet', async () => {
        const rawTx = '01000000019deb84766cbd2baa2bdaf442fce9b1f592b5cea7e34b2603560cc954655c0fc2010000006b4830450221008ea78f75a8a9e8596d7ed0fc25248e1702c218b7e86375a8fa04a20227cb1a4502204228c2ab3abdc6a9b7cbdff08ac6d1657bb4d5c94ef6a2639375d16c2da46d8741210273cc96bde0fcc1f42e4d4be59e11e8e8872a0c148f89aba8c5497a5e9fafa824ffffffff0243170000000000001976a9144c01fae966c8da6f0d5bd46c29a4cc356220012988ac29740300000000001976a91476e4013eab1e39dd120bd698db2df2963573b51b88ac4d290c00'
        const r = await services.postRawTx(rawTx, 'main', undefined)
        expect(r[0].status).toBe('error')
    }, 300000)
})