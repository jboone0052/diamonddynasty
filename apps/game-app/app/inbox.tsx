import { Pressable, ScrollView, Text, View } from "react-native";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function InboxScreen() {
  const { game, markMessageRead } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      {game.mailbox.messages.map((message) => (
        <View key={message.id} style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 8, backgroundColor: message.isRead ? "white" : "#f9fafb" }}>
          <Text style={{ fontWeight: "700" }}>{message.subject}</Text>
          <Text>{message.sender} | {message.date} | {message.category}</Text>
          <Text>{message.body}</Text>
          {!message.isRead ? (
            <Pressable onPress={() => markMessageRead(message.id)} style={{ padding: 8, borderWidth: 1, borderRadius: 8 }}>
              <Text>Mark Read</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
