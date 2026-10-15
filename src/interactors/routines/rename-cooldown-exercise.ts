import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";
import { routineLabel } from "./routine-list";

export interface RenameCooldownExerciseInput {
  cooldownId: string;
  label: string;
  /** False while typing; true when the field is committed. */
  final: boolean;
}

// As a user
// When I rename a cool-down exercise in Settings
// Then the cool-down checklist shows the new name
export function renameCooldownExercise(
  gateways: Gateways,
  input: RenameCooldownExerciseInput,
): InteractorResult<string> {
  const cooldowns = gateways.routines.cooldowns();
  const index = cooldowns.findIndex(
    (exercise) => exercise.id === input.cooldownId,
  );
  if (index < 0) return unchanged();
  const label = routineLabel(
    input.label,
    input.final,
    `Cool-down exercise ${index + 1}`,
  );
  cooldowns[index].label = label;
  return changed({ value: label });
}
