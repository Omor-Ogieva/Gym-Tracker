import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { db, isOnline } from "./backend/db";
import ProfileHeader from "./components/ProfileHeader";
import ProfileStats from "./components/ProfileStats";
import WorkoutHistoryList from "./components/WorkoutHistoryList";

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

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<SessionWithMeta[]>([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalVolume: 0, totalExercises: 0 });

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await db.getUser();
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileErr } = await db.getUserProfile(user.id);
      if (profileErr) {
        setError(profileErr.message);
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // Fetch completed workout sessions
      const { data: sessionsData, error: sessionsErr } = await db.getWorkoutSessions(user.id);
      if (sessionsErr) {
        setError(sessionsErr.message);
        setLoading(false);
        return;
      }

      // For each session, compute exercise count and total volume
      let overallVolume = 0;
      const uniqueExercises = new Set<string>();
      const enrichedSessions: SessionWithMeta[] = [];

      for (const session of sessionsData ?? []) {
        const { data: exercises } = await db.getSessionExercises(session.session_id);
        let sessionVolume = 0;

        for (const ex of exercises ?? []) {
          uniqueExercises.add(ex.exercise_id);
          const { data: sets } = await db.getSessionExerciseSets(ex.session_exercise_id);
          for (const set of sets ?? []) {
            if (set.completed && set.weight != null && set.reps != null) {
              sessionVolume += set.weight * set.reps;
            }
          }
        }

        overallVolume += sessionVolume;

        enrichedSessions.push({
          session_id: session.session_id,
          session_name: session.session_name,
          session_date: session.session_date,
          start_time: session.start_time,
          end_time: session.end_time,
          notes: session.notes,
          exerciseCount: (exercises ?? []).length,
          totalVolume: sessionVolume,
        });
      }

      setSessions(enrichedSessions);
      setStats({
        totalWorkouts: enrichedSessions.length,
        totalVolume: overallVolume,
        totalExercises: uniqueExercises.size,
      });
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {!isOnline && <Text style={styles.offlineText}>⚡ Offline Mode</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {profile && (
        <ProfileHeader
          username={profile.username}
          email={profile.email}
          memberSince={new Date(profile.created_at).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        />
      )}

      <ProfileStats
        totalWorkouts={stats.totalWorkouts}
        totalVolume={stats.totalVolume}
        totalExercises={stats.totalExercises}
      />

      <View style={styles.historySection}>
        <WorkoutHistoryList sessions={sessions} />
      </View>

      <Pressable style={styles.signOutButton} onPress={async () => { await db.signOut(); }}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#6b7280" },
  backText: { fontSize: 16, color: "#3b82f6", fontWeight: "600", marginBottom: 8 },
  offlineText: { textAlign: "center", color: "#f59e0b", fontWeight: "600", marginBottom: 8 },
  errorText: { color: "red", marginBottom: 8 },
  historySection: { marginTop: 24 },
  signOutButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#fca5a5",
    alignItems: "center",
  },
  signOutText: { fontWeight: "600", color: "#991b1b", fontSize: 16 },
});