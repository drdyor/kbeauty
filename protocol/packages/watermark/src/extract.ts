/**
 * LSB Steganographic Watermark — Extract
 *
 * Reads verification metadata from the blue channel LSBs.
 */

import type { WatermarkData } from "@glow/types";

const MAGIC_HEADER = "GLOW";
const BITS_PER_BYTE = 8;

/**
 * Extract bits from blue channel LSBs
 */
function extractBits(
  pixels: Uint8Array | Uint8ClampedArray,
  count: number
): number[] {
  const bits: number[] = [];
  for (let i = 0; i < count; i++) {
    const blueIndex = i * 4 + 2;
    bits.push(pixels[blueIndex] & 1);
  }
  return bits;
}

/**
 * Convert bits to bytes
 */
function bitsToBytes(bits: number[]): Uint8Array {
  const bytes = new Uint8Array(Math.floor(bits.length / BITS_PER_BYTE));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < BITS_PER_BYTE; j++) {
      byte = (byte << 1) | (bits[i * BITS_PER_BYTE + j] ?? 0);
    }
    bytes[i] = byte;
  }
  return bytes;
}

/**
 * Extract watermark data from RGBA pixel array.
 *
 * @param pixels - RGBA pixel data
 * @returns WatermarkData if found, null if no watermark or invalid
 */
export function extractWatermark(
  pixels: Uint8Array | Uint8ClampedArray
): WatermarkData | null {
  const availablePixels = pixels.length / 4;

  // First read the magic header (4 bytes = 32 bits)
  const headerBitCount = MAGIC_HEADER.length * BITS_PER_BYTE;
  if (availablePixels < headerBitCount) return null;

  const headerBits = extractBits(pixels, headerBitCount);
  const headerBytes = bitsToBytes(headerBits);
  const header = new TextDecoder().decode(headerBytes);

  if (header !== MAGIC_HEADER) {
    return null; // No watermark found
  }

  // Read length (4 bytes = 32 bits, starting after header)
  const lengthStart = headerBitCount;
  const lengthBitCount = 4 * BITS_PER_BYTE;

  if (availablePixels < lengthStart + lengthBitCount) return null;

  const lengthBits = extractBits(pixels, lengthStart + lengthBitCount).slice(
    lengthStart
  );
  const lengthBytes = bitsToBytes(lengthBits);
  const dv = new DataView(lengthBytes.buffer);
  const payloadLength = dv.getUint32(0, false); // big-endian

  // Sanity check
  if (payloadLength <= 0 || payloadLength > 10000) {
    return null; // Unreasonable payload size
  }

  // Read payload
  const payloadStart = lengthStart + lengthBitCount;
  const payloadBitCount = payloadLength * BITS_PER_BYTE;

  if (availablePixels < payloadStart + payloadBitCount) return null;

  const allBits = extractBits(pixels, payloadStart + payloadBitCount);
  const payloadBits = allBits.slice(payloadStart);
  const payloadBytes = bitsToBytes(payloadBits);

  try {
    const json = new TextDecoder().decode(payloadBytes);
    const parsed = JSON.parse(json);
    return {
      hash: parsed.h,
      clinicId: parsed.c,
      patientId: parsed.p,
      topicId: parsed.tid,
      hederaSeq: parsed.s,
      timestamp: parsed.t,
    };
  } catch {
    return null; // Invalid JSON payload
  }
}
