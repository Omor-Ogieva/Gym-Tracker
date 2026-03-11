import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import WorkoutHistoryCard from "./WorkoutHistoryCard";

type SessionWithMeta = {
  session_id: number;
  session_name: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  exerciseCount: number;
  totalVolume: number;
};

type WorkoutHistoryListProps = {
  sessions: SessionWithMeta[];
};

export default function WorkoutHistoryList({ sessions }: WorkoutHistoryListProps) {
  const { colors } = useTheme();

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text
          style={[styles.emptyTitle, { color: colors.textSecondary }]}>
          No workouts yet
        </Text>
        <Text
          style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
          Complete your first workout to see it here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text
        style={[styles.sectionTitle, { color: colors.text }]}
        >Workout History</Text>
      <View style={styles.list}>
        {sessions.map((session) => (
          <WorkoutHistoryCard
            key={session.session_id}
            sessionName={session.session_name}
            sessionDate={session.session_date}
            startTime={session.start_time}
            endTime={session.end_time}
            exerciseCount={session.exerciseCount}
            totalVolume={session.totalVolume}
            notes={session.notes}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  list: { gap: 12 },
  emptyContainer: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
});