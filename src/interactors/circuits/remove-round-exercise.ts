import type { Gateways } from "../../gateways/gateways";
import type { DayId } from "../../types";
import { unchanged, type InteractorResult } from "../interactor";
import { deleteCircuitExercise } from "./delete-circuit-exercise";

// As a user
// When I press "−" on a circuit's rounds
// Then the last added exercise leaves the round (unless it is locked)
export function removeRoundExercise(
  gateways: Gateways,
  input: { dayId: DayId; circuitIndex: number },
): InteractorResult {
  const circuit = gateways.week.day(input.dayId).circuits[input.circuitIndex];
  const assignment = circuit.extras[circuit.extras.length - 1];
  if (!assignment || assignment.locked) return unchanged();
  return deleteCircuitExercise(gateways, {
    dayId: input.dayId,
    circuitIndex: input.circuitIndex,
    position: `extra-${circuit.extras.length - 1}`,
  });
}
