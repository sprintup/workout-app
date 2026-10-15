import type { Gateways } from "../../gateways/gateways";
import { changed, type InteractorResult } from "../interactor";

export type ExerciseLogField = "reps" | "weight" | "notes";

export interface UpdateExerciseLogInput {
  exerciseId: string;
  field: ExerciseLogField;
  value: string;
}

// As a user
// When I type the reps, load or notes for an exercise
// Then they are saved for the next time it comes up; changing the load
//   starts its four-workout progression over
export function updateExerciseLog(
  gateways: Gateways,
  input: UpdateExerciseLogInput,
): InteractorResult {
  const stats = gateways.exercises.stats(input.exerciseId);
  const nextValue = input.value.slice(0, input.field === "notes" ? 1000 : 40);
  if (input.field === "weight" && stats.weight !== nextValue)
    stats.loadProgressCount = 0;
  stats[input.field] = nextValue;
  return changed();
}
