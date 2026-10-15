import type { Gateways } from "../../gateways/gateways";
import { assignmentFor } from "../../services/circuit-editing";
import { assignmentRepBasis } from "../../services/reps";
import type { AssignmentContext } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I switch an exercise's reps between per side and total
// Then the circuit counts that exercise's reps the chosen way
export function setAssignmentRepBasis(
  gateways: Gateways,
  input: AssignmentContext & { repBasis: string },
): InteractorResult {
  const assignment = assignmentFor(input);
  if (!assignment) return unchanged();
  assignment.repBasis =
    input.repBasis === "per_side" || input.repBasis === "total"
      ? input.repBasis
      : assignmentRepBasis(assignment);
  return changed({ refresh: ["all"] });
}
