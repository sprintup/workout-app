import type { Gateways } from "../../gateways/gateways";
import { recordCooldownCompletion } from "../../services/routine-schedule";
import type { DayId } from "../../types";
import { changed, type InteractorResult } from "../interactor";

export interface CheckCooldownExerciseInput {
  dayId: DayId;
  cooldownId: string;
  completed: boolean;
}

// As a user
// When I check off a cool-down exercise on a training day
// Then it is marked done for that day and the date is recorded, so an
//   exercise scheduled "every N days" stays hidden until it is due again
export function checkCooldownExercise(
  gateways: Gateways,
  input: CheckCooldownExerciseInput,
): InteractorResult {
  gateways.week.day(input.dayId).cooldownChecklist[input.cooldownId] =
    input.completed;
  const exercise = gateways.routines
    .cooldowns()
    .find((item) => item.id === input.cooldownId);
  if (exercise)
    recordCooldownCompletion(exercise, input.dayId, input.completed);
  return changed({ refresh: ["all"] });
}
