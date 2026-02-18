import { View, Text, StyleSheet } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clinic Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hedera Network</Text>
        <Text style={styles.value}>Testnet</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topic ID</Text>
        <Text style={styles.value}>Not configured</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Retention Policy</Text>
        <Text style={styles.value}>7 years (US / HIPAA)</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <Text style={styles.value}>Basic ($50/month)</Text>
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
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#1a1a2e",
    fontWeight: "500",
  },
});
