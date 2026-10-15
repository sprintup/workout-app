import {
  cycleDisplayName,
  cycleTargetLabel,
  isRestCycle,
} from "../../entities/cycles";
import { trainingDesignation } from "../../entities/targets";
import type { Gateways } from "../../gateways/gateways";
import {
  cycleDaysWithProgress,
  regenerateSchedule,
  scheduleUpdateFailed,
} from "../../services/schedule";
import { changed, unchanged, type InteractorResult } from "../interactor";

export interface SetCycleDesignationInput {
  cycleId: string;
  designation: string;
}

function plannedChange(gateways: Gateways, input: SetCycleDesignationInput) {
  const cycle = gateways.cycles.find(input.cycleId);
  if (!cycle || isRestCycle(cycle)) return null;
  const designation =
    String(input.designation || "")
      .trim()
      .slice(0, 80) || cycleTargetLabel(cycle);
  const preset = trainingDesignation(designation);
  const target = preset?.target || "custom";
  const bodyParts = preset ? [...preset.bodyParts] : [...cycle.bodyParts];
  const same =
    designation === cycleTargetLabel(cycle) &&
    target === cycle.target &&
    bodyParts.join("|") === cycle.bodyParts.join("|");
  return { cycle, designation, target, bodyParts, same };
}

export function setCycleDesignationConfirmation(
  gateways: Gateways,
  input: SetCycleDesignationInput,
): string | null {
  const change = plannedChange(gateways, input);
  if (!change || change.same || !cycleDaysWithProgress(change.cycle.id).length)
    return null;
  return `Changing ${cycleDisplayName(change.cycle)}'s training target regenerates its current workouts and clears their progress. Continue?`;
}

// As a user
// When I type a training target for a cycle (for example "Pull" or "Chest")
// Then a known target sets the cycle's muscles to match (anything else keeps
//   them as a custom target) and the cycle's days are regenerated
export function setCycleDesignation(
  gateways: Gateways,
  input: SetCycleDesignationInput,
): InteractorResult<string> {
  const change = plannedChange(gateways, input);
  if (!change) return unchanged();
  const { cycle, designation, target, bodyParts } = change;
  if (change.same) return unchanged({ value: designation });
  const backup = gateways.appState.snapshot();
  gateways.cycles.setActiveSplitId(null);
  cycle.designation = designation;
  cycle.target = target;
  cycle.bodyParts = bodyParts;
  const message = `${cycleDisplayName(cycle)} now targets ${designation}.`;
  try {
    regenerateSchedule({ forceCycleIds: [cycle.id], preserveMatching: true });
  } catch (error) {
    gateways.appState.restore(backup);
    return scheduleUpdateFailed(error);
  }
  return changed({ refresh: ["all"], toast: message });
}
