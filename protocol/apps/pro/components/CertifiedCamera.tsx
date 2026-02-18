/**
 * CertifiedCamera — locked-down camera for clinical photography.
 *
 * Uses expo-camera CameraView with:
 * - No filters, no beauty mode, no HDR
 * - Clinical grid overlay (rule of thirds, Frankfort plane, midline)
 * - Shutter button that triggers the certification pipeline
 * - Progress indicator during hash → Hedera → watermark → encrypt
 * - Angle selector for required clinical views
 */
import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ClinicalGrid } from "./ClinicalGrid";
import {
  certifyCapture,
  type PipelineProgress,
  type CertificationResult,
  type CaptureInput,
} from "../services/captureService";
import type { CaptureAngle } from "@glow/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAMERA_HEIGHT = SCREEN_WIDTH * (4 / 3); // 4:3 aspect for clinical photos

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
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [lastResult, setLastResult] = useState<CertificationResult | null>(null);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);
    setProgress({ step: "hashing", message: "Capturing..." });
    setLastResult(null);

    try {
      // Take photo — max quality, no mirroring
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
        exif: false, // Don't include EXIF (we control metadata)
      });

      if (!photo?.base64) {
        throw new Error("Camera returned no image data");
      }

      const input: CaptureInput = {
        imageBase64: photo.base64,
        clinicId,
        patientId,
        photographerId,
        captureAngle,
        procedureType,
        deviceInfo: `${Dimensions.get("window").width}x${Dimensions.get("window").height}`,
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
  }, [capturing, clinicId, patientId, photographerId, captureAngle, procedureType, onCertified, onError]);

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6FAE" />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Camera access is required for certified photography.</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera preview */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          mode="picture"
        >
          {/* Clinical grid overlay */}
          <ClinicalGrid
            width={SCREEN_WIDTH}
            height={CAMERA_HEIGHT}
            visible={showGrid}
          />

          {/* Angle label */}
          {captureAngle && (
            <View style={styles.angleBadge}>
              <Text style={styles.angleText}>
                {captureAngle.replace(/_/g, " ").toUpperCase()}
              </Text>
            </View>
          )}

          {/* Pipeline progress overlay */}
          {capturing && progress && (
            <View style={styles.progressOverlay}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.progressText}>{progress.message}</Text>
            </View>
          )}

          {/* Certification badge */}
          {lastResult && !capturing && (
            <View style={styles.certifiedBadge}>
              <Text style={styles.certifiedIcon}>&#x2713;</Text>
              <Text style={styles.certifiedText}>Certified</Text>
              <Text style={styles.certifiedHash}>
                {lastResult.sha256Hash.slice(0, 12)}...
              </Text>
              <Text style={styles.certifiedSeq}>
                Hedera #{lastResult.hedera.sequenceNumber}
              </Text>
            </View>
          )}
        </CameraView>
      </View>

      {/* Controls bar */}
      <View style={styles.controls}>
        {/* Grid toggle */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowGrid(!showGrid)}
        >
          <Text style={styles.controlIcon}>{showGrid ? "#" : "+"}</Text>
          <Text style={styles.controlLabel}>Grid</Text>
        </TouchableOpacity>

        {/* Shutter */}
        <TouchableOpacity
          style={[styles.shutter, capturing && styles.shutterDisabled]}
          onPress={handleCapture}
          disabled={capturing}
          activeOpacity={0.7}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        {/* Placeholder for flip/settings */}
        <View style={styles.controlButton}>
          <Text style={styles.controlIcon}>&#x2699;</Text>
          <Text style={styles.controlLabel}>Locked</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    padding: 32,
  },
  cameraContainer: {
    width: SCREEN_WIDTH,
    height: CAMERA_HEIGHT,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  angleBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  angleText: {
    color: "#4FC3F7",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  progressOverlay: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  progressText: {
    color: "#fff",
    fontSize: 13,
  },
  certifiedBadge: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.85)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  certifiedIcon: {
    fontSize: 24,
    color: "#fff",
  },
  certifiedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  certifiedHash: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  certifiedSeq: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    marginTop: 1,
  },
  controls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 32,
    backgroundColor: "#1a1a2e",
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
  },
  controlIcon: {
    fontSize: 22,
    color: "#fff",
  },
  controlLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterDisabled: {
    borderColor: "#666",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  permText: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  permButton: {
    backgroundColor: "#FF6FAE",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
