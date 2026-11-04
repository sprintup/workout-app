// Pure cardio rules: the weekly goal, the split presets, and how a week of
// completed sessions turns into each day's done / remaining / scheduled time.
import type { CardioDay, CardioSettings, CardioSplitId } from "../types";

export const DEFAULT_CARDIO_GOAL_MINUTES = 180;

export const MIN_CARDIO_MINUTES = 5;

export const MAX_CARDIO_GOAL_MINUTES = 1440;

export const MAX_CARDIO_SESSION_MINUTES = 300;

export const CARDIO_SPLITS: Array<{ id: CardioSplitId; minutes: number | null }> = [
  { id: "6x30", minutes: 30 },
  { id: "4x45", minutes: 45 },
  { id: "custom", minutes: null },
];

export function createDefaultCardioSettings(): CardioSettings {
  return {
    weeklyGoalMinutes: DEFAULT_CARDIO_GOAL_MINUTES,
    splitId: "6x30",
    customMinutes: 30,
  };
}

function wholeMinutes(value, fallback: number, min: number, max: number) {
  const numeric = Math.round(Number(value));
  if (!Number.isFinite(numeric) || value === "" || value === null) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

export function normalizeCardioGoal(value, fallback = DEFAULT_CARDIO_GOAL_MINUTES) {
  return wholeMinutes(value, fallback, MIN_CARDIO_MINUTES, MAX_CARDIO_GOAL_MINUTES);
}

export function normalizeCardioSessionMinutes(value, fallback = 30) {
  return wholeMinutes(value, fallback, MIN_CARDIO_MINUTES, MAX_CARDIO_SESSION_MINUTES);
}

/** Scheduled minutes for a day may be zero (a planned day off). */
export function normalizePlannedCardioMinutes(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Math.round(Number(value));
  if (!Number.isFinite(numeric)) return null;
  return Math.min(MAX_CARDIO_SESSION_MINUTES, Math.max(0, numeric));
}

export function normalizeCardioSettings(value): CardioSettings {
  const defaults = createDefaultCardioSettings();
  const splitId = CARDIO_SPLITS.some((split) => split.id === value?.splitId)
    ? value.splitId
    : defaults.splitId;
  return {
    weeklyGoalMinutes: normalizeCardioGoal(value?.weeklyGoalMinutes),
    splitId,
    customMinutes: normalizeCardioSessionMinutes(value?.customMinutes),
  };
}

export function normalizeCardioDay(value): CardioDay {
  return {
    plannedMinutes: normalizePlannedCardioMinutes(value?.plannedMinutes),
    completed: Boolean(value?.completed),
  };
}

/** Length of one session under the chosen split. */
export function cardioSessionMinutes(settings: CardioSettings) {
  const preset = CARDIO_SPLITS.find((split) => split.id === settings.splitId);
  return preset?.minutes ?? settings.customMinutes;
}

/** "6 × 30 min" style label: how many sessions of this length reach the goal. */
export function cardioSplitLabel(settings: CardioSettings, splitId: CardioSplitId) {
  if (splitId === "custom") return "Custom time";
  const minutes = CARDIO_SPLITS.find((split) => split.id === splitId)?.minutes ?? 30;
  return `${Math.ceil(settings.weeklyGoalMinutes / minutes)} × ${minutes} min`;
}

export interface CardioDayStatus {
  /** Minutes completed on earlier days this week. */
  doneBefore: number;
  /** Minutes completed this week up to and including this day. */
  doneThrough: number;
  /** Minutes still to do this week after this day. */
  remaining: number;
  /** Minutes on the schedule for this day (0 is a cardio rest day). */
  plannedMinutes: number;
  /** Minutes added to this day's session to make up for missed or short days. */
  makeUpMinutes: number;
  /** True when plannedMinutes was set by hand rather than by the split. */
  customPlan: boolean;
  completed: boolean;
  /** The day has passed without its scheduled cardio being checked off. */
  missed: boolean;
  /** The goal was already met before this day, so it is a cardio day off. */
  goalMetBefore: boolean;
}

export interface CardioWeekDay {
  cardio: CardioDay | undefined;
  /** The calendar day is before today. */
  past: boolean;
  /** The calendar day is before the week was started, so nothing is scheduled. */
  beforeWeek?: boolean;
}

/**
 * Plans the week in calendar order: each day gets one session of the
 * split's length (or the time set by hand) until the plan reaches the goal,
 * and later days are cardio rest. Only completed days count toward the
 * goal; time from days that passed unchecked (or were shortened) moves to
 * the last session still ahead, making it a longer one.
 */
export function cardioWeekStatus(
  settings: CardioSettings,
  week: CardioWeekDay[],
): CardioDayStatus[] {
  const goal = settings.weeklyGoalMinutes;
  const session = cardioSessionMinutes(settings);
  let scheduled = 0;
  const plans = week.map(({ cardio, past, beforeWeek }) => {
    const day = normalizeCardioDay(cardio);
    const plannedMinutes =
      day.plannedMinutes ??
      (beforeWeek ? 0 : Math.min(session, Math.max(0, goal - scheduled)));
    scheduled += plannedMinutes;
    return {
      ...day,
      plannedMinutes,
      customPlan: day.plannedMinutes !== null,
      missed: past && !day.completed && plannedMinutes > 0,
      past,
      makeUpMinutes: 0,
    };
  });
  // Whatever the remaining sessions can't cover (because earlier days were
  // missed or shortened) goes onto the last one still ahead.
  const completedMinutes = plans
    .filter((plan) => plan.completed)
    .reduce((total, plan) => total + plan.plannedMinutes, 0);
  const upcoming = plans.filter((plan) => !plan.past && !plan.completed);
  const shortfall =
    goal -
    completedMinutes -
    upcoming.reduce((total, plan) => total + plan.plannedMinutes, 0);
  const longSession =
    upcoming.filter((plan) => plan.plannedMinutes > 0 && !plan.customPlan).pop() ||
    upcoming.filter((plan) => !plan.customPlan).pop();
  if (longSession && shortfall > 0) {
    const plannedMinutes = Math.min(
      MAX_CARDIO_SESSION_MINUTES,
      longSession.plannedMinutes + shortfall,
    );
    longSession.makeUpMinutes = plannedMinutes - longSession.plannedMinutes;
    longSession.plannedMinutes = plannedMinutes;
  }
  let done = 0;
  return plans.map((plan) => {
    const doneBefore = done;
    if (plan.completed) done += plan.plannedMinutes;
    return {
      doneBefore,
      doneThrough: done,
      remaining: Math.max(0, goal - done),
      plannedMinutes: plan.plannedMinutes,
      makeUpMinutes: plan.makeUpMinutes,
      customPlan: plan.customPlan,
      completed: plan.completed,
      missed: plan.missed,
      goalMetBefore: doneBefore >= goal,
    };
  });
}
