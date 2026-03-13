import { Text, View } from "react-native";

type DashboardCardProps = {
  label: string;
  value: string;
};

export function DashboardCard({ label, value }: DashboardCardProps) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}
