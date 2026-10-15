import { gateways } from "../gateways/registry";
import { cleanRepValue, defaultMeasureType } from "../entities/exercise-state";
import type { ExerciseStats } from "../types";


export function initialExerciseState(): Record<string, ExerciseStats> {
  return Object.fromEntries(
    gateways.exercises.all().map((exercise) => [
      exercise.id,
      {
        chosenCount: 0,
        skippedCount: 0,
        preference: 0,
        effectivenessFeedbackBase: null,
        loadProgressCount: 0,
        reps: cleanRepValue(exercise.default_reps),
        measureType: defaultMeasureType(exercise),
        weight: "",
        loadBasis: "total" as const,
        notes: "",
      },
    ]),
  );
}
