import type { Gateways } from "../../gateways/gateways";
import type { ExerciseStats } from "../../types";
import { changed, type InteractorResult } from "../interactor";

export interface SetExerciseMeasurementInput {
  exerciseId: string;
  setting: "measureType" | "loadBasis";
  value: string;
}

// As a user
// When I switch an exercise between reps and seconds, or between total load
//   and load per hand
// Then the choice is saved for that exercise
export function setExerciseMeasurement(
  gateways: Gateways,
  input: SetExerciseMeasurementInput,
): InteractorResult {
  const stats = gateways.exercises.stats(input.exerciseId);
  if (input.setting === "measureType")
    stats.measureType = input.value as ExerciseStats["measureType"];
  else stats.loadBasis = input.value as ExerciseStats["loadBasis"];
  return changed({ refresh: input.setting === "loadBasis" ? ["all"] : [] });
}
