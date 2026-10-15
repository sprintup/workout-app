import {
  allRoundsComplete,
  pauseWorkoutTimer,
  timerDuration,
  timerElapsed,
} from "../../entities/timer";
import type { Gateways } from "../../gateways/gateways";
import type { DayId } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I press Start, Pause or Resume on the workout timer
// Then the timer runs or pauses; it can only start once the warm-up is
//   complete and stays stopped after every round is done
export function toggleWorkoutTimer(
  gateways: Gateways,
  input: { dayId: DayId },
): InteractorResult {
  const day = gateways.week.day(input.dayId);
  if (
    !day ||
    day.rest ||
    !Object.values(day.preChecklist).every(Boolean) ||
    allRoundsComplete(day)
  )
    return unchanged();
  if (day.timer.startedAt) {
    pauseWorkoutTimer(day);
  } else if (timerElapsed(day) < timerDuration(day)) {
    day.timer.startedAt = gateways.clock.nowIso();
  }
  return changed({ refresh: ["timer"] });
}
