/**
 * Pure JavaScript JPEG encode/decode for watermark embedding.
 *
 * Uses jpeg-js — no DOM dependency, works in React Native and Node.js.
 * Bridges the gap between base64 JPEG images and raw RGBA pixel arrays
 * needed by embed.ts / extract.ts.
 */

import * as jpeg from "jpeg-js";

export interface DecodedImage {
  data: Uint8Array; // RGBA pixel array
  width: number;
  height: number;
}

/**
 * Decode JPEG bytes to RGBA pixel array.
 */
export function decodeJpeg(jpegBytes: Uint8Array): DecodedImage {
  const decoded = jpeg.decode(jpegBytes, { useTArray: true, formatAsRGBA: true });
  return {
    data: new Uint8Array(decoded.data),
    width: decoded.width,
    height: decoded.height,
  };
}

/**
 * Encode RGBA pixel array back to JPEG bytes.
 * Quality 100 preserves LSBs as much as possible (critical for watermark survival).
 */
export function encodeJpeg(
  rgbaData: Uint8Array,
  width: number,
  height: number,
  quality = 100
): Uint8Array {
  const rawImageData = {
    data: rgbaData,
    width,
    height,
  };
  const encoded = jpeg.encode(rawImageData, quality);
  return new Uint8Array(encoded.data);
}

/**
 * Strip data URL prefix from base64 string.
 * "data:image/jpeg;base64,/9j/4..." → "/9j/4..."
 */
export function stripDataUrl(input: string): string {
  if (input.startsWith("data:")) {
    const commaIdx = input.indexOf(",");
    if (commaIdx === -1) throw new Error("Invalid data URL: no comma found");
    return input.slice(commaIdx + 1);
  }
  return input;
}

/**
 * Base64 string → Uint8Array (works in both browser and RN).
 */
export function base64ToBytes(base64: string): Uint8Array {
  const cleaned = stripDataUrl(base64);

  // Node / RN with Buffer
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(cleaned, "base64"));
  }

  // Browser
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Uint8Array → base64 data URL.
 */
export function bytesToBase64(
  bytes: Uint8Array,
  mimeType = "image/jpeg"
): string {
  // Node / RN with Buffer
  if (typeof Buffer !== "undefined") {
    const b64 = Buffer.from(bytes).toString("base64");
    return `data:${mimeType};base64,${b64}`;
  }

  // Browser
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}
