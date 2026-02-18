/**
 * Privacy blur for Glow Protocol
 *
 * Applies targeted blur to face regions (eyes, hair, background) using
 * pixel-level operations. Works with raw RGBA pixel arrays.
 *
 * Pattern ported from src/components/Procedures/PrivacyEditor.tsx which uses
 * StackBlur (canvasRGBA from stackblur-canvas).
 *
 * For React Native: use react-native-skia for GPU-accelerated blur.
 * For web: use stackblur-canvas (already in kbeauty deps).
 * This module provides the region calculation logic — actual blur is platform-specific.
 */

import type { Point } from "./landmarks";
import { getFaceEllipse, getEyeEllipses, getBoundingBox } from "./landmarks";

export interface BlurRegion {
  type: "eyes" | "hair" | "background" | "custom";
  /** Mask function: returns true if pixel at (x, y) should be blurred */
  shouldBlur: (x: number, y: number) => boolean;
}

export interface PrivacyConfig {
  blurEyes: boolean;
  blurHair: boolean;
  blurBackground: boolean;
  blurStrength: number; // 1-100, maps to blur radius
}

export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  blurEyes: true,
  blurHair: false,
  blurBackground: false,
  blurStrength: 40,
};

/**
 * Check if a point is inside an ellipse
 */
function isInsideEllipse(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): boolean {
  return ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2) <= 1;
}

/**
 * Generate blur regions based on face landmarks and privacy config.
 *
 * @param landmarks - 68-point face landmark positions
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @param config - Privacy configuration
 * @returns Array of blur regions with hit-test functions
 */
export function generateBlurRegions(
  landmarks: Point[],
  imageWidth: number,
  imageHeight: number,
  config: PrivacyConfig
): BlurRegion[] {
  const regions: BlurRegion[] = [];
  const faceEllipse = getFaceEllipse(landmarks);

  if (config.blurEyes) {
    const eyes = getEyeEllipses(landmarks);
    regions.push({
      type: "eyes",
      shouldBlur: (x, y) =>
        isInsideEllipse(x, y, eyes.left.cx, eyes.left.cy, eyes.left.rx, eyes.left.ry) ||
        isInsideEllipse(x, y, eyes.right.cx, eyes.right.cy, eyes.right.rx, eyes.right.ry),
    });
  }

  if (config.blurHair) {
    // Hair region: band above face ellipse, same width
    const hairTop = Math.max(0, faceEllipse.cy - faceEllipse.ry * 1.6);
    const hairBottom = faceEllipse.cy - faceEllipse.ry * 0.7;
    regions.push({
      type: "hair",
      shouldBlur: (x, y) =>
        y >= hairTop &&
        y <= hairBottom &&
        isInsideEllipse(x, y, faceEllipse.cx, faceEllipse.cy, faceEllipse.rx * 1.3, faceEllipse.ry * 1.6) &&
        !isInsideEllipse(x, y, faceEllipse.cx, faceEllipse.cy, faceEllipse.rx, faceEllipse.ry),
    });
  }

  if (config.blurBackground) {
    // Background: everything outside the face ellipse
    regions.push({
      type: "background",
      shouldBlur: (x, y) =>
        !isInsideEllipse(
          x, y,
          faceEllipse.cx,
          faceEllipse.cy,
          faceEllipse.rx * 1.1,
          faceEllipse.ry * 1.1
        ),
    });
  }

  return regions;
}

/**
 * Create a binary mask (Uint8Array) for blur regions.
 * 1 = blur this pixel, 0 = leave sharp.
 * Useful for StackBlur or Skia blur operations.
 */
export function createBlurMask(
  regions: BlurRegion[],
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      for (const region of regions) {
        if (region.shouldBlur(x, y)) {
          mask[idx] = 1;
          break;
        }
      }
    }
  }
  return mask;
}
