import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";
import { moveRoutineItem } from "./routine-list";

// As a user
// When I move a cool-down exercise earlier or later in Settings
// Then the cool-down checklist uses the new order
export function moveCooldownExercise(
  gateways: Gateways,
  input: { cooldownId: string; direction: number },
): InteractorResult {
  if (
    !moveRoutineItem(
      gateways.routines.cooldowns(),
      input.cooldownId,
      input.direction,
    )
  )
    return unchanged();
  return changed({ refresh: ["settings"], toast: "Cool-down order updated." });
}
