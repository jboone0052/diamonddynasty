import { Pressable, ScrollView, Text, View } from "react-native";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function SavesScreen() {
  const { game, saves, loading, refreshSaves, loadSave, saveGame, clearLocalStorage } = useGameSessionStore();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      <Pressable onPress={refreshSaves} style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
        <Text>Refresh Saves</Text>
      </Pressable>
      <Pressable onPress={clearLocalStorage} style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
        <Text>{loading ? "Clearing..." : "Clear Local Storage"}</Text>
      </Pressable>
      {game ? (
        <Pressable onPress={saveGame} style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
          <Text>{loading ? "Saving..." : "Save Current Game"}</Text>
        </Pressable>
      ) : null}
      {saves.map((save) => (
        <View key={save.id} style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 4 }}>
          <Text style={{ fontWeight: "700" }}>{save.saveName}</Text>
          <Text>Updated: {save.updatedAt}</Text>
          <Pressable onPress={() => loadSave(save.id)} style={{ padding: 8, borderWidth: 1, borderRadius: 8 }}>
            <Text>Load Save</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
