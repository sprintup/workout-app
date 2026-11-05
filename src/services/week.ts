import { gateways } from "../gateways/registry";
import { DAY_CONFIG } from "../data/training";
import { isCircuitComplete } from "../entities/circuits";
import { cycleDisplayName, cycleTargetLabel } from "../entities/cycles";
import { timerElapsed } from "../entities/timer";
import { cardioWeek } from "./cardio";
import { cycleForId } from "./cycle-schedule";


export function workoutDayHasProgress(day) {
  if (!day) return false;
  return (
    Object.values(day.preChecklist || {}).some(Boolean) ||
    Object.values(day.cooldownChecklist || {}).some(Boolean) ||
    timerElapsed(day) > 0 ||
    (day.circuits || []).some(
      (circuit) =>
        circuit.roundsCompleted?.some(Boolean) ||
        circuit.optionalActivatorCompleted,
    )
  );
}


export function archiveCurrentWeek() {
  if (!gateways.week.current()) return;
  const exerciseIds = DAY_CONFIG.flatMap((day) =>
    gateways.week.current().days[day.id].circuits.flatMap((circuit) => [
      circuit.first.exerciseId,
      circuit.second.exerciseId,
      ...(circuit.extras || []).map((assignment) => assignment.exerciseId),
    ]),
  );
  gateways.week.history().push({
    weekNumber: gateways.week.number(),
    startedAt: gateways.week.startedAt(),
    exerciseIds,
  });
  gateways.week.replaceHistory(gateways.week.history().slice(-12));
}


export function allAssignments(week = gateways.week.current()) {
  return DAY_CONFIG.flatMap((day) =>
    week.days[day.id].circuits.flatMap((circuit, circuitIndex) => [
      { ...circuit.first, dayId: day.id, circuitIndex, position: "first" },
      { ...circuit.second, dayId: day.id, circuitIndex, position: "second" },
      ...(circuit.extras || []).map((assignment, extraIndex) => ({
        ...assignment,
        dayId: day.id,
        circuitIndex,
        position: `extra-${extraIndex}`,
      })),
      ...(circuit.optionalActivator
        ? [
            {
              ...circuit.optionalActivator,
              dayId: day.id,
              circuitIndex,
              position: "optionalActivator",
            },
          ]
        : []),
    ]),
  );
}


export function completedCircuits() {
  return DAY_CONFIG.reduce(
    (total, day) =>
      total +
      (!gateways.week.current().days[day.id].rest
        ? gateways.week.current().days[day.id].circuits.filter(isCircuitComplete).length
        : 0),
    0,
  );
}


export function displayDay(day) {
  const dayData = gateways.week.current().days[day.id];
  const cycle = cycleForId(dayData.cycleId);
  const rotationRest = dayData.restSource === "rotation";
  const displayedCycle = rotationRest
    ? cycle
    : dayData.rest
      ? cycleForId(dayData.pendingCycleId)
      : cycle;
  return {
    ...day,
    focus: dayData.rest
      ? rotationRest
        ? "Scheduled rest"
        : "Rest day"
      : cycleTargetLabel(cycle),
    guidance: dayData.rest
      ? dayData.description
      : cycle.description || day.guidance,
    cycle: displayedCycle,
    cycleName: cycleDisplayName(displayedCycle),
    rotationRest,
  };
}


/** Every circuit on every training day is done and the cardio goal is met. */
export function isWeekFinished() {
  const days = enabledDays();
  return (
    days.length > 0 &&
    completedCircuits() === days.length * 3 &&
    cardioWeek().at(-1).remaining === 0
  );
}


/** Finished weeks in a row, counting this one once it is finished. */
export function currentStreak() {
  return gateways.week.streak() + (isWeekFinished() ? 1 : 0);
}


export function enabledDays() {
  return DAY_CONFIG.filter((day) => !gateways.week.current().days[day.id].rest);
}
