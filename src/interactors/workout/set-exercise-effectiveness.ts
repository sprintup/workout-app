import type { Gateways } from "../../gateways/gateways";
import { updateExerciseEffectiveness } from "../../services/exercise-catalog";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I pick an effectiveness score (1 to 5) for an exercise
// Then that score is saved and any thumbs-up or thumbs-down adjustment is
//   cleared
export function setExerciseEffectiveness(
  gateways: Gateways,
  input: { exerciseId: string; score: string | number },
): InteractorResult {
  if (!gateways.exercises.find(input.exerciseId)) return unchanged();
  updateExerciseEffectiveness(input.exerciseId, input.score, true);
  return changed({ refresh: ["all"] });
}
