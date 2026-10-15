import { DATE_KEY_PATTERN, MAX_COMPLETED_DATES } from "../config/constants";
import { DEFAULT_COOLDOWN_EXERCISES, DEFAULT_WARMUP_EXERCISES } from "../data/routines";
import type { CooldownExercise } from "../types";


export function createDefaultWarmupExercises() {
  return DEFAULT_WARMUP_EXERCISES.map((exercise) => ({ ...exercise }));
}


export function createDefaultCooldownExercises(): CooldownExercise[] {
  return DEFAULT_COOLDOWN_EXERCISES.map((exercise) => ({
    ...exercise,
    intervalDays: 1,
    completedDates: [],
  }));
}


export function normalizeRoutineExercises(
  values,
  defaults,
  prefix,
  noun,
  extraFields: (exercise: any) => object = () => ({}),
) {
  const source = Array.isArray(values) ? values : defaults;
  const seen = new Set();
  return source.slice(0, 24).map((exercise, index) => {
    const requestedId = String(exercise?.id || `${prefix}-${index + 1}`);
    let id = requestedId;
    let suffix = 2;
    while (seen.has(id)) {
      id = `${requestedId}-${suffix}`;
      suffix += 1;
    }
    seen.add(id);
    return {
      id,
      label:
        String(exercise?.label || "")
          .trim()
          .slice(0, 100) || `${noun} ${index + 1}`,
      ...extraFields(exercise),
    };
  });
}


export function normalizeWarmupExercises(values) {
  return normalizeRoutineExercises(
    values,
    createDefaultWarmupExercises(),
    "warmup",
    "Warm-up exercise",
  );
}


export function isCoreCooldownLabel(value) {
  const label = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return label === "core complete" || label === "5 core";
}


export function normalizeCooldownInterval(value) {
  const numeric = Math.round(Number(value));
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(30, Math.max(1, numeric));
}


export function normalizeCompletedDates(values) {
  if (!Array.isArray(values)) return [];
  return [
    ...new Set(
      values
        .map((value) => String(value || ""))
        .filter((value) => DATE_KEY_PATTERN.test(value)),
    ),
  ]
    .sort()
    .slice(-MAX_COMPLETED_DATES);
}


export function cooldownIntervalLabel(intervalDays) {
  return intervalDays === 1 ? "Every day" : `Every ${intervalDays} days`;
}


export function normalizeCooldownExercises(values) {
  const normalized = normalizeRoutineExercises(
    values,
    createDefaultCooldownExercises(),
    "cooldown",
    "Cool-down exercise",
    (exercise) => ({
      intervalDays: normalizeCooldownInterval(exercise?.intervalDays),
      completedDates: normalizeCompletedDates(exercise?.completedDates),
    }),
  );
  const firstCoreIndex = normalized.findIndex((exercise) =>
    isCoreCooldownLabel(exercise.label),
  );
  if (firstCoreIndex < 0) return normalized;
  const canonicalCore =
    normalized.find(
      (exercise) =>
        exercise.id === "core" && isCoreCooldownLabel(exercise.label),
    ) || normalized[firstCoreIndex];
  return normalized.flatMap((exercise, index) => {
    if (index === firstCoreIndex)
      return [{ ...canonicalCore, label: "5 core" }];
    return isCoreCooldownLabel(exercise.label) ? [] : [exercise];
  });
}


export function warmupChecklist(warmups, current = {}) {
  return Object.fromEntries(
    warmups.map((exercise) => [exercise.id, Boolean(current?.[exercise.id])]),
  );
}
