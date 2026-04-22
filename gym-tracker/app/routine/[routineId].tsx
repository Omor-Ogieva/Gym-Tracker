import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { db } from "../backend/db";
import { useTheme } from "../theme/ThemeContext";
import { useGuardedPress } from "../utils/pressGuard";
import ExercisePicker from "../components/ExercisePicker";
import ConfirmModal from "../components/ConfirmModal";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RoutineScreen() {
  const router = useRouter();
  const {
    routineId: routineIdParam,
    routineName: routineNameParam,
    description: descriptionParam,
    mode: modeParam,
  } = useLocalSearchParams<{ routineId: string; routineName: string; description?: string; mode?: string }>();
  const routineId = parseInt(routineIdParam, 10);
  const { colors } = useTheme();

  const scrollRef = useRef<ScrollView>(null);

  // ── Mode ──
  const [isEditing, setIsEditing] = useState(modeParam === "edit");

  // ── Display state (view mode shows these) ──
  const [displayName, setDisplayName] = useState(routineNameParam ?? "Routine");
  const [displayDesc, setDisplayDesc] = useState(descriptionParam ?? "");

  // ── Edit state (edit mode uses these) ──
  const [editableName, setEditableName] = useState(routineNameParam ?? "Routine");
  const [editableDesc, setEditableDesc] = useState(descriptionParam ?? "");

  // ── Data ──
  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseSets, setExerciseSets] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI flags ──
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showDeleteRoutine, setShowDeleteRoutine] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const [exerciseOptionsVisible, setExerciseOptionsVisible] = useState(false);
  const [selectedExerciseForOptions, setSelectedExerciseForOptions] = useState<any>(null);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  const exercisePickerModeRef = useRef<"add" | "replace">("add");
  const replaceTargetRef = useRef<any>(null);

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadData = async () => {
    setLoading(true);
    const { data: exData, error: exErr } = await db.getRoutineExercises(routineId);
    if (exErr) { setError(exErr.message); setLoading(false); return; }
    const exs = exData ?? [];
    setExercises(exs);

    const setsResults = await Promise.all(
      exs.map((ex: any) => db.getRoutineExerciseSets(ex.routine_exercise_id))
    );
    const setsMap: Record<number, any[]> = {};
    exs.forEach((ex: any, i: number) => {
      setsMap[ex.routine_exercise_id] = setsResults[i].data ?? [];
    });
    setExerciseSets(setsMap);
    setLoading(false);
  };

  const reloadSetsForExercise = async (routineExerciseId: number) => {
    const { data } = await db.getRoutineExerciseSets(routineExerciseId);
    setExerciseSets((prev) => ({ ...prev, [routineExerciseId]: data ?? [] }));
  };

  useEffect(() => { loadData(); }, []);

  // ─── Mode transitions ──────────────────────────────────────────────────────

  const enterEditMode = () => {
    setViewMenuOpen(false);
    setEditableName(displayName);
    setEditableDesc(displayDesc);
    setIsEditing(true);
  };

  const exitEditMode = () => {
    if (modeParam === "edit") {
      router.back();
    } else {
      // Revert unsaved name/desc changes and return to view
      setEditableName(displayName);
      setEditableDesc(displayDesc);
      setIsEditing(false);
    }
  };

  const handleSaveNameDesc = async () => {
    const trimmedName = editableName.trim();
    if (!trimmedName) return;
    const trimmedDesc = editableDesc.trim();
    if (trimmedName === displayName && trimmedDesc === displayDesc) return;
    await db.updateRoutine(routineId, {
      routine_name: trimmedName,
      description: trimmedDesc || null,
    });
    setDisplayName(trimmedName);
    setDisplayDesc(trimmedDesc);
  };

  const handleDoneEditing = async () => {
    await handleSaveNameDesc();
    setIsEditing(false);
  };

  // ─── Exercise handlers ─────────────────────────────────────────────────────

  const handleAddExercise = useGuardedPress(async (exercise: any) => {
    setShowExercisePicker(false);
    const { error: err } = await db.insertRoutineExercise({
      routine_id: routineId,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      exercise_order: exercises.length === 0 ? 1 : Math.max(...exercises.map((e) => e.exercise_order)) + 1,
    });
    if (err) { setError(err.message); return; }
    await loadData();
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  });

  const handleRemoveExercise = useGuardedPress(async (routineExerciseId: number) => {
    const { error: err } = await db.deleteRoutineExercise(routineExerciseId);
    if (err) { setError(err.message); return; }
    setExercises((prev) => prev.filter((e) => e.routine_exercise_id !== routineExerciseId));
    setExerciseSets((prev) => {
      const next = { ...prev };
      delete next[routineExerciseId];
      return next;
    });
  });

  const openExerciseOptions = useCallback((ex: any) => {
    setSelectedExerciseForOptions(ex);
    setExerciseOptionsVisible(true);
  }, []);

  const closeExerciseOptions = useCallback(() => {
    setExerciseOptionsVisible(false);
    setSelectedExerciseForOptions(null);
  }, []);

  const handleRemoveExerciseFromMenu = useCallback(() => {
    if (!selectedExerciseForOptions) return;
    closeExerciseOptions();
    handleRemoveExercise(selectedExerciseForOptions.routine_exercise_id);
  }, [selectedExerciseForOptions, closeExerciseOptions, handleRemoveExercise]);

  const handleReplaceExercise = useGuardedPress(async (exercise: any) => {
    const target = replaceTargetRef.current;
    if (!target) return;
    setShowExercisePicker(false);
    const { error: err } = await db.updateRoutineExercise(target.routine_exercise_id, {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
    });
    if (err) { setError(err.message); replaceTargetRef.current = null; return; }
    setExercises((prev) => prev.map((e) =>
      e.routine_exercise_id === target.routine_exercise_id
        ? { ...e, exercise_id: exercise.id, exercise_name: exercise.name }
        : e
    ));
    replaceTargetRef.current = null;
  });

  const handleAddSet = useGuardedPress(async (routineExerciseId: number) => {
    const currentSets = exerciseSets[routineExerciseId] ?? [];
    const { error: err } = await db.insertRoutineExerciseSet({
      routine_exercise_id: routineExerciseId,
      set_number: currentSets.length + 1,
      target_weight: null,
      target_reps: null,
      is_warmup: false,
    });
    if (err) { setError(err.message); return; }
    await reloadSetsForExercise(routineExerciseId);
  }, 300);

  const handleDeleteSet = async (routineSetId: number, routineExerciseId: number) => {
    setExerciseSets((prev) => ({
      ...prev,
      [routineExerciseId]: (prev[routineExerciseId] ?? []).filter(
        (s) => s.routine_set_id !== routineSetId
      ),
    }));
    const { error: err } = await db.deleteRoutineExerciseSet(routineSetId);
    if (err) { setError(err.message); reloadSetsForExercise(routineExerciseId); }
  };

  const handleUpdateSet = useCallback(async (
    routineSetId: number,
    routineExerciseId: number,
    updates: { target_reps?: number | null; target_weight?: number | null; is_warmup?: boolean }
  ) => {
    if ("is_warmup" in updates) {
      setExerciseSets((prev) => ({
        ...prev,
        [routineExerciseId]: (prev[routineExerciseId] ?? []).map((s) =>
          s.routine_set_id === routineSetId ? { ...s, ...updates } : s
        ),
      }));
    }
    const { error: err } = await db.updateRoutineExerciseSet(routineSetId, updates);
    if (err) { setError(err.message); reloadSetsForExercise(routineExerciseId); }
  }, []);

  const handleStartWorkout = useGuardedPress(async () => {
    setStartingWorkout(true);
    const { data: { user } } = await db.getUser();
    if (!user) { setError("Not authenticated"); setStartingWorkout(false); return; }
    const { data: session, error: err } = await db.startWorkoutFromRoutine(routineId, user.id);
    if (err) { setError(err.message); setStartingWorkout(false); return; }
    setStartingWorkout(false);
    router.push({ pathname: "/workout", params: { sessionId: String(session.session_id) } });
  }, 1000);

  const handleDeleteRoutine = useGuardedPress(async () => {
    setShowDeleteRoutine(false);
    const { error: err } = await db.deleteRoutine(routineId);
    if (err) { setError(err.message); return; }
    router.back();
  });

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Header ── */}
      {isEditing ? (
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Pressable onPress={exitEditMode} hitSlop={8} style={styles.headerBack}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Routine</Text>
          <View style={styles.headerRight}>
            <Pressable
              style={[styles.donePill, { backgroundColor: colors.primary }]}
              onPress={handleDoneEditing}
            >
              <Text style={styles.donePillText}>Done</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerBack}>
            <Ionicons name="chevron-down" size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.headerRightRow}>
            <Pressable
              style={[styles.startPill, { backgroundColor: colors.primary }, startingWorkout && { opacity: 0.6 }]}
              onPress={handleStartWorkout}
              disabled={startingWorkout}
            >
              <Ionicons name="play" size={13} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.startPillText}>{startingWorkout ? "Starting…" : "Start"}</Text>
            </Pressable>
            <Pressable onPress={() => setViewMenuOpen(true)} hitSlop={8} style={styles.menuBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* ── Edit mode: name + description inputs ── */}
        {isEditing && (
          <View style={[styles.nameCard, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.border }]}
              value={editableName}
              onChangeText={setEditableName}
              placeholder="Routine name"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
            />
            <TextInput
              style={[styles.descInput, { color: colors.textSecondary }]}
              value={editableDesc}
              onChangeText={setEditableDesc}
              placeholder="Add description (optional)"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              multiline
            />
          </View>
        )}

        {/* ── View mode: description pill ── */}
        {!isEditing && displayDesc ? (
          <Text style={[styles.viewDesc, { color: colors.textSecondary }]}>{displayDesc}</Text>
        ) : null}

        {/* ── Empty state ── */}
        {exercises.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No exercises yet</Text>
            {isEditing && (
              <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
                Tap "Add Exercise" to build your routine
              </Text>
            )}
          </View>
        )}

        {/* ── Exercise cards ── */}
        {exercises.map((ex) => {
          const sets = exerciseSets[ex.routine_exercise_id] ?? [];
          return (
            <View key={ex.routine_exercise_id} style={[styles.exerciseCard, { backgroundColor: colors.surface }]}>
              {/* Exercise name row */}
              <View style={styles.exerciseHeaderRow}>
                <Pressable
                  style={styles.exerciseNameBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/exercise-detail/[exerciseId]",
                      params: { exerciseId: ex.exercise_id, exerciseName: ex.exercise_name },
                    })
                  }
                >
                  <Text style={[styles.exerciseName, { color: colors.primary }]}>
                    {ex.exercise_name}
                  </Text>
                </Pressable>
                {isEditing && (
                  <Pressable onPress={() => openExerciseOptions(ex)} hitSlop={8}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>

              {/* Column headers */}
              <View style={[styles.colHeaders, { borderBottomColor: colors.border }]}>
                <Text style={[styles.colHeader, styles.colSet, { color: colors.textTertiary }]}>SET</Text>
                <Text style={[styles.colHeader, styles.colWeight, { color: colors.textTertiary }]}>LBS</Text>
                <Text style={[styles.colHeader, styles.colReps, { color: colors.textTertiary }]}>REPS</Text>
                {isEditing && (
                  <>
                    <Text style={[styles.colHeader, styles.colW, { color: colors.textTertiary }]}>W</Text>
                    <View style={styles.colDel} />
                  </>
                )}
              </View>

              {/* Set rows */}
              {sets.map((set) =>
                isEditing ? (
                  <TemplateSetRow
                    key={set.routine_set_id}
                    set={set}
                    routineExerciseId={ex.routine_exercise_id}
                    onUpdate={handleUpdateSet}
                    onDelete={handleDeleteSet}
                    colors={colors}
                  />
                ) : (
                  <ViewSetRow key={set.routine_set_id} set={set} colors={colors} />
                )
              )}

              {/* Add Set (edit only) */}
              {isEditing && (
                <Pressable
                  style={[styles.addSetRow, { borderTopColor: colors.border }]}
                  onPress={() => handleAddSet(ex.routine_exercise_id)}
                >
                  <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                  <Text style={[styles.addSetText, { color: colors.primary }]}>Add Set</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        {/* ── Add Exercise card (edit only) ── */}
        {isEditing && (
          <Pressable
            style={[styles.addExCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowExercisePicker(true)}
          >
            <View style={[styles.addExIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.addExText, { color: colors.primary }]}>Add Exercise</Text>
          </Pressable>
        )}

        {/* ── Delete Routine button (edit only) ── */}
        {isEditing && (
          <Pressable style={styles.deleteRoutineBtn} onPress={() => setShowDeleteRoutine(true)}>
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={[styles.deleteRoutineText, { color: colors.danger }]}>Delete Routine</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ── Exercise picker ── */}
      <ExercisePicker
        visible={showExercisePicker}
        onSelect={(exercise) => {
          if (exercisePickerModeRef.current === "replace") {
            exercisePickerModeRef.current = "add";
            handleReplaceExercise(exercise);
          } else {
            handleAddExercise(exercise);
          }
        }}
        onClose={() => {
          exercisePickerModeRef.current = "add";
          replaceTargetRef.current = null;
          setShowExercisePicker(false);
        }}
      />

      {/* ── Exercise options bottom sheet (edit only) ── */}
      <Modal visible={exerciseOptionsVisible} transparent animationType="slide" onRequestClose={closeExerciseOptions}>
        <Pressable style={modalStyles.overlay} onPress={closeExerciseOptions}>
          <View style={[modalStyles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
            <Text style={[modalStyles.sheetTitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {selectedExerciseForOptions?.exercise_name}
            </Text>
            <Pressable
              style={[modalStyles.option, { borderBottomColor: colors.border }]}
              onPress={() => {
                exercisePickerModeRef.current = "replace";
                replaceTargetRef.current = selectedExerciseForOptions;
                closeExerciseOptions();
                setShowExercisePicker(true);
              }}
            >
              <View style={[modalStyles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="swap-horizontal-outline" size={16} color={colors.primary} />
              </View>
              <Text style={[modalStyles.optionLabel, { color: colors.text }]}>Replace Exercise</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </Pressable>
            <Pressable style={modalStyles.option} onPress={handleRemoveExerciseFromMenu}>
              <View style={[modalStyles.iconWrap, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </View>
              <Text style={[modalStyles.optionLabel, { color: colors.danger }]}>Remove Exercise</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.danger} style={{ opacity: 0.4 }} />
            </Pressable>
            <Pressable
              style={[modalStyles.cancelBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={closeExerciseOptions}
            >
              <Text style={[modalStyles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── View mode options menu ── */}
      <Modal visible={viewMenuOpen} transparent animationType="slide" onRequestClose={() => setViewMenuOpen(false)}>
        <Pressable style={modalStyles.overlay} onPress={() => setViewMenuOpen(false)}>
          <View style={[modalStyles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
            <Text style={[modalStyles.sheetTitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Pressable
              style={[modalStyles.option, { borderBottomColor: colors.border }]}
              onPress={enterEditMode}
            >
              <View style={[modalStyles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="pencil-outline" size={16} color={colors.primary} />
              </View>
              <Text style={[modalStyles.optionLabel, { color: colors.text }]}>Edit Routine</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </Pressable>
            <Pressable
              style={modalStyles.option}
              onPress={() => { setViewMenuOpen(false); setShowDeleteRoutine(true); }}
            >
              <View style={[modalStyles.iconWrap, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </View>
              <Text style={[modalStyles.optionLabel, { color: colors.danger }]}>Delete Routine</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.danger} style={{ opacity: 0.4 }} />
            </Pressable>
            <Pressable
              style={[modalStyles.cancelBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setViewMenuOpen(false)}
            >
              <Text style={[modalStyles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Delete confirm ── */}
      <ConfirmModal
        visible={showDeleteRoutine}
        title="Delete Routine"
        message={`"${displayName}" will be permanently deleted. This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="danger"
        icon="trash-outline"
        onConfirm={handleDeleteRoutine}
        onCancel={() => setShowDeleteRoutine(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── ViewSetRow (read-only) ───────────────────────────────────────────────────

function ViewSetRow({ set, colors }: { set: any; colors: any }) {
  const isWarmup = set.is_warmup === true;
  return (
    <View style={[rowStyles.row, { backgroundColor: isWarmup ? colors.warningLight + "55" : "transparent", borderBottomColor: colors.border }]}>
      <View style={[rowStyles.setNumWrap, isWarmup && { backgroundColor: colors.warningLight }]}>
        <Text style={[rowStyles.setNum, { color: isWarmup ? colors.warning : colors.textTertiary }]}>
          {isWarmup ? "W" : set.set_number}
        </Text>
      </View>
      <Text style={[viewRowStyles.cell, { color: colors.text }]}>
        {set.target_weight != null ? String(set.target_weight) : "—"}
      </Text>
      <Text style={[viewRowStyles.cell, { color: colors.text }]}>
        {set.target_reps != null ? String(set.target_reps) : "—"}
      </Text>
    </View>
  );
}

// ─── TemplateSetRow (editable) ────────────────────────────────────────────────

function TemplateSetRow({
  set,
  routineExerciseId,
  onUpdate,
  onDelete,
  colors,
}: {
  set: any;
  routineExerciseId: number;
  onUpdate: (id: number, exId: number, updates: any) => void;
  onDelete: (id: number, exId: number) => void;
  colors: any;
}) {
  const [weight, setWeight] = useState(set.target_weight != null ? String(set.target_weight) : "");
  const [reps, setReps] = useState(set.target_reps != null ? String(set.target_reps) : "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setWeight(set.target_weight != null ? String(set.target_weight) : "");
    setReps(set.target_reps != null ? String(set.target_reps) : "");
  }, [set.target_weight, set.target_reps]);

  const commitWeight = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const val = weight ? parseFloat(weight) : null;
    if (val !== set.target_weight) onUpdate(set.routine_set_id, routineExerciseId, { target_weight: val });
  }, [weight, set.target_weight, set.routine_set_id, routineExerciseId, onUpdate]);

  const commitReps = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const val = reps ? parseInt(reps, 10) : null;
    if (val !== set.target_reps) onUpdate(set.routine_set_id, routineExerciseId, { target_reps: val });
  }, [reps, set.target_reps, set.routine_set_id, routineExerciseId, onUpdate]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const isWarmup = set.is_warmup === true;
  const rowBg = isWarmup ? colors.warningLight + "55" : "transparent";

  return (
    <View style={[rowStyles.row, { backgroundColor: rowBg, borderBottomColor: colors.border }]}>
      <View style={[rowStyles.setNumWrap, isWarmup && { backgroundColor: colors.warningLight }]}>
        <Text style={[rowStyles.setNum, { color: isWarmup ? colors.warning : colors.textTertiary }]}>
          {isWarmup ? "W" : set.set_number}
        </Text>
      </View>
      <TextInput
        style={[rowStyles.input, rowStyles.weightCol, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
        value={weight}
        onChangeText={setWeight}
        onBlur={commitWeight}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="done"
      />
      <TextInput
        style={[rowStyles.input, rowStyles.repsCol, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
        value={reps}
        onChangeText={setReps}
        onBlur={commitReps}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="done"
      />
      <Pressable
        style={[rowStyles.warmupBtn, isWarmup && { backgroundColor: colors.warningLight }]}
        onPress={() => onUpdate(set.routine_set_id, routineExerciseId, { is_warmup: !isWarmup })}
        hitSlop={6}
      >
        <Text style={[rowStyles.warmupLabel, { color: isWarmup ? colors.warning : colors.textTertiary }]}>W</Text>
      </Pressable>
      <Pressable
        onPress={() => onDelete(set.routine_set_id, routineExerciseId)}
        hitSlop={6}
        style={rowStyles.deleteBtn}
      >
        <Ionicons name="remove-circle-outline" size={18} color={colors.danger} style={{ opacity: 0.7 }} />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: { width: 64, alignItems: "flex-start" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  headerRight: { width: 64, alignItems: "flex-end" },
  headerRightRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelText: { fontSize: 16, fontWeight: "500" },
  donePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  donePillText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  startPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  startPillText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  menuBtn: { padding: 2 },

  scrollContent: { paddingVertical: 12, paddingHorizontal: 16, gap: 12, paddingBottom: 60 },

  errorBanner: { borderRadius: 10, padding: 12 },
  errorText: { fontSize: 14, fontWeight: "500" },

  nameCard: { borderRadius: 14, padding: 16, gap: 4 },
  nameInput: {
    fontSize: 20,
    fontWeight: "700",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  descInput: { fontSize: 14, paddingVertical: 8, minHeight: 36 },

  viewDesc: { fontSize: 14, paddingHorizontal: 4, marginBottom: 4 },

  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 17, fontWeight: "600" },
  emptySubText: { fontSize: 14, textAlign: "center" },

  exerciseCard: { borderRadius: 14, overflow: "hidden" },
  exerciseHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  exerciseNameBtn: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "700" },

  colHeaders: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colHeader: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  colSet: { width: 36 },
  colWeight: { flex: 1 },
  colReps: { flex: 1 },
  colW: { width: 36 },
  colDel: { width: 28 },

  addSetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addSetText: { fontSize: 14, fontWeight: "700" },

  addExCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    borderStyle: "dashed",
  },
  addExIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addExText: { fontSize: 15, fontWeight: "700" },

  deleteRoutineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  deleteRoutineText: { fontSize: 14, fontWeight: "600" },
});

const viewRowStyles = StyleSheet.create({
  cell: { flex: 1, fontSize: 14, fontWeight: "500", textAlign: "center" },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  setNumWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  setNum: { fontSize: 13, fontWeight: "700" },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 14,
    textAlign: "center",
  },
  weightCol: { flex: 1 },
  repsCol: { flex: 1 },
  warmupBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  warmupLabel: { fontSize: 12, fontWeight: "800" },
  deleteBtn: { width: 28, alignItems: "center" },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: "500" },
  cancelBtn: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "600" },
});
