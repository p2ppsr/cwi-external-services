import { CwiError } from "cwi-base";

/**
 * Expected txid ${expected} doesn't match proof txid ${actual}
 */
export class ERR_EXTSVS_TXID_INVALID extends CwiError { constructor(expected?: string, actual?: string) { super('ERR_EXTSVS_TXID_INVALID', `Expected txid ${expected} doesn't match proof txid ${actual}`) } }
/**
 * Header for block hash ${hash} was not found.
 */
export class ERR_EXTSVS_BLOCK_HASH_MISSING extends CwiError { constructor(hash?: string) { super('ERR_EXTSVS_BLOCK_HASH_MISSING', `Header for block hash ${hash} was not found.`) } }
/**
 * Header for block height ${height} was not found.
 */
export class ERR_EXTSVS_BLOCK_HEIGHT_MISSING extends CwiError { constructor(height?: number) { super('ERR_EXTSVS_BLOCK_HEIGHT_MISSING', `Header for block height ${height} was not found.`) } }
/**
 * Exceeded max envelope depth ${maxDepth}
 */
export class ERR_EXTSVS_ENVELOPE_DEPTH extends CwiError { constructor(maxDepth: number) { super('ERR_EXTSVS_ENVELOPE_DEPTH', `Exceeded max envelope depth ${maxDepth}`) } }
/**
 * Expected merkleRoot ${expected} doesn't match computed ${actual}
 */
export class ERR_EXTSVS_MERKLEROOT_INVALID extends CwiError { constructor(expected?: string, actual?: string) { super('ERR_EXTSVS_MERKLEROOT_INVALID', `Expected merkleRoot ${expected} doesn't match computed ${actual}`) } }
/**
 * MerkleRoot ${merkleRoot} was not found in active chain.
 */
export class ERR_EXTSVS_MERKLEROOT_MISSING extends CwiError { constructor(merkleRoot?: string) { super('ERR_EXTSVS_MERKLEROOT_MISSING', `MerkleRoot ${merkleRoot} was not found in active chain.`) } }
/**
 * Unsupported merkle proof target type ${targetType}.
 */
export class ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE extends CwiError { constructor(targetType?: string | number) { super('ERR_EXTSVS_MERKLEPROOF_TAGET_TYPE', `Unsupported merkle proof target type ${targetType}.`) } }
/**
 * Unsupported merkle proof node type ${nodeType}.
 */
export class ERR_EXTSVS_MERKLEPROOF_NODE_TYPE extends CwiError { constructor(nodeType?: string | number) { super('ERR_EXTSVS_MERKLEPROOF_NODE_TYPE', `Unsupported merkle proof node type ${nodeType}.`) } }
/**
 * Merkle proof parsing error.
 */
export class ERR_EXTSVS_MERKLEPROOF_PARSING extends CwiError { constructor() { super('ERR_EXTSVS_MERKLEPROOF_PARSING', 'Merkle proof parsing error.') } }
/**
 * Merkle proof unsuported feature ${feature}.
 */
export class ERR_EXTSVS_MERKLEPROOF_UNSUPORTED extends CwiError { constructor(feature?: string) { super('ERR_EXTSVS_MERKLEPROOF_UNSUPORTED', `Merkle proof unsuported feature ${feature}.`) } }
/**
 * Required Mapi response is missing.
 */
export class ERR_EXTSVS_MAPI_MISSING extends CwiError { constructor() { super('ERR_EXTSVS_MAPI_MISSING', `Required Mapi response is missing.`) } }
/**
 * Mapi response signature is invalid.
 */
export class ERR_EXTSVS_MAPI_SIGNATURE_INVALID extends CwiError { constructor() { super('ERR_EXTSVS_MAPI_SIGNATURE_INVALID', `Mapi response signature is invalid.`) } }
/**
 * mAPI response unsupported mimetype ${mimeType}
 */
export class ERR_EXTSVS_MAPI_UNSUPORTED_MIMETYPE extends CwiError { constructor(mimeType?: string) { super('ERR_EXTSVS_MAPI_UNSUPORTED_MIMETYPE', `mAPI response unsupported mimetype ${mimeType}`) } }
/**
 * mAPI response unsupported encoding ${encoding}
 */
export class ERR_EXTSVS_MAPI_UNSUPORTED_ENCODING extends CwiError { constructor(encoding?: string) { super('ERR_EXTSVS_MAPI_UNSUPORTED_ENCODING', `mAPI response unsupported encoding ${encoding}`) } }
/**
 * mAPI response unsupported returnResult ${result}
 */
export class ERR_EXTSVS_MAPI_UNSUPORTED_RETURNRESULT extends CwiError { constructor(result?: string) { super('ERR_EXTSVS_MAPI_RETURNRESULT_INVALID', `mAPI response unsupported returnResult ${result}`) } }