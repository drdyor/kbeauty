/**
 * SHA-256 hashing for Glow Protocol
 *
 * Works in both browser (Web Crypto API) and React Native (expo-crypto polyfill).
 * Core logic ported from src/utils/verification.ts in the existing kbeauty codebase.
 */

/**
 * Generate SHA-256 hash from raw bytes
 */
export async function hashBytes(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate SHA-256 hash from a base64-encoded image string.
 * Handles data URL prefix (e.g., "data:image/jpeg;base64,...") automatically.
 */
export async function hashBase64Image(imageData: string): Promise<string> {
  const base64Data = imageData.includes(",")
    ? imageData.split(",")[1]
    : imageData;

  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return hashBytes(bytes);
}

/**
 * Verify that an image's hash matches a stored hash
 */
export async function verifyHash(
  imageData: string,
  expectedHash: string
): Promise<boolean> {
  const currentHash = await hashBase64Image(imageData);
  return currentHash === expectedHash;
}

/**
 * Generate SHA-256 hash from a string (for general use)
 */
export async function hashString(text: string): Promise<string> {
  const encoder = new TextEncoder();
  return hashBytes(encoder.encode(text));
}
