/**
 * Capture screen — certified medical photography.
 *
 * Wires CertifiedCamera to the capture pipeline.
 * Shows angle selector before capture, results after.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { CertifiedCamera } from "../../components/CertifiedCamera";
import { initCapturePipeline } from "../../services/captureService";
import type { CaptureAngle } from "@glow/types";
import { PHOTO_SERIES } from "@glow/types/src/photo";

// TODO: pull from clinic config / secure storage
const DEMO_CONFIG = {
  clinicId: "demo-clinic-001",
  patientId: "demo-patient-001",
  photographerId: "demo-physician-001",
};

// Hedera testnet config — matches .env in project root
const HEDERA_CONFIG = {
  operatorId: "0.0.7861233",
  operatorKey:
    "3030020100300706052b8104000a04220420b430153530c6db9d5ceb349bcbf7a8ceca6ff22af74df7aa0bd2324c1d44d500",
  network: "testnet" as const,
};

type Mode = "series_select" | "angle_select" | "capture" | "review";

export default function CaptureScreen() {
  const [mode, setMode] = useState<Mode>("series_select");
  const [hederaReady, setHederaReady] = useState(false);
  const [hederaError, setHederaError] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<CaptureAngle | undefined>(
    undefined
  );
  const [capturedCount, setCapturedCount] = useState(0);

  // Initialize Hedera on mount
  useEffect(() => {
    initCapturePipeline(HEDERA_CONFIG)
      .then(() => setHederaReady(true))
      .catch((err) => {
        setHederaError(err.message);
      });
  }, []);

  // Series selection screen
  if (mode === "series_select") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Certified Capture</Text>
        <Text style={styles.subtitle}>
          Select a photo series to begin.{"\n"}
          No filters. No beauty mode. No HDR.
        </Text>

        {/* Hedera status */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: hederaReady ? "#10b981" : hederaError ? "#ef4444" : "#f59e0b" },
            ]}
          />
          <Text style={styles.statusText}>
            {hederaReady
              ? "Hedera Testnet Connected"
              : hederaError
                ? `Hedera Error: ${hederaError}`
                : "Connecting to Hedera..."}
          </Text>
        </View>

        <ScrollView style={styles.seriesList}>
          {Object.entries(PHOTO_SERIES).map(([key, series]) => (
            <TouchableOpacity
              key={key}
              style={styles.seriesCard}
              onPress={() => {
                setSelectedSeries(key);
                setMode("angle_select");
              }}
            >
              <Text style={styles.seriesName}>{series.label}</Text>
              <Text style={styles.seriesCount}>
                {series.angles.length} angles required
              </Text>
            </TouchableOpacity>
          ))}

          {/* Quick capture — no series */}
          <TouchableOpacity
            style={[styles.seriesCard, { borderColor: "#4FC3F7" }]}
            onPress={() => {
              setSelectedSeries(null);
              setSelectedAngle(undefined);
              setMode("capture");
            }}
          >
            <Text style={styles.seriesName}>Quick Capture</Text>
            <Text style={styles.seriesCount}>
              Single photo, any angle
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Angle selection for the chosen series
  if (mode === "angle_select" && selectedSeries) {
    const series = PHOTO_SERIES[selectedSeries];
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setMode("series_select")}>
          <Text style={styles.backButton}>&#x2190; Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{series.label}</Text>
        <Text style={styles.subtitle}>
          Captured {capturedCount} of {series.angles.length}. Tap an angle to capture.
        </Text>

        <ScrollView style={styles.seriesList}>
          {series.angles.map((angle) => (
            <TouchableOpacity
              key={angle}
              style={styles.angleCard}
              onPress={() => {
                setSelectedAngle(angle);
                setMode("capture");
              }}
            >
              <Text style={styles.angleName}>
                {angle.replace(/_/g, " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Camera capture mode
  if (mode === "capture") {
    return (
      <View style={{ flex: 1 }}>
        {/* Back button overlaid on camera */}
        <TouchableOpacity
          style={styles.cameraBack}
          onPress={() => {
            if (selectedSeries) {
              setMode("angle_select");
            } else {
              setMode("series_select");
            }
          }}
        >
          <Text style={styles.cameraBackText}>&#x2190; Back</Text>
        </TouchableOpacity>

        <CertifiedCamera
          clinicId={DEMO_CONFIG.clinicId}
          patientId={DEMO_CONFIG.patientId}
          photographerId={DEMO_CONFIG.photographerId}
          captureAngle={selectedAngle}
          onCertified={(result) => {
            setCapturedCount((c) => c + 1);
            Alert.alert(
              "Photo Certified",
              `Hash: ${result.sha256Hash.slice(0, 16)}...\n` +
                `Hedera Seq: #${result.hedera.sequenceNumber}\n` +
                `Timestamp: ${result.timestamp}`,
              [
                {
                  text: "Next Angle",
                  onPress: () => {
                    if (selectedSeries) {
                      setMode("angle_select");
                    }
                  },
                },
                {
                  text: "Done",
                  onPress: () => setMode("series_select"),
                },
              ]
            );
          }}
          onError={(err) => {
            Alert.alert("Capture Error", err.message);
          }}
        />
      </View>
    );
  }

  // Fallback
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Capture</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
    padding: 20,
    paddingTop: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#666",
  },
  seriesList: {
    flex: 1,
  },
  seriesCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  seriesName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  seriesCount: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  angleCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  angleName: {
    fontSize: 14,
    color: "#1a1a2e",
    textTransform: "capitalize",
  },
  backButton: {
    fontSize: 16,
    color: "#FF6FAE",
    marginBottom: 12,
  },
  cameraBack: {
    position: "absolute",
    top: 52,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cameraBackText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
