import { clampRating, exerciseEffectivenessScore } from "../../entities/exercise";
import type { Gateways } from "../../gateways/gateways";
import { assignmentFor } from "../../services/circuit-editing";
import { ratingKey, updateExerciseEffectiveness } from "../../services/exercise-catalog";
import type { AssignmentContext } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I give an exercise a thumbs up or thumbs down in a workout
// Then its effectiveness score moves one point that way (which changes how
//   often it is recommended); pressing the same thumb again in that spot
//   undoes it, and every later appearance of the exercise can be rated again
export function rateExercise(
  gateways: Gateways,
  input: AssignmentContext & { thumbsUp: boolean },
): InteractorResult {
  const exercise = gateways.exercises.find(assignmentFor(input)?.exerciseId);
  if (!exercise) return unchanged();
  const key = ratingKey(input, exercise.id);
  const ratings = gateways.exercises.ratings();
  const previous = ratings[key];
  const direction = input.thumbsUp ? 1 : -1;
  const unrated = clampRating(
    exerciseEffectivenessScore(exercise) - (previous?.applied || 0),
    3,
  );
  if (previous?.direction === direction) {
    delete ratings[key];
    const score = updateExerciseEffectiveness(exercise.id, unrated);
    return changed({
      refresh: ["all"],
      toast: `${exercise.name} effectiveness returned to ${score} of 5.`,
    });
  }
  const score = updateExerciseEffectiveness(exercise.id, unrated + direction);
  ratings[key] = { direction, applied: score - unrated };
  return changed({
    refresh: ["all"],
    toast: `${exercise.name} effectiveness is now ${score} of 5.`,
  });
}
