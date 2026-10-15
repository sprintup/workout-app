import { DEFAULT_WORKOUT_DURATION_MS, MAX_WORKOUT_DURATION_MS, MIN_WORKOUT_DURATION_MS, TIMER_ADJUSTMENT_MS } from "../config/constants";


export function normalizeTimerDuration(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_WORKOUT_DURATION_MS;
  const rounded =
    Math.round(numeric / TIMER_ADJUSTMENT_MS) * TIMER_ADJUSTMENT_MS;
  return Math.max(
    MIN_WORKOUT_DURATION_MS,
    Math.min(MAX_WORKOUT_DURATION_MS, rounded),
  );
}


export function timerDuration(day) {
  return normalizeTimerDuration(day?.timer?.durationMs);
}


export function roundDeadlineMs(day, globalRound) {
  return (timerDuration(day) * (globalRound + 1)) / 9;
}


export function timerElapsed(day) {
  if (!day?.timer) return 0;
  const runningFor = day.timer.startedAt
    ? Math.max(0, Date.now() - new Date(day.timer.startedAt).getTime())
    : 0;
  return Math.min(
    timerDuration(day),
    Math.max(0, day.timer.elapsedMs + runningFor),
  );
}


export function allRoundsComplete(day) {
  return day.circuits.every((circuit) =>
    circuit.roundsCompleted.every(Boolean),
  );
}


export function pauseWorkoutTimer(day) {
  if (!day?.timer?.startedAt) return;
  day.timer.elapsedMs = timerElapsed(day);
  day.timer.startedAt = null;
}


export function formatTimer(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
