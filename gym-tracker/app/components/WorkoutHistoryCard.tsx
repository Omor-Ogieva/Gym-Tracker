import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

type WorkoutHistoryCardProps = {
  sessionName: string;
  sessionDate: string;
  startTime: string;
  endTime: string | null;
  exerciseCount: number;
  totalVolume: number;
  notes: string | null;
};

export default function WorkoutHistoryCard({
  sessionName,
  sessionDate,
  startTime,
  endTime,
  exerciseCount,
  totalVolume,
  notes,
}: WorkoutHistoryCardProps) {
  const { colors } = useTheme();

  const formatDuration = () => {
    if (!endTime) return "In progress";

    let start: Date;
    let end: Date;

    if (startTime.includes("T") || startTime.length > 10) {
      start = new Date(startTime);
    } else {
      start = new Date(`${sessionDate}T${startTime}`);
    }

    if (endTime.includes("T") || endTime.length > 10) {
      end = new Date(endTime);
    } else {
      end = new Date(`${sessionDate}T${endTime}`);
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "—";
    }

    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "—";

    const totalSeconds = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs === 0 && mins === 0) return `${secs}s`;
    if (hrs === 0) return `${mins}m ${secs}s`;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]}>{sessionName}</Text>
        <Text
          style={[styles.date, { color: colors.textTertiary }]}>
          {new Date(sessionDate).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text
            style={[styles.statValue, { color: colors.primary }]}>{formatDuration()}</Text>
          <Text
            style={[styles.statLabel, { color: colors.textSecondary }]}>Duration</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[styles.statValue, { color: colors.primary }]}>{exerciseCount}</Text>
          <Text
            style={[styles.statLabel, { color: colors.textSecondary }]}>Exercises</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[styles.statValue, { color: colors.primary }]}>{totalVolume.toLocaleString()}</Text>
          <Text
            style={[styles.statLabel, { color: colors.textSecondary }]}>Volume</Text>
        </View>
      </View>
      {notes ? (
        <Text
          style={[styles.notes, { color: colors.textSecondary }]}>{notes}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, borderWidth: 1, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "700" },
  date: { fontSize: 13 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  notes: { fontSize: 13, fontStyle: "italic" },
});