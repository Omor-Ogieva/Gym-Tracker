import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { db, isOnline } from "../backend/db";
import { useTheme } from "../theme/ThemeContext";
import { useUnits } from "../utils/units";
import WorkoutHistoryList, { SessionWithMeta } from "../components/WorkoutHistoryList";

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calcStreaks(sessions: SessionWithMeta[]) {
  if (sessions.length === 0) return { current: 0, longest: 0 };
  const dates = new Set(sessions.map((s) => s.session_date.slice(0, 10)));
  const sorted = [...dates].sort();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
    if (diff === 1) { run++; longest = Math.max(longest, run); }
    else run = 1;
  }
  if (sorted.length === 1) longest = 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let current = 0;
  let d = new Date(today);
  while (dates.has(localDateStr(d))) { current++; d.setDate(d.getDate() - 1); }
  if (current === 0) {
    d = new Date(today);
    d.setDate(d.getDate() - 1);
    while (dates.has(localDateStr(d))) { current++; d.setDate(d.getDate() - 1); }
  }

  return { current, longest };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { toDisplay, label: unitLabel } = useUnits();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<SessionWithMeta[]>([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalVolume: 0, totalExercises: 0, totalSets: 0 });

  const hasDataRef = useRef(false);
  const lastFetchedRef = useRef(0);

  const loadProfile = useCallback(async (isRefresh = false) => {
    const now = Date.now();
    const isStale = now - lastFetchedRef.current > 30_000;

    // Skip if data is fresh and this isn't a manual pull-to-refresh
    if (hasDataRef.current && !isStale && !isRefresh) return;

    // Show spinner only on first load; subsequent refreshes are silent
    if (isRefresh) {
      setRefreshing(true);
    } else if (!hasDataRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const { data: { user } } = await db.getUser();
      if (!user) { setError("Not authenticated"); return; }

      const [profileResult, sessionsResult] = await Promise.all([
        db.getUserProfile(user.id),
        db.getWorkoutSessions(user.id),
      ]);

      if (profileResult.error) { setError(profileResult.error.message); return; }
      setProfile(profileResult.data);

      if (sessionsResult.error) { setError(sessionsResult.error.message); return; }
      const sessionsData = sessionsResult.data ?? [];

      // Batch fetch — 1 request for all exercises, 1 request for all sets
      const sessionIds = sessionsData.map((s: any) => s.session_id);
      const { data: allExercisesFlat } = await db.getBatchSessionExercises(sessionIds);

      const exerciseIds = (allExercisesFlat ?? []).map((ex: any) => ex.session_exercise_id);
      const { data: allSetsFlat } = await db.getBatchSessionExerciseSets(exerciseIds);

      // Build lookup maps for O(1) access
      const exercisesBySession: Record<number, any[]> = {};
      for (const ex of allExercisesFlat ?? []) {
        (exercisesBySession[ex.session_id] ??= []).push(ex);
      }
      const setsByExercise: Record<number, any[]> = {};
      for (const set of allSetsFlat ?? []) {
        (setsByExercise[set.session_exercise_id] ??= []).push(set);
      }

      let overallVolume = 0;
      let overallSets = 0;
      const uniqueExercises = new Set<string>();

      const enriched: SessionWithMeta[] = sessionsData.map((s: any) => {
        const exs = exercisesBySession[s.session_id] ?? [];
        let sessionVolume = 0;
        for (const ex of exs) {
          uniqueExercises.add(ex.exercise_id);
          for (const set of setsByExercise[ex.session_exercise_id] ?? []) {
            if (set.completed) {
              overallSets++;
              if (set.weight != null && set.reps != null) {
                sessionVolume += set.weight * set.reps;
              }
            }
          }
        }
        overallVolume += sessionVolume;
        return {
          session_id: s.session_id,
          session_name: s.session_name,
          session_date: s.session_date,
          start_time: s.start_time,
          end_time: s.end_time,
          notes: s.notes,
          exerciseCount: exs.length,
          totalVolume: sessionVolume,
          exerciseNames: exs.map((ex: any) => ex.exercise_name),
        };
      });

      enriched.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

      setSessions(enriched);
      setStats({ totalWorkouts: enriched.length, totalVolume: overallVolume, totalExercises: uniqueExercises.size, totalSets: overallSets });
      hasDataRef.current = true;
      lastFetchedRef.current = Date.now();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const handleDeleteSession = useCallback((sessionId: number) => {
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
  }, []);

  const handleEditSession = useCallback((sessionId: number, name: string, notes: string | null) => {
    setSessions((prev) =>
      prev.map((s) => s.session_id === sessionId ? { ...s, session_name: name, notes } : s)
    );
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay()); // rewind to Sunday (getDay: 0=Sun … 6=Sat)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return { dateStr: localDateStr(d), label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1) };
  });
  const workoutDates = new Set(sessions.map((s) => s.session_date.slice(0, 10)));
  const { current: currentStreak, longest: longestStreak } = calcStreaks(sessions);
  const initials = profile?.username ? profile.username.slice(0, 2).toUpperCase() : "?";

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 10 }}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor={colors.primary} />}
    >
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.username, { color: colors.text }]}>
          {profile?.username ?? "Profile"}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.settingsBtn,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.warningLight }]}>
          <Text style={[styles.offlineText, { color: colors.warning }]}>⚡ Offline Mode</Text>
        </View>
      )}
      {error && (
        <Text style={{ color: colors.danger, marginHorizontal: 20, marginBottom: 8, fontSize: 14 }}>{error}</Text>
      )}

      {/* ── Avatar + bio ── */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.bioInfo}>
          <Text style={[styles.bioName, { color: colors.text }]}>{profile?.username ?? "—"}</Text>
          {currentStreak > 0 && (
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={16} color="#ff9f0a" />
              <Text style={[styles.streakText, { color: colors.textSecondary }]}>
                {currentStreak} day streak
              </Text>
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: colors.text }]}>{stats.totalWorkouts}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: colors.text }]}>{stats.totalSets}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sets</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: colors.text }]}>
              {(toDisplay(stats.totalVolume) ?? stats.totalVolume).toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vol ({unitLabel})</Text>
          </View>
        </View>
      </View>

      {/* ── Weekly activity ── */}
      <View style={[styles.card, { backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 12 }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>THIS WEEK</Text>
          {longestStreak > 0 && (
            <View style={styles.bestStreakRow}>
              <Ionicons name="trophy-outline" size={14} color={colors.primary} />
              <Text style={[styles.bestStreakText, { color: colors.primary }]}>Best: {longestStreak} days</Text>
            </View>
          )}
        </View>
        <View style={styles.dotsRow}>
          {last7.map(({ dateStr, label }, i) => {
            const active = workoutDates.has(dateStr);
            return (
              <View key={i} style={styles.dotCell}>
                <View style={[
                  styles.dot,
                  { backgroundColor: active ? colors.primary : colors.surfaceSecondary },
                ]}>
                  {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.dotLabel, { color: active ? colors.primary : colors.textTertiary }]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Workout history ── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Workouts</Text>
      </View>
      <View style={{ marginHorizontal: 16 }}>
        <WorkoutHistoryList sessions={sessions} onDelete={handleDeleteSession} onEdit={handleEditSession} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  username: { flex: 1, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  settingsBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  offlineBanner: { marginHorizontal: 16, marginTop: 10, padding: 10, borderRadius: 10 },
  offlineText: { fontSize: 13, fontWeight: "600", textAlign: "center" },

  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
    flexWrap: "wrap",
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { fontSize: 28, fontWeight: "800" },
  bioInfo: { flex: 1 },
  bioName: { fontSize: 20, fontWeight: "700" },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  streakText: { fontSize: 14, fontWeight: "500" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  statCell: { flex: 1, alignItems: "center", paddingVertical: 10 },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32 },

  card: { borderRadius: 14, padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  cardTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  bestStreakRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  bestStreakText: { fontSize: 12, fontWeight: "600" },
  dotsRow: { flexDirection: "row", justifyContent: "space-between" },
  dotCell: { alignItems: "center", gap: 6 },
  dot: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dotLabel: { fontSize: 11, fontWeight: "600" },

  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
});
