import { mainAssignments } from "../../entities/circuits";
import type { Gateways } from "../../gateways/gateways";
import {
  markManualSetupTransitions,
  positionIndex,
  writeMainAssignments,
} from "../../services/circuit-editing";
import { syncCycleTemplateFromDay } from "../../services/generation";
import { resetCircuitCompletion } from "../../services/replacement";
import type { AssignmentContext } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I remove an exercise from a circuit that has more than two
// Then it leaves the circuit (and future occurrences of the cycle), counts as
//   skipped, and the circuit's rounds start over
export function deleteCircuitExercise(
  gateways: Gateways,
  input: AssignmentContext,
): InteractorResult {
  const circuit = gateways.week.day(input.dayId).circuits[input.circuitIndex];
  const assignments = mainAssignments(circuit);
  const index = positionIndex(input.position);
  if (assignments.length <= 2 || index < 0 || assignments[index].locked)
    return unchanged();
  const [removed] = assignments.splice(index, 1);
  if (removed.slotKey === "first" || removed.slotKey === "second") {
    const promoted = assignments.find(
      (assignment) => assignment.slotKey === "extra",
    );
    if (promoted) {
      promoted.slotKey = removed.slotKey;
      promoted.slotLabel = removed.slotLabel;
      promoted.manualOverride = true;
    }
  }
  markManualSetupTransitions(assignments);
  writeMainAssignments(circuit, assignments);
  syncCycleTemplateFromDay(input.dayId);
  gateways.exercises.stats(removed.exerciseId).skippedCount += 1;
  resetCircuitCompletion(circuit);
  return changed({
    refresh: ["all"],
    toast: `${gateways.exercises.find(removed.exerciseId).name} removed from this circuit.`,
  });
}
