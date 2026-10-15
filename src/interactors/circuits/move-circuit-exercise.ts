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
// When I move an exercise earlier or later in a circuit
// Then the circuit runs in the new order (also for future occurrences of the
//   cycle) and its rounds start over
export function moveCircuitExercise(
  gateways: Gateways,
  input: AssignmentContext & { direction: number },
): InteractorResult {
  const circuit = gateways.week.day(input.dayId).circuits[input.circuitIndex];
  const assignments = mainAssignments(circuit);
  const index = positionIndex(input.position);
  const nextIndex = index + input.direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= assignments.length)
    return unchanged();
  [assignments[index], assignments[nextIndex]] = [
    assignments[nextIndex],
    assignments[index],
  ];
  markManualSetupTransitions(assignments);
  writeMainAssignments(circuit, assignments);
  syncCycleTemplateFromDay(input.dayId);
  resetCircuitCompletion(circuit);
  return changed({ refresh: ["all"] });
}
