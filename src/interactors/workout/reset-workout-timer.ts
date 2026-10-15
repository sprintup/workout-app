import { timerDuration } from "../../entities/timer";
import type { Gateways } from "../../gateways/gateways";
import type { DayId } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I press Reset on the workout timer
// Then the day's timer goes back to zero and keeps its selected duration
export function resetWorkoutTimer(
  gateways: Gateways,
  input: { dayId: DayId },
): InteractorResult {
  const day = gateways.week.day(input.dayId);
  if (!day || day.rest) return unchanged();
  day.timer = {
    durationMs: timerDuration(day),
    elapsedMs: 0,
    startedAt: null,
  };
  return changed({ refresh: ["timer"] });
}
