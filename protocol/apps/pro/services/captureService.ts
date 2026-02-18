/**
 * Capture pipeline service for Glow Pro.
 *
 * Pipeline: raw photo → SHA-256 hash → Hedera notarize → LSB watermark → encrypt
 *
 * Each step feeds into the next. The service returns a CertificationResult
 * containing all the cryptographic proof needed for evidence vault storage.
 */

import { hashBase64Image } from "@glow/crypto/src/hash";
import { generateKey, encryptImage, exportKey } from "@glow/crypto/src/encrypt";
import { initClient, createTopic, setTopicId, getTopicId, isReady } from "@glow/hedera/src/client";
import { notarizePhoto } from "@glow/hedera/src/notarize";
import { embedWatermarkInJpeg } from "@glow/watermark/src/pipeline";
import type { HederaProof, CaptureAngle, WatermarkData } from "@glow/types";

export interface CaptureInput {
  imageBase64: string; // raw capture (data URL or plain base64)
  clinicId: string;
  patientId: string;
  photographerId: string;
  captureAngle?: CaptureAngle;
  procedureType?: string;
  deviceInfo?: string;
}

export interface CertificationResult {
  sha256Hash: string;
  hedera: HederaProof;
  watermarkData: WatermarkData;
  encryptedImage: Uint8Array;
  encryptionKey: Uint8Array;
  timestamp: string;
}

export type PipelineStep =
  | "hashing"
  | "notarizing"
  | "watermarking"
  | "encrypting"
  | "complete"
  | "error";

export interface PipelineProgress {
  step: PipelineStep;
  message: string;
}

/**
 * Initialize the Hedera client for use in the capture pipeline.
 * Call once at app startup.
 */
export async function initCapturePipeline(config: {
  operatorId: string;
  operatorKey: string;
  network: "testnet" | "mainnet";
  topicId?: string;
}): Promise<void> {
  initClient(config);

  if (config.topicId) {
    setTopicId(config.topicId);
  } else {
    // Create a new topic for this clinic
    await createTopic("Glow Protocol — Certified Medical Photography");
  }
}

/**
 * Run the full certification pipeline on a captured photo.
 *
 * Steps:
 * 1. SHA-256 hash of raw image bytes (hash of ORIGINAL, before watermark)
 * 2. Submit hash to Hedera HCS topic (blockchain timestamp)
 * 3. Embed watermark with hash + Hedera seq + topicId into pixel LSBs
 * 4. Encrypt the WATERMARKED image with AES-256-GCM
 */
export async function certifyCapture(
  input: CaptureInput,
  onProgress?: (progress: PipelineProgress) => void
): Promise<CertificationResult> {
  const timestamp = new Date().toISOString();

  // Step 1: Hash the ORIGINAL image (before any modifications)
  onProgress?.({ step: "hashing", message: "Computing SHA-256 hash..." });
  const sha256Hash = await hashBase64Image(input.imageBase64);

  // Step 2: Notarize on Hedera
  onProgress?.({ step: "notarizing", message: "Anchoring to Hedera blockchain..." });

  if (!isReady()) {
    throw new Error("Hedera client not initialized. Call initCapturePipeline() first.");
  }

  const hedera = await notarizePhoto({
    version: 1,
    hash: sha256Hash,
    clinicId: input.clinicId,
    patientId: input.patientId,
    photographerId: input.photographerId,
    captureAngle: input.captureAngle,
    procedureType: input.procedureType,
    deviceInfo: input.deviceInfo,
    timestamp,
  });

  // Step 3: Embed watermark into actual image pixels
  onProgress?.({ step: "watermarking", message: "Embedding steganographic watermark..." });

  const topicId = getTopicId();
  if (!topicId) {
    throw new Error("No Hedera topic ID available for watermark embedding.");
  }

  const watermarkData: WatermarkData = {
    hash: sha256Hash,
    clinicId: input.clinicId,
    patientId: input.patientId,
    topicId,
    hederaSeq: hedera.sequenceNumber,
    timestamp,
  };

  // Decode JPEG → embed watermark in blue channel LSBs → re-encode JPEG
  const watermarkedBase64 = embedWatermarkInJpeg(
    input.imageBase64,
    watermarkData,
    100 // max quality to preserve LSBs through JPEG re-encoding
  );

  // Step 4: Encrypt the WATERMARKED image (not the original)
  onProgress?.({ step: "encrypting", message: "Encrypting with AES-256-GCM..." });
  const key = await generateKey();
  const encryptedImage = await encryptImage(watermarkedBase64, key);
  const encryptionKey = await exportKey(key);

  onProgress?.({ step: "complete", message: "Photo certified." });

  return {
    sha256Hash,
    hedera,
    watermarkData,
    encryptedImage,
    encryptionKey,
    timestamp,
  };
}
