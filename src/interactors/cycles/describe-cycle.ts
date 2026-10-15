import { DAY_CONFIG } from "../../data/training";
import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I edit a cycle's description in Settings
// Then the description is shown on every day that uses the cycle
export function describeCycle(
  gateways: Gateways,
  input: { cycleId: string; description: string },
): InteractorResult {
  const cycle = gateways.cycles.find(input.cycleId);
  if (!cycle) return unchanged();
  cycle.description = input.description.slice(0, 600);
  for (const day of DAY_CONFIG) {
    const dayData = gateways.week.day(day.id);
    if (dayData.cycleId === cycle.id) dayData.description = cycle.description;
  }
  return changed();
}
