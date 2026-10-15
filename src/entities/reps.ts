import { DEFAULT_CIRCUIT_REP_BUDGET, MAX_CIRCUIT_REP_BUDGET, MIN_CIRCUIT_REP_BUDGET } from "../config/constants";


export function normalizeCircuitRepBudget(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_CIRCUIT_REP_BUDGET;
  const bounded = Math.max(
    MIN_CIRCUIT_REP_BUDGET,
    Math.min(MAX_CIRCUIT_REP_BUDGET, Math.round(numeric)),
  );
  return Math.max(3, Math.round(bounded / 3) * 3);
}


export function normalizePerSideReps(
  value,
  fallback: number | string = 10,
) {
  const match = String(value ?? "").match(/\d+/);
  const numeric = match ? Number(match[0]) : Number(fallback);
  return Math.max(1, Math.min(120, Math.round(numeric) || 10));
}
