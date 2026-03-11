import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { db, isOnline } from "../backend/db";
import { useTheme } from "../theme/ThemeContext";
import ProfileHeader from "../components/ProfileHeader";
import ProfileStats from "../components/ProfileStats";
import WorkoutHistoryList from "../components/WorkoutHistoryList";

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
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<SessionWithMeta[]>([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalVolume: 0, totalExercises: 0 });

  const loadProfile = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: { user } } = await db.getUser();
      if (!user) { setError("Not authenticated"); setLoading(false); return; }

      // Load profile and sessions in parallel
      const [profileResult, sessionsResult] = await Promise.all([
        db.getUserProfile(user.id),
        db.getWorkoutSessions(user.id),
      ]);

      if (profileResult.error) { setError(profileResult.error.message); setLoading(false); return; }
      setProfile(profileResult.data);

      if (sessionsResult.error) { setError(sessionsResult.error.message); setLoading(false); return; }

      const sessionsData = sessionsResult.data ?? [];

      // Load all exercises for all sessions in parallel
      const exerciseResults = await Promise.all(
        sessionsData.map((session: any) => db.getSessionExercises(session.session_id))
      );

      // Collect all session exercises, then load all sets in parallel
      const allSessionExercises: { sessionIndex: number; exercise: any }[] = [];
      exerciseResults.forEach((result, sessionIndex) => {
        (result.data ?? []).forEach((exercise: any) => {
          allSessionExercises.push({ sessionIndex, exercise });
        });
      });

      const setsResults = await Promise.all(
        allSessionExercises.map(({ exercise }) =>
          db.getSessionExerciseSets(exercise.session_exercise_id)
        )
      );

      // Build enriched sessions
      let overallVolume = 0;
      const uniqueExercises = new Set<string>();
      const sessionVolumeMap: Record<number, number> = {};
      const sessionExerciseCountMap: Record<number, number> = {};

      // Initialize
      sessionsData.forEach((_: any, i: number) => {
        sessionVolumeMap[i] = 0;
        sessionExerciseCountMap[i] = (exerciseResults[i].data ?? []).length;
      });

      allSessionExercises.forEach(({ sessionIndex, exercise }, setIndex) => {
        uniqueExercises.add(exercise.exercise_id);
        const sets = setsResults[setIndex].data ?? [];
        for (const set of sets) {
          if (set.completed && set.weight != null && set.reps != null) {
            sessionVolumeMap[sessionIndex] += set.weight * set.reps;
          }
        }
      });

      const enrichedSessions: SessionWithMeta[] = sessionsData.map((session: any, i: number) => {
        const vol = sessionVolumeMap[i];
        overallVolume += vol;
        return {
          session_id: session.session_id,
          session_name: session.session_name,
          session_date: session.session_date,
          start_time: session.start_time,
          end_time: session.end_time,
          notes: session.notes,
          exerciseCount: sessionExerciseCountMap[i],
          totalVolume: vol,
        };
      });

      setSessions(enrichedSessions);
      setStats({ totalWorkouts: enrichedSessions.length, totalVolume: overallVolume, totalExercises: uniqueExercises.size });
    } catch (e: any) { setError(e.message ?? "Something went wrong"); }
    setLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16, paddingTop: 60, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginBottom: 4 }}>
        <View style={{ flex: 1 }} />
        <Pressable
          style={({ pressed }) => [{
            width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface,
            alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border,
          }, pressed && { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => router.push("/settings")}
        >
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </Pressable>
      </View>

      {!isOnline && <Text style={{ textAlign: "center", color: colors.warning, fontWeight: "600", marginBottom: 8 }}>⚡ Offline Mode</Text>}
      {error && <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text>}

      {profile && (
        <ProfileHeader username={profile.username} email={profile.email} memberSince={new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })} />
      )}

      <ProfileStats totalWorkouts={stats.totalWorkouts} totalVolume={stats.totalVolume} totalExercises={stats.totalExercises} />

      <View style={{ marginTop: 24 }}>
        <WorkoutHistoryList sessions={sessions} />
      </View>
    </ScrollView>
  );
}