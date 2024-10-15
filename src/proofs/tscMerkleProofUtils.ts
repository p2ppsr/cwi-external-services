import { asBuffer, asString, doubleSha256HashLE, ERR_BAD_REQUEST, ERR_INTERNAL, readVarUint32LE, TscMerkleProofApi, writeVarUint32LE } from "cwi-base";
import { ERR_EXTSVS_MERKLEPROOF_NODE_TYPE, ERR_EXTSVS_MERKLEPROOF_PARSING, ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE, ERR_EXTSVS_TXID_INVALID } from "../base/ERR_EXTSVS_errors";

/**
 * Convert JSON style TSC Merkle Proof to standard binary format.
 * @param proof 
 * @returns 
 */
export function serializeTscMerkleProof(proof: TscMerkleProofApi): Buffer {
    let flags = 0
    let maxLen = 1 + 5 // flag, index 
    const txOrId = asBuffer(proof.txOrId)
    if (txOrId.length === 32) {
        maxLen += 32
    } else {
        maxLen += 5 + txOrId.length
        flags |= 1
    }
    let target: Buffer
    switch (proof.targetType) {
        case "height":
            flags |= 6
            target = Buffer.alloc(5)
            target = target.subarray(0, writeVarUint32LE(Number(asString(proof.target)), target, 0))
            maxLen += target.length
            break
        case "merkleRoot":
            flags |= 4
            maxLen += 32
            target = Buffer.from(asBuffer(proof.target)).reverse()
            if (32 !== target.length) throw Error(`Unexpected merleRoot target length ${target.length}`)
            break
        case "header":
            flags |= 2
            maxLen += 80
            target = asBuffer(proof.target)
            if (80 !== target.length) throw Error(`Unexpected header target length ${target.length}`)
            break
        case "hash":
        default:
            maxLen += 32
            target = Buffer.from(asBuffer(proof.target)).reverse()
            if (32 !== target.length) throw Error(`Unexpected hash target length ${target.length}`)
            break
    }
    const buffer = Buffer.alloc(maxLen)
    let offset = 0
    buffer[offset++] = flags
    offset = writeVarUint32LE(proof.index, buffer, offset)
    if (txOrId.length !== 32)
        offset = writeVarUint32LE(txOrId.length, buffer, offset)
    txOrId.copy(buffer, offset, 0, txOrId.length); offset += txOrId.length
    target.copy(buffer, offset, 0, target.length); offset += target.length
    offset = writeVarUint32LE(proof.nodes.length, buffer, offset)
    return Buffer.concat([buffer.subarray(0, offset), serializeTscMerkleProofNodes(proof.nodes)])
}

export function serializeTscMerkleProofNodes(nodes: Buffer | string[]): Buffer {
    if (Buffer.isBuffer(nodes)) {
        return nodes
    }
    const buffer = Buffer.alloc(nodes.length * 33)
    let offset = 0
    for (const node of nodes) {
        if (node === "*") {
            buffer[offset++] = 1
        } else {
            buffer[offset++] = 0
            asBuffer(node).copy(buffer, offset, 0, 32)
            offset += 32
        }
    }
    return buffer.subarray(0, offset)
}

export function deserializeTscMerkleProof(txid: string, buffer: TscMerkleProofApi | Buffer): TscMerkleProofApi {
    if (!Buffer.isBuffer(buffer))
        return buffer

    const p: TscMerkleProofApi = {
        index: 0,
        txOrId: "",
        target: "",
        nodes: []
    }

    const txidMustMatch = async (proofTxid: string | Buffer) => {
        if (asString(txid) !== asString(proofTxid))
            throw new ERR_EXTSVS_TXID_INVALID(asString(txid), asString(proofTxid))
    }

    let offset = 0;
    const flags = buffer[offset++];
    ({ val: p.index, offset } = readVarUint32LE(buffer, offset));
    const isTxId = (flags & 1) === 0;
    if (isTxId) {
        p.txOrId = buffer.subarray(offset, offset + 32);
        offset += 32;
    } else {
        let txLength = 0;
        ({ val: txLength, offset } = readVarUint32LE(buffer, offset));
        p.txOrId = doubleSha256HashLE(buffer.subarray(offset, offset + txLength));
        offset += txLength;
    }
    txidMustMatch(p.txOrId)
    const targetType = (flags & 6) >> 1;
    switch (targetType) {
        case 0: { // block hash
            p.targetType = 'hash'
            const blockHash = buffer.subarray(offset, offset + 32).reverse();
            p.target = asString(blockHash)
            offset += 32;
        } break;
        case 1: { // block header
            // pull out just the merkle root of the header
            p.targetType = 'merkleRoot'
            const merkleRoot = buffer.subarray(offset + 36, offset + 68).reverse();
            offset += 80;
            p.target = asString(merkleRoot)
        } break;
        case 2: { // merkle root
            p.targetType = 'merkleRoot'
            const merkleRoot = buffer.subarray(offset, offset + 32).reverse();
            offset += 32;
            p.target = asString(merkleRoot)
        } break;
        case 3: { // height - This is our own proof standard extension for now...
            p.targetType = 'height'
            let height = 0;
            ({ val: height, offset } = readVarUint32LE(buffer, offset));
            p.target = '' + height
        } break;
        default:
            throw new ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE(targetType)
    }
    let nodeCount = 0;
    ({ val: nodeCount, offset } = readVarUint32LE(buffer, offset));
    // parse nodes to compute and validate length
    let nodesLength = 0;
    p.nodes = []
    for (let i = 0; i < nodeCount; i++) {
        const nodeType = buffer[offset + nodesLength++];
        switch (nodeType) {
            case 0: // 32 byte hash
                p.nodes.push(asString(buffer.subarray(offset + nodesLength, offset + nodesLength + 32)))
                nodesLength += 32;
                break;
            case 1: // duplicate, no extra value needed
                p.nodes.push('*')
                break;
            case 2: // index (extension format), probably a varint for length + that many bytes...
                throw new ERR_EXTSVS_MERKLEPROOF_NODE_TYPE(nodeType)
            default:
                throw new ERR_EXTSVS_MERKLEPROOF_NODE_TYPE(nodeType)
        }
    }
    offset += nodesLength;
    if (offset !== buffer.length)
        throw new ERR_EXTSVS_MERKLEPROOF_PARSING()

    return p
}

export function deserializeTscMerkleProofNodes(nodes: Buffer | string[]): string[] {
    if (typeof nodes === 'string') return nodes
    if (!Buffer.isBuffer(nodes)) throw new ERR_INTERNAL('Buffer or string expected.')
    const buffer = nodes
    nodes = []
    for (let offset = 0; offset < buffer.length;) {
        const flag = buffer[offset++]
        if (flag === 1)
            nodes.push('*')
        else if (flag === 0) {
            nodes.push(asString(buffer.subarray(offset, offset + 32)))
            offset += 32
        } else {
            throw new ERR_BAD_REQUEST(`node type byte ${flag} is not supported here.`)
        }
    }
    return nodes
}
    