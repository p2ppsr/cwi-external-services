import { ChainTracker } from "@bsv/sdk";
import { Chain, ChaintracksClientApi } from "cwi-base";
import { ChaintracksServiceClient } from "./ChaintracksServiceClient";

export class ChaintracksChainTracker implements ChainTracker {
    chaintracks: ChaintracksClientApi

    constructor(chain?: Chain, chaintracks?: ChaintracksClientApi) {

        chain ||= 'main'
        this.chaintracks = chaintracks ?? new ChaintracksServiceClient(chain, `https://npm-registry.babbage.systems:808${chain === 'main' ? '4' : '3'}`)
    }

    async isValidRootForHeight(root: string, height: number) : Promise<boolean> {

        const header = await this.chaintracks.findHeaderHexForHeight(height)
        if (!header)
            return false
        if (header.merkleRoot !== root)
            return false
        return true
    }
}