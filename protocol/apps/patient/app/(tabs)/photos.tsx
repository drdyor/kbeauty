import { View, Text, StyleSheet } from "react-native";

export default function PhotosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Photos</Text>
      <Text style={styles.subtitle}>
        View your certified medical photos.
        {"\n"}Each photo is blockchain-verified and tamper-proof.
      </Text>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No photos yet</Text>
        <Text style={styles.emptyNote}>
          Your clinic will share photos with you after your visit
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
    lineHeight: 20,
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
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
