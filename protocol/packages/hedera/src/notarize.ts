/**
 * Hedera HCS notarization for Glow Protocol
 *
 * Submits photo hashes to an HCS topic for immutable timestamped proof.
 * Cost: ~$0.0001 per message on mainnet.
 */

import {
  TopicMessageSubmitTransaction,
  TopicId,
} from "@hashgraph/sdk";
import type { HederaProof } from "@glow/types";
import { getClient, getTopicId } from "./client";

export interface NotarizationPayload {
  version: number;
  hash: string; // SHA-256 of the raw image
  clinicId: string;
  patientId: string;
  photographerId: string;
  captureAngle?: string;
  procedureType?: string;
  deviceInfo?: string;
  timestamp: string; // ISO string
}

/**
 * Notarize a photo by submitting its hash to the clinic's HCS topic.
 * Returns the Hedera proof with transaction ID and sequence number.
 */
export async function notarizePhoto(
  payload: NotarizationPayload
): Promise<HederaProof> {
  const client = getClient();
  const topicId = getTopicId();

  if (!topicId) {
    throw new Error(
      "No topic ID set. Call createTopic() or setTopicId() first."
    );
  }

  const message = JSON.stringify({
    v: payload.version,
    hash: payload.hash,
    cid: payload.clinicId,
    pid: payload.patientId,
    uid: payload.photographerId,
    angle: payload.captureAngle,
    proc: payload.procedureType,
    dev: payload.deviceInfo,
    ts: payload.timestamp,
  });

  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(message);

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
    consensusTimestamp: new Date().toISOString(), // Approximate; exact from Mirror Node
    topicId,
    sequenceNumber: receipt.topicSequenceNumber?.toNumber() ?? 0,
  };
}
