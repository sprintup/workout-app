import type { Gateways } from "../../gateways/gateways";
import {
  regenerateSchedule,
  scheduleUpdateFailed,
  wholeScheduleConfirmation,
} from "../../services/schedule";
import { changed, unchanged, type InteractorResult } from "../interactor";

const MAX_CYCLES = 16;

export function addRestCycleConfirmation(gateways: Gateways): string | null {
  if (gateways.cycles.all().length >= MAX_CYCLES) return null;
  return wholeScheduleConfirmation(
    "Adding a rest day may shift this week's rotation.",
  );
}

// As a user
// When I add a rest day to the rotation in Settings
// Then a scheduled recovery day joins the end of the rotation and uses up
//   its place when it comes around
export function addRestCycle(gateways: Gateways): InteractorResult {
  if (gateways.cycles.all().length >= MAX_CYCLES) return unchanged();
  const backup = gateways.appState.snapshot();
  gateways.cycles.setActiveSplitId(null);
  gateways.cycles.all().push({
    id: `rest-${gateways.clock.nowMs()}-${gateways.random.token(5)}`,
    kind: "rest",
    name: "",
    target: null,
    bodyParts: [],
    description: "A scheduled recovery day that advances the rotation.",
    circuitExerciseCounts: [null, null, null],
    lockedAssignments: [],
  });
  try {
    regenerateSchedule({ preserveMatching: true });
  } catch (error) {
    gateways.appState.restore(backup);
    return scheduleUpdateFailed(error);
  }
  return changed({
    refresh: ["all"],
    toast: "Rest day added to the rotation.",
  });
}
