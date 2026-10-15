import { normalizePerSideReps } from "../../entities/reps";
import type { Gateways } from "../../gateways/gateways";
import { assignmentFor } from "../../services/circuit-editing";
import type { AssignmentContext } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I change the prescribed reps for an exercise in a circuit
// Then the circuit uses the new rep count
export function setAssignmentReps(
  gateways: Gateways,
  input: AssignmentContext & { reps: string },
): InteractorResult {
  const assignment = assignmentFor(input);
  if (!assignment) return unchanged();
  assignment.reps = String(normalizePerSideReps(input.reps, assignment.reps));
  return changed({ refresh: ["all"] });
}
