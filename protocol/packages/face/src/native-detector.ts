/**
 * NativeDetector for Glow Protocol
 *
 * Wrapper for platform-specific face detection result mapping.
 * Primarily for React Native MLKit Face Detection result mapping to internal FaceResult.
 */

import { LivenessFaceResult } from "./liveness";
import type { FaceDetection } from "./detect";
import type { Point } from "./landmarks";

/**
 * Result structure from @infinitered/react-native-mlkit-face-detection
 */
export interface MLKitFace {
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  smilingProbability?: number;
  headEulerAngleY?: number; // yaw
  headEulerAngleX?: number; // pitch
  headEulerAngleZ?: number; // roll
  bounds: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
  landmarks?: {
    [key: string]: { x: number; y: number };
  };
}

export class NativeDetector {
  /**
   * Map native MLKit face result to internal LivenessFaceResult
   * @param nativeFace Result from @infinitered/react-native-mlkit-face-detection
   */
  public static mapMLKitResult(nativeFace: MLKitFace): LivenessFaceResult {
    return {
      leftEyeOpenProbability: nativeFace.leftEyeOpenProbability,
      rightEyeOpenProbability: nativeFace.rightEyeOpenProbability,
      yawAngle: nativeFace.headEulerAngleY,
      pitchAngle: nativeFace.headEulerAngleX,
      smilingProbability: nativeFace.smilingProbability,
    };
  }

  /**
   * Map native MLKit face result to internal FaceDetection interface
   * @param nativeFace Result from @infinitered/react-native-mlkit-face-detection
   */
  public static mapToFaceDetection(nativeFace: MLKitFace): FaceDetection {
    // Map native landmarks to Point array if available
    // Note: MLKit and face-api.js landmark mappings differ, this is a simplified mapping
    let landmarks: Point[] | undefined;
    if (nativeFace.landmarks) {
      landmarks = Object.values(nativeFace.landmarks).map((p) => ({
        x: p.x,
        y: p.y,
      }));
    }

    return {
      box: {
        x: nativeFace.bounds.originX,
        y: nativeFace.bounds.originY,
        width: nativeFace.bounds.width,
        height: nativeFace.bounds.height,
      },
      score: 1.0, // MLKit doesn't provide per-face score in the same way
      landmarks,
    };
  }

  /**
   * Filter and validate faces from native results
   * @param faces List of detected faces
   */
  public static processFrame(faces: MLKitFace[]): LivenessFaceResult | null {
    if (!faces || faces.length === 0) {
      return null;
    }

    // Always use the largest face for liveness detection
    const largestFace = faces.reduce((prev, current) => {
      const prevArea = prev.bounds.width * prev.bounds.height;
      const currentArea = current.bounds.width * current.bounds.height;
      return currentArea > prevArea ? current : prev;
    });

    return this.mapMLKitResult(largestFace);
  }
}
