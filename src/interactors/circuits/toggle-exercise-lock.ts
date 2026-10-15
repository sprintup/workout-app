import type { Gateways } from "../../gateways/gateways";
import { assignmentFor } from "../../services/circuit-editing";
import {
  refreshFutureCycleOccurrences,
  syncCycleTemplateFromDay,
} from "../../services/generation";
import type { AssignmentContext } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I lock (or unlock) an exercise in a circuit
// Then that exercise stays in place for every future occurrence of the
//   cycle, and later unstarted days of the same cycle pick it up now
export function toggleExerciseLock(
  gateways: Gateways,
  input: AssignmentContext,
): InteractorResult {
  const assignment = assignmentFor(input);
  if (!assignment || assignment.fixed) return unchanged();
  assignment.locked = !assignment.locked;
  assignment.cycleLock = assignment.locked;
  syncCycleTemplateFromDay(input.dayId);
  refreshFutureCycleOccurrences(input.dayId);
  return changed({
    refresh: ["all"],
    toast: assignment.locked
      ? "Exercise locked for future occurrences of this cycle."
      : "Exercise unlocked.",
  });
}
