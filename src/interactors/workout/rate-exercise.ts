import { clampRating, exerciseEffectivenessScore } from "../../entities/exercise";
import type { Gateways } from "../../gateways/gateways";
import { updateExerciseEffectiveness } from "../../services/exercise-catalog";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I give an exercise a thumbs up or thumbs down
// Then its effectiveness score moves one point that way (pressing the same
//   thumb again undoes it), which changes how often it is recommended
export function rateExercise(
  gateways: Gateways,
  input: { exerciseId: string; thumbsUp: boolean },
): InteractorResult {
  const exercise = gateways.exercises.find(input.exerciseId);
  if (!exercise) return unchanged();
  const stats = gateways.exercises.stats(exercise.id);
  const requestedPreference = input.thumbsUp ? 1 : -1;
  const previousPreference = stats.preference;
  const feedbackBase =
    previousPreference === 0
      ? exerciseEffectivenessScore(exercise)
      : clampRating(
          stats.effectivenessFeedbackBase,
          exerciseEffectivenessScore(exercise) - previousPreference,
        );
  const nextPreference =
    previousPreference === requestedPreference ? 0 : requestedPreference;
  const effectivenessScore = updateExerciseEffectiveness(
    exercise.id,
    nextPreference === 0 ? feedbackBase : feedbackBase + nextPreference,
  );
  stats.preference = nextPreference;
  stats.effectivenessFeedbackBase = nextPreference ? feedbackBase : null;
  return changed({
    refresh: ["all"],
    toast:
      nextPreference === 0
        ? `${exercise.name} effectiveness returned to ${effectivenessScore} of 5.`
        : `${exercise.name} effectiveness is now ${effectivenessScore} of 5.`,
  });
}
