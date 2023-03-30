import { asBuffer, asString, BlockHeader, ChaintracksClientApi, computeRootFromMerkleProofNodes, doubleSha256HashLE, readVarUint32LE } from "@cwi/base";
import { TscMerkleProofApi } from "./Api/MerchantApi";

/**
 * Implement merkle proof per https://tsc.bitcoinassociation.net/standards/merkle-proof-standardised-format/
 *
 * We extend the current standard by implementing targetType 'height' (binary value 3).
 * This extension avoids the need to maintain a merkleroot or block hash index for all headers,
 * reducing the space required by 50%.
 * 
 * Other extensions are not currently supported.
 *
 * Supports partial and full binary format as well as hex strings.
 * 
 * External Assumptions:
 * 1. The raw transaction is in-hand and is either duplicated in the proof or matches the starting hash
 *    used to evaluate the merkle tree branch.
 * 
 * Checking the proof verifies these claims:
 * 1. The merkleRoot determined by the targetType is confirmed to match a block header on the active chain.
 * 2. Computing a merkleRoot value starting with the transaction hash, using the proof nodes yields a
 *    match for the target value.
 * 
 * Implications:
 * 1. The transaction in-hand is valid and was included in a block on the active chain.
 * 
 * @param txid the transaction hash of the in-hand transaction to which this proof applies.
 * @param proof
 * @returns The block header containing the verified merkleRoot
 */
export async function checkMerkleProof(txid: string | Buffer, proof: TscMerkleProofApi | Buffer, chaintracks: ChaintracksClientApi): Promise<BlockHeader> {

    const proofIsBuffer = Buffer.isBuffer(proof);

    let p: TscMerkleProofApi = { index: 0, txOrId: '', target: '', nodes: [] };

    const txidMustMatch = async (proofTxid: string | Buffer) => {
        if (asString(txid) !== asString(proofTxid))
            throw new Error(`Expected txid ${asString(txid)} doesn't match proof txid ${asString(proofTxid)}`)
    }

    let header: BlockHeader | undefined

    const merkleRootMustBeActive = async (merkleRoot: string | Buffer) => {
        header = await chaintracks.findHeaderForMerkleRoot(asBuffer(merkleRoot))
        if (!header) throw new Error(`MerkleRoot ${asString(merkleRoot)} was not found in active chain.`)
    }

    if (proofIsBuffer) {
        let offset = 0;
        const flags = proof[offset++];
        ({ val: p.index, offset } = readVarUint32LE(proof, offset));
        const isTxId = (flags & 1) === 0;
        if (isTxId) {
            p.txOrId = proof.subarray(offset, offset + 32);
            offset += 32;
        } else {
            let txLength = 0;
            ({ val: txLength, offset } = readVarUint32LE(proof, offset));
            p.txOrId = doubleSha256HashLE(proof.subarray(offset, offset + txLength));
            offset += txLength;
        }
        txidMustMatch(p.txOrId)
        const targetType = (flags & 6) >> 1;
        switch (targetType) {
            case 0: { // block hash
                const blockHash = proof.subarray(offset, offset + 32).reverse();
                offset += 32;
                header = await chaintracks.findHeaderForBlockHash(blockHash)
                if (!header)
                    throw new Error(`Header for block hash ${blockHash} was not found.`);
                p.target = header.merkleRoot
            } break;
            case 1: // block header
                // pull out just the merkle root of the header
                p.target = proof.subarray(offset + 36, offset + 68).reverse();
                offset += 80;
                await merkleRootMustBeActive(p.target)
                break;
            case 2: // merkle root
                p.target = proof.subarray(offset, offset + 32).reverse();
                offset += 32;
                await merkleRootMustBeActive(p.target)
                break;
            case 3: { // height - This is our own proof standard extension for now...
                let height = 0;
                ({ val: height, offset } = readVarUint32LE(proof, offset));
                header = await chaintracks.findHeaderForHeight(height)
                if (!header) throw new Error(`No header found matching height ${height}`)
                p.target = header.merkleRoot
            } break;
            default:
                throw new Error(`Unsupported target type. ${targetType}`);
        }
        let nodeCount = 0;
        ({ val: nodeCount, offset } = readVarUint32LE(proof, offset));
        // parse nodes to compute and validate length
        let nodesLength = 0;
        for (let i = 0; i < nodeCount; i++) {
            const nodeType = proof[offset + nodesLength++];
            switch (nodeType) {
                case 0: // 32 byte hash
                    nodesLength += 32;
                    break;
                case 1: // duplicate, no extra value needed
                    break;
                case 2: // index (extension format), probably a varint for length + that many bytes...
                    throw new Error(`Unsupported node type. ${nodeType}`);
                default:
                    throw new Error(`Unsupported node type. ${nodeType}`);
            }
        }
        p.nodes = proof.subarray(offset, offset + nodesLength);
        offset += nodesLength;
        if (offset !== proof.length)
            throw new Error("Probable proof parsing error.");
    } else {
        p = { ...proof };
        if (p.proofType === "tree")
            throw new Error("'tree' proofType is not currently supported.");
        if (p.composite === true)
            throw new Error("Composite proofs are not currently supported.");

        // p.txOrId
        // Convert hex to buffer.
        p.txOrId = asBuffer(p.txOrId)
        // Convert full tx to txId
        if (p.txOrId.length > 32)
            p.txOrId = doubleSha256HashLE(p.txOrId);
        txidMustMatch(p.txOrId)

        // p.target, p.targetType
        switch (p.targetType) {
            case "header":
                // pull out just the merkle root of the header
                p.target = asBuffer(p.target).subarray(36, 68).reverse();
                await merkleRootMustBeActive(p.target)
                break;
            case "merkleRoot":
                // no action needed
                p.target = asBuffer(p.target)
                await merkleRootMustBeActive(p.target)
                break;
            case "height": {
                const height = Number(p.target)
                header = await chaintracks.findHeaderForHeight(height)
                if (!header) throw new Error(`No header found matching height ${height}`)
                p.target = header.merkleRoot
            } break;
            case "hash":
            default:
                header = await chaintracks.findHeaderForBlockHash(asBuffer(p.target))
                if (!header)
                    throw new Error(`Header for block hash ${p.target} was not found.`);
                p.target = header.merkleRoot
                break;
        }
        p.targetType = "merkleRoot";

        // p.nodes
        // must be string[], no action needed
    }
    const computedRoot = computeRootFromMerkleProofNodes(p.index, p.txOrId, p.nodes);

    if (!computedRoot.equals(p.target))
        throw new Error(`Computed root ${asString(computedRoot)} doesn't equal expected root ${asString(p.target)}`)

    if (!header)
        throw new Error('Failed to retrieve active chain header containing target merkleRoot')
    
    return header
}
