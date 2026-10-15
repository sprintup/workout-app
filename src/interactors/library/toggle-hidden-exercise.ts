import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I hide an exercise in the library or replacement list (or unhide it)
// Then it stops (or resumes) appearing in recommendations
export function toggleHiddenExercise(
  gateways: Gateways,
  input: { exerciseId: string; hideOnly?: boolean },
): InteractorResult {
  const exercise = gateways.exercises.find(input.exerciseId);
  if (
    !exercise ||
    exercise.always_locked ||
    gateways.exercises.isDeleted(input.exerciseId)
  )
    return unchanged();
  const hidden = gateways.exercises.isHidden(input.exerciseId);
  const shouldHide = input.hideOnly || !hidden;
  let toast: string;
  if (!shouldHide) {
    gateways.exercises.replaceHiddenIds(
      gateways.exercises.hiddenIds().filter((id) => id !== input.exerciseId),
    );
    toast = `${exercise.name} restored to recommendations.`;
  } else {
    if (!hidden) gateways.exercises.hiddenIds().push(input.exerciseId);
    toast = `${exercise.name} hidden from future recommendations.`;
  }
  return changed({ refresh: ["all", "replacement-results"], toast });
}
