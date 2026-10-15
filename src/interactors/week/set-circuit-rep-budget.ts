import { DAY_CONFIG } from "../../data/training";
import { normalizeCircuitRepBudget } from "../../entities/reps";
import type { Gateways } from "../../gateways/gateways";
import { assignCircuitRepBudget } from "../../services/reps";
import { changed, type InteractorResult } from "../interactor";

// As a user
// When I change how many reps a circuit round should add up to
// Then every circuit in the week re-divides its reps to match
export function setCircuitRepBudget(
  gateways: Gateways,
  input: { reps: string | number },
): InteractorResult {
  gateways.preferences.setCircuitRepBudget(normalizeCircuitRepBudget(input.reps));
  const budget = gateways.preferences.circuitRepBudget();
  for (const day of DAY_CONFIG) {
    for (const circuit of gateways.week.day(day.id).circuits || [])
      assignCircuitRepBudget(circuit, budget);
  }
  return changed({
    refresh: ["all"],
    toast: `Generated circuits now target ${budget} reps per round.`,
  });
}
