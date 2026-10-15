import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";
import { routineLabel } from "./routine-list";

export interface RenameWarmupExerciseInput {
  warmupId: string;
  label: string;
  /** False while typing; true when the field is committed. */
  final: boolean;
}

// As a user
// When I rename a warm-up exercise in Settings
// Then the warm-up checklist shows the new name
export function renameWarmupExercise(
  gateways: Gateways,
  input: RenameWarmupExerciseInput,
): InteractorResult<string> {
  const warmups = gateways.routines.warmups();
  const index = warmups.findIndex((exercise) => exercise.id === input.warmupId);
  if (index < 0) return unchanged();
  const label = routineLabel(
    input.label,
    input.final,
    `Warm-up exercise ${index + 1}`,
  );
  warmups[index].label = label;
  return changed({ value: label });
}
