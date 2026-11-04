import { DAY_CONFIG } from "../../data/training";
import type { Gateways } from "../../gateways/gateways";
import { cardioStatusForDay } from "../../services/cardio";
import type { DayId } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I check off (or uncheck) a day's cardio
// Then its scheduled minutes count toward this week's goal and every later
//   day's done and remaining time updates; once the goal is met, the
//   following days are cardio days off
export function completeCardio(
  gateways: Gateways,
  input: { dayId: DayId; completed: boolean },
): InteractorResult {
  if (!DAY_CONFIG.some((day) => day.id === input.dayId)) return unchanged();
  const before = cardioStatusForDay(input.dayId);
  const day = gateways.cardio.day(input.dayId);
  day.completed = input.completed;
  // Keep the checked-off time fixed even if earlier days change later.
  if (input.completed) day.plannedMinutes = before.plannedMinutes;
  const after = cardioStatusForDay(input.dayId);
  return changed({
    refresh: ["all"],
    toast: !input.completed
      ? undefined
      : after.remaining
        ? `${after.plannedMinutes} min of cardio done, ${after.remaining} min left this week.`
        : "Weekly cardio goal reached. Enjoy your day off!",
  });
}
