import { Transaction, TransactionOutput } from '@bsv/sdk'

import {
    Chain,
    CwiError, ERR_INTERNAL, ERR_INVALID_PARAMETER, ERR_MISSING_PARAMETER, ERR_TXID_INVALID,
    asBsvSdkTx, asString, doubleSha256BE
} from "cwi-base"

import {
    BsvExchangeRateApi,
    CwiExternalServicesApi, FiatExchangeRatesApi, GetMerkleProofResultApi, GetMerkleProofServiceApi, GetRawTxResultApi,
    GetRawTxServiceApi, GetScriptHistoryResultApi, GetScriptHistoryServiceApi, GetUtxoStatusOutputFormatApi, GetUtxoStatusResultApi,
    GetUtxoStatusServiceApi,
    MapiCallbackApi, PostRawTxResultApi, PostRawTxServiceApi, UpdateFiatExchangeRateServiceApi 
} from "./Api/CwiExternalServicesApi"

import { ServiceCollection } from "./ServiceCollection"

import { postRawTxToGorillaPool, postRawTxToTaal, postRawTxToWhatsOnChain } from "./postRawTxMapiServices"
import { getRawTxFromWhatsOnChain } from "./getRawTxServices"
import {
    getProofFromTaal, getProofFromWhatsOnChain, getProofFromWhatsOnChainTsc
} from "./getProofServices"
import { getScriptHistoryFromWhatsOnChain, getUtxoStatusFromWhatsOnChain } from "./getUtxoStatusServices"
import { updateBsvExchangeRate, updateChaintracksFiatExchangeRates, updateExchangeratesapi } from "./getExchangeRateServices"

export interface CwiExternalServicesOptions {
    mainTaalApiKey?: string
    testTaalApiKey?: string
    bsvExchangeRate: BsvExchangeRateApi
    bsvUpdateMsecs: number
    fiatExchangeRates: FiatExchangeRatesApi
    fiatUpdateMsecs: number
    disableMapiCallback?: boolean,
    exchangeratesapiKey?: string
    chaintracksFiatExchangeRatesUrl?: string
}

export class CwiExternalServices implements CwiExternalServicesApi {
    static createDefaultOptions() : CwiExternalServicesOptions {
        const o: CwiExternalServicesOptions = {
            mainTaalApiKey: "mainnet_9596de07e92300c6287e4393594ae39c", // Tone's key, no plan
            testTaalApiKey: "testnet_0e6cf72133b43ea2d7861da2a38684e3", // Tone's personal "starter" key
            bsvExchangeRate: {
                timestamp: new Date('2023-12-13'),
                base: "USD",
                rate: 47.52
            },
            bsvUpdateMsecs: 1000 * 60 * 15, // 15 minutes
            fiatExchangeRates: {
                timestamp: new Date('2023-12-13'),
                base: "USD",
                rates: {
                    "USD": 1,
                    "GBP": 0.8,
                    "EUR": 0.93
                }
            },
            fiatUpdateMsecs: 1000 * 60 * 60 * 24, // 24 hours
            disableMapiCallback: true, // Rely on DojoWatchman by default.
            exchangeratesapiKey: 'bd539d2ff492bcb5619d5f27726a766f',
            chaintracksFiatExchangeRatesUrl: `https://npm-registry.babbage.systems:8084/getFiatExchangeRates`
        }
        return o
    }

    options: CwiExternalServicesOptions

    getMerkleProofServices: ServiceCollection<GetMerkleProofServiceApi>
    getRawTxServices: ServiceCollection<GetRawTxServiceApi>
    postRawTxServices: ServiceCollection<PostRawTxServiceApi>
    getUtxoStatusServices: ServiceCollection<GetUtxoStatusServiceApi>
    getScriptHistoryServices: ServiceCollection<GetScriptHistoryServiceApi>
    updateFiatExchangeRateServices: ServiceCollection<UpdateFiatExchangeRateServiceApi>

