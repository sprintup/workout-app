import type { Gateways } from "../../gateways/gateways";
import { allAssignments } from "../../services/week";
import { changed, unchanged, type InteractorResult } from "../interactor";

function deletableExercise(gateways: Gateways, exerciseId: string) {
  const exercise = gateways.exercises.find(exerciseId);
  if (
    !exercise ||
    exercise.always_locked ||
    gateways.exercises.isDeleted(exerciseId)
  )
    return null;
  return exercise;
}

/** The question to confirm before deleting, or null if it can't be deleted. */
export function deleteLibraryExerciseConfirmation(
  gateways: Gateways,
  input: { exerciseId: string },
): string | null {
  const exercise = deletableExercise(gateways, input.exerciseId);
  if (!exercise) return null;
  const inCurrentWeek = allAssignments().some(
    (assignment) => assignment.exerciseId === input.exerciseId,
  );
  return inCurrentWeek
    ? `Delete ${exercise.name} from the library? It will remain in the current week until you replace it, but will not be recommended again.`
    : `Delete ${exercise.name} from the library and future recommendations?`;
}

// As a user
// When I delete an exercise from the library
// Then it is never recommended again (it stays in the current week until I
//   replace it)
export function deleteLibraryExercise(
  gateways: Gateways,
  input: { exerciseId: string },
): InteractorResult {
  const exercise = deletableExercise(gateways, input.exerciseId);
  if (!exercise) return unchanged();
  gateways.exercises.deletedIds().push(input.exerciseId);
  gateways.exercises.replaceHiddenIds(
    gateways.exercises.hiddenIds().filter((id) => id !== input.exerciseId),
  );
  return changed({
    refresh: ["tabs", "library"],
    toast: `${exercise.name} deleted from the library.`,
  });
}
