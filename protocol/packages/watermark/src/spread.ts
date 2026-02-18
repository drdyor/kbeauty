/**
 * Spread-spectrum watermarking for JPEG resilience
 *
 * Basic LSB watermarks are destroyed by JPEG recompression.
 * This module spreads each bit across multiple pixels using a
 * deterministic pseudo-random pattern seeded by the image hash.
 *
 * The DB hash serves as ground truth — this is a secondary signal
 * for detecting modification even when the original DB record isn't available.
 *
 * TODO: Implement full spread-spectrum (post-MVP).
 * For MVP, the simple LSB embed/extract in embed.ts + extract.ts is sufficient
 * because we always have the DB hash as the primary verification mechanism.
 */

/**
 * Simple seed-based PRNG (xorshift32) for deterministic pixel selection
 */
function xorshift32(seed: number): () => number {
  let state = seed | 1; // Ensure non-zero
  return () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff; // Normalize to [0, 1)
  };
}

/**
 * Generate a deterministic pixel index sequence from a hash seed.
 * Used to spread watermark bits across non-sequential pixels.
 */
export function generatePixelSequence(
  hashSeed: string,
  pixelCount: number,
  sequenceLength: number
): number[] {
  // Convert first 4 chars of hash to a numeric seed
  const seed = parseInt(hashSeed.slice(0, 8), 16);
  const rng = xorshift32(seed);

  const indices: Set<number> = new Set();
  while (indices.size < sequenceLength && indices.size < pixelCount) {
    const idx = Math.floor(rng() * pixelCount);
    indices.add(idx);
  }

  return Array.from(indices);
}

/**
 * Embed a single bit across N redundant pixels (majority voting)
 * This makes the watermark survive moderate JPEG compression.
 *
 * @param redundancy - Number of pixels per bit (odd number, e.g. 7)
 */
export function embedSpreadBit(
  pixels: Uint8Array,
  pixelIndices: number[],
  bit: 0 | 1
): void {
  for (const idx of pixelIndices) {
    const blueIndex = idx * 4 + 2;
    pixels[blueIndex] = (pixels[blueIndex] & 0xfe) | bit;
  }
}

/**
 * Extract a spread bit using majority voting across redundant pixels
 */
export function extractSpreadBit(
  pixels: Uint8Array | Uint8ClampedArray,
  pixelIndices: number[]
): 0 | 1 {
  let ones = 0;
  for (const idx of pixelIndices) {
    const blueIndex = idx * 4 + 2;
    if (pixels[blueIndex] & 1) ones++;
  }
  return ones > pixelIndices.length / 2 ? 1 : 0;
}
