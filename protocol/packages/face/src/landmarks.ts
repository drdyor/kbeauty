/**
 * Face landmark utilities for Glow Protocol
 *
 * Helpers for working with the 68-point face landmark model.
 * Used for privacy blur regions, alignment scoring, and clinical grid positioning.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * 68-point landmark regions
 */
export const LANDMARK_REGIONS = {
  jawline: { start: 0, end: 16 },
  leftEyebrow: { start: 17, end: 21 },
  rightEyebrow: { start: 22, end: 26 },
  noseBridge: { start: 27, end: 30 },
  noseLower: { start: 31, end: 35 },
  leftEye: { start: 36, end: 41 },
  rightEye: { start: 42, end: 47 },
  outerMouth: { start: 48, end: 59 },
  innerMouth: { start: 60, end: 67 },
} as const;

/**
 * Extract a region's points from the full 68-point array
 */
export function getRegionPoints(
  positions: Point[],
  region: keyof typeof LANDMARK_REGIONS
): Point[] {
  const { start, end } = LANDMARK_REGIONS[region];
  return positions.slice(start, end + 1);
}

/**
 * Get the center point of a region
 */
export function getRegionCenter(points: Point[]): Point {
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/**
 * Get bounding box of a set of points
 */
export function getBoundingBox(points: Point[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Calculate the distance between two eyes (inter-pupillary distance)
 * Used for consistent photo comparison scaling.
 */
export function getInterPupillaryDistance(positions: Point[]): number {
  const leftEye = getRegionCenter(getRegionPoints(positions, "leftEye"));
  const rightEye = getRegionCenter(getRegionPoints(positions, "rightEye"));
  return Math.sqrt(
    Math.pow(rightEye.x - leftEye.x, 2) +
      Math.pow(rightEye.y - leftEye.y, 2)
  );
}

/**
 * Get face ellipse parameters for privacy blur.
 * Returns an ellipse that covers the full face area.
 */
export function getFaceEllipse(
  positions: Point[]
): { cx: number; cy: number; rx: number; ry: number } {
  const jawline = getRegionPoints(positions, "jawline");
  const bbox = getBoundingBox(positions);

  // Center from nose bridge
  const noseBridge = getRegionPoints(positions, "noseBridge");
  const center = getRegionCenter(noseBridge);

  // Radii from bounding box with padding
  const rx = (bbox.width / 2) * 1.1;
  const ry = (bbox.height / 2) * 1.15; // Slightly taller for forehead

  return { cx: center.x, cy: center.y - bbox.height * 0.05, rx, ry };
}

/**
 * Get eye ellipse parameters for targeted eye blur.
 */
export function getEyeEllipses(
  positions: Point[]
): { left: { cx: number; cy: number; rx: number; ry: number }; right: { cx: number; cy: number; rx: number; ry: number } } {
  const leftEyePoints = getRegionPoints(positions, "leftEye");
  const rightEyePoints = getRegionPoints(positions, "rightEye");

  const leftCenter = getRegionCenter(leftEyePoints);
  const rightCenter = getRegionCenter(rightEyePoints);

  const leftBox = getBoundingBox(leftEyePoints);
  const rightBox = getBoundingBox(rightEyePoints);

  // Pad eye regions for comfortable blur
  const padX = 1.8;
  const padY = 2.5;

  return {
    left: {
      cx: leftCenter.x,
      cy: leftCenter.y,
      rx: (leftBox.width / 2) * padX,
      ry: (leftBox.height / 2) * padY,
    },
    right: {
      cx: rightCenter.x,
      cy: rightCenter.y,
      rx: (rightBox.width / 2) * padX,
      ry: (rightBox.height / 2) * padY,
    },
  };
}
