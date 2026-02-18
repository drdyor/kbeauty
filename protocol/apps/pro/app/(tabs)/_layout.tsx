import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF6FAE",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f0f0f0",
        },
      }}
    >
      <Tabs.Screen
        name="capture"
        options={{
          title: "Capture",
          headerTitle: "Certified Capture",
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          headerTitle: "Patient Management",
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "Vault",
          headerTitle: "Evidence Vault",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerTitle: "Clinic Settings",
        }}
      />
    </Tabs>
  );
}
