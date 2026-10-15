import { cycleDisplayName, isRestCycle } from "../../entities/cycles";
import { normalizeBodyParts } from "../../entities/exercise";
import type { Gateways } from "../../gateways/gateways";
import {
  cycleDaysWithProgress,
  regenerateSchedule,
  scheduleUpdateFailed,
} from "../../services/schedule";
import { changed, unchanged, type InteractorResult } from "../interactor";

export interface SetCycleBodyPartsInput {
  cycleId: string;
  bodyParts: string[];
}

function plannedChange(gateways: Gateways, input: SetCycleBodyPartsInput) {
  const cycle = gateways.cycles.find(input.cycleId);
  if (!cycle || isRestCycle(cycle)) return null;
  const bodyParts = normalizeBodyParts(input.bodyParts);
  const same = bodyParts.join("|") === cycle.bodyParts.join("|");
  return { cycle, bodyParts, same };
}

export function setCycleBodyPartsConfirmation(
  gateways: Gateways,
  input: SetCycleBodyPartsInput,
): string | null {
  const change = plannedChange(gateways, input);
  if (!change || change.same || !cycleDaysWithProgress(change.cycle.id).length)
    return null;
  return `Changing ${cycleDisplayName(change.cycle)}'s body parts regenerates its current workouts and clears their progress. Continue?`;
}

// As a user
// When I choose which body parts a cycle trains and apply them
// Then the cycle only recommends exercises for those muscles (none selected
//   means every qualifying muscle) and its days are regenerated
export function setCycleBodyParts(
  gateways: Gateways,
  input: SetCycleBodyPartsInput,
): InteractorResult {
  const change = plannedChange(gateways, input);
  if (!change) return unchanged();
  const { cycle, bodyParts } = change;
  if (change.same)
    return unchanged({ toast: "Those body-part settings are already applied." });
  const backup = gateways.appState.snapshot();
  gateways.cycles.setActiveSplitId(null);
  cycle.bodyParts = bodyParts;
  const message = bodyParts.length
    ? `${cycleDisplayName(cycle)} now targets ${bodyParts.join(", ")}.`
    : `${cycleDisplayName(cycle)} now uses every qualifying body part.`;
  try {
    regenerateSchedule({ forceCycleIds: [cycle.id], preserveMatching: true });
  } catch (error) {
    gateways.appState.restore(backup);
    return scheduleUpdateFailed(error);
  }
  return changed({ refresh: ["all"], toast: message });
}