    constructor(options?: CwiExternalServicesOptions) {
        this.options = options || CwiExternalServices.createDefaultOptions()
        
        this.getMerkleProofServices = new ServiceCollection<GetMerkleProofServiceApi>()
        .add({ name: 'WhatsOnChain', service: getProofFromWhatsOnChain})
        .add({ name: 'WhatsOnChainTsc', service: getProofFromWhatsOnChainTsc})
        //.add({ name: 'MetaStreme', service: getProofFromMetastreme})
        //.add({ name: 'GorillaPool', service: getProofFromGorillaPool})
        .add({ name: 'Taal', service: this.makeGetProofFromTaal() })
        
        this.getRawTxServices = new ServiceCollection<GetRawTxServiceApi>()
        .add({ name: 'WhatsOnChain', service: getRawTxFromWhatsOnChain})

        this.postRawTxServices = new ServiceCollection<PostRawTxServiceApi>()
        .add({ name: 'WhatsOnChain', service: postRawTxToWhatsOnChain })
        .add({ name: 'GorillaPool', service: postRawTxToGorillaPool })
        .add({ name: 'Taal', service: this.makePostRawTxToTaal() })
        
        this.getUtxoStatusServices = new ServiceCollection<GetUtxoStatusServiceApi>()
        .add({ name: 'WhatsOnChain', service: getUtxoStatusFromWhatsOnChain})
        
        this.getScriptHistoryServices = new ServiceCollection<GetScriptHistoryServiceApi>()
        .add({ name: 'WhatsOnChain', service: getScriptHistoryFromWhatsOnChain})

        this.updateFiatExchangeRateServices = new ServiceCollection<UpdateFiatExchangeRateServiceApi>()
        .add({ name: 'ChaintracksService', service: updateChaintracksFiatExchangeRates })
        .add({ name: 'exchangeratesapi', service: updateExchangeratesapi })
    }

    async getBsvExchangeRate(): Promise<number> {
        this.options.bsvExchangeRate = await updateBsvExchangeRate(this.options.bsvExchangeRate, this.options.bsvUpdateMsecs)
        return this.options.bsvExchangeRate.rate
    }

    async getFiatExchangeRate(currency: "USD" | "GBP" | "EUR", base?: "USD" | "GBP" | "EUR"): Promise<number> {
        const rates = await this.updateFiatExchangeRates(this.options.fiatExchangeRates, this.options.fiatUpdateMsecs)

        this.options.fiatExchangeRates = rates

        base ||= 'USD'
        const rate = rates.rates[currency] / rates.rates[base]

        return rate
    }

    targetCurrencies = ['USD', 'GBP', 'EUR']

    async updateFiatExchangeRates(rates?: FiatExchangeRatesApi, updateMsecs?: number): Promise<FiatExchangeRatesApi> {

        updateMsecs ||= 1000 * 60 * 15
        const freshnessDate = new Date(Date.now() - updateMsecs)
        if (rates) {
            // Check if the rate we know is stale enough to update.
            updateMsecs ||= 1000 * 60 * 15
            if (rates.timestamp > freshnessDate)
                return rates
        }

        // Make sure we always start with the first service listed (chaintracks aggregator)
        const services = this.updateFiatExchangeRateServices.clone()

        let r0: FiatExchangeRatesApi | undefined

        for (let tries = 0; tries < services.count; tries++) {
            const service = services.service
            try {
                const r = await service(this.targetCurrencies, this.options)
                if (this.targetCurrencies.every(c => typeof r.rates[c] === 'number')) {
                    r0 = r
                    break
                }
            } catch (eu: unknown) {
                const e = CwiError.fromUnknown(eu)
                console.log(`updateFiatExchangeRates servcice name ${service.name} error ${e.message}`)
            }
            services.next()
        }

        if (!r0) {
            console.error('Failed to update fiat exchange rates.')
            if (!rates) throw new ERR_INTERNAL()
            return rates
        }

        return r0
    }

    private taalApiKey(chain: Chain) {
         const key = chain === 'main' ? this.options.mainTaalApiKey : this.options.testTaalApiKey
         if (!key) throw new ERR_MISSING_PARAMETER(`options.${chain}TallApiKey`, 'valid')
         return key
    }

    private makePostRawTxToTaal() {
        return (txid: string | Buffer, rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi) => {
            return postRawTxToTaal(txid, rawTx, chain, callback, this.taalApiKey(chain))
        }
    }

    private makeGetProofFromTaal() {
        return (txid: string | Buffer, chain: Chain) => {
            return getProofFromTaal(txid, this.taalApiKey(chain))
        }
    }

    get getProofsCount() { return this.getMerkleProofServices.count }
    get getRawTxsCount() { return this.getRawTxServices.count }
    get postRawTxsCount() { return this.postRawTxServices.count }
    get getUtxoStatsCount() { return this.getUtxoStatusServices.count }

