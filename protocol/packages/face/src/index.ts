export type { FaceDetection, DetectionConfig, FaceDetector } from "./detect";
export { DEFAULT_CONFIG } from "./detect";

export {
  LANDMARK_REGIONS,
  getRegionPoints,
  getRegionCenter,
  getBoundingBox,
  getInterPupillaryDistance,
  getFaceEllipse,
  getEyeEllipses,
} from "./landmarks";
export type { Point } from "./landmarks";

export { scoreAlignment } from "./alignment";
export type { FaceLandmarks68, AlignmentScore } from "./alignment";

export {
  generateBlurRegions,
  createBlurMask,
  DEFAULT_PRIVACY_CONFIG,
} from "./privacy";
export type { BlurRegion, PrivacyConfig } from "./privacy";
