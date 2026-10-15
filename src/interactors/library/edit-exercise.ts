import { DAY_CONFIG } from "../../data/training";
import { mainAssignments } from "../../entities/circuits";
import { exerciseEffectivenessScore } from "../../entities/exercise";
import type { Gateways } from "../../gateways/gateways";
import { markManualSetupTransitions } from "../../services/circuit-editing";
import { validateWeek } from "../../services/validation";
import { changed, failed, unchanged, type InteractorResult } from "../interactor";
import {
  normalizeExerciseForm,
  saveExerciseDefaults,
  type ExerciseFormOutcome,
  type ExerciseFormValues,
} from "./exercise-form";

// As a user
// When I edit an exercise (built in or my own)
// Then the changes apply throughout the library and the current week, unless
//   they would make the current plan invalid
export function editExercise(
  gateways: Gateways,
  input: { exerciseId: string; values: ExerciseFormValues },
): InteractorResult<ExerciseFormOutcome> {
  const existing = gateways.exercises.find(input.exerciseId);
  if (!existing) return unchanged();
  const previousEffectivenessScore = exerciseEffectivenessScore(existing);
  const form = normalizeExerciseForm(input.values);
  const edits = gateways.exercises.edits();
  const previousEdit = edits[input.exerciseId];
  edits[input.exerciseId] = form.record;
  gateways.exercises.rebuildCatalog(gateways.exercises.customRecords(), edits);
  for (const day of DAY_CONFIG) {
    for (const circuit of gateways.week.day(day.id).circuits) {
      markManualSetupTransitions(mainAssignments(circuit));
    }
  }
  const issues = validateWeek(gateways.week.current());
  if (issues.length) {
    if (previousEdit) edits[input.exerciseId] = previousEdit;
    else delete edits[input.exerciseId];
    gateways.exercises.rebuildCatalog(
      gateways.exercises.customRecords(),
      edits,
    );
    const formError = `That edit conflicts with the current plan: ${issues[0]}`;
    return failed(formError, { value: { formError } });
  }
  const stats = saveExerciseDefaults(gateways, input.exerciseId, form);
  if (previousEffectivenessScore !== form.record.effectivenessScore) {
    stats.preference = 0;
    stats.effectivenessFeedbackBase = null;
  }
  return changed({
    refresh: ["all"],
    toast: `${form.name} updated.`,
    value: { exerciseId: input.exerciseId },
  });
}
