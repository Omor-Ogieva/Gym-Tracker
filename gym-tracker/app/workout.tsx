import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "./backend/db";
import { useTheme } from "./theme/ThemeContext";
import { useGuardedPress } from "./utils/pressGuard";

export default function WorkoutScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { colors } = useTheme();
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId: string }>();

  const [session, setSession] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseSets, setExerciseSets] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const startTimestamp = useRef<number>(Date.now());

  const [setOptionsVisible, setSetOptionsVisible] = useState(false);
  const [selectedSet, setSelectedSet] = useState<any>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);

  const totalVolume = useMemo(() => {
    let total = 0;
    for (const sets of Object.values(exerciseSets)) {
      for (const set of sets) {
        if (set.completed && set.weight != null && set.reps != null) {
          total += set.weight * set.reps;
        }
      }
    }
    return total;
  }, [exerciseSets]);

  useEffect(() => {
    if (!session || session.end_time) return;
    startTimestamp.current = Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimestamp.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, []);

  const loadSession = async () => {
    setLoading(true);
    const sessionId = parseInt(sessionIdParam, 10);

    const [sessionResult, exercisesResult] = await Promise.all([
      db.getWorkoutSession(sessionId),
      db.getSessionExercises(sessionId),
    ]);

    if (sessionResult.data) {
      setSession(sessionResult.data);
      setNotes(sessionResult.data.notes ?? "");
    }

    const exs = exercisesResult.data ?? [];
    setExercises(exs);

    // Load all sets in parallel
    const setsResults = await Promise.all(
      exs.map((ex: any) => db.getSessionExerciseSets(ex.session_exercise_id))
    );

    const setsMap: Record<number, any[]> = {};
    exs.forEach((ex: any, i: number) => {
      setsMap[ex.session_exercise_id] = setsResults[i].data ?? [];
    });
    setExerciseSets(setsMap);
    setLoading(false);
  };

  const reloadSetsForExercise = async (sessionExerciseId: number) => {
    const { data } = await db.getSessionExerciseSets(sessionExerciseId);
    setExerciseSets((prev) => ({ ...prev, [sessionExerciseId]: data ?? [] }));
  };

  // Optimistic update + background sync
  const updateSet = useCallback(async (
    sessionSetId: number,
    sessionExerciseId: number,
    updates: { reps?: number | null; weight?: number | null; is_warmup?: boolean; completed?: boolean }
  ) => {
    // Optimistic update
    setExerciseSets((prev) => {
      const sets = prev[sessionExerciseId] ?? [];
      return {
        ...prev,
        [sessionExerciseId]: sets.map((s) =>
          s.session_set_id === sessionSetId ? { ...s, ...updates } : s
        ),
      };
    });

    const { error } = await db.updateSessionExerciseSet(sessionSetId, updates);
    if (error) {
      setError(error.message);
      // Rollback on error
      reloadSetsForExercise(sessionExerciseId);
    }
  }, []);

  const addSet = useGuardedPress(async (sessionExerciseId: number) => {
    const currentSets = exerciseSets[sessionExerciseId] ?? [];
    setError(null);

    let prefillWeight: number | null = null;
    let prefillReps: number | null = null;

    for (let i = currentSets.length - 1; i >= 0; i--) {
      const s = currentSets[i];
      if (s.weight != null || s.reps != null) {
        prefillWeight = s.weight ?? null;
        prefillReps = s.reps ?? null;
        break;
      }
    }

    const { error } = await db.insertSessionExerciseSet({
      session_exercise_id: sessionExerciseId,
      set_number: currentSets.length + 1,
      weight: prefillWeight,
      reps: prefillReps,
      is_warmup: false,
    });
    if (error) setError(error.message);
    else reloadSetsForExercise(sessionExerciseId);
  }, 300);

  const deleteSet = async (sessionSetId: number, sessionExerciseId: number) => {
    // Optimistic remove
    setExerciseSets((prev) => ({
      ...prev,
      [sessionExerciseId]: (prev[sessionExerciseId] ?? []).filter(
        (s) => s.session_set_id !== sessionSetId
      ),
    }));

    const { error } = await db.deleteSessionExerciseSet(sessionSetId);
    if (error) {
      setError(error.message);
      reloadSetsForExercise(sessionExerciseId);
    }
  };

  const openSetOptions = useCallback((set: any, sessionExerciseId: number) => {
    setSelectedSet(set);
    setSelectedExerciseId(sessionExerciseId);
    setSetOptionsVisible(true);
  }, []);

  const closeSetOptions = useCallback(() => {
    setSetOptionsVisible(false);
    setSelectedSet(null);
    setSelectedExerciseId(null);
  }, []);

  const handleToggleWarmup = useGuardedPress(async () => {
    if (!selectedSet || !selectedExerciseId) return;
    await updateSet(selectedSet.session_set_id, selectedExerciseId, {
      is_warmup: !selectedSet.is_warmup,
    });
    closeSetOptions();
  });

  const handleRemoveSet = useGuardedPress(async () => {
    if (!selectedSet || !selectedExerciseId) return;
    await deleteSet(selectedSet.session_set_id, selectedExerciseId);
    closeSetOptions();
  });

  const finishWorkout = useGuardedPress(async () => {
    if (!session) return;
    setError(null);
    const { error } = await db.finishWorkoutSession(session.session_id, notes || null);
    if (error) setError(error.message);
    else router.back();
  }, 1000);

  const discardWorkout = useGuardedPress(async () => {
    if (!session) return;
    await db.deleteWorkoutSession(session.session_id);
    router.back();
  }, 1000);

  useEffect(() => { loadSession(); }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading workout...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Session not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollRef}
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>{session.session_name}</Text>
            <Text style={[styles.volumeText, { color: colors.textSecondary }]}>
              Volume: {totalVolume.toLocaleString()} lbs
            </Text>
          </View>
          <Text style={[styles.timer, { color: colors.primary }]}>{formatTime(elapsed)}</Text>
        </View>

        {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

        {exercises.map((ex) => {
          const sets = exerciseSets[ex.session_exercise_id] ?? [];
          return (
            <View key={ex.session_exercise_id} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.exerciseName, { color: colors.text }]}>{ex.exercise_name}</Text>

              {sets.length > 0 && (
                <View style={[styles.setHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.headerCell, { width: 40, color: colors.textSecondary }]}>Set</Text>
                  <Text style={[styles.headerCell, { flex: 1, color: colors.textSecondary }]}>lbs</Text>
                  <Text style={[styles.headerCell, { flex: 1, color: colors.textSecondary }]}>Reps</Text>
                  <Text style={[styles.headerCell, { width: 50, color: colors.textSecondary }]}></Text>
                </View>
              )}

              {sets.map((set) => (
                <SetRow
                  key={set.session_set_id}
                  set={set}
                  sessionExerciseId={ex.session_exercise_id}
                  onUpdate={updateSet}
                  onSetNumberPress={openSetOptions}
                  scrollRef={scrollRef}
                />
              ))}

              <Pressable style={[styles.addSetButton, { backgroundColor: colors.primary }]} onPress={() => addSet(ex.session_exercise_id)}>
                <Text style={styles.addSetText}>+ Add Set</Text>
              </Pressable>
            </View>
          );
        })}

        <TextInput
          style={[styles.notesInput, { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Workout notes..."
          placeholderTextColor={colors.textTertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={styles.actions}>
          <Pressable style={[styles.finishButton, { backgroundColor: colors.success }]} onPress={finishWorkout}>
            <Text style={styles.finishText}>Finish Workout</Text>
          </Pressable>
          <Pressable style={[styles.discardButton, { backgroundColor: colors.dangerLight }]} onPress={discardWorkout}>
            <Text style={[styles.discardText, { color: colors.danger }]}>Discard</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={setOptionsVisible} transparent animationType="fade" onRequestClose={closeSetOptions}>
        <Pressable style={modalStyles.overlay} onPress={closeSetOptions}>
          <View style={[modalStyles.container, { backgroundColor: colors.surface }]}>
            <Text style={[modalStyles.title, { color: colors.text }]}>Set #{selectedSet?.set_number}</Text>
            {selectedSet?.is_warmup && (
              <View style={[modalStyles.warmupBadge, { backgroundColor: colors.warningLight }]}>
                <Text style={modalStyles.warmupBadgeText}>Warmup Set</Text>
              </View>
            )}
            <Pressable style={modalStyles.option} onPress={handleToggleWarmup}>
              <Text style={modalStyles.optionIcon}>🔥</Text>
              <Text style={[modalStyles.optionText, { color: colors.text }]}>{selectedSet?.is_warmup ? "Remove Warmup" : "Mark as Warmup"}</Text>
            </Pressable>
            <View style={[modalStyles.divider, { backgroundColor: colors.border }]} />
            <Pressable style={[modalStyles.option, { backgroundColor: colors.dangerLight }]} onPress={handleRemoveSet}>
              <Text style={modalStyles.removeIcon}>🗑</Text>
              <Text style={[modalStyles.removeText, { color: colors.danger }]}>Remove Set</Text>
            </Pressable>
            <Pressable style={[modalStyles.cancelButton, { backgroundColor: colors.surfaceSecondary }]} onPress={closeSetOptions}>
              <Text style={[modalStyles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function SetRow({
  set,
  sessionExerciseId,
  onUpdate,
  onSetNumberPress,
  scrollRef,
}: {
  set: any;
  sessionExerciseId: number;
  onUpdate: (id: number, exId: number, updates: any) => void;
  onSetNumberPress: (set: any, sessionExerciseId: number) => void;
  scrollRef: React.RefObject<ScrollView>;
}) {
  const { colors } = useTheme();
  const [weight, setWeight] = useState(set.weight != null ? String(set.weight) : "");
  const [reps, setReps] = useState(set.reps != null ? String(set.reps) : "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setWeight(set.weight != null ? String(set.weight) : "");
    setReps(set.reps != null ? String(set.reps) : "");
  }, [set.weight, set.reps]);

  // Debounced commit — saves 500ms after the user stops typing
  const commitWeight = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const val = weight ? parseFloat(weight) : null;
      if (val !== set.weight) onUpdate(set.session_set_id, sessionExerciseId, { weight: val });
    }, 500);
  }, [weight, set.weight, set.session_set_id, sessionExerciseId, onUpdate]);

  const commitReps = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const val = reps ? parseInt(reps, 10) : null;
      if (val !== set.reps) onUpdate(set.session_set_id, sessionExerciseId, { reps: val });
    }, 500);
  }, [reps, set.reps, set.session_set_id, sessionExerciseId, onUpdate]);

  // Commit immediately on blur
  const commitWeightNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const val = weight ? parseFloat(weight) : null;
    if (val !== set.weight) onUpdate(set.session_set_id, sessionExerciseId, { weight: val });
  }, [weight, set.weight, set.session_set_id, sessionExerciseId, onUpdate]);

  const commitRepsNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const val = reps ? parseInt(reps, 10) : null;
    if (val !== set.reps) onUpdate(set.session_set_id, sessionExerciseId, { reps: val });
  }, [reps, set.reps, set.session_set_id, sessionExerciseId, onUpdate]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const toggleCompleted = useCallback(() => {
    // Commit any pending values first
    const weightVal = weight ? parseFloat(weight) : null;
    const repsVal = reps ? parseInt(reps, 10) : null;
    const updates: any = { completed: !set.completed };
    if (weightVal !== set.weight) updates.weight = weightVal;
    if (repsVal !== set.reps) updates.reps = repsVal;
    onUpdate(set.session_set_id, sessionExerciseId, updates);
  }, [weight, reps, set, sessionExerciseId, onUpdate]);

  const isCompleted = set.completed === true;
  const isWarmup = set.is_warmup === true;

  return (
    <View style={[rowStyles.row, isCompleted && { backgroundColor: colors.successLight }]}>
      <Pressable
        style={[
          rowStyles.setNumberBtn,
          { width: 40, backgroundColor: colors.surfaceSecondary },
          isWarmup && { backgroundColor: colors.warningLight },
        ]}
        onPress={() => onSetNumberPress(set, sessionExerciseId)}
      >
        <Text style={[
          rowStyles.setNumberText,
          { color: colors.textSecondary },
          isWarmup && { color: "#92400e" },
          isCompleted && { color: colors.success },
        ]}>
          {isWarmup ? "W" : set.set_number}
        </Text>
      </Pressable>
      <TextInput
        style={[
          rowStyles.input,
          { flex: 1, borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text },
          isCompleted && { backgroundColor: colors.successLight, borderColor: colors.success, color: colors.success },
        ]}
        value={weight}
        onChangeText={(t) => { setWeight(t); }}
        onBlur={commitWeightNow}
        keyboardType="numeric"
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
        editable={!isCompleted}
        onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200)}
      />
      <TextInput
        style={[
          rowStyles.input,
          { flex: 1, borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text },
          isCompleted && { backgroundColor: colors.successLight, borderColor: colors.success, color: colors.success },
        ]}
        value={reps}
        onChangeText={(t) => { setReps(t); }}
        onBlur={commitRepsNow}
        keyboardType="numeric"
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
        editable={!isCompleted}
        onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200)}
      />
      <Pressable
        style={[
          rowStyles.checkBtn,
          { width: 50, backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          isCompleted && { backgroundColor: colors.success, borderColor: colors.success },
        ]}
        onPress={toggleCompleted}
      >
        <Text style={[
          rowStyles.checkText,
          { color: colors.textTertiary },
          isCompleted && { color: "#fff" },
        ]}>
          ✓
        </Text>
      </Pressable>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  container: { borderRadius: 16, padding: 24, width: 280, alignItems: "center", elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  warmupBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 16 },
  warmupBadgeText: { fontSize: 12, fontWeight: "700", color: "#92400e" },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, width: "100%", borderRadius: 10, gap: 12 },
  optionIcon: { fontSize: 20 },
  optionText: { fontSize: 16, fontWeight: "600" },
  divider: { height: 1, width: "100%", marginVertical: 4 },
  removeIcon: { fontSize: 20 },
  removeText: { fontSize: 16, fontWeight: "600" },
  cancelButton: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 10, width: "100%", alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "600" },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 4, borderRadius: 6, paddingHorizontal: 4 },
  setNumberBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 6, borderRadius: 6 },
  setNumberText: { fontSize: 14, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 6, padding: 8, fontSize: 16, textAlign: "center" },
  checkBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 6, borderWidth: 2 },
  checkText: { fontSize: 18, fontWeight: "700" },
});

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  volumeText: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  timer: { fontSize: 24, fontWeight: "700", fontVariant: ["tabular-nums"] },
  backText: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  errorText: { marginBottom: 8 },
  exerciseCard: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  exerciseName: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  setHeader: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, marginBottom: 4 },
  headerCell: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  addSetButton: { marginTop: 8, paddingVertical: 8, borderRadius: 6, alignItems: "center" },
  addSetText: { color: "#fff", fontWeight: "600" },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, minHeight: 80, textAlignVertical: "top", marginBottom: 16 },
  actions: { gap: 12 },
  finishButton: { paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  finishText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  discardButton: { paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  discardText: { fontSize: 16, fontWeight: "600" },
});