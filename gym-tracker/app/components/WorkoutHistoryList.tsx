import { StyleSheet, Text, View } from "react-native";
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
  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏋️</Text>
        <Text style={styles.emptyTitle}>No workouts yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete your first workout to see it here!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Workout History</Text>
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
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937" },
  list: { gap: 12 },
  emptyContainer: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#6b7280" },
  emptySubtitle: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
});