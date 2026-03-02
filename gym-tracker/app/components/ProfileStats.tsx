import { StyleSheet, Text, View } from "react-native";

type ProfileStatsProps = {
  totalWorkouts: number;
  totalVolume: number;
  totalExercises: number;
};

export default function ProfileStats({ totalWorkouts, totalVolume, totalExercises }: ProfileStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{totalWorkouts}</Text>
        <Text style={styles.statLabel}>Workouts</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.statValue}>{totalVolume.toLocaleString()}</Text>
        <Text style={styles.statLabel}>Total lbs</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.statValue}>{totalExercises}</Text>
        <Text style={styles.statLabel}>Exercises</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#1f2937" },
  statLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  divider: { width: 1, backgroundColor: "#e5e7eb" },
});