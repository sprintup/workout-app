import {
  cooldownIntervalLabel,
  normalizeCooldownInterval,
} from "../../entities/routines";
import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I set how many days apart a cool-down exercise should be scheduled
// Then it only appears on days when it wasn't done in the previous
//   interval - 1 days ("every day" shows it every day)
export function setCooldownInterval(
  gateways: Gateways,
  input: { cooldownId: string; intervalDays: string | number },
): InteractorResult {
  const exercise = gateways.routines
    .cooldowns()
    .find((item) => item.id === input.cooldownId);
  if (!exercise) return unchanged();
  exercise.intervalDays = normalizeCooldownInterval(input.intervalDays);
  return changed({
    toast: `${exercise.label}: ${cooldownIntervalLabel(exercise.intervalDays).toLowerCase()}.`,
  });
}
