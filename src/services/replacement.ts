import { gateways } from "../gateways/registry";
import { isEquipmentFreeExercise } from "../entities/circuits";
import { matchesEquipmentSelection } from "../entities/equipment";
import { exerciseEffectivenessScore } from "../entities/exercise";
import { fuzzyExerciseScore } from "../entities/search";
import { assignmentFor, automaticTransitionCost } from "./circuit-editing";
import { isNoEquipmentTarget } from "./generation";
import { requiresBothSides } from "./reps";
import { matchesDayTargetMuscles, targetIdForDay } from "./targeting";
import { allAssignments } from "./week";


export function matchesAutomaticReplacementEligibility(exercise, context) {
  if (!exercise || !context) return false;
  if (
    context.position === "optionalActivator" &&
    !exercise.total_body_activator
  ) {
    return false;
  }
  if (
    isNoEquipmentTarget(targetIdForDay(context.dayId)) &&
    !isEquipmentFreeExercise(exercise)
  ) {
    return false;
  }
  return matchesDayTargetMuscles(exercise, context.dayId);
}


// What the replacement list should show: the slot being replaced (or added)
// plus the dialog's search text and filters.
export function defaultReplacementQuery(context) {
  return {
    context,
    search: "",
    showAll: false,
    bodyPart: "all",
    equipment: "all",
    sides: "all",
  };
}


export function replacementOptions(query) {
  if (!query?.context) return [];
  const assignment = assignmentFor(query.context);
  const used = new Set(allAssignments().map((item) => item.exerciseId));
  if (assignment) used.delete(assignment.exerciseId);
  const search = query.search.trim();

  return gateways.exercises.all()
    .map((exercise) => ({
      exercise,
      searchScore: fuzzyExerciseScore(exercise, search),
    }))
    .filter(({ exercise, searchScore }) => {
      if (
        gateways.exercises.isHidden(exercise.id) ||
        gateways.exercises.isDeleted(exercise.id) ||
        exercise.id === assignment?.exerciseId ||
        (!query.showAll && used.has(exercise.id)) ||
        (!query.showAll &&
          !matchesAutomaticReplacementEligibility(exercise, query.context))
      ) {
        return false;
      }
      if (searchScore === null) return false;
      if (
        query.bodyPart !== "all" &&
        !exercise.body_parts.includes(query.bodyPart)
      )
        return false;
      if (
        query.equipment !== "all" &&
        !matchesEquipmentSelection(exercise, query.equipment)
      )
        return false;
      if (
        (query.sides === "one_side" && requiresBothSides(exercise)) ||
        (query.sides === "two_side" && !requiresBothSides(exercise))
      )
        return false;
      return true;
    })
    .sort((first, second) => {
      const firstCost = automaticTransitionCost(
        first.exercise,
        query.context,
      );
      const secondCost = automaticTransitionCost(
        second.exercise,
        query.context,
      );
      return (
        first.searchScore - second.searchScore ||
        firstCost - secondCost ||
        exerciseEffectivenessScore(second.exercise) -
          exerciseEffectivenessScore(first.exercise) ||
        gateways.exercises.stats(second.exercise.id).chosenCount -
          gateways.exercises.stats(first.exercise.id).chosenCount ||
        first.exercise.name.localeCompare(second.exercise.name)
      );
    })
    .map(({ exercise }) => ({
      exercise,
      alreadyUsed: used.has(exercise.id),
      eligible: matchesAutomaticReplacementEligibility(
        exercise,
        query.context,
      ),
    }));
}


export function weightedRandomExercise(options) {
  const weighted = options.map((exercise) => {
    const stats = gateways.exercises.stats(exercise.id);
    return {
      exercise,
      weight:
        exerciseEffectivenessScore(exercise) /
        Math.max(1, stats.chosenCount + 1),
    };
  });
  let draw =
    gateways.random.next() * weighted.reduce((sum, item) => sum + item.weight, 0);
  return (
    weighted.find((item) => {
      draw -= item.weight;
      return draw <= 0;
    })?.exercise || weighted[weighted.length - 1]?.exercise
  );
}


export function resetCircuitCompletion(circuit) {
  circuit.roundsCompleted = [false, false, false];
  circuit.completionCredited = false;
}
