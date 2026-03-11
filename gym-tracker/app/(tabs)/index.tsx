import { useEffect, useState, useRef, useCallback } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { db, isOnline } from "../backend/db";
import { useTheme } from "../theme/ThemeContext";
import { useGuardedPress } from "../utils/pressGuard";
import exercisesData from "../../assets/data/exercises.json";

export default function WorkoutsScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { colors } = useTheme();

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
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [exerciseSets, setExerciseSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editReps, setEditReps] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editWarmup, setEditWarmup] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);

  const filteredExercises = exerciseSearch.length === 0
    ? []
    : exercisesData.filter(
        (ex) => ex.name && ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
      );

  const loadUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    const { data, error } = await db.getUsers();
    if (error) setError(error.message);
    else setUsers(data ?? []);
    setLoadingUsers(false);
  };

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
    if (error) { setError(error.message); } else { setRoutineName(""); setDescription(""); setShowForm(false); loadRoutines(); }
  });

  const deleteRoutine = async (routineId: number) => {
    setError(null);
    const { error } = await db.deleteRoutine(routineId);
    if (error) setError(error.message);
    else {
      if (selectedRoutineId === routineId) { setSelectedRoutineId(null); setRoutineExercises([]); setExpandedExerciseId(null); setExerciseSets([]); }
      loadRoutines();
    }
  };

  const handleLongPressRoutine = useCallback((routineId: number, routineName: string) => {
    Alert.alert(
      routineName,
      "What would you like to do?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Routine",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Delete Routine",
              `Are you sure you want to delete "${routineName}"? This cannot be undone.`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteRoutine(routineId) },
              ]
            );
          },
        },
      ]
    );
  }, [selectedRoutineId]);

  const loadRoutineExercises = async (routineId: number) => {
    setLoadingExercises(true); setError(null);
    const { data, error } = await db.getRoutineExercises(routineId);
    if (error) setError(error.message); else setRoutineExercises(data ?? []);
    setLoadingExercises(false);
  };

  const addExerciseToRoutine = useGuardedPress(async (exercise: any) => {
    if (!selectedRoutineId) return; setError(null);
    const { error } = await db.insertRoutineExercise({ routine_id: selectedRoutineId, exercise_id: exercise.id, exercise_name: exercise.name, exercise_order: routineExercises.length + 1 });
    if (error) { setError(error.message); } else { setShowExercisePicker(false); setExerciseSearch(""); loadRoutineExercises(selectedRoutineId); }
  });

  const removeExerciseFromRoutine = useGuardedPress(async (routineExerciseId: number) => {
    if (!selectedRoutineId) return; setError(null);
    const { error } = await db.deleteRoutineExercise(routineExerciseId);
    if (error) setError(error.message);
    else { if (expandedExerciseId === routineExerciseId) { setExpandedExerciseId(null); setExerciseSets([]); } loadRoutineExercises(selectedRoutineId); }
  });

  const selectRoutine = useCallback((routineId: number) => {
    if (selectedRoutineId === routineId) { setSelectedRoutineId(null); setRoutineExercises([]); setExpandedExerciseId(null); setExerciseSets([]); setShowExercisePicker(false); }
    else { setSelectedRoutineId(routineId); loadRoutineExercises(routineId); setExpandedExerciseId(null); setExerciseSets([]); setShowExercisePicker(false); }
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

  useEffect(() => { loadUsers(); loadRoutines(); }, []);

  const themed = {
    container: { flex: 1 as const, padding: 16, paddingTop: 60, backgroundColor: colors.background },
    title: { fontSize: 24, fontWeight: "700" as const, marginBottom: 12, color: colors.text },
    offlineText: { textAlign: "center" as const, color: colors.warning, fontWeight: "600" as const, marginBottom: 8 },
    errorText: { color: colors.danger, marginBottom: 8 },
    sectionHeader: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, marginTop: 12 },
    sectionTitle: { fontSize: 18, fontWeight: "600" as const, color: colors.text },
    subTitle: { fontSize: 16, fontWeight: "600" as const, color: colors.text },
    form: { gap: 8, marginTop: 8 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: colors.inputBackground, color: colors.text },
    insertButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.successLight },
    cancelButton: { backgroundColor: colors.dangerLight },
    submitButton: { alignSelf: "flex-start" as const, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary },
    submitText: { color: "#fff", fontWeight: "600" as const },
    deleteButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.dangerLight },
    deleteText: { fontWeight: "600" as const, color: colors.danger },
    buttonText: { fontWeight: "600" as const, color: colors.text },
    routineCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: colors.border },
    routineCardSelected: { borderColor: colors.primary, borderWidth: 2 },
    routineTopRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
    routineName: { fontSize: 16, fontWeight: "700" as const, color: colors.text },
    routineDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    routineDate: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
    startWorkoutButton: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    startWorkoutButtonDisabled: { opacity: 0.5 },
    startWorkoutText: { color: "#fff", fontWeight: "700" as const, fontSize: 14 },
    longPressHint: { fontSize: 11, color: colors.textTertiary, marginTop: 6, textAlign: "center" as const },
    exercisesSection: { marginLeft: 12, marginTop: 8, marginBottom: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.primary },
    exerciseItem: { flexDirection: "row" as const, alignItems: "center" as const, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    expandedExercise: { backgroundColor: colors.successLight, borderRadius: 8, paddingHorizontal: 8 },
    exerciseOrder: { fontSize: 12, color: colors.textTertiary, fontWeight: "600" as const },
    exerciseName: { fontSize: 15, fontWeight: "600" as const, color: colors.text },
    tapHint: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
    pickerContainer: { marginTop: 8, gap: 8 },
    pickerList: { maxHeight: 300, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface },
    pickerItem: { flexDirection: "row" as const, alignItems: "center" as const, paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    pickerName: { fontSize: 14, fontWeight: "600" as const, color: colors.text },
    pickerMeta: { fontSize: 12, color: colors.textSecondary },
    addText: { color: colors.primary, fontWeight: "600" as const, fontSize: 14 },
    emptyText: { textAlign: "center" as const, color: colors.textTertiary, marginTop: 12, paddingVertical: 8 },
    setsSection: { marginLeft: 16, marginTop: 4, marginBottom: 8, paddingLeft: 12, paddingVertical: 8, borderLeftWidth: 2, borderLeftColor: colors.success, backgroundColor: colors.surfaceSecondary, borderRadius: 8 },
    setsTitle: { fontSize: 14, fontWeight: "700" as const, marginBottom: 8, color: colors.text },
    setHeader: { flexDirection: "row" as const, alignItems: "center" as const, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4 },
    setHeaderText: { fontSize: 12, fontWeight: "700" as const, color: colors.textSecondary, textAlign: "center" as const },
    setRow: { flexDirection: "row" as const, alignItems: "center" as const, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 4 },
    setNumber: { fontSize: 13, fontWeight: "600" as const, color: colors.textSecondary, textAlign: "center" as const },
    setValue: { fontSize: 14, textAlign: "center" as const, color: colors.text },
    setInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 6, fontSize: 14, textAlign: "center" as const, marginHorizontal: 2, backgroundColor: colors.inputBackground, color: colors.text },
    warmupToggle: { alignItems: "center" as const, justifyContent: "center" as const, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.surfaceSecondary },
    warmupActive: { backgroundColor: colors.warning },
    warmupText: { fontSize: 13, fontWeight: "700" as const, color: colors.text },
    warmupBadge: { fontSize: 12, fontWeight: "700" as const, color: "#92400e", backgroundColor: colors.warningLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" as const },
    editSetButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.surfaceSecondary },
    editSetText: { fontSize: 14, fontWeight: "600" as const, color: colors.text },
    saveSetButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.successLight },
    saveSetText: { fontSize: 14, fontWeight: "700" as const, color: colors.success },
    cancelSetButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.dangerLight },
    deleteSetButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.dangerLight },
    addSetButton: { marginTop: 8, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.primary, alignItems: "center" as const },
    addSetText: { color: "#fff", fontWeight: "600" as const, fontSize: 14 },
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        ref={scrollRef}
        style={themed.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={themed.title}>Workouts</Text>
        {!isOnline && <Text style={themed.offlineText}>⚡ Offline Mode (in-memory)</Text>}
        {error ? <Text style={themed.errorText}>{error}</Text> : null}

        <View style={themed.sectionHeader}>
          <Text style={themed.sectionTitle}>Routines</Text>
          <Pressable
            style={[themed.insertButton, showForm && themed.cancelButton]}
            onPress={() => { setShowForm(!showForm); setRoutineName(""); setDescription(""); }}
          >
            <Text style={themed.buttonText}>{showForm ? "Cancel" : "Create Routine"}</Text>
          </Pressable>
        </View>

        {showForm && (
          <View style={themed.form}>
            <TextInput style={themed.input} placeholder="Routine Name" placeholderTextColor={colors.textTertiary} value={routineName} onChangeText={setRoutineName} onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
            <TextInput style={themed.input} placeholder="Description (optional)" placeholderTextColor={colors.textTertiary} value={description} onChangeText={setDescription} onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
            <Pressable style={themed.submitButton} onPress={insertRoutine}>
              <Text style={themed.submitText}>Save Routine</Text>
            </Pressable>
          </View>
        )}

        {loadingRoutines ? (
          <ActivityIndicator style={{ marginTop: 16 }} color={colors.primary} />
        ) : (
          routines.map((item, index) => (
            <View key={String(item.routine_id ?? index)}>
              <Pressable
                onPress={() => selectRoutine(item.routine_id)}
                onLongPress={() => handleLongPressRoutine(item.routine_id, item.routine_name)}
                delayLongPress={500}
                style={({ pressed }) => [
                  themed.routineCard,
                  selectedRoutineId === item.routine_id && themed.routineCardSelected,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={themed.routineTopRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={themed.routineName}>{item.routine_name}</Text>
                    {item.description ? <Text style={themed.routineDesc}>{item.description}</Text> : null}
                    <Text style={themed.routineDate}>Created: {new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Pressable
                    style={[themed.startWorkoutButton, startingWorkout && themed.startWorkoutButtonDisabled]}
                    disabled={startingWorkout}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleStartWorkout(item.routine_id);
                    }}
                  >
                    <Text style={themed.startWorkoutText}>{startingWorkout ? "..." : "▶ Start"}</Text>
                  </Pressable>
                </View>
                <Text style={themed.longPressHint}>Hold to delete</Text>
              </Pressable>

              {selectedRoutineId === item.routine_id && (
                <View style={[themed.exercisesSection, { marginTop: 8, marginLeft: 0, paddingLeft: 16, paddingRight: 4 }]}>
                  <View style={themed.sectionHeader}>
                    <Text style={themed.subTitle}>Exercises</Text>
                    <Pressable
                      style={[themed.insertButton, showExercisePicker && themed.cancelButton]}
                      onPress={() => { setShowExercisePicker(!showExercisePicker); setExerciseSearch(""); }}
                    >
                      <Text style={themed.buttonText}>{showExercisePicker ? "Cancel" : "Add Exercise"}</Text>
                    </Pressable>
                  </View>

                  {showExercisePicker && (
                    <View style={themed.pickerContainer}>
                      <TextInput style={themed.input} placeholder="Type to search exercises..." placeholderTextColor={colors.textTertiary} value={exerciseSearch} onChangeText={setExerciseSearch} autoCapitalize="none" onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
                      {exerciseSearch.length > 0 && (
                        <ScrollView style={themed.pickerList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                          {filteredExercises.slice(0, 30).map((ex) => (
                            <Pressable key={ex.id} style={themed.pickerItem} onPress={() => addExerciseToRoutine(ex)}>
                              <View style={{ flex: 1 }}>
                                <Text style={themed.pickerName}>{ex.name}</Text>
                                <Text style={themed.pickerMeta}>{ex.primaryMuscles?.join(", ")} • {ex.equipment ?? "none"}</Text>
                              </View>
                              <Text style={themed.addText}>+ Add</Text>
                            </Pressable>
                          ))}
                          {filteredExercises.length > 30 && <Text style={themed.emptyText}>Showing 30 of {filteredExercises.length} — refine your search</Text>}
                          {filteredExercises.length === 0 && <Text style={themed.emptyText}>No exercises found</Text>}
                        </ScrollView>
                      )}
                    </View>
                  )}

                  {loadingExercises ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : routineExercises.length === 0 ? (
                    <Text style={themed.emptyText}>No exercises added yet</Text>
                  ) : (
                    routineExercises.map((ex, i) => (
                      <View key={String(ex.routine_exercise_id ?? i)}>
                        <Pressable
                          style={[themed.exerciseItem, expandedExerciseId === ex.routine_exercise_id && themed.expandedExercise]}
                          onPress={() => toggleExerciseSets(ex.routine_exercise_id)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={themed.exerciseOrder}>#{ex.exercise_order}</Text>
                            <Text style={themed.exerciseName}>{ex.exercise_name}</Text>
                            <Text style={themed.tapHint}>{expandedExerciseId === ex.routine_exercise_id ? "▼ Tap to collapse" : "▶ Tap to manage sets"}</Text>
                          </View>
                          <Pressable style={themed.deleteButton} onPress={() => removeExerciseFromRoutine(ex.routine_exercise_id)}>
                            <Text style={themed.deleteText}>Remove</Text>
                          </Pressable>
                        </Pressable>

                        {expandedExerciseId === ex.routine_exercise_id && (
                          <View style={themed.setsSection}>
                            <Text style={themed.setsTitle}>Template Sets</Text>
                            {loadingSets ? <ActivityIndicator color={colors.primary} /> : (
                              <>
                                {exerciseSets.length > 0 && (
                                  <View style={themed.setHeader}>
                                    <Text style={[themed.setHeaderText, { width: 36 }]}>Set</Text>
                                    <Text style={[themed.setHeaderText, { flex: 1 }]}>Reps</Text>
                                    <Text style={[themed.setHeaderText, { flex: 1 }]}>Weight</Text>
                                    <Text style={[themed.setHeaderText, { width: 52 }]}>Warm</Text>
                                    <Text style={[themed.setHeaderText, { width: 70 }]}></Text>
                                  </View>
                                )}
                                {exerciseSets.map((set) => (
                                  <View key={String(set.routine_set_id)} style={themed.setRow}>
                                    {editingSetId === set.routine_set_id ? (
                                      <>
                                        <Text style={[themed.setNumber, { width: 36 }]}>#{set.set_number}</Text>
                                        <TextInput style={[themed.setInput, { flex: 1 }]} placeholder="Reps" placeholderTextColor={colors.textTertiary} value={editReps} onChangeText={setEditReps} keyboardType="numeric" onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
                                        <TextInput style={[themed.setInput, { flex: 1 }]} placeholder="lbs" placeholderTextColor={colors.textTertiary} value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
                                        <Pressable style={[themed.warmupToggle, editWarmup && themed.warmupActive, { width: 52 }]} onPress={() => setEditWarmup(!editWarmup)}>
                                          <Text style={themed.warmupText}>{editWarmup ? "W" : "—"}</Text>
                                        </Pressable>
                                        <View style={[{ flexDirection: "row", gap: 4, justifyContent: "flex-end" }, { width: 70 }]}>
                                          <Pressable style={themed.saveSetButton} onPress={saveEditSet}><Text style={themed.saveSetText}>✓</Text></Pressable>
                                          <Pressable style={themed.cancelSetButton} onPress={() => setEditingSetId(null)}><Text style={themed.deleteText}>✕</Text></Pressable>
                                        </View>
                                      </>
                                    ) : (
                                      <>
                                        <Text style={[themed.setNumber, { width: 36 }]}>#{set.set_number}</Text>
                                        <Text style={[themed.setValue, { flex: 1 }]}>{set.target_reps ?? "—"} reps</Text>
                                        <Text style={[themed.setValue, { flex: 1 }]}>{set.target_weight ?? "—"} lbs</Text>
                                        <View style={{ width: 52, alignItems: "center" }}>{set.is_warmup && <Text style={themed.warmupBadge}>W</Text>}</View>
                                        <View style={{ flexDirection: "row", gap: 4, justifyContent: "flex-end", width: 70 }}>
                                          <Pressable style={themed.editSetButton} onPress={() => startEditSet(set)}><Text style={themed.editSetText}>✎</Text></Pressable>
                                          <Pressable style={themed.deleteSetButton} onPress={() => deleteSet(set.routine_set_id)}><Text style={themed.deleteText}>✕</Text></Pressable>
                                        </View>
                                      </>
                                    )}
                                  </View>
                                ))}
                                {exerciseSets.length === 0 && <Text style={themed.emptyText}>No sets yet</Text>}
                                <Pressable style={themed.addSetButton} onPress={addSet}><Text style={themed.addSetText}>+ Add Set</Text></Pressable>
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

        {!loadingRoutines && routines.length === 0 && <Text style={themed.emptyText}>No routines found</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}