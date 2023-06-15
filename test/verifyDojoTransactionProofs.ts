import { checkMerkleProof } from "./chaintracks-validation-engine-bsv1";

import { asBuffer, asString, computeRootFromMerkleProofNodes } from "cwi-base";
import { Knex, knex } from "knex";
import { TscMerkleProofApi } from "../src/Api/MerchantApi";
import { getMerkleProofFromTaal } from "../src/getMerkleProofV1";

export interface VerifyDojoTransactionProofResults {
    /**
     * Total count of transaction records with non-null proof property values.
     */
    totalCount: number,
    /**
     * Count of proofs that failed validation for any reason.
     */
    failedCount: number,
    /**
     * Count of proofs that couldn't be validated due to targetType.
     */
    unknownCount: number,
    /**
     * Count of proofs where the index is the binary reverse of correct value.
     */
    flippedCount: number,
    /**
     * Count of proofs that can become valid if index is updated from Taal proof service.
     */
    newIndexCount: number,
    /**
     * Count of times the Taal proof service returned null instead of a proof.
     */
    taalNullCount: number,
    /**
     * Count of times a disagreement between new computed merkle root value and prior-implementation value.
     */
    disagreement: number
}

export async function verifyDojoTransactionProof(dojoConnection: string, taalApiKey: string, updateDatabase: boolean): Promise<VerifyDojoTransactionProofResults> {
    let totalCount = 0
    let failedCount = 0
    let unknownCount = 0
    let flippedCount = 0
    let newIndexCount = 0
    let taalNullCount = 0
    let disagreement = 0

    const config: Knex.Config = {
        client: 'mysql',
        connection: JSON.parse(dojoConnection || '{}'),
        useNullAsDefault: true,
        pool: { min: 0, max: 7, idleTimeoutMillis: 15000 }
    }
    const k = knex(config)

    const count = 100
    let maxTransactionId = 0

    console.log(`updateDatabase=${updateDatabase}`)

    for (; ;) {
        const proofs = await k<{ transactionId: number, txid: string, proof: string }>('transactions')
            .whereNotNull('proof')
            .andWhere('transactionId', '>', maxTransactionId)
            .select('transactionId', 'txid', 'proof')
            .limit(count)
            .orderBy('transactionId')

        if (proofs.length === 0) break;

        for (let i = 0; i < proofs.length; i++) {
            maxTransactionId = proofs[i].transactionId
            const txid = proofs[i].txid
            const proof = <TscMerkleProofApi>JSON.parse(proofs[i].proof)

            let computed = computeRootFromMerkleProofNodes(proof.index, txid, proof.nodes)

            totalCount++

            let result = 'unknown'
            let targetRoot: string | undefined

            if (proof.targetType === 'header') {
                targetRoot = asString(asBuffer(proof.target).subarray(36, 68).reverse());
                proof.target = targetRoot
                proof.targetType = "merkleRoot"
            } else if (proof.targetType === 'merkleRoot') {
                targetRoot = asString(proof.target)
            }

            if (!targetRoot) {
                unknownCount++
            } else {
                if (asString(computed) === targetRoot) {
                    if (!checkMerkleProof({ proof })) disagreement++
                    result = 'valid'
                } else {
                    // Try flipping the index
                    proof.index = parseInt((proof.index >>> 0).toString(2).split("").reverse().join("").padStart(proof.nodes.length, "0"), 2)
                    computed = computeRootFromMerkleProofNodes(proof.index, txid, proof.nodes)
                    if (asString(computed) === targetRoot) {
                        flippedCount++
                        if (!checkMerkleProof({ proof })) disagreement++
                        result = 'valid'
                        // Reference: line 31, mapiCallback.js, dojo/src/routes
                        if (updateDatabase)
                            await k('transactions').where({ transactionId: proofs[i].transactionId }).update({ proof: JSON.stringify(proof) })
                    } else {
                        const p2 = await getMerkleProofFromTaal(txid, taalApiKey)
                        if (p2) {
                            console.log(`old index ${proof.index} => ${p2.index} new index`)
                            proof.index = p2.index
                            computed = computeRootFromMerkleProofNodes(proof.index, txid, proof.nodes)
                            if (asString(computed) === targetRoot) {
                                newIndexCount++
                                if (!checkMerkleProof({ proof })) disagreement++
                                result = 'valid'
                                if (updateDatabase)
                                    await k('transactions').where({ transactionId: proofs[i].transactionId }).update({ proof: JSON.stringify(proof) })
                            } else {
                                failedCount++
                                if (checkMerkleProof({ proof })) disagreement++
                                result = 'failed'
                            }
                        } else {
                            taalNullCount++
                            failedCount++
                            if (checkMerkleProof({ proof })) disagreement++
                            result = 'failed'
                        }
                    }
                }
            }
            if (result === 'failed')
                console.log(proofs[i].transactionId, txid, proof.targetType, computed.toString('hex'))
        }

        console.log(`maxId=${maxTransactionId} total=${totalCount} failed=${failedCount} unknown=${unknownCount} flipped=${flippedCount} newIndex=${newIndexCount} taalNull=${taalNullCount} disagreement=${disagreement}`)

    }

    return {
        totalCount,
        failedCount,
        unknownCount,
        flippedCount,
        newIndexCount,
        taalNullCount,
        disagreement
    }
}