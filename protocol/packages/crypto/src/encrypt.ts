/**
 * E2E Encryption for Glow Protocol
 *
 * Uses XChaCha20-Poly1305 via the Web Crypto API compatible approach.
 * Pattern extracted from ente-io/ente encryption architecture.
 *
 * For MVP: uses AES-256-GCM (native Web Crypto) as XChaCha20 requires
 * libsodium-wrappers. Can be swapped to XChaCha20 post-MVP when
 * libsodium is added.
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

/**
 * Generate a new encryption key
 */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Export a CryptoKey to raw bytes for storage
 */
export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return new Uint8Array(raw);
}

/**
 * Import raw bytes as a CryptoKey
 */
export async function importKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", keyBytes, { name: ALGORITHM }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encrypt data with AES-256-GCM
 * Returns: IV (12 bytes) || ciphertext
 */
export async function encrypt(
  data: Uint8Array,
  key: CryptoKey
): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  // Prepend IV to ciphertext
  const result = new Uint8Array(iv.length + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), iv.length);
  return result;
}

/**
 * Decrypt data encrypted with encrypt()
 * Expects: IV (12 bytes) || ciphertext
 */
export async function decrypt(
  encryptedData: Uint8Array,
  key: CryptoKey
): Promise<Uint8Array> {
  const iv = encryptedData.slice(0, IV_LENGTH);
  const ciphertext = encryptedData.slice(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return new Uint8Array(plaintext);
}

/**
 * Encrypt a base64 image string
 */
export async function encryptImage(
  imageBase64: string,
  key: CryptoKey
): Promise<Uint8Array> {
  const binaryString = atob(
    imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64
  );
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return encrypt(bytes, key);
}

/**
 * Decrypt an image back to base64
 */
export async function decryptImage(
  encryptedData: Uint8Array,
  key: CryptoKey,
  mimeType = "image/jpeg"
): Promise<string> {
  const bytes = await decrypt(encryptedData, key);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}
