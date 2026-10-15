import { DAY_CONFIG } from "../../data/training";
import type { Gateways } from "../../gateways/gateways";
import { regenerateSchedule, scheduleUpdateFailed } from "../../services/schedule";
import { workoutDayHasProgress } from "../../services/week";
import type { DayId } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

/** The question to confirm first, or null when no progress would be lost. */
export function toggleRestDayConfirmation(
  gateways: Gateways,
  input: { dayId: DayId },
): string | null {
  const dayIndex = DAY_CONFIG.findIndex((day) => day.id === input.dayId);
  if (dayIndex < 0) return null;
  const affectedProgress = DAY_CONFIG.slice(dayIndex).some((day) =>
    workoutDayHasProgress(gateways.week.day(day.id)),
  );
  if (!affectedProgress) return null;
  const isRest = gateways.week.current().restDayIds.includes(input.dayId);
  return `${isRest ? "Restoring" : "Resting"} ${gateways.week.day(input.dayId).day} shifts this day and every later cycle assignment. Affected workout progress will be cleared. Continue?`;
}

// As a user
// When I choose "Rest today" (or "Train today instead")
// Then that day becomes a rest day (or a training day again) without using
//   up a cycle, and every later day shifts along the rotation
export function toggleRestDay(
  gateways: Gateways,
  input: { dayId: DayId },
): InteractorResult {
  const dayIndex = DAY_CONFIG.findIndex((day) => day.id === input.dayId);
  if (dayIndex < 0) return unchanged();
  const week = gateways.week.current();
  const isRest = week.restDayIds.includes(input.dayId);
  const backup = gateways.appState.snapshot();
  week.restDayIds = isRest
    ? week.restDayIds.filter((id) => id !== input.dayId)
    : [...week.restDayIds, input.dayId];
  try {
    regenerateSchedule({ preserveMatching: true });
  } catch (error) {
    gateways.appState.restore(backup);
    return scheduleUpdateFailed(error, []);
  }
  return changed({
    refresh: ["all"],
    toast: isRest
      ? `${gateways.week.day(input.dayId).day} is a training day again.`
      : `${DAY_CONFIG[dayIndex].name} is now a rest day. Later cycles shifted forward.`,
  });
}
