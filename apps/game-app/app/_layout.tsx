import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="index" options={{ title: "Franchise Dashboard" }} />
      <Stack.Screen name="roster" options={{ title: "Roster" }} />
      <Stack.Screen name="lineup" options={{ title: "Lineup" }} />
      <Stack.Screen name="standings" options={{ title: "Standings" }} />
      <Stack.Screen name="schedule" options={{ title: "Schedule" }} />
      <Stack.Screen name="finances" options={{ title: "Finances" }} />
      <Stack.Screen name="promotion" options={{ title: "Promotion Tracker" }} />
      <Stack.Screen name="inbox" options={{ title: "Inbox" }} />
      <Stack.Screen name="summary" options={{ title: "Season Summary" }} />
      <Stack.Screen name="saves" options={{ title: "Save / Load" }} />
    </Stack>
  );
}
