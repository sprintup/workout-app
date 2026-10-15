import { gateways } from "../gateways/registry";
import { DEFAULT_CIRCUIT_REP_BUDGET } from "../config/constants";
import { mainAssignments } from "../entities/circuits";
import { normalizeCircuitRepBudget, normalizePerSideReps } from "../entities/reps";


export function requiresBothSides(exercise) {
  return Boolean(
    exercise?.unilateral ||
    /both sides|per side|\/ side/i.test(
      `${exercise?.name || ""} ${exercise?.default_reps || ""}`,
    ),
  );
}


export function exerciseSideMultiplier(exercise) {
  return requiresBothSides(exercise) ? 2 : 1;
}


export function assignmentReps(assignment) {
  const exercise = gateways.exercises.find(assignment?.exerciseId);
  return normalizePerSideReps(
    assignment?.reps,
    gateways.exercises.stats(exercise?.id).reps || exercise?.default_reps || 10,
  );
}


export function defaultAssignmentRepBasis(exercise) {
  return requiresBothSides(exercise) ? "per_side" : "total";
}


export function assignmentRepBasis(assignment) {
  return ["per_side", "total"].includes(assignment?.repBasis)
    ? assignment.repBasis
    : defaultAssignmentRepBasis(gateways.exercises.find(assignment?.exerciseId));
}


export function assignmentTotalReps(assignment) {
  return (
    assignmentReps(assignment) *
    (assignmentRepBasis(assignment) === "per_side" ? 2 : 1)
  );
}


export function circuitTotalReps(circuit) {
  return mainAssignments(circuit).reduce(
    (total, assignment) => total + assignmentTotalReps(assignment),
    0,
  );
}


export function assignCircuitRepBudget(
  circuit,
  budget = gateways.preferences.circuitRepBudget() || DEFAULT_CIRCUIT_REP_BUDGET,
) {
  const assignments = mainAssignments(circuit);
  const multipliers = assignments.map((assignment) =>
    exerciseSideMultiplier(gateways.exercises.find(assignment.exerciseId)),
  );
  const sideUnits = multipliers.reduce((total, value) => total + value, 0);
  if (!sideUnits) return;
  const target = normalizeCircuitRepBudget(budget);
  const base = Math.max(1, Math.floor(target / sideUnits));
  let remaining = Math.max(0, target - base * sideUnits);
  assignments.forEach((assignment, index) => {
    let reps = base;
    if (remaining >= multipliers[index]) {
      reps += 1;
      remaining -= multipliers[index];
    }
    assignment.reps = String(reps);
    assignment.repBasis = defaultAssignmentRepBasis(
      gateways.exercises.find(assignment.exerciseId),
    );
  });
}
