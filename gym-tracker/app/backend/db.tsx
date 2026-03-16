import { supabase } from "./supabaseClient";
import { localDb } from "./localDb";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isOnline = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const db = {
  // Auth
  signUp: async (email: string, password: string, username: string) => {
    if (isOnline) {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) return { data: null, error: signUpError };
      if (data.user) {
        const { error: insertError } = await supabase.from("users").insert({
          user_id: data.user.id,
          username,
          email,
          password_hash: "managed_by_supabase_auth",
        });
        if (insertError) return { data: null, error: insertError };
      }
      return { data, error: null };
    }
    return localDb.signUp(email, password, username);
  },

  signIn: async (email: string, password: string) => {
    if (isOnline) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    }
    return localDb.signIn(email, password);
  },

  signOut: async () => {
    if (isOnline) {
      await supabase.auth.signOut();
    } else {
      await localDb.signOut();
    }
  },

  getSession: async () => {
    if (isOnline) {
      return supabase.auth.getSession();
    }
    return localDb.getSession();
  },

  getUser: async () => {
    if (isOnline) {
      return supabase.auth.getUser();
    }
    return localDb.getUser();
  },

  getUserProfile: async (userId: string) => {
    if (isOnline) {
      return supabase.from("users").select("*").eq("user_id", userId).single();
    }
    return localDb.getUserProfile(userId);
  },

  updateUserProfile: async (userId: string, updates: { username: string }) => {
    if (isOnline) {
      return supabase.from("users").update(updates).eq("user_id", userId);
    }
    return localDb.updateUserProfile(userId, updates);
  },

  changePassword: async (newPassword: string) => {
    if (isOnline) {
      return supabase.auth.updateUser({ password: newPassword });
    }
    return { data: null, error: { message: "Password changes require an internet connection." } };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (isOnline) {
      return supabase.auth.onAuthStateChange(callback);
    }
    return localDb.onAuthStateChange(callback);
  },

  // Users
  getUsers: async () => {
    if (isOnline) {
      return supabase.from("users").select("*");
    }
    return localDb.getUsers();
  },

  // Routines
  getRoutines: async () => {
    if (isOnline) {
      return supabase.from("routines").select("*");
    }
    return localDb.getRoutines();
  },

  insertRoutine: async (routine: { routine_name: string; description: string | null; user_id: string }) => {
    if (isOnline) {
      return supabase.from("routines").insert(routine);
    }
    return localDb.insertRoutine(routine);
  },

  deleteRoutine: async (routineId: number) => {
    if (isOnline) {
      return supabase.from("routines").delete().eq("routine_id", routineId);
    }
    return localDb.deleteRoutine(routineId);
  },

  // Routine Exercises
  getRoutineExercises: async (routineId: number) => {
    if (isOnline) {
      return supabase
        .from("routine_exercises")
        .select("*")
        .eq("routine_id", routineId)
        .order("exercise_order", { ascending: true });
    }
    return localDb.getRoutineExercises(routineId);
  },

  insertRoutineExercise: async (exercise: {
    routine_id: number;
    exercise_id: string;
    exercise_name: string;
    exercise_order: number;
  }) => {
    if (isOnline) {
      return supabase.from("routine_exercises").insert(exercise);
    }
    return localDb.insertRoutineExercise(exercise);
  },

  deleteRoutineExercise: async (routineExerciseId: number) => {
    if (isOnline) {
      return supabase.from("routine_exercises").delete().eq("routine_exercise_id", routineExerciseId);
    }
    return localDb.deleteRoutineExercise(routineExerciseId);
  },

  // Routine Exercise Sets (template sets)
  getRoutineExerciseSets: async (routineExerciseId: number) => {
    if (isOnline) {
      return supabase
        .from("routine_exercise_sets")
        .select("*")
        .eq("routine_exercise_id", routineExerciseId)
        .order("set_number", { ascending: true });
    }
    return localDb.getRoutineExerciseSets(routineExerciseId);
  },

  insertRoutineExerciseSet: async (set: {
    routine_exercise_id: number;
    set_number: number;
    target_weight: number | null;
    target_reps: number | null;
    is_warmup: boolean;
  }) => {
    if (isOnline) {
      return supabase.from("routine_exercise_sets").insert(set);
    }
    return localDb.insertRoutineExerciseSet(set);
  },

  deleteRoutineExerciseSet: async (routineSetId: number) => {
    if (isOnline) {
      return supabase.from("routine_exercise_sets").delete().eq("routine_set_id", routineSetId);
    }
    return localDb.deleteRoutineExerciseSet(routineSetId);
  },

  updateRoutineExerciseSet: async (
    routineSetId: number,
    updates: { target_reps?: number | null; target_weight?: number | null; is_warmup?: boolean }
  ) => {
    if (isOnline) {
      return supabase
        .from("routine_exercise_sets")
        .update(updates)
        .eq("routine_set_id", routineSetId);
    }
    return localDb.updateRoutineExerciseSet(routineSetId, updates);
  },

  // Workout Sessions
  startWorkoutSession: async (params: { routine_id: number | null; session_name: string; user_id: string }) => {
    if (isOnline) {
      const now = new Date();
      return supabase.from("workout_sessions").insert({
        routine_id: params.routine_id,
        session_name: params.session_name,
        session_date: now.toISOString().split("T")[0],
        start_time: now.toTimeString().split(" ")[0],
        user_id: params.user_id,
      }).select().single();
    }
    return localDb.startWorkoutSession(params);
  },

  finishWorkoutSession: async (sessionId: number, notes?: string) => {
    if (isOnline) {
      const now = new Date();
      return supabase.from("workout_sessions").update({
        end_time: now.toTimeString().split(" ")[0],
        notes,
      }).eq("session_id", sessionId);
    }
    return localDb.finishWorkoutSession(sessionId, notes);
  },

  getWorkoutSessions: async (userId: string) => {
    if (isOnline) {
      return supabase.from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .not("end_time", "is", null)
        .order("created_at", { ascending: false });
    }
    return localDb.getWorkoutSessions(userId);
  },

  getWorkoutSession: async (sessionId: number) => {
    if (isOnline) {
      return supabase.from("workout_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .single();
    }
    return localDb.getWorkoutSession(sessionId);
  },

  getActiveSession: async (userId: string) => {
    if (isOnline) {
      return supabase.from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .is("end_time", null)
        .maybeSingle();
    }
    return localDb.getActiveSession(userId);
  },

  updateWorkoutSession: async (sessionId: number, updates: { notes?: string; session_name?: string }) => {
    if (isOnline) {
      return supabase.from("workout_sessions")
        .update(updates)
        .eq("session_id", sessionId);
    }
    return localDb.updateWorkoutSession(sessionId, updates);
  },

  deleteWorkoutSession: async (sessionId: number) => {
    if (isOnline) {
      // Delete child records first (Supabase won't cascade unless FK has ON DELETE CASCADE)
      const { data: exercises } = await supabase.from("session_exercises")
        .select("session_exercise_id")
        .eq("session_id", sessionId);
      
      for (const ex of exercises ?? []) {
        await supabase.from("session_exercise_sets")
          .delete()
          .eq("session_exercise_id", ex.session_exercise_id);
      }
      await supabase.from("session_exercises").delete().eq("session_id", sessionId);
      return supabase.from("workout_sessions").delete().eq("session_id", sessionId);
    }
    return localDb.deleteWorkoutSession(sessionId);
  },

  // Session Exercises
  getSessionExercises: async (sessionId: number) => {
    if (isOnline) {
      return supabase.from("session_exercises")
        .select("*")
        .eq("session_id", sessionId)
        .order("exercise_order");
    }
    return localDb.getSessionExercises(sessionId);
  },

  insertSessionExercise: async (exercise: { session_id: number; exercise_id: string; exercise_name: string; exercise_order: number; notes: string | null }) => {
    if (isOnline) {
      return supabase.from("session_exercises").insert(exercise).select().single();
    }
    return localDb.insertSessionExercise(exercise);
  },

  deleteSessionExercise: async (sessionExerciseId: number) => {
    if (isOnline) {
      await supabase.from("session_exercise_sets").delete().eq("session_exercise_id", sessionExerciseId);
      return supabase.from("session_exercises").delete().eq("session_exercise_id", sessionExerciseId);
    }
    return localDb.deleteSessionExercise(sessionExerciseId);
  },

  // Session Exercise Sets
  getSessionExerciseSets: async (sessionExerciseId: number) => {
    if (isOnline) {
      return supabase.from("session_exercise_sets")
        .select("*")
        .eq("session_exercise_id", sessionExerciseId)
        .order("set_number");
    }
    return localDb.getSessionExerciseSets(sessionExerciseId);
  },

  insertSessionExerciseSet: async (set: { session_exercise_id: number; set_number: number; weight: number | null; reps: number | null; is_warmup: boolean }) => {
    if (isOnline) {
      return supabase.from("session_exercise_sets").insert(set).select().single();
    }
    return localDb.insertSessionExerciseSet(set);
  },

  updateSessionExerciseSet: async (sessionSetId: number, updates: { reps?: number | null; weight?: number | null; is_warmup?: boolean; completed?: boolean }) => {
    if (isOnline) {
      return supabase.from("session_exercise_sets").update(updates).eq("session_set_id", sessionSetId);
    }
    return localDb.updateSessionExerciseSet(sessionSetId, updates);
  },

  deleteSessionExerciseSet: async (sessionSetId: number) => {
    if (isOnline) {
      return supabase.from("session_exercise_sets").delete().eq("session_set_id", sessionSetId);
    }
    return localDb.deleteSessionExerciseSet(sessionSetId);
  },

  // Start from routine (copies template → live session)
  startWorkoutFromRoutine: async (routineId: number, userId: string) => {
    if (isOnline) {
      // Round 1: fetch routine + exercises in parallel
      const [{ data: routine }, { data: exercises }] = await Promise.all([
        supabase.from("routines").select("*").eq("routine_id", routineId).single(),
        supabase.from("routine_exercises").select("*").eq("routine_id", routineId).order("exercise_order"),
      ]);
      if (!routine) return { data: null, error: { message: "Routine not found" } };

      const now = new Date();
      const routineExerciseIds = (exercises ?? []).map((e: any) => e.routine_exercise_id);

      // Round 2: create session + fetch all template sets in parallel
      const [{ data: session, error: sessionErr }, { data: allTemplateSets }] = await Promise.all([
        supabase.from("workout_sessions").insert({
          routine_id: routineId,
          session_name: routine.routine_name,
          session_date: now.toISOString().split("T")[0],
          start_time: now.toTimeString().split(" ")[0],
          user_id: userId,
        }).select().single(),
        routineExerciseIds.length > 0
          ? supabase.from("routine_exercise_sets").select("*").in("routine_exercise_id", routineExerciseIds).order("set_number")
          : Promise.resolve({ data: [] }),
      ]);
      if (sessionErr) return { data: null, error: sessionErr };

      if ((exercises ?? []).length === 0) return { data: session, error: null };

      // Round 3: batch insert all session exercises at once
      const exerciseInserts = (exercises ?? []).map((ex: any) => ({
        session_id: session.session_id,
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        exercise_order: ex.exercise_order,
        notes: null,
      }));
      const { data: sessionExercises, error: exErr } = await supabase
        .from("session_exercises").insert(exerciseInserts).select();
      if (exErr) return { data: null, error: exErr };

      // Round 4: batch insert all sets at once (sessionExercises preserves insertion order)
      const setInserts: any[] = [];
      (sessionExercises ?? []).forEach((sessionEx: any, i: number) => {
        const origEx = (exercises ?? [])[i];
        const templateSets = (allTemplateSets ?? []).filter(
          (ts: any) => ts.routine_exercise_id === origEx?.routine_exercise_id
        );
        for (const ts of templateSets) {
          setInserts.push({
            session_exercise_id: sessionEx.session_exercise_id,
            set_number: ts.set_number,
            weight: ts.target_weight,
            reps: ts.target_reps,
            is_warmup: ts.is_warmup,
          });
        }
      });
      if (setInserts.length > 0) {
        await supabase.from("session_exercise_sets").insert(setInserts);
      }

      return { data: session, error: null };
    }
    return localDb.startWorkoutFromRoutine(routineId, userId);
  },

  // Previous performance hints
  getPreviousSessionSets: async (exerciseId: string, userId: string, excludeSessionId: number) => {
    if (isOnline) {
      const { data: prevEx } = await supabase
        .from("session_exercises")
        .select("session_exercise_id, workout_sessions!inner(session_id, user_id, end_time)")
        .eq("exercise_id", exerciseId)
        .eq("workout_sessions.user_id", userId)
        .not("workout_sessions.end_time", "is", null)
        .neq("workout_sessions.session_id", excludeSessionId)
        .order("workout_sessions(created_at)", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!prevEx) return { data: [], error: null };
      return supabase
        .from("session_exercise_sets")
        .select("*")
        .eq("session_exercise_id", prevEx.session_exercise_id)
        .order("set_number");
    }
    return localDb.getPreviousSessionSets(exerciseId, userId, excludeSessionId);
  },

  // Personal Records
  getPersonalRecords: async (userId: string) => {
    if (isOnline) {
      return supabase.from("personal_records").select("*").eq("user_id", userId);
    }
    return localDb.getPersonalRecords(userId);
  },

  upsertPersonalRecord: async (record: {
    user_id: string;
    exercise_id: string;
    max_weight: number | null;
    max_volume: number | null;
  }) => {
    if (isOnline) {
      return supabase.from("personal_records").upsert(record, { onConflict: "user_id,exercise_id" });
    }
    return localDb.upsertPersonalRecord(record);
  },

  // Custom Exercises
  getCustomExercises: async (userId: string) => {
    if (isOnline) {
      return supabase.from("custom_exercises").select("*").eq("user_id", userId);
    }
    return localDb.getCustomExercises(userId);
  },

  insertCustomExercise: async (exercise: {
    exercise_id: string;
    user_id: string;
    name: string;
    primary_muscle: string | null;
    equipment: string | null;
  }) => {
    if (isOnline) {
      return supabase.from("custom_exercises").insert(exercise);
    }
    return localDb.insertCustomExercise(exercise);
  },

  deleteCustomExercise: async (exerciseId: string) => {
    if (isOnline) {
      return supabase.from("custom_exercises").delete().eq("exercise_id", exerciseId);
    }
    return localDb.deleteCustomExercise(exerciseId);
  },

  // Exercise history for progression charts
  getExerciseHistory: async (exerciseId: string, userId: string) => {
    if (isOnline) {
      const { data: sessionExercises } = await supabase
        .from("session_exercises")
        .select("session_exercise_id, workout_sessions!inner(session_id, session_date, end_time, user_id)")
        .eq("exercise_id", exerciseId)
        .eq("workout_sessions.user_id", userId)
        .not("workout_sessions.end_time", "is", null)
        .order("workout_sessions(session_date)", { ascending: true });

      if (!sessionExercises) return { data: [], error: null };

      const history = await Promise.all(
        sessionExercises.map(async (se: any) => {
          const { data: sets } = await supabase
            .from("session_exercise_sets")
            .select("*")
            .eq("session_exercise_id", se.session_exercise_id)
            .eq("completed", true);
          return {
            session_date: se.workout_sessions.session_date,
            sets: sets ?? [],
          };
        })
      );
      return { data: history, error: null };
    }
    return localDb.getExerciseHistory(exerciseId, userId);
  },
};