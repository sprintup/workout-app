import { timerDuration, timerElapsed } from "../../entities/timer";
import type { Gateways } from "../../gateways/gateways";
import type { DayId } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When my workout time runs out while the timer is running
// Then the timer stops at zero
export function stopExpiredWorkoutTimer(
  gateways: Gateways,
  input: { dayId: DayId },
): InteractorResult {
  const day = gateways.week.day(input.dayId);
  if (!day || day.rest || !day.timer.startedAt) return unchanged();
  const duration = timerDuration(day);
  if (timerElapsed(day) < duration) return unchanged();
  day.timer.elapsedMs = duration;
  day.timer.startedAt = null;
  return changed();
}
