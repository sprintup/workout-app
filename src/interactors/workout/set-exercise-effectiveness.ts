import type { Gateways } from "../../gateways/gateways";
import { clearExerciseRatings, updateExerciseEffectiveness } from "../../services/exercise-catalog";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I pick an effectiveness score (1 to 5) for an exercise
// Then that score is saved and this week's thumbs for it are cleared, so
//   the typed score is the new starting point
export function setExerciseEffectiveness(
  gateways: Gateways,
  input: { exerciseId: string; score: string | number },
): InteractorResult {
  if (!gateways.exercises.find(input.exerciseId)) return unchanged();
  updateExerciseEffectiveness(input.exerciseId, input.score);
  clearExerciseRatings(input.exerciseId);
  return changed({ refresh: ["all"] });
}
