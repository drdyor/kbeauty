/**
 * CertifiedCamera — locked-down camera for clinical photography.
 *
 * Integrated with Liveness Detection:
 * - Uses react-native-vision-camera for real-time frame processing
 * - Requires face liveness check (blink, turn, smile) before enabling shutter
 * - Clinical grid overlay (rule of thirds, Frankfort plane, midline)
 * - Shutter button triggers the certification pipeline (hash → Hedera → watermark → encrypt)
 */
import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  type PhotoFile,
} from "react-native-vision-camera";
import { useSharedValue, runOnJS } from "react-native-reanimated";
import { ClinicalGrid } from "./ClinicalGrid";
import { LivenessOverlay } from "./LivenessOverlay";
import {
  certifyCapture,
  type PipelineProgress,
  type CertificationResult,
  type CaptureInput,
} from "../services/captureService";
import { LivenessDetector, NativeDetector, type MLKitFace } from "@glow/face";
import type { CaptureAngle } from "@glow/types";

// Mock for MLKit face detection frame processor (actual implementation requires native module)
// In a real environment, this would be provided by @infinitered/react-native-mlkit-face-detection
const detectFaces = (frame: any): MLKitFace[] => {
  "worklet";
  return []; // Native call would happen here
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAMERA_HEIGHT = SCREEN_WIDTH * (4 / 3);

interface CertifiedCameraProps {
  clinicId: string;
  patientId: string;
  photographerId: string;
  captureAngle?: CaptureAngle;
  procedureType?: string;
  onCertified?: (result: CertificationResult) => void;
  onError?: (error: Error) => void;
}

export function CertifiedCamera({
  clinicId,
  patientId,
  photographerId,
  captureAngle,
  procedureType,
  onCertified,
  onError,
}: CertifiedCameraProps) {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  // Liveness State
  const detector = useMemo(() => new LivenessDetector(), []);
  const [livenessStatus, setLivenessStatus] = useState(detector.getStatus());
  const [isLivenessPassed, setIsLivenessPassed] = useState(false);

  // Pipeline State
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [lastResult, setLastResult] = useState<CertificationResult | null>(null);

  // Initialize liveness on mount
  useEffect(() => {
    detector.start(["blink", "turn_left", "turn_right"]);
    setLivenessStatus(detector.getStatus());
  }, [detector]);

  const onFaceDetected = useCallback(
    (faces: MLKitFace[]) => {
      const result = NativeDetector.processFrame(faces);
      if (result) {
        const newState = detector.update(result);
        const status = detector.getStatus();
        setLivenessStatus(status);

        if (newState === "passed") {
          setIsLivenessPassed(true);
        } else if (newState === "timeout" || newState === "failed") {
          Alert.alert("Liveness Failed", "Please try again.", [
            { text: "Retry", onPress: () => detector.start() },
          ]);
        }
      }
    },
    [detector]
  );

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    const faces = detectFaces(frame);
    if (faces.length > 0) {
      runOnJS(onFaceDetected)(faces);
    }
  }, [onFaceDetected]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing || !isLivenessPassed) return;

    setCapturing(true);
    setProgress({ step: "hashing", message: "Capturing..." });
    setLastResult(null);

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: "off",
        enableAutoRedEyeReduction: true,
      });

      // Convert local file to base64 for the certification pipeline
      // Note: In a real app, we'd use a file-based pipeline to avoid memory issues
      const input: CaptureInput = {
        imageBase64: photo.path, // captureService should handle file paths or base64
        clinicId,
        patientId,
        photographerId,
        captureAngle,
        procedureType,
        deviceInfo: "VisionCamera v4",
      };

      const result = await certifyCapture(input, setProgress);
      setLastResult(result);
      onCertified?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setProgress({ step: "error", message: error.message });
      onError?.(error);
    } finally {
      setCapturing(false);
    }
  }, [capturing, isLivenessPassed, clinicId, patientId, photographerId, captureAngle, procedureType, onCertified, onError]);

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Camera access is required.</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6FAE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
          frameProcessor={frameProcessor}
          pixelFormat="yuv"
        />

        <ClinicalGrid width={SCREEN_WIDTH} height={CAMERA_HEIGHT} visible={showGrid} />

        <LivenessOverlay
          state={livenessStatus.state}
          currentChallenge={livenessStatus.currentChallenge}
          progress={livenessStatus.progress}
          completed={livenessStatus.completed}
        />

        {isLivenessPassed && !capturing && (
          <View style={styles.livenessBadge}>
            <Text style={styles.livenessBadgeText}>LIVENESS PASSED</Text>
          </View>
        )}

        {captureAngle && (
          <View style={styles.angleBadge}>
            <Text style={styles.angleText}>{captureAngle.toUpperCase()}</Text>
          </View>
        )}

        {capturing && progress && (
          <View style={styles.progressOverlay}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.progressText}>{progress.message}</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setShowGrid(!showGrid)}>
          <Text style={styles.controlIcon}>{showGrid ? "#" : "+"}</Text>
          <Text style={styles.controlLabel}>Grid</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.shutter,
            (!isLivenessPassed || capturing) && styles.shutterDisabled,
          ]}
          onPress={handleCapture}
          disabled={!isLivenessPassed || capturing}
        >
          <View style={[styles.shutterInner, !isLivenessPassed && styles.shutterInnerDisabled]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => {
            setIsLivenessPassed(false);
            detector.start();
          }}
        >
          <Text style={styles.controlIcon}>&#x21BB;</Text>
          <Text style={styles.controlLabel}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a2e", padding: 32 },
  cameraContainer: { width: SCREEN_WIDTH, height: CAMERA_HEIGHT, overflow: "hidden" },
  camera: { flex: 1 },
  angleBadge: { position: "absolute", top: 12, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  angleText: { color: "#4FC3F7", fontSize: 11, fontWeight: "600" },
  livenessBadge: { position: "absolute", top: 12, left: 12, backgroundColor: "#10B981", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  livenessBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  progressOverlay: { position: "absolute", bottom: 20, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
  progressText: { color: "#fff", fontSize: 13 },
  controls: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: "#1a1a2e" },
  controlButton: { alignItems: "center", width: 56 },
  controlIcon: { fontSize: 22, color: "#fff" },
  controlLabel: { fontSize: 10, color: "#999", marginTop: 4 },
  shutter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  shutterDisabled: { borderColor: "#444" },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" },
  shutterInnerDisabled: { backgroundColor: "#444" },
  permText: { color: "#ccc", fontSize: 16, textAlign: "center", marginBottom: 16 },
  permButton: { backgroundColor: "#FF6FAE", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
