import { useEffect, useState, useRef } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { db, isOnline } from "./backend/db";
import exercisesData from "../assets/data/exercises.json";

export default function TestScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [routines, setRoutines] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);
  const [routineExercises, setRoutineExercises] = useState<any[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sets state
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [exerciseSets, setExerciseSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);

  // Inline editing for sets
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editReps, setEditReps] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editWarmup, setEditWarmup] = useState(false);

  const filteredExercises = exercisesData.filter(
    (ex) => ex.name && ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  // --- Users ---
  const loadUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    const { data, error } = await db.getUsers();
    if (error) setError(error.message);
    else setUsers(data ?? []);
    setLoadingUsers(false);
  };

  // --- Routines ---
  const loadRoutines = async () => {
    setLoadingRoutines(true);
    setError(null);
    const { data, error } = await db.getRoutines();
    if (error) setError(error.message);
    else setRoutines(data ?? []);
    setLoadingRoutines(false);
  };

  const insertRoutine = async () => {
    if (!routineName) {
      setError("Routine name is required");
      return;
    }
    setError(null);
    const { data: { user } } = await db.getUser();
    if (!user) {
      setError("Not authenticated");
      return;
    }
    const { error } = await db.insertRoutine({
      routine_name: routineName,
      description: description || null,
      user_id: user.id,
    });
    if (error) {
      setError(error.message);
    } else {
      setRoutineName("");
      setDescription("");
      setShowForm(false);
      loadRoutines();
    }
  };

  const deleteRoutine = async (routineId: number) => {
    setError(null);
    const { error } = await db.deleteRoutine(routineId);
    if (error) setError(error.message);
    else {
      if (selectedRoutineId === routineId) {
        setSelectedRoutineId(null);
        setRoutineExercises([]);
        setExpandedExerciseId(null);
        setExerciseSets([]);
      }
      loadRoutines();
    }
  };

  // --- Routine Exercises ---
  const loadRoutineExercises = async (routineId: number) => {
    setLoadingExercises(true);
    setError(null);
    const { data, error } = await db.getRoutineExercises(routineId);
    if (error) setError(error.message);
    else setRoutineExercises(data ?? []);
    setLoadingExercises(false);
  };

  const addExerciseToRoutine = async (exercise: any) => {
    if (!selectedRoutineId) return;
    setError(null);
    const { error } = await db.insertRoutineExercise({
      routine_id: selectedRoutineId,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      exercise_order: routineExercises.length + 1,
    });
    if (error) {
      setError(error.message);
    } else {
      setShowExercisePicker(false);
      setExerciseSearch("");
      loadRoutineExercises(selectedRoutineId);
    }
  };

  const removeExerciseFromRoutine = async (routineExerciseId: number) => {
    if (!selectedRoutineId) return;
    setError(null);
    const { error } = await db.deleteRoutineExercise(routineExerciseId);
    if (error) setError(error.message);
    else {
      if (expandedExerciseId === routineExerciseId) {
        setExpandedExerciseId(null);
        setExerciseSets([]);
      }
      loadRoutineExercises(selectedRoutineId);
    }
  };

  const selectRoutine = (routineId: number) => {
    if (selectedRoutineId === routineId) {
      setSelectedRoutineId(null);
      setRoutineExercises([]);
      setExpandedExerciseId(null);
      setExerciseSets([]);
      setShowExercisePicker(false);
    } else {
      setSelectedRoutineId(routineId);
      loadRoutineExercises(routineId);
      setExpandedExerciseId(null);
      setExerciseSets([]);
      setShowExercisePicker(false);
    }
  };

  // --- Sets ---
  const loadSets = async (routineExerciseId: number) => {
    setLoadingSets(true);
    setError(null);
    const { data, error } = await db.getRoutineExerciseSets(routineExerciseId);
    if (error) setError(error.message);
    else setExerciseSets(data ?? []);
    setLoadingSets(false);
  };

  const toggleExerciseSets = (routineExerciseId: number) => {
    if (expandedExerciseId === routineExerciseId) {
      setExpandedExerciseId(null);
      setExerciseSets([]);
      setEditingSetId(null);
    } else {
      setExpandedExerciseId(routineExerciseId);
      loadSets(routineExerciseId);
      setEditingSetId(null);
    }
  };

  const addSet = async () => {
    if (!expandedExerciseId) return;
    setError(null);
    const { error } = await db.insertRoutineExerciseSet({
      routine_exercise_id: expandedExerciseId,
      set_number: exerciseSets.length + 1,
      target_reps: null,
      target_weight: null,
      is_warmup: false,
    });
    if (error) {
      setError(error.message);
    } else {
      loadSets(expandedExerciseId);
    }
  };

  const startEditSet = (set: any) => {
    setEditingSetId(set.routine_set_id);
    setEditReps(set.target_reps != null ? String(set.target_reps) : "");
    setEditWeight(set.target_weight != null ? String(set.target_weight) : "");
    setEditWarmup(set.is_warmup ?? false);
  };

  const saveEditSet = async () => {
    if (!editingSetId || !expandedExerciseId) return;
    setError(null);

    const reps = editReps ? parseInt(editReps, 10) : null;
    const weight = editWeight ? parseFloat(editWeight) : null;

    if (editReps && isNaN(reps!)) {
      setError("Reps must be a number");
      return;
    }
    if (editWeight && isNaN(weight!)) {
      setError("Weight must be a number");
      return;
    }

    const { error } = await db.updateRoutineExerciseSet(editingSetId, {
      target_reps: reps,
      target_weight: weight,
      is_warmup: editWarmup,
    });

    if (error) {
      setError(error.message);
    } else {
      setEditingSetId(null);
      loadSets(expandedExerciseId);
    }
  };

  const deleteSet = async (routineSetId: number) => {
    if (!expandedExerciseId) return;
    setError(null);
    const { error } = await db.deleteRoutineExerciseSet(routineSetId);
    if (error) setError(error.message);
    else loadSets(expandedExerciseId);
  };

  useEffect(() => {
    loadUsers();
    loadRoutines();
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Supabase Test</Text>
        {!isOnline && <Text style={styles.offlineText}>⚡ Offline Mode (in-memory)</Text>}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* ---- Users Section ---- */}
        <Text style={styles.sectionTitle}>Users</Text>
        <Pressable style={styles.button} onPress={loadUsers} disabled={loadingUsers}>
          <Text style={styles.buttonText}>{loadingUsers ? "Loading..." : "Load Users"}</Text>
        </Pressable>

        {loadingUsers ? (
          <ActivityIndicator />
        ) : (
          users.map((item, index) => (
            <View key={String(item.user_id ?? index)} style={styles.listItem}>
              <Text>{item.username} — {item.email}</Text>
            </View>
          ))
        )}
        {!loadingUsers && users.length === 0 && (
          <Text style={styles.emptyText}>No users found</Text>
        )}

        {/* ---- Routines Section ---- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Routines</Text>
          <Pressable
            style={[styles.insertButton, showForm && styles.cancelButton]}
            onPress={() => {
              setShowForm(!showForm);
              setRoutineName("");
              setDescription("");
            }}
          >
            <Text style={styles.buttonText}>{showForm ? "Cancel" : "Create Routine"}</Text>
          </Pressable>
        </View>

        {showForm && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Routine Name"
              value={routineName}
              onChangeText={setRoutineName}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
            />
            <Pressable style={styles.submitButton} onPress={insertRoutine}>
              <Text style={styles.submitText}>Save Routine</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.button} onPress={loadRoutines} disabled={loadingRoutines}>
          <Text style={styles.buttonText}>{loadingRoutines ? "Loading..." : "Load Routines"}</Text>
        </Pressable>

        {loadingRoutines ? (
          <ActivityIndicator />
        ) : (
          routines.map((item, index) => (
            <View key={String(item.routine_id ?? index)}>
              <Pressable
                style={[
                  styles.routineItem,
                  selectedRoutineId === item.routine_id && styles.selectedRoutine,
                ]}
                onPress={() => selectRoutine(item.routine_id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineName}>{item.routine_name}</Text>
                  {item.description ? <Text style={styles.routineDesc}>{item.description}</Text> : null}
                  <Text style={styles.routineDate}>
                    Created: {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable style={styles.deleteButton} onPress={() => deleteRoutine(item.routine_id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </Pressable>

              {/* Start Workout button */}
              <Pressable
                style={{ backgroundColor: "#22c55e", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginTop: 4, alignSelf: "flex-start" }}
                onPress={async () => {
                  const { data: { user } } = await db.getUser();
                  if (!user) { setError("Not authenticated"); return; }
                  const { data: session, error: err } = await db.startWorkoutFromRoutine(item.routine_id, user.id);
                  if (err) { setError(err.message); return; }
                  router.push({ pathname: "/workout", params: { sessionId: String(session.session_id) } });
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>▶ Start Workout</Text>
              </Pressable>

              {/* ---- Exercises for selected routine ---- */}
              {selectedRoutineId === item.routine_id && (
                <View style={styles.exercisesSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.subTitle}>Exercises</Text>
                    <Pressable
                      style={[styles.insertButton, showExercisePicker && styles.cancelButton]}
                      onPress={() => {
                        setShowExercisePicker(!showExercisePicker);
                        setExerciseSearch("");
                      }}
                    >
                      <Text style={styles.buttonText}>
                        {showExercisePicker ? "Cancel" : "Add Exercise"}
                      </Text>
                    </Pressable>
                  </View>

                  {showExercisePicker && (
                    <View style={styles.pickerContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Search exercises..."
                        value={exerciseSearch}
                        onChangeText={setExerciseSearch}
                        autoCapitalize="none"
                        onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
                      />
                      <ScrollView
                        style={styles.pickerList}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {filteredExercises.slice(0, 50).map((ex) => (
                          <Pressable key={ex.id} style={styles.pickerItem} onPress={() => addExerciseToRoutine(ex)}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.pickerName}>{ex.name}</Text>
                              <Text style={styles.pickerMeta}>
                                {ex.primaryMuscles?.join(", ")} • {ex.equipment ?? "none"}
                              </Text>
                            </View>
                            <Text style={styles.addText}>+ Add</Text>
                          </Pressable>
                        ))}
                        {filteredExercises.length > 50 && (
                          <Text style={styles.emptyText}>
                            Showing 50 of {filteredExercises.length} — refine your search
                          </Text>
                        )}
                        {filteredExercises.length === 0 && (
                          <Text style={styles.emptyText}>No exercises found</Text>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {/* ---- Exercise List with Sets ---- */}
                  {loadingExercises ? (
                    <ActivityIndicator />
                  ) : routineExercises.length === 0 ? (
                    <Text style={styles.emptyText}>No exercises added yet</Text>
                  ) : (
                    routineExercises.map((ex, i) => (
                      <View key={String(ex.routine_exercise_id ?? i)}>
                        <Pressable
                          style={[
                            styles.exerciseItem,
                            expandedExerciseId === ex.routine_exercise_id && styles.expandedExercise,
                          ]}
                          onPress={() => toggleExerciseSets(ex.routine_exercise_id)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.exerciseOrder}>#{ex.exercise_order}</Text>
                            <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
                            <Text style={styles.tapHint}>
                              {expandedExerciseId === ex.routine_exercise_id
                                ? "▼ Tap to collapse"
                                : "▶ Tap to manage sets"}
                            </Text>
                          </View>
                          <Pressable
                            style={styles.deleteButton}
                            onPress={() => removeExerciseFromRoutine(ex.routine_exercise_id)}
                          >
                            <Text style={styles.deleteText}>Remove</Text>
                          </Pressable>
                        </Pressable>

                        {/* ---- Sets for expanded exercise ---- */}
                        {expandedExerciseId === ex.routine_exercise_id && (
                          <View style={styles.setsSection}>
                            <Text style={styles.setsTitle}>Template Sets</Text>

                            {loadingSets ? (
                              <ActivityIndicator />
                            ) : (
                              <>
                                {/* Header row */}
                                {exerciseSets.length > 0 && (
                                  <View style={styles.setHeader}>
                                    <Text style={[styles.setHeaderText, { width: 36 }]}>Set</Text>
                                    <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
                                    <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight</Text>
                                    <Text style={[styles.setHeaderText, { width: 52 }]}>Warm</Text>
                                    <Text style={[styles.setHeaderText, { width: 70 }]}></Text>
                                  </View>
                                )}

                                {/* Each set row */}
                                {exerciseSets.map((set) => (
                                  <View key={String(set.routine_set_id)} style={styles.setRow}>
                                    {editingSetId === set.routine_set_id ? (
                                      /* ---- Editing mode ---- */
                                      <>
                                        <Text style={[styles.setNumber, { width: 36 }]}>
                                          #{set.set_number}
                                        </Text>
                                        <TextInput
                                          style={[styles.setInput, { flex: 1 }]}
                                          placeholder="Reps"
                                          value={editReps}
                                          onChangeText={setEditReps}
                                          keyboardType="numeric"
                                          onFocus={() =>
                                            setTimeout(
                                              () => scrollRef.current?.scrollToEnd({ animated: true }),
                                              300
                                            )
                                          }
                                        />
                                        <TextInput
                                          style={[styles.setInput, { flex: 1 }]}
                                          placeholder="lbs"
                                          value={editWeight}
                                          onChangeText={setEditWeight}
                                          keyboardType="numeric"
                                          onFocus={() =>
                                            setTimeout(
                                              () => scrollRef.current?.scrollToEnd({ animated: true }),
                                              300
                                            )
                                          }
                                        />
                                        <Pressable
                                          style={[
                                            styles.warmupToggle,
                                            editWarmup && styles.warmupActive,
                                            { width: 52 },
                                          ]}
                                          onPress={() => setEditWarmup(!editWarmup)}
                                        >
                                          <Text style={styles.warmupText}>
                                            {editWarmup ? "W" : "—"}
                                          </Text>
                                        </Pressable>
                                        <View style={[styles.setActions, { width: 70 }]}>
                                          <Pressable style={styles.saveSetButton} onPress={saveEditSet}>
                                            <Text style={styles.saveSetText}>✓</Text>
                                          </Pressable>
                                          <Pressable
                                            style={styles.cancelSetButton}
                                            onPress={() => setEditingSetId(null)}
                                          >
                                            <Text style={styles.deleteText}>✕</Text>
                                          </Pressable>
                                        </View>
                                      </>
                                    ) : (
                                      /* ---- Display mode ---- */
                                      <>
                                        <Text style={[styles.setNumber, { width: 36 }]}>
                                          #{set.set_number}
                                        </Text>
                                        <Text style={[styles.setValue, { flex: 1 }]}>
                                          {set.target_reps ?? "—"} reps
                                        </Text>
                                        <Text style={[styles.setValue, { flex: 1 }]}>
                                          {set.target_weight ?? "—"} lbs
                                        </Text>
                                        <View style={{ width: 52, alignItems: "center" }}>
                                          {set.is_warmup && (
                                            <Text style={styles.warmupBadge}>W</Text>
                                          )}
                                        </View>
                                        <View style={[styles.setActions, { width: 70 }]}>
                                          <Pressable
                                            style={styles.editSetButton}
                                            onPress={() => startEditSet(set)}
                                          >
                                            <Text style={styles.editSetText}>✎</Text>
                                          </Pressable>
                                          <Pressable
                                            style={styles.deleteSetButton}
                                            onPress={() => deleteSet(set.routine_set_id)}
                                          >
                                            <Text style={styles.deleteText}>✕</Text>
                                          </Pressable>
                                        </View>
                                      </>
                                    )}
                                  </View>
                                ))}

                                {exerciseSets.length === 0 && (
                                  <Text style={styles.emptyText}>No sets yet</Text>
                                )}

                                {/* Add set button */}
                                <Pressable style={styles.addSetButton} onPress={addSet}>
                                  <Text style={styles.addSetText}>+ Add Set</Text>
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
            </View>
          ))
        )}
        {!loadingRoutines && routines.length === 0 && (
          <Text style={styles.emptyText}>No routines found</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  offlineText: { textAlign: "center", color: "#f59e0b", fontWeight: "600", marginBottom: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600" },
  subTitle: { fontSize: 16, fontWeight: "600" },
  backText: { fontSize: 16, color: "#3b82f6", fontWeight: "600", marginBottom: 8 },
  form: { gap: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, fontSize: 16 },
  button: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#e2e8f0", marginTop: 8 },
  insertButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#86efac" },
  cancelButton: { backgroundColor: "#fca5a5" },
  submitButton: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#3b82f6" },
  submitText: { color: "#fff", fontWeight: "600" },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: "#fca5a5" },
  deleteText: { fontWeight: "600", color: "#991b1b" },
  buttonText: { fontWeight: "600" },
  listItem: { paddingVertical: 6 },
  routineItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  selectedRoutine: { backgroundColor: "#eff6ff", borderRadius: 8, paddingHorizontal: 8 },
  routineName: { fontSize: 16, fontWeight: "600" },
  routineDesc: { fontSize: 14, color: "#6b7280" },
  routineDate: { fontSize: 12, color: "#9ca3af" },
  exercisesSection: { marginLeft: 12, marginTop: 8, marginBottom: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#3b82f6" },
  exerciseItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  expandedExercise: { backgroundColor: "#f0fdf4", borderRadius: 8, paddingHorizontal: 8 },
  exerciseOrder: { fontSize: 12, color: "#9ca3af", fontWeight: "600" },
  exerciseName: { fontSize: 15, fontWeight: "600" },
  tapHint: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  pickerContainer: { marginTop: 8, gap: 8 },
  pickerList: { maxHeight: 300, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8 },
  pickerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  pickerName: { fontSize: 14, fontWeight: "600" },
  pickerMeta: { fontSize: 12, color: "#6b7280" },
  addText: { color: "#3b82f6", fontWeight: "600", fontSize: 14 },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 12, paddingVertical: 8 },
  errorText: { color: "red", marginBottom: 8 },

  // Sets
  setsSection: {
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 12,
    paddingVertical: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#86efac",
    backgroundColor: "#fafafa",
    borderRadius: 8,
  },
  setsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 4,
  },
  setHeaderText: { fontSize: 12, fontWeight: "700", color: "#6b7280", textAlign: "center" },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 4,
  },
  setNumber: { fontSize: 13, fontWeight: "600", color: "#6b7280", textAlign: "center" },
  setValue: { fontSize: 14, textAlign: "center" },
  setInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    textAlign: "center",
    marginHorizontal: 2,
  },
  setActions: { flexDirection: "row", gap: 4, justifyContent: "flex-end" },
  warmupToggle: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
  },
  warmupActive: { backgroundColor: "#fbbf24" },
  warmupText: { fontSize: 13, fontWeight: "700" },
  warmupBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400e",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  editSetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
  },
  editSetText: { fontSize: 14, fontWeight: "600" },
  saveSetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#86efac",
  },
  saveSetText: { fontSize: 14, fontWeight: "700", color: "#166534" },
  cancelSetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#fca5a5",
  },
  deleteSetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#fca5a5",
  },
  addSetButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  addSetText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});