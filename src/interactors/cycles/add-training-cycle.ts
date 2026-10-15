import type { Gateways } from "../../gateways/gateways";
import {
  regenerateSchedule,
  scheduleUpdateFailed,
  wholeScheduleConfirmation,
} from "../../services/schedule";
import { changed, unchanged, type InteractorResult } from "../interactor";

const MAX_CYCLES = 16;

export function addTrainingCycleConfirmation(gateways: Gateways): string | null {
  if (gateways.cycles.all().length >= MAX_CYCLES) return null;
  return wholeScheduleConfirmation(
    "Adding a cycle may shift this week's rotation.",
  );
}

// As a user
// When I add a training cycle to the rotation in Settings
// Then a flexible total-body cycle joins the end of the rotation and the
//   week is regenerated around it
export function addTrainingCycle(gateways: Gateways): InteractorResult {
  if (gateways.cycles.all().length >= MAX_CYCLES) return unchanged();
  const backup = gateways.appState.snapshot();
  gateways.cycles.setActiveSplitId(null);
  gateways.cycles.all().push({
    id: `cycle-${gateways.clock.nowMs()}-${gateways.random.token(5)}`,
    kind: "training",
    name: "",
    target: "total_body",
    designation: "Full body",
    bodyParts: [],
    description: "A flexible total-body training cycle.",
    circuitExerciseCounts: [null, null, null],
    lockedAssignments: [],
  });
  const message = `Cycle ${gateways.cycles.all().length} added to the rotation.`;
  try {
    regenerateSchedule({ preserveMatching: true });
  } catch (error) {
    gateways.appState.restore(backup);
    return scheduleUpdateFailed(error);
  }
  return changed({ refresh: ["all"], toast: message });
}
