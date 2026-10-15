import { DAY_CONFIG } from "../../data/training";
import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I delete a warm-up exercise in Settings
// Then it leaves every day's warm-up checklist
export function deleteWarmupExercise(
  gateways: Gateways,
  input: { warmupId: string },
): InteractorResult {
  const warmups = gateways.routines.warmups();
  const index = warmups.findIndex((exercise) => exercise.id === input.warmupId);
  if (index < 0) return unchanged();
  const [removed] = warmups.splice(index, 1);
  for (const day of DAY_CONFIG) {
    delete gateways.week.day(day.id).preChecklist?.[input.warmupId];
  }
  return changed({
    refresh: ["settings"],
    toast: `${removed.label} removed from the warm-up.`,
  });
}
