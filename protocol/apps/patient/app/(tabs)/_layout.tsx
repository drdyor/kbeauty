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
        name="photos"
        options={{
          title: "Photos",
          headerTitle: "My Photos",
        }}
      />
      <Tabs.Screen
        name="verify"
        options={{
          title: "Verify",
          headerTitle: "Verify Photo",
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: "Share",
          headerTitle: "Share & Reports",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "My Profile",
        }}
      />
    </Tabs>
  );
}
