import { useEffect, useState, useRef, useMemo } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "./backend/db";

export default function WorkoutScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId: string }>();

  const [session, setSession] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseSets, setExerciseSets] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const startTimestamp = useRef<number>(Date.now());

  // Set options modal state
  const [setOptionsVisible, setSetOptionsVisible] = useState(false);
  const [selectedSet, setSelectedSet] = useState<any>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);

  // Calculate total confirmed volume (weight × reps for completed sets)
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

  // Timer — counts up from 00:00 when workout screen loads
  useEffect(() => {
    if (!session || session.end_time) return;
    startTimestamp.current = Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimestamp.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Load session data
  const loadSession = async () => {
    setLoading(true);
    const sessionId = parseInt(sessionIdParam, 10);
    const { data } = await db.getWorkoutSession(sessionId);
    if (data) {
      setSession(data);
      setNotes(data.notes ?? "");
    }

    const { data: exs } = await db.getSessionExercises(sessionId);
    setExercises(exs ?? []);

    // Load all sets for all exercises
    const setsMap: Record<number, any[]> = {};
    for (const ex of exs ?? []) {
      const { data: sets } = await db.getSessionExerciseSets(ex.session_exercise_id);
      setsMap[ex.session_exercise_id] = sets ?? [];
    }
    setExerciseSets(setsMap);
    setLoading(false);
  };

  const reloadSetsForExercise = async (sessionExerciseId: number) => {
    const { data } = await db.getSessionExerciseSets(sessionExerciseId);
    setExerciseSets((prev) => ({ ...prev, [sessionExerciseId]: data ?? [] }));
  };

  // Update a set inline
  const updateSet = async (
    sessionSetId: number,
    sessionExerciseId: number,
    updates: { reps?: number | null; weight?: number | null; is_warmup?: boolean; completed?: boolean }
  ) => {
    setError(null);
    const { error } = await db.updateSessionExerciseSet(sessionSetId, updates);
    if (error) setError(error.message);
    else reloadSetsForExercise(sessionExerciseId);
  };

  // Add a set to an exercise
  const addSet = async (sessionExerciseId: number) => {
    const currentSets = exerciseSets[sessionExerciseId] ?? [];
    setError(null);
    const { error } = await db.insertSessionExerciseSet({
      session_exercise_id: sessionExerciseId,
      set_number: currentSets.length + 1,
      weight: null,
      reps: null,
      is_warmup: false,
    });
    if (error) setError(error.message);
    else reloadSetsForExercise(sessionExerciseId);
  };

  // Delete a set
  const deleteSet = async (sessionSetId: number, sessionExerciseId: number) => {
    setError(null);
    const { error } = await db.deleteSessionExerciseSet(sessionSetId);
    if (error) setError(error.message);
    else reloadSetsForExercise(sessionExerciseId);
  };

  // Set options modal handlers
  const openSetOptions = (set: any, sessionExerciseId: number) => {
    setSelectedSet(set);
    setSelectedExerciseId(sessionExerciseId);
    setSetOptionsVisible(true);
  };

  const closeSetOptions = () => {
    setSetOptionsVisible(false);
    setSelectedSet(null);
    setSelectedExerciseId(null);
  };

  const handleToggleWarmup = async () => {
    if (!selectedSet || !selectedExerciseId) return;
    await updateSet(selectedSet.session_set_id, selectedExerciseId, {
      is_warmup: !selectedSet.is_warmup,
    });
    closeSetOptions();
  };

  const handleRemoveSet = async () => {
    if (!selectedSet || !selectedExerciseId) return;
    await deleteSet(selectedSet.session_set_id, selectedExerciseId);
    closeSetOptions();
  };

  // Finish workout
  const finishWorkout = async () => {
    if (!session) return;
    setError(null);
    const { error } = await db.finishWorkoutSession(session.session_id, notes || null);
    if (error) setError(error.message);
    else router.back();
  };

  // Discard workout
  const discardWorkout = async () => {
    if (!session) return;
    await db.deleteWorkoutSession(session.session_id);
    router.back();
  };

  useEffect(() => {
    loadSession();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading workout...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text>Session not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{session.session_name}</Text>
            <Text style={styles.volumeText}>
              Volume: {totalVolume.toLocaleString()} lbs
            </Text>
          </View>
          <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Exercises */}
        {exercises.map((ex) => {
          const sets = exerciseSets[ex.session_exercise_id] ?? [];
          return (
            <View key={ex.session_exercise_id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{ex.exercise_name}</Text>

              {/* Set header */}
              {sets.length > 0 && (
                <View style={styles.setHeader}>
                  <Text style={[styles.headerCell, { width: 40 }]}>Set</Text>
                  <Text style={[styles.headerCell, { flex: 1 }]}>lbs</Text>
                  <Text style={[styles.headerCell, { flex: 1 }]}>Reps</Text>
                  <Text style={[styles.headerCell, { width: 50 }]}></Text>
                </View>
              )}

              {/* Set rows */}
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

              <Pressable style={styles.addSetButton} onPress={() => addSet(ex.session_exercise_id)}>
                <Text style={styles.addSetText}>+ Add Set</Text>
              </Pressable>
            </View>
          );
        })}

        {/* Notes */}
        <TextInput
          style={styles.notesInput}
          placeholder="Workout notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.finishButton} onPress={finishWorkout}>
            <Text style={styles.finishText}>Finish Workout</Text>
          </Pressable>
          <Pressable style={styles.discardButton} onPress={discardWorkout}>
            <Text style={styles.discardText}>Discard</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Set Options Modal */}
      <Modal
        visible={setOptionsVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSetOptions}
      >
        <Pressable style={modalStyles.overlay} onPress={closeSetOptions}>
          <View style={modalStyles.container}>
            <Text style={modalStyles.title}>
              Set #{selectedSet?.set_number}
            </Text>

            {selectedSet?.is_warmup && (
              <View style={modalStyles.warmupBadge}>
                <Text style={modalStyles.warmupBadgeText}>Warmup Set</Text>
              </View>
            )}

            <Pressable
              style={modalStyles.option}
              onPress={handleToggleWarmup}
            >
              <Text style={modalStyles.optionIcon}>
                {selectedSet?.is_warmup ? "🔥" : "🔥"}
              </Text>
              <Text style={modalStyles.optionText}>
                {selectedSet?.is_warmup ? "Remove Warmup" : "Mark as Warmup"}
              </Text>
            </Pressable>

            <View style={modalStyles.divider} />

            <Pressable
              style={[modalStyles.option, modalStyles.removeOption]}
              onPress={handleRemoveSet}
            >
              <Text style={modalStyles.removeIcon}>🗑</Text>
              <Text style={modalStyles.removeText}>Remove Set</Text>
            </Pressable>

            <Pressable style={modalStyles.cancelButton} onPress={closeSetOptions}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Inline editable set row
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
  const [weight, setWeight] = useState(set.weight != null ? String(set.weight) : "");
  const [reps, setReps] = useState(set.reps != null ? String(set.reps) : "");

  const commitWeight = () => {
    const val = weight ? parseFloat(weight) : null;
    if (val !== set.weight) onUpdate(set.session_set_id, sessionExerciseId, { weight: val });
  };

  const commitReps = () => {
    const val = reps ? parseInt(reps, 10) : null;
    if (val !== set.reps) onUpdate(set.session_set_id, sessionExerciseId, { reps: val });
  };

  const toggleCompleted = () => {
    onUpdate(set.session_set_id, sessionExerciseId, { completed: !set.completed });
  };

  const isCompleted = set.completed === true;
  const isWarmup = set.is_warmup === true;

  return (
    <View style={[rowStyles.row, isCompleted && rowStyles.rowCompleted]}>
      <Pressable
        style={[
          rowStyles.setNumberBtn,
          { width: 40 },
          isWarmup && rowStyles.setNumberWarmup,
        ]}
        onPress={() => onSetNumberPress(set, sessionExerciseId)}
      >
        <Text
          style={[
            rowStyles.setNumberText,
            isWarmup && rowStyles.setNumberWarmupText,
            isCompleted && rowStyles.cellCompleted,
          ]}
        >
          {isWarmup ? "W" : set.set_number}
        </Text>
      </Pressable>
      <TextInput
        style={[rowStyles.input, { flex: 1 }, isCompleted && rowStyles.inputCompleted]}
        value={weight}
        onChangeText={setWeight}
        onBlur={commitWeight}
        keyboardType="numeric"
        placeholder="—"
        placeholderTextColor="#9ca3af"
        editable={!isCompleted}
        onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
      />
      <TextInput
        style={[rowStyles.input, { flex: 1 }, isCompleted && rowStyles.inputCompleted]}
        value={reps}
        onChangeText={setReps}
        onBlur={commitReps}
        keyboardType="numeric"
        placeholder="—"
        placeholderTextColor="#9ca3af"
        editable={!isCompleted}
        onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
      />
      <Pressable
        style={[
          rowStyles.checkBtn,
          { width: 50 },
          isCompleted && rowStyles.checkBtnCompleted,
        ]}
        onPress={toggleCompleted}
      >
        <Text style={[rowStyles.checkText, isCompleted && rowStyles.checkTextCompleted]}>
          ✓
        </Text>
      </Pressable>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: 280,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  warmupBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  warmupBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400e",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: "100%",
    borderRadius: 10,
    gap: 12,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    width: "100%",
    marginVertical: 4,
  },
  removeOption: {
    backgroundColor: "#fef2f2",
  },
  removeIcon: {
    fontSize: 20,
  },
  removeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    width: "100%",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  rowCompleted: {
    backgroundColor: "#dcfce7",
  },
  cell: { textAlign: "center", fontSize: 14, fontWeight: "600", color: "#6b7280" },
  cellCompleted: { color: "#16a34a" },
  setNumberBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },
  setNumberWarmup: {
    backgroundColor: "#fef3c7",
  },
  setNumberWarmupText: {
    color: "#92400e",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "#fff",
  },
  inputCompleted: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
    color: "#16a34a",
  },
  checkBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
    borderWidth: 2,
    borderColor: "#cbd5e1",
  },
  checkBtnCompleted: {
    backgroundColor: "#22c55e",
    borderColor: "#16a34a",
  },
  checkText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#94a3b8",
  },
  checkTextCompleted: {
    color: "#fff",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "700" },
  volumeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 2,
  },
  timer: { fontSize: 24, fontWeight: "700", color: "#3b82f6", fontVariant: ["tabular-nums"] },
  backText: { fontSize: 16, color: "#3b82f6", fontWeight: "600", marginTop: 12 },
  errorText: { color: "red", marginBottom: 8 },
  exerciseCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  exerciseName: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  setHeader: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 4,
  },
  headerCell: { fontSize: 12, fontWeight: "700", color: "#6b7280", textAlign: "center" },
  addSetButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  addSetText: { color: "#fff", fontWeight: "600" },
  notesInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  actions: { gap: 12 },
  finishButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  finishText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  discardButton: {
    backgroundColor: "#fca5a5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  discardText: { color: "#991b1b", fontSize: 16, fontWeight: "600" },
});