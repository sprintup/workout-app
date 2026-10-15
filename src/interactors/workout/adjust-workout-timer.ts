import {
  allRoundsComplete,
  normalizeTimerDuration,
  timerDuration,
  timerElapsed,
} from "../../entities/timer";
import type { Gateways } from "../../gateways/gateways";
import type { DayId } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

export interface AdjustWorkoutTimerInput {
  dayId: DayId;
  minutes: number;
}

// As a user
// When I add or remove five minutes while the workout timer is paused
// Then the workout's duration changes and the nine round deadlines rescale
export function adjustWorkoutTimer(
  gateways: Gateways,
  input: AdjustWorkoutTimerInput,
): InteractorResult {
  const day = gateways.week.day(input.dayId);
  if (!day || day.rest || day.timer.startedAt || allRoundsComplete(day))
    return unchanged();
  const adjustment = Number(input.minutes) * 60 * 1000;
  if (!Number.isFinite(adjustment) || adjustment === 0) return unchanged();
  const currentDuration = timerDuration(day);
  const nextDuration = normalizeTimerDuration(currentDuration + adjustment);
  if (nextDuration === currentDuration || nextDuration <= timerElapsed(day))
    return unchanged();
  day.timer.durationMs = nextDuration;
  return changed({ refresh: ["timer"] });
}
