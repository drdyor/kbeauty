/**
 * Face detection wrapper for Glow Protocol
 *
 * Wraps face-api.js with TinyFaceDetector for lightweight face detection.
 * This module provides the interface — the actual face-api.js import
 * happens in the consumer (web vs React Native use different backends).
 *
 * Web: face-api.js with tfjs-core
 * React Native: face-api.js with @tensorflow/tfjs-react-native
 */

import type { Point } from "./landmarks";

export interface FaceDetection {
  box: { x: number; y: number; width: number; height: number };
  score: number;
  landmarks?: Point[];
}

/**
 * Configuration for face detection
 */
export interface DetectionConfig {
  inputSize?: number; // TinyFaceDetector input size (128, 160, 224, 320, 416, 512, 608)
  scoreThreshold?: number; // Minimum confidence (0-1)
  withLandmarks?: boolean; // Whether to detect 68-point landmarks
}

export const DEFAULT_CONFIG: DetectionConfig = {
  inputSize: 224, // Balance between speed and accuracy
  scoreThreshold: 0.5,
  withLandmarks: true,
};

/**
 * Face detector interface.
 * Implementations are platform-specific (web vs React Native).
 */
export interface FaceDetector {
  /**
   * Initialize the face detection models.
   * Must be called before detect().
   * @param modelPath - Path to face-api.js model files
   */
  init(modelPath: string): Promise<void>;

  /**
   * Detect faces in an image/video frame.
   * Returns array of detected faces with optional landmarks.
   */
  detect(
    input: HTMLVideoElement | HTMLCanvasElement | ImageData,
    config?: DetectionConfig
  ): Promise<FaceDetection[]>;

  /**
   * Whether models are loaded and ready
   */
  isReady(): boolean;
}
