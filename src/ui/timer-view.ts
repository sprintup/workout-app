import { gateways } from "../gateways/registry";
import { MAX_WORKOUT_DURATION_MS, MIN_WORKOUT_DURATION_MS, TIMER_ADJUSTMENT_MS } from "../config/constants";
import { DAY_CONFIG } from "../data/training";
import { allRoundsComplete, formatTimer, roundDeadlineMs, timerDuration, timerElapsed } from "../entities/timer";
import { stopExpiredWorkoutTimer } from "../interactors/workout/stop-expired-workout-timer";
import { storeSession } from "./session";
import { ui } from "./ui-state";
import type { DayId } from "../types";
import { byId } from "./dom";


/** The training day the timer belongs to: the open day tab, if it trains. */
export function timerDayId(): DayId | null {
  if (!DAY_CONFIG.some((day) => day.id === ui.currentView)) return null;
  const day = gateways.week.day(ui.currentView);
  return day && !day.rest ? (ui.currentView as DayId) : null;
}


export function updateWorkoutTimer() {
  const timer = document.getElementById("workout-timer");
  const display = document.getElementById("timer-display");
  const toggle = byId<HTMLButtonElement>("timer-toggle");
  const reset = byId<HTMLButtonElement>("timer-reset");
  const subtract = byId<HTMLButtonElement>("timer-minus");
  const add = byId<HTMLButtonElement>("timer-plus");
  if (!timer || !display || !toggle || !reset || !subtract || !add) return;

  const dayId = timerDayId();
  timer.hidden = !dayId;
  if (!dayId) return;
  if (stopExpiredWorkoutTimer(gateways, { dayId }).changed) storeSession();
  const day = gateways.week.day(dayId);

  const duration = timerDuration(day);
  const elapsed = timerElapsed(day);
  const remaining = duration - elapsed;
  const warmupComplete = Object.values(day.preChecklist).every(Boolean);
  const workoutComplete = allRoundsComplete(day);
  const isRunning = Boolean(day.timer.startedAt);
  display.textContent = formatTimer(remaining);
  timer.setAttribute(
    "aria-label",
    `${duration / 60000}-minute workout timer`,
  );
  timer.classList.toggle("is-running", isRunning);
  timer.classList.toggle("is-expired", remaining <= 0 && !workoutComplete);
  toggle.textContent = isRunning ? "Pause" : elapsed > 0 ? "Resume" : "Start";
  toggle.disabled = !warmupComplete || workoutComplete || remaining <= 0;
  toggle.title = !warmupComplete
    ? "Complete the warm-up before starting the workout timer"
    : workoutComplete
      ? "All nine rounds are complete"
      : isRunning
        ? "Pause the workout timer"
        : elapsed > 0
          ? "Resume the workout timer"
          : "Start the workout timer";
  reset.disabled = elapsed <= 0;
  subtract.disabled =
    isRunning ||
    workoutComplete ||
    duration <= MIN_WORKOUT_DURATION_MS ||
    duration - TIMER_ADJUSTMENT_MS <= elapsed;
  add.disabled =
    isRunning || workoutComplete || duration >= MAX_WORKOUT_DURATION_MS;
  subtract.title = isRunning
    ? "Pause the timer before adjusting it"
    : "Remove five minutes";
  add.title = isRunning
    ? "Pause the timer before adjusting it"
    : "Add five minutes";

  const targetSummary = document.getElementById("timer-target-summary");
  const deadlineSummary = document.getElementById("timer-deadline-summary");
  if (targetSummary)
    targetSummary.textContent = `About ${duration / 60000} minutes`;
  if (deadlineSummary)
    deadlineSummary.textContent = `The nine round deadlines scale evenly across your ${duration / 60000}-minute workout after the warm-up.`;

  document
    .querySelectorAll?.<HTMLElement>(".round-check[data-global-round]")
    .forEach((label) => {
      const globalRound = Number(label.dataset.globalRound);
      const circuit = day.circuits[Math.floor(globalRound / 3)];
      const checked = circuit?.roundsCompleted[globalRound % 3];
      label.classList.toggle(
        "is-overdue",
        !checked && elapsed >= roundDeadlineMs(day, globalRound),
      );
    });
}
