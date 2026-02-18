import { View, Text, StyleSheet } from "react-native";

export default function VerifyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Photo</Text>
      <Text style={styles.subtitle}>
        Check if any photo is a certified Glow Protocol image.
      </Text>
      <View style={styles.dropzone}>
        <Text style={styles.dropzoneText}>Tap to select a photo</Text>
        <Text style={styles.dropzoneNote}>
          We'll check the SHA-256 hash against the blockchain
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
    padding: 20,
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
    marginBottom: 20,
  },
  dropzone: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FF6FAE",
    borderStyle: "dashed",
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dropzoneText: {
    fontSize: 16,
    color: "#FF6FAE",
    fontWeight: "600",
  },
  dropzoneNote: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});
