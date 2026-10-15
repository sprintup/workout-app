import { DAY_CONFIG } from "../../data/training";
import { cycleDisplayName } from "../../entities/cycles";
import type { Gateways } from "../../gateways/gateways";
import { regenerateSchedule, scheduleUpdateFailed } from "../../services/schedule";
import { workoutDayHasProgress } from "../../services/week";
import type { DayId } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

export interface SelectDayCycleInput {
  dayId: DayId;
  cycleId: string;
}

function applicableChange(gateways: Gateways, input: SelectDayCycleInput) {
  const dayIndex = DAY_CONFIG.findIndex((day) => day.id === input.dayId);
  const selectedCycle = gateways.cycles.find(input.cycleId);
  const dayData = gateways.week.day(input.dayId);
  const scheduledCycleId =
    dayData?.restSource === "calendar"
      ? dayData.pendingCycleId
      : dayData?.cycleId;
  if (
    dayIndex < 0 ||
    !dayData ||
    !selectedCycle ||
    scheduledCycleId === selectedCycle.id
  )
    return null;
  return { dayData, selectedCycle, affectedDays: DAY_CONFIG.slice(dayIndex) };
}

/** The question to confirm first, or null when no progress would be lost. */
export function selectDayCycleConfirmation(
  gateways: Gateways,
  input: SelectDayCycleInput,
): string | null {
  const change = applicableChange(gateways, input);
  if (
    !change ||
    !change.affectedDays.some((day) =>
      workoutDayHasProgress(gateways.week.day(day.id)),
    )
  )
    return null;
  return `Changing ${change.dayData.day} to ${cycleDisplayName(change.selectedCycle)} skips to that point in the rotation and regenerates this day and every later day. Affected workout progress will be cleared. Continue?`;
}

// As a user
// When I pick a different cycle for a day from its rotation selector
// Then that day uses the chosen cycle and the rotation continues from there
//   for every later day
export function selectDayCycle(
  gateways: Gateways,
  input: SelectDayCycleInput,
): InteractorResult {
  const change = applicableChange(gateways, input);
  if (!change) return unchanged();
  const { dayData, selectedCycle, affectedDays } = change;
  const backup = gateways.appState.snapshot();
  const week = gateways.week.current();
  week.restDayIds = week.restDayIds.filter((id) => id !== input.dayId);
  week.cycleOverrides ||= {};
  for (const day of affectedDays) {
    delete week.cycleOverrides[day.id as DayId];
  }
  week.cycleOverrides[input.dayId] = selectedCycle.id;
  const message = `${dayData.day} now uses ${cycleDisplayName(selectedCycle)}. The rotation continues from there.`;
  try {
    regenerateSchedule({
      preserveMatching: true,
      forceDayIds: affectedDays.map((day) => day.id),
    });
  } catch (error) {
    gateways.appState.restore(backup);
    return scheduleUpdateFailed(error);
  }
  return changed({ refresh: ["all"], toast: message });
}
