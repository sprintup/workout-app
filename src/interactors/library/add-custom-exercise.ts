import { idFor } from "../../entities/exercise";
import type { Gateways } from "../../gateways/gateways";
import { changed, failed, type InteractorResult } from "../interactor";
import {
  normalizeExerciseForm,
  saveExerciseDefaults,
  type ExerciseFormOutcome,
  type ExerciseFormValues,
} from "./exercise-form";

// As a user
// When I add my own exercise to the library
// Then it can be recommended wherever its muscles, equipment and movement fit,
//   starting with the reps and load I entered
export function addCustomExercise(
  gateways: Gateways,
  input: ExerciseFormValues,
): InteractorResult<ExerciseFormOutcome> {
  const form = normalizeExerciseForm(input);
  const exerciseId = idFor(form.name);
  if (!exerciseId || gateways.exercises.has(exerciseId)) {
    const formError = "An exercise with that name already exists.";
    return failed(formError, { value: { formError } });
  }
  gateways.exercises.customRecords().push(form.record);
  gateways.exercises.rebuildCatalog(
    gateways.exercises.customRecords(),
    gateways.exercises.edits(),
  );
  gateways.exercises.stats(exerciseId);
  saveExerciseDefaults(gateways, exerciseId, form);
  return changed({
    refresh: ["all"],
    toast: `${form.name} added to the exercise library.`,
    value: { exerciseId },
  });
}
