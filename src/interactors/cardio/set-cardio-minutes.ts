import { normalizePlannedCardioMinutes } from "../../entities/cardio";
import type { Gateways } from "../../gateways/gateways";
import type { DayId } from "../../types";
import { changed, type InteractorResult } from "../interactor";

// As a user
// When I change the cardio time scheduled for a day (or clear the field)
// Then that day uses my time (or goes back to the split's), and once it is
//   checked off, later days' remaining time follows from it
export function setCardioMinutes(
  gateways: Gateways,
  input: { dayId: DayId; minutes: string | number | null },
): InteractorResult {
  gateways.cardio.day(input.dayId).plannedMinutes =
    normalizePlannedCardioMinutes(input.minutes);
  return changed({ refresh: ["all"] });
}
