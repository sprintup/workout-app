// Regenerating the week after a change to the rotation, shared by every
// interactor that edits cycles, splits or calendar rest days.
import { DAY_CONFIG } from "../data/training";
import { gateways } from "../gateways/registry";
import { failed, type RefreshTarget } from "../interactors/interactor";
import { generateWeek } from "./generation";
import { validateWeek } from "./validation";
import { workoutDayHasProgress } from "./week";

/** Days (optionally only those using one cycle) that have workout progress. */
export function cycleDaysWithProgress(cycleId = null) {
  return DAY_CONFIG.filter((day) => {
    const dayData = gateways.week.day(day.id);
    return (
      (!cycleId || dayData.cycleId === cycleId) &&
      workoutDayHasProgress(dayData)
    );
  });
}

/**
 * The question to ask before a change that regenerates the whole week, or
 * null when no workout progress would be lost.
 */
export function wholeScheduleConfirmation(message) {
  return cycleDaysWithProgress().length
    ? `${message} Affected workout progress will be cleared. Continue?`
    : null;
}

/** Regenerates the current week; throws when the result is invalid. */
export function regenerateSchedule(options) {
  const week = gateways.week.current();
  const previousWeek = JSON.parse(JSON.stringify(week));
  generateWeek(previousWeek, {
    restDayIds: week.restDayIds,
    cycleOverrides: week.cycleOverrides,
    preserveMatching: options.preserveMatching !== false,
    forceCycleIds: options.forceCycleIds || [],
    forceDayIds: options.forceDayIds || [],
    trackChanges: true,
  });
  const issues = validateWeek(gateways.week.current());
  if (issues.length) throw new Error(issues[0]);
}

/** The result for a regeneration that failed and was rolled back. */
export function scheduleUpdateFailed(
  error,
  refresh: RefreshTarget[] = ["all"],
) {
  return failed(`The cycle schedule could not be updated: ${error.message}`, {
    refresh,
  });
}
