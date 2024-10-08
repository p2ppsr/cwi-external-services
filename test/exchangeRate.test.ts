import { CwiExternalServices, getExchangeRatesIo, updateChaintracksFiatExchangeRates } from "../src/index"

describe("exchangeRate Tests", () => {

    test("0_getBsvExchangeRate", async () => {
        const s = new CwiExternalServices()

        const r = await s.getBsvExchangeRate()

        expect(r).toBeGreaterThan(0)

    }, 9000000)

    test("1_getExchangeRatesIo", async () => {

        const o = CwiExternalServices.createDefaultOptions()
        const r = await getExchangeRatesIo(o.exchangeratesapiKey || '')

        expect(r.success).toBe(true)

    }, 9000000)

    test("2_updateFiatExchangeRates", async () => {

        const s = new CwiExternalServices()
        const r = await s.updateFiatExchangeRates()

        expect(r.timestamp > new Date(Date.now() - 1000 * 60 * 60 * 48)).toBe(true)
        expect(Object.keys(r.rates).length).toBe(3)
        expect(Math.abs(r.rates['USD'] - 1)).toBeLessThan(0.00001)
        expect(r.rates['EUR']).toBeGreaterThan(0)
        expect(r.rates['GBP']).toBeGreaterThan(0)

    }, 9000000)

    test("3_getFiatExchangeRate", async () => {
        const s = new CwiExternalServices()

        let r = await s.getFiatExchangeRate('EUR')
        expect(r).toBeGreaterThan(0)

        r = await s.getFiatExchangeRate('GBP')
        expect(r).toBeGreaterThan(0)

    }, 9000000)

    test("4_updateChaintracksFiatExchangeRates", async () => {

        const s = new CwiExternalServices()
        const r = await updateChaintracksFiatExchangeRates(s.targetCurrencies, s.options)

        expect(r.timestamp > new Date(Date.now() - 1000 * 60 * 60 * 48)).toBe(true)
        expect(Object.keys(r.rates).length).toBe(3)
        expect(Math.abs(r.rates['USD'] - 1)).toBeLessThan(0.00001)
        expect(r.rates['EUR']).toBeGreaterThan(0)
        expect(r.rates['GBP']).toBeGreaterThan(0)

    }, 9000000)

})