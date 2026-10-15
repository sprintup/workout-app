import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I type a name for a cycle in Settings
// Then the day tabs show that name for the cycle's days
export function renameCycle(
  gateways: Gateways,
  input: { cycleId: string; name: string },
): InteractorResult {
  const cycle = gateways.cycles.find(input.cycleId);
  if (!cycle) return unchanged();
  cycle.name = input.name.slice(0, 80);
  return changed({ refresh: ["tabs"] });
}
