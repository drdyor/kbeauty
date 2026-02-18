/**
 * LSB Steganographic Watermark — Embed
 *
 * Hides verification metadata in the least significant bits of the blue channel.
 * Works with raw RGBA pixel arrays (no DOM canvas dependency).
 *
 * Technique extracted from nickfallon/watermark patterns, adapted for
 * Uint8Array pixel buffers to work in both browser and React Native.
 */

import type { WatermarkData } from "@glow/types";

const MAGIC_HEADER = "GLOW"; // 4 bytes to identify watermarked images
const BITS_PER_BYTE = 8;

/**
 * Convert a string to a bit array (array of 0s and 1s)
 */
function stringToBits(str: string): number[] {
  const bits: number[] = [];
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }
  return bits;
}

/**
 * Convert a bit array back to a string
 */
function bitsToString(bits: number[]): string {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += BITS_PER_BYTE) {
    let byte = 0;
    for (let j = 0; j < BITS_PER_BYTE; j++) {
      byte = (byte << 1) | (bits[i + j] ?? 0);
    }
    bytes.push(byte);
  }
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}

/**
 * Serialize watermark data to a compact JSON string
 */
function serializePayload(data: WatermarkData): string {
  return JSON.stringify({
    h: data.hash,
    c: data.clinicId,
    p: data.patientId,
    tid: data.topicId,
    s: data.hederaSeq,
    t: data.timestamp,
  });
}

/**
 * Deserialize watermark payload back to WatermarkData
 */
function deserializePayload(json: string): WatermarkData {
  const parsed = JSON.parse(json);
  return {
    hash: parsed.h,
    clinicId: parsed.c,
    patientId: parsed.p,
    topicId: parsed.tid,
    hederaSeq: parsed.s,
    timestamp: parsed.t,
  };
}

/**
 * Embed watermark data into RGBA pixel array using LSB of blue channel.
 *
 * Format: [MAGIC_HEADER (4 bytes)] [LENGTH (4 bytes, big-endian)] [PAYLOAD]
 *
 * @param pixels - RGBA pixel data (Uint8Array or Uint8ClampedArray, length = width * height * 4)
 * @param data - Watermark data to embed
 * @returns Modified pixel array with embedded watermark
 */
export function embedWatermark(
  pixels: Uint8Array | Uint8ClampedArray,
  data: WatermarkData
): Uint8Array {
  const payload = serializePayload(data);
  const payloadBytes = new TextEncoder().encode(payload);

  // Build the full message: MAGIC + length (4 bytes) + payload
  const headerBytes = new TextEncoder().encode(MAGIC_HEADER);
  const lengthBytes = new Uint8Array(4);
  const dv = new DataView(lengthBytes.buffer);
  dv.setUint32(0, payloadBytes.length, false); // big-endian

  const fullMessage = new Uint8Array(
    headerBytes.length + lengthBytes.length + payloadBytes.length
  );
  fullMessage.set(headerBytes, 0);
  fullMessage.set(lengthBytes, headerBytes.length);
  fullMessage.set(payloadBytes, headerBytes.length + lengthBytes.length);

  // Convert to bits
  const bits = stringToBits(new TextDecoder().decode(fullMessage));

  // Check capacity: we use 1 bit per pixel (blue channel LSB), need enough pixels
  const availablePixels = pixels.length / 4;
  if (bits.length > availablePixels) {
    throw new Error(
      `Image too small for watermark. Need ${bits.length} pixels, have ${availablePixels}.`
    );
  }

  // Embed bits into blue channel LSB
  const result = new Uint8Array(pixels);
  for (let i = 0; i < bits.length; i++) {
    const blueIndex = i * 4 + 2; // RGBA: R=0, G=1, B=2, A=3
    // Clear LSB and set to our bit
    result[blueIndex] = (result[blueIndex] & 0xfe) | bits[i];
  }

  return result;
}

/**
 * Extract embedded watermark metadata, or null if none found.
 */
export { deserializePayload };
