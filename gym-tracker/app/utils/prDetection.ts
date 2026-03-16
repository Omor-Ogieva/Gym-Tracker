export type PRResult = {
  exerciseId: string;
  exerciseName: string;
  type: "weight" | "volume" | "both";
  newMax: number;
};

type CurrentSet = {
  weight: number | null;
  reps: number | null;
  completed: boolean;
};

type PreviousRecord = {
  exercise_id: string;
  max_weight: number | null;
  max_volume: number | null;
};

export function detectPRs(
  exercises: Array<{ session_exercise_id: number; exercise_id: string; exercise_name: string }>,
  exerciseSets: Record<number, CurrentSet[]>,
  previousRecords: PreviousRecord[]
): PRResult[] {
  const results: PRResult[] = [];
  const prevMap = new Map(previousRecords.map((r) => [r.exercise_id, r]));

  for (const ex of exercises) {
    const sets = (exerciseSets[ex.session_exercise_id] ?? []).filter((s) => s.completed);
    if (sets.length === 0) continue;

    const maxWeight = sets.reduce((m, s) => (s.weight != null && s.weight > m ? s.weight : m), 0);
    const totalVolume = sets.reduce((sum, s) => {
      if (s.weight != null && s.reps != null) return sum + s.weight * s.reps;
      return sum;
    }, 0);

    const prev = prevMap.get(ex.exercise_id);
    const prevWeight = prev?.max_weight ?? 0;
    const prevVolume = prev?.max_volume ?? 0;

    const weightPR = maxWeight > prevWeight;
    const volumePR = totalVolume > prevVolume;

    if (weightPR || volumePR) {
      results.push({
        exerciseId: ex.exercise_id,
        exerciseName: ex.exercise_name,
        type: weightPR && volumePR ? "both" : weightPR ? "weight" : "volume",
        newMax: weightPR ? maxWeight : totalVolume,
      });
    }
  }

  return results;
}