    async getUtxoStatus(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetUtxoStatusResultApi> {
        const services = this.getUtxoStatusServices
        if (useNext)
            services.next()

        let r0: GetUtxoStatusResultApi = { name: "<noservices>", status: "error", error: new ERR_INTERNAL('No services available.'), details: [] }

        for (let tries = 0; tries < services.count; tries++) {
            const service = services.service
            const r = await service(output, chain, outputFormat)
            if (r.status === 'success') {
                r0 = r
                break
            }
            services.next()
        }
        return r0
    }

    async getScriptHistory(output: string | Buffer, chain: Chain, outputFormat?: GetUtxoStatusOutputFormatApi, useNext?: boolean): Promise<GetScriptHistoryResultApi> {
        const services = this.getScriptHistoryServices
        if (useNext)
            services.next()

        let r0: GetScriptHistoryResultApi = { name: "<noservices>", status: "error", error: new ERR_INTERNAL('No services available.'), details: [] }

        for (let tries = 0; tries < services.count; tries++) {
            const service = services.service
            const r = await service(output, chain, outputFormat)
            if (r.status === 'success') {
                r0 = r
                break
            }
            services.next()
        }
        return r0
    }

    async verifyOutput(output: { outputScript: Buffer | null, amount: number | null }, chain: Chain) : Promise<boolean> {
        if (!output.outputScript || !output.amount) return false
        const r = await this.getUtxoStatus(output.outputScript, chain, 'script')
        let ok = false
        if (r.status === 'success' && r.isUtxo) {
            if (r.details.some(d => d.amount === output.amount)) {
                ok = true
            }
        }
        return ok
    }

    async postRawTx(rawTx: string | Buffer, chain: Chain, callback?: MapiCallbackApi): Promise<PostRawTxResultApi[]> {
        
        const txid = doubleSha256BE(rawTx)

        if (this.options.disableMapiCallback)
            callback = undefined

        return await Promise.all(this.postRawTxServices.allServices.map(async service => {
            const r = await service(txid, rawTx, chain, callback)
            return r
        }))
    }

    async getRawTx(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetRawTxResultApi> {
        
        if (useNext)
            this.getRawTxServices.next()

        const r0: GetRawTxResultApi = { txid: asString(txid) }

        for (let tries = 0; tries < this.getRawTxServices.count; tries++) {
            const service = this.getRawTxServices.service
            const r = await service(txid, chain)
            if (r.rawTx) {
                const hash = asString(doubleSha256BE(r.rawTx))
                // Confirm transaction hash matches txid
                if (hash === asString(txid)) {
                    // If we have a match, call it done.
                    r0.rawTx = r.rawTx
                    r0.name = r.name
                    break
                }
                r.error = { name: r.name, err: new ERR_TXID_INVALID() }
                r.rawTx = undefined
            }
            if (r.mapi && !r0.mapi)
                // If we have a mapi response and didn't before...
                r0.mapi = r.mapi
            if (r.error && !r0.error)
                // If we have an error and didn't before...
                r0.error = r.error

            this.getRawTxServices.next()
        }
        return r0
    }

    async getTransaction(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<Transaction> {
        const rawTx = await this.getRawTx(txid, chain, useNext)
        if (!rawTx.rawTx)
            throw new ERR_INVALID_PARAMETER('txid', `valid on ${chain}Net which has no transaction with txid ${txid}`)
        return asBsvSdkTx(rawTx.rawTx)
    }

    async getTransactionOutput(vout: number, txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<TransactionOutput> {
        const tx = await this.getTransaction(txid, chain, useNext)
        if (vout < 0 || vout >= tx.outputs.length)
            throw new ERR_INVALID_PARAMETER('vout', `in range 0..${tx.outputs.length - 1}`)
        return tx.outputs[vout]
    }

    async getMerkleProof(txid: string | Buffer, chain: Chain, useNext?: boolean): Promise<GetMerkleProofResultApi> {
        
        if (useNext)
            this.getMerkleProofServices.next()

        const r0: GetMerkleProofResultApi = {}

        for (let tries = 0; tries < this.getMerkleProofServices.count; tries++) {
            const service = this.getMerkleProofServices.service
            const r = await service(txid, chain)
            if (r.proof) {
                // If we have a proof, call it done.
                r0.proof = r.proof
                r0.name = r.name
                break
            }
            if (r.mapi && !r0.mapi)
                // If we have a mapi response and didn't before...
                r0.mapi = r.mapi
            if (r.error && !r0.error)
                // If we have an error and didn't before...
                r0.error = r.error

            this.getMerkleProofServices.next()
        }
        return r0
    }
}
