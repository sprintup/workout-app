import { gateways } from "../gateways/registry";
import { DAY_CONFIG } from "../data/training";
import { mainAssignments } from "../entities/circuits";
import { idFor } from "../entities/exercise";
import { normalizeWorkoutTarget, workoutTarget } from "../entities/targets";
import { includesAny } from "../entities/text";
import { transitionCost } from "../entities/transitions";
import { matchesSlot, qualifiesAsOptionalActivator } from "./generation";
import { circuitDefinitionsForTarget, withBodyPartFilter } from "./targeting";


export function validateWeek(week) {
  const issues = [];
  if (!week?.days) return ["Missing workout days."];
  const ids = [];
  const reusableIds = new Set();

  for (const day of DAY_CONFIG) {
    const dayData = week.days[day.id];
    if (dayData?.rest) {
      if (dayData.circuits?.length) {
        issues.push(`${day.name} is a rest day but still contains circuits.`);
      }
      continue;
    }
    if (!dayData || dayData.circuits?.length !== 3) {
      issues.push(`${day.name} must contain three circuits.`);
      continue;
    }

    for (const circuit of dayData.circuits) {
      if (
        !circuit.first ||
        !circuit.second ||
        !Array.isArray(circuit.extras)
      ) {
        issues.push(`${day.name} circuit ${circuit.number} is incomplete.`);
        continue;
      }
      const assignments = mainAssignments(circuit);
      if (assignments.length < 2 || assignments.length > 4) {
        issues.push(
          `${day.name} circuit ${circuit.number} must contain two to four round exercises.`,
        );
      }
      if (
        !Array.isArray(circuit.roundsCompleted) ||
        circuit.roundsCompleted.length !== 3
      ) {
        issues.push(
          `${day.name} circuit ${circuit.number} must track three rounds.`,
        );
      }
      if (typeof circuit.optionalActivatorCompleted !== "boolean") {
        issues.push(
          `${day.name} circuit ${circuit.number} must track its optional activator.`,
        );
      }
      const optionalActivatorExercise = gateways.exercises.find(
        circuit.optionalActivator?.exerciseId,
      );
      const circuitTargetId = normalizeWorkoutTarget(
        dayData.target,
        day.defaultTarget,
      );
      if (
        !qualifiesAsOptionalActivator(
          optionalActivatorExercise,
          circuitTargetId,
        )
      ) {
        issues.push(
          `${day.name} circuit ${circuit.number} must have one eligible optional total-body activator.`,
        );
      }
      if (typeof circuit.completionCredited !== "boolean") {
        issues.push(
          `${day.name} circuit ${circuit.number} must track its load-progression credit.`,
        );
      }
      ids.push(...assignments.map((assignment) => assignment.exerciseId));
      assignments
        .filter(
          (assignment) => assignment.cycleLock || assignment.rotationRepeat,
        )
        .forEach((assignment) => reusableIds.add(assignment.exerciseId));
      if (
        normalizeWorkoutTarget(dayData.target, day.defaultTarget) ===
        "total_body_no_equipment"
      ) {
        assignments.forEach((assignment) =>
          reusableIds.add(assignment.exerciseId),
        );
      }
      const mainExercises = assignments.map((assignment) =>
        gateways.exercises.find(assignment.exerciseId),
      );
      if (mainExercises.some((exercise) => !exercise)) {
        issues.push(`${day.name} references an unknown exercise.`);
      }
      for (let index = 1; index < mainExercises.length; index += 1) {
        if (
          mainExercises[index - 1] &&
          mainExercises[index] &&
          transitionCost(mainExercises[index - 1], mainExercises[index]) >
            2 &&
          !assignments[index - 1].manualOverride &&
          !assignments[index].manualOverride
        ) {
          issues.push(
            `${day.name} circuit ${circuit.number} has a transition cost above 2.`,
          );
        }
      }
      for (const exercise of mainExercises.filter(Boolean)) {
        if (exercise.overhead && !exercise.must_be_seated) {
          issues.push(`${exercise.name} violates the low-ceiling rule.`);
        }
        if (
          includesAny(exercise.name, [
            "leg extension machine",
            "leg curl machine",
          ])
        ) {
          issues.push(`${exercise.name} requires unavailable equipment.`);
        }
      }
    }

    const targetId = normalizeWorkoutTarget(
      dayData.target,
      day.defaultTarget,
    );
    const qualificationUsed = new Set();
    if (
      targetId === "shoulders_rotator" &&
      dayData.circuits[2]?.first?.exerciseId !==
        idFor("Shoulder Exercise Placeholder")
    ) {
      qualificationUsed.add(idFor("Shoulder Exercise Placeholder"));
    }
    const definitions = withBodyPartFilter(
      circuitDefinitionsForTarget(targetId, qualificationUsed),
      dayData.bodyParts,
    );
    dayData.circuits.forEach((circuit, circuitIndex) => {
      const definition = definitions[circuitIndex];
      const qualifiedAssignments = mainAssignments(circuit).map(
        (assignment, assignmentIndex) => {
          const fallbackKey =
            assignmentIndex === 0
              ? "first"
              : assignmentIndex === 1
                ? "second"
                : "extra";
          return [
            assignment,
            definition[assignment.slotKey || fallbackKey] || definition.extra,
          ];
        },
      );
      for (const [assignment, slot] of qualifiedAssignments) {
        const exercise = gateways.exercises.find(assignment.exerciseId);
        if (
          exercise &&
          !assignment.manualOverride &&
          !matchesSlot(exercise, slot)
        ) {
          issues.push(
            `${day.name} circuit ${circuit.number} contains ${exercise.name}, which is outside its ${workoutTarget(targetId).label} target.`,
          );
        }
      }
    });
  }

  const strictlyUniqueIds = ids.filter((id) => !reusableIds.has(id));
  if (strictlyUniqueIds.length !== new Set(strictlyUniqueIds).size) {
    issues.push("An exercise is repeated within the weekly plan.");
  }

  const shoulderTargetDays = DAY_CONFIG.filter(
    (day) =>
      !week.days[day.id]?.rest &&
      normalizeWorkoutTarget(week.days[day.id]?.target, day.defaultTarget) ===
        "shoulders_rotator",
  );
  if (
    shoulderTargetDays.length &&
    !shoulderTargetDays.some((day) =>
      week.days[day.id].circuits.some((circuit) =>
        mainAssignments(circuit).some(
          (assignment) =>
            assignment.exerciseId === idFor("Shoulder Exercise Placeholder"),
        ),
      ),
    )
  ) {
    issues.push(
      "A Shoulder & Rotator cuff day must preserve the shoulder exercise placeholder.",
    );
  }

  return issues;
}
