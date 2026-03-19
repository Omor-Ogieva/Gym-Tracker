import { useEffect, useState, useRef, useCallback } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { db, isOnline } from "../backend/db";
import { useTheme } from "../theme/ThemeContext";
import { useGuardedPress } from "../utils/pressGuard";
import ExercisePicker from "../components/ExercisePicker";

export default function WorkoutsScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { colors } = useTheme();

  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [routines, setRoutines] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);
  const [routineExercises, setRoutineExercises] = useState<any[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [exerciseSets, setExerciseSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editReps, setEditReps] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editWarmup, setEditWarmup] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);

  const loadRoutines = async () => {
    setLoadingRoutines(true);
    setError(null);
    const { data, error } = await db.getRoutines();
    if (error) setError(error.message);
    else setRoutines(data ?? []);
    setLoadingRoutines(false);
  };

  const insertRoutine = useGuardedPress(async () => {
    if (!routineName) { setError("Routine name is required"); return; }
    setError(null);
    const { data: { user } } = await db.getUser();
    if (!user) { setError("Not authenticated"); return; }
    const { error } = await db.insertRoutine({ routine_name: routineName, description: description || null, user_id: user.id });
    if (error) { setError(error.message); }
    else { setRoutineName(""); setDescription(""); setShowForm(false); loadRoutines(); }
  });

  const deleteRoutine = async (routineId: number) => {
    setError(null);
    const { error } = await db.deleteRoutine(routineId);
    if (error) setError(error.message);
    else {
      if (selectedRoutineId === routineId) {
        setSelectedRoutineId(null); setRoutineExercises([]);
        setExpandedExerciseId(null); setExerciseSets([]);
      }
      loadRoutines();
    }
  };

  const handleLongPressRoutine = (routineId: number, routineName: string) => {
    Alert.alert(routineName, "What would you like to do?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete Routine", style: "destructive",
        onPress: () => Alert.alert("Delete Routine", `Are you sure you want to delete "${routineName}"?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteRoutine(routineId) },
        ]),
      },
    ]);
  };

  const loadRoutineExercises = async (routineId: number) => {
    setLoadingExercises(true); setError(null);
    const { data, error } = await db.getRoutineExercises(routineId);
    if (error) setError(error.message); else setRoutineExercises(data ?? []);
    setLoadingExercises(false);
  };

  const addExerciseToRoutine = useGuardedPress(async (exercise: any) => {
    if (!selectedRoutineId) return; setError(null);
    const { error } = await db.insertRoutineExercise({ routine_id: selectedRoutineId, exercise_id: exercise.id, exercise_name: exercise.name, exercise_order: routineExercises.length + 1 });
    if (error) { setError(error.message); }
    else { setShowExercisePicker(false); loadRoutineExercises(selectedRoutineId); }
  });

  const removeExerciseFromRoutine = useGuardedPress(async (routineExerciseId: number) => {
    if (!selectedRoutineId) return; setError(null);
    const { error } = await db.deleteRoutineExercise(routineExerciseId);
    if (error) setError(error.message);
    else {
      if (expandedExerciseId === routineExerciseId) { setExpandedExerciseId(null); setExerciseSets([]); }
      loadRoutineExercises(selectedRoutineId);
    }
  });

  const selectRoutine = useCallback((routineId: number) => {
    if (selectedRoutineId === routineId) {
      setSelectedRoutineId(null); setRoutineExercises([]); setExpandedExerciseId(null); setExerciseSets([]); setShowExercisePicker(false);
    } else {
      setSelectedRoutineId(routineId); loadRoutineExercises(routineId); setExpandedExerciseId(null); setExerciseSets([]); setShowExercisePicker(false);
    }
  }, [selectedRoutineId]);

  const loadSets = async (routineExerciseId: number) => {
    setLoadingSets(true); setError(null);
    const { data, error } = await db.getRoutineExerciseSets(routineExerciseId);
    if (error) setError(error.message); else setExerciseSets(data ?? []);
    setLoadingSets(false);
  };

  const toggleExerciseSets = useCallback((routineExerciseId: number) => {
    if (expandedExerciseId === routineExerciseId) { setExpandedExerciseId(null); setExerciseSets([]); setEditingSetId(null); }
    else { setExpandedExerciseId(routineExerciseId); loadSets(routineExerciseId); setEditingSetId(null); }
  }, [expandedExerciseId]);

  const addSet = useGuardedPress(async () => {
    if (!expandedExerciseId) return; setError(null);
    const { error } = await db.insertRoutineExerciseSet({ routine_exercise_id: expandedExerciseId, set_number: exerciseSets.length + 1, target_reps: null, target_weight: null, is_warmup: false });
    if (error) { setError(error.message); } else { loadSets(expandedExerciseId); }
  });

  const startEditSet = useCallback((set: any) => {
    setEditingSetId(set.routine_set_id);
    setEditReps(set.target_reps != null ? String(set.target_reps) : "");
    setEditWeight(set.target_weight != null ? String(set.target_weight) : "");
    setEditWarmup(set.is_warmup ?? false);
  }, []);

  const saveEditSet = useGuardedPress(async () => {
    if (!editingSetId || !expandedExerciseId) return; setError(null);
    const reps = editReps ? parseInt(editReps, 10) : null;
    const weight = editWeight ? parseFloat(editWeight) : null;
    if (editReps && isNaN(reps!)) { setError("Reps must be a number"); return; }
    if (editWeight && isNaN(weight!)) { setError("Weight must be a number"); return; }
    const { error } = await db.updateRoutineExerciseSet(editingSetId, { target_reps: reps, target_weight: weight, is_warmup: editWarmup });
    if (error) { setError(error.message); } else { setEditingSetId(null); loadSets(expandedExerciseId); }
  });

  const deleteSet = useGuardedPress(async (routineSetId: number) => {
    if (!expandedExerciseId) return; setError(null);
    const { error } = await db.deleteRoutineExerciseSet(routineSetId);
    if (error) setError(error.message); else loadSets(expandedExerciseId);
  });

  const handleStartWorkout = useGuardedPress(async (routineId: number) => {
    setStartingWorkout(true);
    const { data: { user } } = await db.getUser();
    if (!user) { setError("Not authenticated"); setStartingWorkout(false); return; }
    const { data: session, error: err } = await db.startWorkoutFromRoutine(routineId, user.id);
    if (err) { setError(err.message); setStartingWorkout(false); return; }
    setStartingWorkout(false);
    router.push({ pathname: "/workout", params: { sessionId: String(session.session_id) } });
  }, 1000);

  useEffect(() => { loadRoutines(); }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page title ── */}
        <View style={[styles.pageHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Workouts</Text>
          {!isOnline && (
            <View style={[styles.offlineBadge, { backgroundColor: colors.warningLight }]}>
              <Text style={[styles.offlineText, { color: colors.warning }]}>Offline</Text>
            </View>
          )}
        </View>

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* ── Routines section ── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Routines</Text>
          <Pressable
            style={[styles.createBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => { setShowForm(!showForm); setRoutineName(""); setDescription(""); }}
          >
            <Ionicons name={showForm ? "close" : "add"} size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Create routine form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="Routine name"
              placeholderTextColor={colors.textTertiary}
              value={routineName}
              onChangeText={setRoutineName}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={[styles.formCancelBtn, { backgroundColor: colors.surfaceSecondary }]} onPress={() => setShowForm(false)}>
                <Text style={[styles.formCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.formSaveBtn, { backgroundColor: colors.primary }]} onPress={insertRoutine}>
                <Text style={styles.formSaveText}>Save Routine</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Routine list */}
        {loadingRoutines ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
        ) : routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={36} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No routines yet</Text>
            <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>Tap + to create your first routine</Text>
          </View>
        ) : (
          <View style={styles.routineList}>
            {routines.map((item) => (
              <View key={String(item.routine_id)} style={[styles.routineCard, { backgroundColor: colors.surface }]}>
                {/* Routine header */}
                <Pressable
                  onPress={() => selectRoutine(item.routine_id)}
                  onLongPress={() => handleLongPressRoutine(item.routine_id, item.routine_name)}
                  delayLongPress={500}
                  style={styles.routineHeader}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.routineName, { color: colors.text }]}>{item.routine_name}</Text>
                    {item.description ? (
                      <Text style={[styles.routineDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={selectedRoutineId === item.routine_id ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textTertiary}
                  />
                </Pressable>

                {/* Expanded exercises */}
                {selectedRoutineId === item.routine_id && (
                  <View style={[styles.exercisesPanel, { borderTopColor: colors.border }]}>
                    <View style={[styles.exercisesPanelHeader, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.exercisesPanelTitle, { color: colors.textSecondary }]}>EXERCISES</Text>
                      <Pressable
                        style={[styles.addExBtn, { backgroundColor: colors.primaryLight }]}
                        onPress={() => setShowExercisePicker(true)}
                      >
                        <Ionicons name="add" size={16} color={colors.primary} />
                        <Text style={[styles.addExText, { color: colors.primary }]}>Add</Text>
                      </Pressable>
                    </View>

                    <ExercisePicker
                      visible={showExercisePicker}
                      onSelect={(ex) => addExerciseToRoutine(ex)}
                      onClose={() => setShowExercisePicker(false)}
                    />

                    {loadingExercises ? (
                      <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
                    ) : routineExercises.length === 0 ? (
                      <Text style={[styles.emptyExText, { color: colors.textTertiary }]}>No exercises added yet</Text>
                    ) : (
                      routineExercises.map((ex) => (
                        <View key={String(ex.routine_exercise_id)}>
                          <Pressable
                            style={[
                              styles.exerciseRow,
                              { borderBottomColor: colors.border },
                              expandedExerciseId === ex.routine_exercise_id && { backgroundColor: colors.primaryLight },
                            ]}
                            onPress={() => toggleExerciseSets(ex.routine_exercise_id)}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.exerciseName, { color: colors.text }]}>{ex.exercise_name}</Text>
                            </View>
                            <Pressable
                              style={[styles.removeExBtn, { backgroundColor: colors.dangerLight }]}
                              onPress={() => removeExerciseFromRoutine(ex.routine_exercise_id)}
                            >
                              <Ionicons name="trash-outline" size={14} color={colors.danger} />
                            </Pressable>
                            <Ionicons
                              name={expandedExerciseId === ex.routine_exercise_id ? "chevron-up" : "chevron-down"}
                              size={16}
                              color={colors.textTertiary}
                              style={{ marginLeft: 8 }}
                            />
                          </Pressable>

                          {expandedExerciseId === ex.routine_exercise_id && (
                            <View style={[styles.setsPanel, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                              <Text style={[styles.setsPanelTitle, { color: colors.textSecondary }]}>TEMPLATE SETS</Text>
                              {loadingSets ? (
                                <ActivityIndicator color={colors.primary} />
                              ) : (
                                <>
                                  {exerciseSets.length > 0 && (
                                    <View style={[styles.setColHeaders, { borderBottomColor: colors.border }]}>
                                      <Text style={[styles.setColHeader, { width: 32, color: colors.textTertiary }]}>#</Text>
                                      <Text style={[styles.setColHeader, { flex: 1, color: colors.textTertiary }]}>Reps</Text>
                                      <Text style={[styles.setColHeader, { flex: 1, color: colors.textTertiary }]}>Weight</Text>
                                      <Text style={[styles.setColHeader, { width: 36, color: colors.textTertiary }]}>W</Text>
                                      <View style={{ width: 64 }} />
                                    </View>
                                  )}
                                  {exerciseSets.map((set) => (
                                    <View key={String(set.routine_set_id)} style={[styles.setRow, { borderBottomColor: colors.border }]}>
                                      {editingSetId === set.routine_set_id ? (
                                        <>
                                          <Text style={[styles.setNum, { color: colors.textTertiary }]}>{set.set_number}</Text>
                                          <TextInput
                                            style={[styles.setInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, flex: 1 }]}
                                            placeholder="Reps" placeholderTextColor={colors.textTertiary}
                                            value={editReps} onChangeText={setEditReps} keyboardType="numeric"
                                            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
                                          />
                                          <TextInput
                                            style={[styles.setInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, flex: 1 }]}
                                            placeholder="lbs" placeholderTextColor={colors.textTertiary}
                                            value={editWeight} onChangeText={setEditWeight} keyboardType="numeric"
                                            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
                                          />
                                          <Pressable
                                            style={[styles.warmupToggle, editWarmup && { backgroundColor: colors.warningLight }, { width: 36 }]}
                                            onPress={() => setEditWarmup(!editWarmup)}
                                          >
                                            <Text style={{ fontSize: 12, fontWeight: "700", color: editWarmup ? colors.warning : colors.textTertiary }}>W</Text>
                                          </Pressable>
                                          <View style={{ flexDirection: "row", gap: 4, width: 64 }}>
                                            <Pressable style={[styles.saveBtn, { backgroundColor: colors.successLight }]} onPress={saveEditSet}>
                                              <Ionicons name="checkmark" size={14} color={colors.success} />
                                            </Pressable>
                                            <Pressable style={[styles.saveBtn, { backgroundColor: colors.dangerLight }]} onPress={() => setEditingSetId(null)}>
                                              <Ionicons name="close" size={14} color={colors.danger} />
                                            </Pressable>
                                          </View>
                                        </>
                                      ) : (
                                        <>
                                          <Text style={[styles.setNum, { color: colors.textTertiary }]}>{set.set_number}</Text>
                                          <Text style={[styles.setVal, { flex: 1, color: colors.text }]}>{set.target_reps ?? "—"}</Text>
                                          <Text style={[styles.setVal, { flex: 1, color: colors.text }]}>{set.target_weight ?? "—"}</Text>
                                          <View style={{ width: 36, alignItems: "center" }}>
                                            {set.is_warmup && <Text style={[styles.warmupChip, { color: colors.warning }]}>W</Text>}
                                          </View>
                                          <View style={{ flexDirection: "row", gap: 4, width: 64 }}>
                                            <Pressable style={[styles.saveBtn, { backgroundColor: colors.surfaceSecondary }]} onPress={() => startEditSet(set)}>
                                              <Ionicons name="pencil" size={12} color={colors.textSecondary} />
                                            </Pressable>
                                            <Pressable style={[styles.saveBtn, { backgroundColor: colors.dangerLight }]} onPress={() => deleteSet(set.routine_set_id)}>
                                              <Ionicons name="trash-outline" size={12} color={colors.danger} />
                                            </Pressable>
                                          </View>
                                        </>
                                      )}
                                    </View>
                                  ))}
                                  {exerciseSets.length === 0 && (
                                    <Text style={[styles.emptyExText, { color: colors.textTertiary }]}>No template sets</Text>
                                  )}
                                  <Pressable style={[styles.addSetRow, { borderTopColor: colors.border }]} onPress={addSet}>
                                    <Ionicons name="add" size={16} color={colors.primary} />
                                    <Text style={[styles.addSetRowText, { color: colors.primary }]}>Add Set</Text>
                                  </Pressable>
                                </>
                              )}
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* Start Routine button */}
                <Pressable
                  style={[
                    styles.startBtn,
                    { backgroundColor: colors.primary },
                    startingWorkout && { opacity: 0.6 },
                  ]}
                  disabled={startingWorkout}
                  onPress={() => handleStartWorkout(item.routine_id)}
                >
                  <Text style={styles.startBtnText}>
                    {startingWorkout ? "Starting…" : "Start Routine"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Header
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageTitle: { flex: 1, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  offlineBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  offlineText: { fontSize: 12, fontWeight: "700" },

  // Error
  errorBanner: { marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },

  // Section header
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: { flex: 1, fontSize: 20, fontWeight: "700" },
  createBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },

  // Create form
  formCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, gap: 10 },
  input: {
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 12,
    fontSize: 15,
  },
  formCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  formCancelText: { fontSize: 15, fontWeight: "600" },
  formSaveBtn: { flex: 2, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  formSaveText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 17, fontWeight: "600" },
  emptySubText: { fontSize: 14 },

  // Routine list
  routineList: { paddingHorizontal: 16, gap: 10 },
  routineCard: { borderRadius: 14, overflow: "hidden" },
  routineHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  routineName: { fontSize: 17, fontWeight: "700" },
  routineDesc: { fontSize: 14, marginTop: 2 },

  // Expanded exercises
  exercisesPanel: { borderTopWidth: StyleSheet.hairlineWidth },
  exercisesPanelHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  exercisesPanelTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  addExBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  addExText: { fontSize: 13, fontWeight: "700" },
  exerciseRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  exerciseName: { fontSize: 15, fontWeight: "600" },
  removeExBtn: { padding: 6, borderRadius: 8 },
  emptyExText: { fontSize: 14, textAlign: "center", paddingVertical: 16, paddingHorizontal: 16 },

  // Sets panel
  setsPanel: {
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  setsPanelTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8 },
  setColHeaders: {
    flexDirection: "row", alignItems: "center", paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4,
  },
  setColHeader: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  setRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  setNum: { width: 32, fontSize: 13, fontWeight: "600", textAlign: "center" },
  setVal: { fontSize: 14, textAlign: "center" },
  setInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 6, fontSize: 14, textAlign: "center" },
  warmupToggle: { width: 36, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  warmupChip: { fontSize: 12, fontWeight: "700" },
  saveBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  addSetRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 4 },
  addSetRowText: { fontSize: 14, fontWeight: "700" },

  // Start button
  startBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  startBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
