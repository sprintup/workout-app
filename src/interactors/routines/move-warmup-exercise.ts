import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";
import { moveRoutineItem } from "./routine-list";

// As a user
// When I move a warm-up exercise earlier or later in Settings
// Then the warm-up checklist uses the new order
export function moveWarmupExercise(
  gateways: Gateways,
  input: { warmupId: string; direction: number },
): InteractorResult {
  if (!moveRoutineItem(gateways.routines.warmups(), input.warmupId, input.direction))
    return unchanged();
  return changed({ refresh: ["settings"], toast: "Warm-up order updated." });
}
