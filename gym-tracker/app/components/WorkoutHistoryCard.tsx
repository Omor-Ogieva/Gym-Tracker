import { StyleSheet, Text, View } from "react-native";

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
  const formatDuration = () => {
    if (!endTime) return "—";
    const [sh, sm, ss] = startTime.split(":").map(Number);
    const [eh, em, es] = endTime.split(":").map(Number);
    const startSec = sh * 3600 + sm * 60 + (ss || 0);
    const endSec = eh * 3600 + em * 60 + (es || 0);
    const diff = Math.max(0, endSec - startSec);
    const mins = Math.floor(diff / 60);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{sessionName}</Text>
        <Text style={styles.date}>{formatDate(sessionDate)}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Duration</Text>
          <Text style={styles.metaValue}>{formatDuration()}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Exercises</Text>
          <Text style={styles.metaValue}>{exerciseCount}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Volume</Text>
          <Text style={styles.metaValue}>{totalVolume.toLocaleString()} lbs</Text>
        </View>
      </View>

      {notes ? <Text style={styles.notes}>{notes}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 16, fontWeight: "700", color: "#1f2937", flex: 1 },
  date: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  metaRow: { flexDirection: "row", gap: 16 },
  metaItem: { gap: 2 },
  metaLabel: { fontSize: 11, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase" },
  metaValue: { fontSize: 14, fontWeight: "600", color: "#374151" },
  notes: { fontSize: 13, color: "#6b7280", fontStyle: "italic" },
});