import type { VerificationData } from "../types/procedures";

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
 * Format verification data for display/export
 */
export function formatVerificationForExport(verification: VerificationData): string {
  return `
Verification Certificate
========================
Hash (SHA-256): ${verification.hash}
Capture Method: ${verification.captureMethod === 'in-app' ? 'Verified In-App Capture' : 'Test Upload (Not Verified)'}
Timestamp: ${new Date(verification.timestamp).toLocaleString()}
Timezone: ${verification.timezone}
Device: ${verification.deviceInfo || 'Unknown'}
`.trim();
}
