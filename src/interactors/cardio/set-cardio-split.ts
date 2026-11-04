import { CARDIO_SPLITS, cardioSessionMinutes, normalizeCardioSessionMinutes } from "../../entities/cardio";
import type { Gateways } from "../../gateways/gateways";
import type { CardioSplitId } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I choose a cardio split in Settings (6 × 30 min, 4 × 45 min, or a
//   custom session length)
// Then each day schedules a session of that length until the weekly goal is met
export function setCardioSplit(
  gateways: Gateways,
  input: { splitId: string; customMinutes?: string | number },
): InteractorResult {
  const settings = gateways.cardio.settings();
  if (!CARDIO_SPLITS.some((split) => split.id === input.splitId))
    return unchanged();
  const next = {
    ...settings,
    splitId: input.splitId as CardioSplitId,
    customMinutes:
      input.customMinutes === undefined
        ? settings.customMinutes
        : normalizeCardioSessionMinutes(input.customMinutes, settings.customMinutes),
  };
  gateways.cardio.replaceSettings(next);
  return changed({
    refresh: ["all"],
    toast: `Cardio sessions are now ${cardioSessionMinutes(next)} minutes.`,
  });
}
