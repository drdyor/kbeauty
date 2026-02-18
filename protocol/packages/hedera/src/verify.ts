/**
 * Hedera Mirror Node verification for Glow Protocol
 *
 * Queries the Hedera Mirror Node REST API to verify photo hashes on-chain.
 * This is a read-only operation (free, no transaction cost).
 */

import type { VerificationResult, HederaProof } from "@glow/types";
import { getMirrorNodeUrl } from "./client";

interface MirrorNodeMessage {
  consensus_timestamp: string;
  topic_id: string;
  sequence_number: number;
  message: string; // base64-encoded JSON
}

/**
 * Verify a photo hash against the Hedera Mirror Node.
 * Looks up the HCS message by topic + sequence number and checks if the hash matches.
 */
export async function verifyOnChain(
  topicId: string,
  sequenceNumber: number,
  expectedHash: string
): Promise<{
  verified: boolean;
  onChainHash: string | null;
  consensusTimestamp: string | null;
  fullPayload: Record<string, unknown> | null;
}> {
  const baseUrl = getMirrorNodeUrl();
  const url = `${baseUrl}/api/v1/topics/${topicId}/messages/${sequenceNumber}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        verified: false,
        onChainHash: null,
        consensusTimestamp: null,
        fullPayload: null,
      };
    }

    const data: MirrorNodeMessage = await response.json();
    const decoded = JSON.parse(atob(data.message));

    return {
      verified: decoded.hash === expectedHash,
      onChainHash: decoded.hash,
      consensusTimestamp: data.consensus_timestamp,
      fullPayload: decoded,
    };
  } catch (err) {
    console.error("Mirror node verification failed:", err);
    return {
      verified: false,
      onChainHash: null,
      consensusTimestamp: null,
      fullPayload: null,
    };
  }
}

/**
 * Build a full verification result for a photo.
 * Combines hash check + Hedera proof + S3 version confirmation.
 */
export async function buildVerificationResult(
  imageHash: string,
  hedera: HederaProof,
  s3VersionId?: string,
  clinicName?: string
): Promise<VerificationResult> {
  const onChainResult = await verifyOnChain(
    hedera.topicId,
    hedera.sequenceNumber,
    imageHash
  );

  if (onChainResult.verified) {
    return {
      status: "certified",
      hash: imageHash,
      hedera,
      s3VersionId,
      capturedAt: onChainResult.consensusTimestamp ?? hedera.consensusTimestamp,
      clinicName,
      message: `Certified — captured at ${onChainResult.consensusTimestamp}${
        clinicName ? ` by ${clinicName}` : ""
      }, Hedera tx ${hedera.transactionId}`,
    };
  }

  if (onChainResult.onChainHash) {
    return {
      status: "modified",
      hash: imageHash,
      hedera,
      message: `Image has been modified. On-chain hash: ${onChainResult.onChainHash}, current hash: ${imageHash}`,
    };
  }

  return {
    status: "unknown",
    hash: imageHash,
    message: "Could not verify — no matching record found on-chain.",
  };
}
