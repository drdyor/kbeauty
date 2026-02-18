/**
 * High-level watermark pipeline for JPEG images.
 *
 * Bridges the gap between the capture pipeline (which deals in base64 JPEGs)
 * and the LSB watermark functions (which operate on raw RGBA pixels).
 *
 * Flow: base64 JPEG → decode → embed/extract → re-encode → base64 JPEG
 */

import { decodeJpeg, encodeJpeg, base64ToBytes, bytesToBase64 } from "./jpeg-codec";
import { embedWatermark } from "./embed";
import { extractWatermark } from "./extract";
import type { WatermarkData } from "@glow/types";

/**
 * Embed watermark data into a JPEG image.
 *
 * Hash is computed BEFORE this function — the watermark contains the hash
 * as embedded metadata. The returned image has the watermark baked into
 * its blue channel LSBs.
 *
 * @param imageBase64 - JPEG image as base64 (with or without data URL prefix)
 * @param watermarkData - Metadata to embed (hash, clinicId, patientId, topicId, hederaSeq, timestamp)
 * @param jpegQuality - Re-encode quality (default 100 to preserve LSBs)
 * @returns Watermarked JPEG as base64 data URL
 */
export function embedWatermarkInJpeg(
  imageBase64: string,
  watermarkData: WatermarkData,
  jpegQuality = 100
): string {
  // 1. Base64 → JPEG bytes
  const jpegBytes = base64ToBytes(imageBase64);

  // 2. JPEG bytes → RGBA pixels
  const { data: pixels, width, height } = decodeJpeg(jpegBytes);

  // 3. Embed watermark into blue channel LSBs
  const watermarkedPixels = embedWatermark(pixels, watermarkData);

  // 4. RGBA pixels → JPEG bytes (high quality to preserve LSBs)
  const watermarkedJpeg = encodeJpeg(watermarkedPixels, width, height, jpegQuality);

  // 5. JPEG bytes → base64 data URL
  return bytesToBase64(watermarkedJpeg);
}

/**
 * Extract watermark data from a JPEG image.
 *
 * @param imageBase64 - JPEG image as base64 (with or without data URL prefix)
 * @returns WatermarkData if found, null if no watermark or corrupted
 */
export function extractWatermarkFromJpeg(
  imageBase64: string
): WatermarkData | null {
  // 1. Base64 → JPEG bytes
  const jpegBytes = base64ToBytes(imageBase64);

  // 2. JPEG bytes → RGBA pixels
  const { data: pixels } = decodeJpeg(jpegBytes);

  // 3. Extract watermark from blue channel LSBs
  return extractWatermark(pixels);
}
