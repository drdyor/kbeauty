import { View, Text, StyleSheet } from "react-native";

export default function ShareScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share & Reports</Text>
      <Text style={styles.subtitle}>
        Share verified photos with your lawyer or insurance company.
        {"\n"}Generate court-admissible legal reports.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Legal Report</Text>
        <Text style={styles.cardDescription}>
          Generate a PDF with SHA-256 hash, Hedera proof, and QR verification code.
        </Text>
        <Text style={styles.price}>$5 per report</Text>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6FAE",
  },
});
