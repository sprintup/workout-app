import { gateways } from "../gateways/registry";
import { DAY_CONFIG } from "../data/training";
import { addDaysToKey, localDateKey } from "../entities/dates";
import { createDefaultCooldownExercises, createDefaultWarmupExercises, normalizeCompletedDates, normalizeCooldownInterval, warmupChecklist } from "../entities/routines";


// Calendar date of a weekday tab: the Monday on or before the week start, plus the day's offset.
function dayDateKey(dayId) {
  const started = new Date(gateways.week.startedAt());
  const base = Number.isNaN(started.getTime()) ? gateways.clock.now() : started;
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const offset = Math.max(
    0,
    DAY_CONFIG.findIndex((day) => day.id === dayId),
  );
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}


export function cooldownCompletionDates(exercise) {
  const dates = new Set(exercise.completedDates || []);
  DAY_CONFIG.forEach((day) => {
    if (gateways.week.current()?.days?.[day.id]?.cooldownChecklist?.[exercise.id])
      dates.add(dayDateKey(day.id));
  });
  return [...dates].sort();
}


// Most recent completion strictly before the given day, or null.
function lastCooldownCompletionBefore(exercise, dateKey) {
  return (
    cooldownCompletionDates(exercise)
      .filter((date) => date < dateKey)
      .pop() || null
  );
}


export function isCooldownDue(exercise, dayId) {
  const interval = normalizeCooldownInterval(exercise.intervalDays);
  if (interval <= 1) return true;
  if (gateways.week.current()?.days?.[dayId]?.cooldownChecklist?.[exercise.id])
    return true;
  const dateKey = dayDateKey(dayId);
  const last = lastCooldownCompletionBefore(exercise, dateKey);
  return !last || addDaysToKey(last, interval) <= dateKey;
}


export function nextCooldownDueKey(exercise, dayId) {
  const last = lastCooldownCompletionBefore(exercise, dayDateKey(dayId));
  return last
    ? addDaysToKey(last, normalizeCooldownInterval(exercise.intervalDays))
    : dayDateKey(dayId);
}


export function recordCooldownCompletion(exercise, dayId, completed) {
  const dateKey = dayDateKey(dayId);
  const dates = new Set(exercise.completedDates || []);
  if (completed) dates.add(dateKey);
  else dates.delete(dateKey);
  exercise.completedDates = normalizeCompletedDates([...dates]);
}


export function emptyWarmupChecklist() {
  return warmupChecklist(
    gateways.routines.warmups() || createDefaultWarmupExercises(),
  );
}


export function emptyCooldownChecklist() {
  return warmupChecklist(
    gateways.routines.cooldowns() || createDefaultCooldownExercises(),
  );
}
