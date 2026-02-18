import { View, Text, StyleSheet } from "react-native";

export default function PatientsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patients</Text>
      <Text style={styles.subtitle}>
        Manage patient records and photo timelines.
      </Text>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No patients yet</Text>
        <Text style={styles.emptyNote}>
          Tap + to add your first patient
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
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    fontWeight: "600",
  },
  emptyNote: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 8,
  },
});
