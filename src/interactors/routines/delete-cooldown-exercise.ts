import { DAY_CONFIG } from "../../data/training";
import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I delete a cool-down exercise in Settings
// Then it leaves every day's cool-down checklist
export function deleteCooldownExercise(
  gateways: Gateways,
  input: { cooldownId: string },
): InteractorResult {
  const cooldowns = gateways.routines.cooldowns();
  const index = cooldowns.findIndex(
    (exercise) => exercise.id === input.cooldownId,
  );
  if (index < 0) return unchanged();
  const [removed] = cooldowns.splice(index, 1);
  for (const day of DAY_CONFIG) {
    delete gateways.week.day(day.id).cooldownChecklist?.[input.cooldownId];
  }
  return changed({
    refresh: ["settings"],
    toast: `${removed.label} removed from the cool-down.`,
  });
}
