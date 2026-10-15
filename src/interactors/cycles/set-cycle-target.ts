import { cycleDisplayName, isRestCycle } from "../../entities/cycles";
import {
  defaultDesignationLabel,
  normalizeWorkoutTarget,
  workoutTarget,
} from "../../entities/targets";
import type { Gateways } from "../../gateways/gateways";
import {
  cycleDaysWithProgress,
  regenerateSchedule,
  scheduleUpdateFailed,
} from "../../services/schedule";
import { changed, unchanged, type InteractorResult } from "../interactor";

export interface SetCycleTargetInput {
  cycleId: string;
  target: string;
}

function plannedChange(gateways: Gateways, input: SetCycleTargetInput) {
  const cycle = gateways.cycles.find(input.cycleId);
  if (!cycle || isRestCycle(cycle)) return null;
  const target = normalizeWorkoutTarget(input.target, cycle.target);
  if (target === cycle.target) return null;
  return { cycle, target };
}

export function setCycleTargetConfirmation(
  gateways: Gateways,
  input: SetCycleTargetInput,
): string | null {
  const change = plannedChange(gateways, input);
  if (!change || !cycleDaysWithProgress(change.cycle.id).length) return null;
  return `Changing ${cycleDisplayName(change.cycle)}'s target regenerates its current workouts and clears their progress. Continue?`;
}

// As a user
// When I choose a different workout target for a cycle
// Then the cycle uses that target's exercise slots and its days are
//   regenerated
export function setCycleTarget(
  gateways: Gateways,
  input: SetCycleTargetInput,
): InteractorResult {
  const change = plannedChange(gateways, input);
  if (!change) return unchanged();
  const { cycle, target } = change;
  const backup = gateways.appState.snapshot();
  gateways.cycles.setActiveSplitId(null);
  cycle.target = target;
  cycle.designation = defaultDesignationLabel(target);
  const message = `${cycleDisplayName(cycle)} is now a ${workoutTarget(target).label} cycle.`;
  try {
    regenerateSchedule({ forceCycleIds: [cycle.id], preserveMatching: true });
  } catch (error) {
    gateways.appState.restore(backup);
    return scheduleUpdateFailed(error);
  }
  return changed({ refresh: ["all"], toast: message });
}
