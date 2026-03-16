import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useUnits } from "../utils/units";

type WorkoutHistoryCardProps = {
  sessionName: string;
  sessionDate: string;
  startTime: string;
  endTime: string | null;
  exerciseCount: number;
  totalVolume: number;
  notes: string | null;
  exerciseNames?: string[];
};

function fullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function relativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function parseDuration(sessionDate: string, startTime: string, endTime: string | null): string {
  if (!endTime) return "In progress";
  const toDate = (t: string) =>
    t.includes("T") || t.length > 10 ? new Date(t) : new Date(`${sessionDate}T${t}`);
  const start = toDate(startTime);
  const end = toDate(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";
  const ms = end.getTime() - start.getTime();
  if (ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  if (mins === 0) return "<1m";
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins % 60}m`;
}

const WorkoutHistoryCard = memo(function WorkoutHistoryCard({
  sessionName,
  sessionDate,
  startTime,
  endTime,
  exerciseCount,
  totalVolume,
  notes,
  exerciseNames = [],
}: WorkoutHistoryCardProps) {
  const { colors } = useTheme();
  const { toDisplay, label: unitLabel } = useUnits();

  const duration = parseDuration(sessionDate, startTime, endTime);
  const volumeDisplay = (toDisplay(totalVolume) ?? totalVolume).toLocaleString();
  const shown = exerciseNames.slice(0, 3);
  const extra = exerciseNames.length - shown.length;

  return (
    <View style={[styles.card, { borderBottomColor: colors.border }]}>
      {/* Date header row */}
      <View style={styles.dateRow}>
        <View style={[styles.dateIcon, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.dateIconText, { color: colors.primary }]}>
            {new Date(sessionDate).getDate()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sessionName, { color: colors.text }]} numberOfLines={1}>
            {sessionName}
          </Text>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>
            {relativeDate(sessionDate)}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>{duration}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Duration</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>{exerciseCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Exercises</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>{volumeDisplay} {unitLabel}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Volume</Text>
        </View>
      </View>

      {/* Exercise list */}
      {shown.length > 0 && (
        <View style={styles.exerciseList}>
          {shown.map((name, i) => (
            <Text key={i} style={[styles.exerciseName, { color: colors.textSecondary }]} numberOfLines={1}>
              {name}
            </Text>
          ))}
          {extra > 0 && (
            <Text style={[styles.moreText, { color: colors.textTertiary }]}>
              +{extra} more exercise{extra > 1 ? "s" : ""}
            </Text>
          )}
        </View>
      )}

      {notes ? (
        <Text style={[styles.notes, { color: colors.textTertiary }]} numberOfLines={2}>{notes}</Text>
      ) : null}
    </View>
  );
});

export default WorkoutHistoryCard;

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  dateIcon: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  dateIconText: { fontSize: 18, fontWeight: "800" },
  sessionName: { fontSize: 16, fontWeight: "700" },
  dateText: { fontSize: 13, marginTop: 1 },

  statsRow: { flexDirection: "row", gap: 20, marginBottom: 8 },
  statItem: {},
  statValue: { fontSize: 14, fontWeight: "600" },
  statLabel: { fontSize: 11, fontWeight: "500", marginTop: 1 },

  exerciseList: { gap: 3 },
  exerciseName: { fontSize: 13 },
  moreText: { fontSize: 12, marginTop: 2 },
  notes: { fontSize: 12, fontStyle: "italic", marginTop: 6 },
});
