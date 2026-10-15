import type { Gateways } from "../../gateways/gateways";
import type { DayId } from "../../types";
import { changed, type InteractorResult } from "../interactor";

export interface CompleteOptionalActivatorInput {
  dayId: DayId;
  circuitIndex: number;
  completed: boolean;
}

// As a user
// When I check off a circuit's optional total-body activator
// Then the activator is marked complete for that circuit
export function completeOptionalActivator(
  gateways: Gateways,
  input: CompleteOptionalActivatorInput,
): InteractorResult {
  const circuit = gateways.week.day(input.dayId).circuits[input.circuitIndex];
  circuit.optionalActivatorCompleted = input.completed;
  return changed({ refresh: ["all"] });
}
