import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import type { LivenessChallenge, LivenessState } from "@glow/face";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LivenessOverlayProps {
  state: LivenessState;
  currentChallenge: LivenessChallenge | null;
  progress: number;
  completed: LivenessChallenge[];
}

export function LivenessOverlay({
  state,
  currentChallenge,
  progress,
  completed,
}: LivenessOverlayProps) {
  if (state === "idle" || state === "passed") {
    return null;
  }

  const getChallengeText = (challenge: LivenessChallenge | null) => {
    switch (challenge) {
      case "blink":
        return "Blink both eyes";
      case "turn_left":
        return "Turn your head to the left";
      case "turn_right":
        return "Turn your head to the right";
      case "nod":
        return "Nod your head up and down";
      case "smile":
        return "Give us a big smile";
      default:
        return "Position your face in the frame";
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case "failed":
        return "#EF4444";
      case "timeout":
        return "#F59E0B";
      default:
        return "#FF6FAE";
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.badgeText}>
          {state === "challenging" ? "Liveness Check" : state.toUpperCase()}
        </Text>
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          {state === "challenging"
            ? getChallengeText(currentChallenge)
            : state === "timeout"
            ? "Time limit exceeded. Please try again."
            : "Verification failed. Please try again."}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: getStatusColor() },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {completed.length} of {Math.round(completed.length / (progress || 1))}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 100,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  instructionContainer: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    width: "100%",
    alignItems: "center",
  },
  instructionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  progressContainer: {
    marginTop: 12,
    width: "60%",
    alignItems: "center",
  },
  progressBar: {
    height: 4,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  progressText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
});
