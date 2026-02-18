/**
 * Clinical photography alignment scoring
 *
 * Scores face alignment against clinical photography standards:
 * - Frankfort horizontal plane (tragion to infraorbitale)
 * - Centering (face centered in frame)
 * - Symmetry (left/right balance)
 * - Distance (face fills appropriate % of frame)
 *
 * Uses 68-point face landmarks from face-api.js.
 */

export interface FaceLandmarks68 {
  positions: Array<{ x: number; y: number }>;
}

export interface AlignmentScore {
  overall: number; // 0-100
  tilt: number; // Head tilt (0 = perfect, higher = worse)
  centering: number; // 0-100 (100 = perfectly centered)
  faceRatio: number; // % of frame filled by face
  feedback: string; // Human-readable guidance
}

/**
 * Calculate the Frankfort plane angle from 68-point landmarks.
 * The Frankfort plane runs from the tragion (ear) to the infraorbitale (below eye).
 * Approximated using outer eye corners and jaw angle points.
 *
 * Landmarks reference (68-point):
 * - 0-16: jawline
 * - 17-21: left eyebrow
 * - 22-26: right eyebrow
 * - 27-30: nose bridge
 * - 31-35: lower nose
 * - 36-41: left eye
 * - 42-47: right eye
 * - 48-67: mouth
 */
function calculateTilt(landmarks: FaceLandmarks68): number {
  const positions = landmarks.positions;

  // Use eye corners for horizontal alignment
  const leftEyeOuter = positions[36]; // Left eye outer corner
  const rightEyeOuter = positions[45]; // Right eye outer corner

  const dx = rightEyeOuter.x - leftEyeOuter.x;
  const dy = rightEyeOuter.y - leftEyeOuter.y;

  // Angle in degrees (0 = perfectly horizontal)
  const angleDeg = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
  return angleDeg;
}

/**
 * Calculate centering score (how centered the face is in the frame)
 */
function calculateCentering(
  landmarks: FaceLandmarks68,
  frameWidth: number,
  frameHeight: number
): number {
  const positions = landmarks.positions;

  // Face center from nose bridge
  const noseBridge = positions[30]; // Nose tip
  const frameCenterX = frameWidth / 2;
  const frameCenterY = frameHeight / 2;

  const dx = Math.abs(noseBridge.x - frameCenterX) / frameWidth;
  const dy = Math.abs(noseBridge.y - frameCenterY) / frameHeight;

  // Score: 100 when perfectly centered, drops with distance
  const distance = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, Math.round(100 - distance * 300));
}

/**
 * Calculate what % of the frame the face fills
 */
function calculateFaceRatio(
  landmarks: FaceLandmarks68,
  frameWidth: number,
  frameHeight: number
): number {
  const positions = landmarks.positions;

  // Bounding box from jawline and forehead
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of positions) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const faceArea = (maxX - minX) * (maxY - minY);
  const frameArea = frameWidth * frameHeight;

  return Math.round((faceArea / frameArea) * 100);
}

/**
 * Score face alignment for clinical photography.
 * Returns an overall score (0-100) and component scores.
 *
 * Guidelines:
 * - Tilt < 2 degrees = excellent
 * - Face ratio 15-35% = good framing
 * - Centering > 80 = well centered
 */
export function scoreAlignment(
  landmarks: FaceLandmarks68,
  frameWidth: number,
  frameHeight: number
): AlignmentScore {
  const tilt = calculateTilt(landmarks);
  const centering = calculateCentering(landmarks, frameWidth, frameHeight);
  const faceRatio = calculateFaceRatio(landmarks, frameWidth, frameHeight);

  // Score components (0-100 each)
  const tiltScore = Math.max(0, 100 - tilt * 15); // 2 deg = 70, 5 deg = 25
  const centerScore = centering;
  const ratioScore =
    faceRatio >= 15 && faceRatio <= 35
      ? 100
      : faceRatio < 15
        ? Math.round((faceRatio / 15) * 100)
        : Math.max(0, 100 - (faceRatio - 35) * 3);

  const overall = Math.round(tiltScore * 0.4 + centerScore * 0.3 + ratioScore * 0.3);

  // Generate feedback
  let feedback = "";
  if (tilt > 5) feedback = "Tilt head to level position";
  else if (centering < 50) feedback = "Center face in frame";
  else if (faceRatio < 10) feedback = "Move closer";
  else if (faceRatio > 40) feedback = "Move further away";
  else if (overall >= 80) feedback = "Good alignment — ready to capture";
  else feedback = "Adjust position for better alignment";

  return { overall, tilt, centering: centerScore, faceRatio, feedback };
}
