/* eslint-disable @typescript-eslint/no-unused-vars */
import { ERR_EXTSVS_MAPI_SIGNATURE_INVALID, checkMapiResponse, signMapiPayload } from "../src/index"
import { BigNumber, Hash, PrivateKey, PublicKey, Signature } from "@bsv/sdk"

describe('checkMapiResponse tests', () => {
    test("0", () => {

        const response = {
            payload: '{"apiVersion":"1.5.0","timestamp":"2024-02-24T01:26:36.446271Z","txid":"f5b8d0c75d3182c7d844c89f95170fa8c83d5677211a8337b3857a7b6d5ddca3","returnResult":"success","resultDescription":"","minerId":"030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e","currentHighestBlockHash":"000000000000024c8353b69dde62a9db5c08551de35a1cbaf074d632052ae6ee","currentHighestBlockHeight":1598702,"txSecondMempoolExpiry":0,"warnings":[],"failureRetryable":false}',
            publicKey: '030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e',
            signature: '304402203d2a78353eed576632344c034b4b7e2b1c5b14b846ac706764d4b9b8729b9f50022019a6ec16f38b014065e3bba96bba944b596c84312a0b830f479a0fdbdaeac090'
        }

        checkMapiResponse(response)
    })

    test("1 verify signature", () => {

        const response = {
            payload: '{"apiVersion":"1.5.0","timestamp":"2024-02-24T01:26:36.446271Z","txid":"f5b8d0c75d3182c7d844c89f95170fa8c83d5677211a8337b3857a7b6d5ddca3","returnResult":"success","resultDescription":"","minerId":"030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e","currentHighestBlockHash":"000000000000024c8353b69dde62a9db5c08551de35a1cbaf074d632052ae6ee","currentHighestBlockHeight":1598702,"txSecondMempoolExpiry":0,"warnings":[],"failureRetryable":false}',
            publicKey: '030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e',
            signature: '304402203d2a78353eed576632344c034b4b7e2b1c5b14b846ac706764d4b9b8729b9f50022019a6ec16f38b014065e3bba96bba944b596c84312a0b830f479a0fdbdaeac090'
        }

        const payloadHashHex = "77cfabb194790bb31f1046fa45577293e1ace4948f65614cba4855bc4b7295f5"

        const payloadHash = new Hash.SHA256().update(response.payload, 'utf8').digestHex()
        expect(payloadHash).toBe(payloadHashHex)

        const payloadHashA = new Hash.SHA256().update(response.payload, 'utf8').digest()

        const publicKey = PublicKey.fromString(response.publicKey)

        const signature = Signature.fromDER(response.signature, 'hex')

        const r = new BigNumber("27666120985365728732830733612542644580363873181294202133567737832944239877968")
        const s = new BigNumber("11602747258239610928409030363373135677575889911601477873200512190137986891920")
        expect(signature.r.toString()).toBe(r.toString())
        expect(signature.s.toString()).toBe(s.toString())

        const ok = publicKey.verify(response.payload, signature, 'utf8')
        expect(ok).toBe(true)

        checkMapiResponse(response)

        response.payload = 'fred'
        expect(() => checkMapiResponse(response)).toThrow(new ERR_EXTSVS_MAPI_SIGNATURE_INVALID())
    })

    test("2 sign payload", () => {

        const privKeyHex = '3333333333333333333333333333333333333333333333333333333333333333'

        const privKey = PrivateKey.fromString(privKeyHex, 'hex')
        const pubKey = privKey.toPublicKey()
        const pubKeyHex = pubKey.toString()
        
        const response = {
            payload: '{"apiVersion":"1.5.0","timestamp":"2024-02-24T01:26:36.446271Z","txid":"f5b8d0c75d3182c7d844c89f95170fa8c83d5677211a8337b3857a7b6d5ddca3","returnResult":"success","resultDescription":"","minerId":"030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e","currentHighestBlockHash":"000000000000024c8353b69dde62a9db5c08551de35a1cbaf074d632052ae6ee","currentHighestBlockHeight":1598702,"txSecondMempoolExpiry":0,"warnings":[],"failureRetryable":false}',
            publicKey: "023c72addb4fdf09af94f0c94d7fe92a386a7e70cf8a1d85916386bb2535c7b1b1",
            signature: "3045022100a189530d9be17f267247addc2c944002fafc5ff7694a9433ccfadc6c34f9029702207229789af23145c728be520847abb038b909ff14b1232288b5d6a0e3a4fbdff2"
        }
        expect(pubKeyHex).toBe(response.publicKey)

        const signature = signMapiPayload(response.payload, privKeyHex)
        expect(signature).toBe(response.signature)


        const payloadHashHex = "77cfabb194790bb31f1046fa45577293e1ace4948f65614cba4855bc4b7295f5"
        const payloadHash = new Hash.SHA256().update(response.payload, 'utf8').digestHex()
        expect(payloadHash).toBe(payloadHashHex)

        const signature2 = privKey.sign(response.payload, 'utf8').toDER('hex')
        expect(signature2).toBe(response.signature)

    })
})