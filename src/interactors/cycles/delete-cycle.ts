import { cycleDisplayName, isRestCycle } from "../../entities/cycles";
import type { Gateways } from "../../gateways/gateways";
import {
  regenerateSchedule,
  scheduleUpdateFailed,
  wholeScheduleConfirmation,
} from "../../services/schedule";
import { changed, failed, unchanged, type InteractorResult } from "../interactor";

const KEEP_ONE_TRAINING_CYCLE =
  "Keep at least one training cycle in the rotation.";

function removal(gateways: Gateways, cycleId: string) {
  const cycles = gateways.cycles.all();
  const index = cycles.findIndex((cycle) => cycle.id === cycleId);
  if (index < 0) return null;
  const cycle = cycles[index];
  const lastTrainingCycle =
    !isRestCycle(cycle) &&
    cycles.filter((item) => !isRestCycle(item)).length <= 1;
  return { index, cycle, lastTrainingCycle };
}

export function deleteCycleConfirmation(
  gateways: Gateways,
  input: { cycleId: string },
): string | null {
  const target = removal(gateways, input.cycleId);
  if (!target || target.lastTrainingCycle) return null;
  return wholeScheduleConfirmation(
    `Removing ${cycleDisplayName(target.cycle, target.index)} changes this week's rotation.`,
  );
}

// As a user
// When I remove a cycle from the rotation
// Then the rotation continues without it, favorites tied to it are removed,
//   and the week is regenerated (the last training cycle can't be removed)
export function deleteCycle(
  gateways: Gateways,
  input: { cycleId: string },
): InteractorResult {
  const target = removal(gateways, input.cycleId);
  if (!target) return unchanged();
  if (target.lastTrainingCycle) return failed(KEEP_ONE_TRAINING_CYCLE);
  const { index, cycle } = target;
  const backup = gateways.appState.snapshot();
  gateways.cycles.setActiveSplitId(null);
  const cycles = gateways.cycles.all();
  const nextCycle = cycles[(index + 1) % cycles.length];
  cycles.splice(index, 1);
  if (gateways.week.startCycleId() === input.cycleId)
    gateways.week.setStartCycleId(nextCycle.id);
  if (gateways.week.nextCycleId() === input.cycleId)
    gateways.week.setNextCycleId(nextCycle.id);
  gateways.favorites.replaceAll(
    gateways.favorites
      .all()
      .filter((favorite) => favorite.cycleId !== input.cycleId),
  );
  const message = `${cycleDisplayName(cycle, index)} removed.`;
  try {
    regenerateSchedule({ preserveMatching: true });
  } catch (error) {
    gateways.appState.restore(backup);
    return scheduleUpdateFailed(error);
  }
  return changed({ refresh: ["all"], toast: message });
}
