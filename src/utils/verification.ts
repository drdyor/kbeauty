import type { VerificationData } from "../types/procedures";
import { isHederaReady, notarizePhoto } from "../services/hederaService";

/**
 * Generate SHA-256 hash of image data for tamper verification
 */
export async function generateImageHash(imageData: string): Promise<string> {
  // Remove data URL prefix if present
  const base64Data = imageData.includes(',')
    ? imageData.split(',')[1]
    : imageData;

  // Convert base64 to ArrayBuffer
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Create full verification data for a captured image
 */
export async function createVerificationData(
  imageData: string,
  captureMethod: 'in-app' | 'upload-test'
): Promise<VerificationData> {
  const hash = await generateImageHash(imageData);
  const now = new Date();

  return {
    hash,
    captureMethod,
    deviceInfo: navigator.userAgent,
    timestamp: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

/**
 * Verify an image hasn't been tampered with
 */
export async function verifyImage(
  imageData: string,
  storedHash: string
): Promise<boolean> {
  const currentHash = await generateImageHash(imageData);
  return currentHash === storedHash;
}

/**
 * Create verification data AND notarize on Hedera if connected.
 * Falls back gracefully to local-only verification if Hedera is not configured.
 */
export async function createAndNotarize(
  imageData: string,
  captureMethod: 'in-app' | 'upload-test',
  procedureId: string
): Promise<VerificationData> {
  const verification = await createVerificationData(imageData, captureMethod);

  if (isHederaReady()) {
    try {
      const result = await notarizePhoto({
        procedureId,
        photoHash: verification.hash,
        timestamp: verification.timestamp,
        captureMethod: verification.captureMethod,
        deviceInfo: verification.deviceInfo,
      });
      verification.hedera = {
        transactionId: result.transactionId,
        consensusTimestamp: result.consensusTimestamp,
        topicId: result.topicId,
        topicSequenceNumber: result.topicSequenceNumber,
      };
    } catch (err) {
      console.warn("Hedera notarization failed, continuing with local verification:", err);
    }
  }

  return verification;
}

/**
 * Format verification data for display/export
 */
export function formatVerificationForExport(verification: VerificationData): string {
  const lines = [
    `Verification Certificate`,
    `========================`,
    `Hash (SHA-256): ${verification.hash}`,
    `Capture Method: ${verification.captureMethod === 'in-app' ? 'Verified In-App Capture' : 'Test Upload (Not Verified)'}`,
    `Timestamp: ${new Date(verification.timestamp).toLocaleString()}`,
    `Timezone: ${verification.timezone}`,
    `Device: ${verification.deviceInfo || 'Unknown'}`,
  ];

  if (verification.hedera) {
    lines.push(
      ``,
      `Blockchain Notarization`,
      `-----------------------`,
      `Network: Hedera Hashgraph`,
      `Transaction ID: ${verification.hedera.transactionId}`,
      `Consensus Timestamp: ${verification.hedera.consensusTimestamp}`,
      `Topic ID: ${verification.hedera.topicId}`,
      `Sequence #: ${verification.hedera.topicSequenceNumber}`,
    );
  }

  return lines.join('\n');
}
