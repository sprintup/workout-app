import { timerElapsed } from "../../entities/timer";
import type { Gateways } from "../../gateways/gateways";
import type { DayId } from "../../types";
import { changed, type InteractorResult } from "../interactor";

export interface CheckWarmupExerciseInput {
  dayId: DayId;
  warmupId: string;
  completed: boolean;
}

// As a user
// When I check off a warm-up exercise
// Then it is marked done for that day, and checking off the last one starts
//   the workout timer automatically
export function checkWarmupExercise(
  gateways: Gateways,
  input: CheckWarmupExerciseInput,
): InteractorResult {
  const day = gateways.week.day(input.dayId);
  const wasComplete = Object.values(day.preChecklist).every(Boolean);
  day.preChecklist[input.warmupId] = input.completed;
  const isComplete = Object.values(day.preChecklist).every(Boolean);
  if (
    !wasComplete &&
    isComplete &&
    timerElapsed(day) === 0 &&
    !day.timer.startedAt
  ) {
    day.timer.startedAt = gateways.clock.nowIso();
  }
  return changed({ refresh: ["all"] });
}
