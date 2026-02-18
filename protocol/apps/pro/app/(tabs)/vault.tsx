import { View, Text, StyleSheet } from "react-native";

export default function VaultScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Evidence Vault</Text>
      <Text style={styles.subtitle}>
        WORM storage with mandatory retention.
        {"\n"}Photos cannot be deleted or modified.
      </Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Certified Photos</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Active Holds</Text>
        </View>
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
    lineHeight: 20,
  },
  stats: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FF6FAE",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});
