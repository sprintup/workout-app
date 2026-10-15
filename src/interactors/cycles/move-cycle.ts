import type { Gateways } from "../../gateways/gateways";
import {
  regenerateSchedule,
  scheduleUpdateFailed,
  wholeScheduleConfirmation,
} from "../../services/schedule";
import { changed, unchanged, type InteractorResult } from "../interactor";

export interface MoveCycleInput {
  cycleId: string;
  direction: number;
}

function moveIndexes(gateways: Gateways, input: MoveCycleInput) {
  const cycles = gateways.cycles.all();
  const index = cycles.findIndex((cycle) => cycle.id === input.cycleId);
  const nextIndex = index + Number(input.direction);
  if (index < 0 || nextIndex < 0 || nextIndex >= cycles.length) return null;
  return { index, nextIndex };
}

export function moveCycleConfirmation(
  gateways: Gateways,
  input: MoveCycleInput,
): string | null {
  if (!moveIndexes(gateways, input)) return null;
  return wholeScheduleConfirmation(
    "Reordering cycles changes this week's rotation.",
  );
}

// As a user
// When I move a cycle earlier or later in the rotation
// Then the rotation runs in the new order and the week is regenerated
export function moveCycle(
  gateways: Gateways,
  input: MoveCycleInput,
): InteractorResult {
  const indexes = moveIndexes(gateways, input);
  if (!indexes) return unchanged();
  const backup = gateways.appState.snapshot();
  gateways.cycles.setActiveSplitId(null);
  const cycles = gateways.cycles.all();
  [cycles[indexes.index], cycles[indexes.nextIndex]] = [
    cycles[indexes.nextIndex],
    cycles[indexes.index],
  ];
  try {
    regenerateSchedule({ preserveMatching: true });
  } catch (error) {
    gateways.appState.restore(backup);
    return scheduleUpdateFailed(error);
  }
  return changed({ refresh: ["all"], toast: "Cycle order updated." });
}
