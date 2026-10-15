import { isEquipmentFreeExercise } from "../../entities/circuits";
import type { Gateways } from "../../gateways/gateways";
import {
  adjacentExercises,
  assignmentFor,
  otherCircuitExercises,
} from "../../services/circuit-editing";
import { canCombine, isNoEquipmentTarget } from "../../services/generation";
import {
  defaultReplacementQuery,
  matchesAutomaticReplacementEligibility,
  replacementOptions,
  weightedRandomExercise,
} from "../../services/replacement";
import { requiresBothSides } from "../../services/reps";
import { targetIdForDay } from "../../services/targeting";
import { allAssignments } from "../../services/week";
import type { AssignmentContext, Exercise } from "../../types";
import { failed, unchanged, type InteractorResult } from "../interactor";
import { replaceExercise } from "./replace-exercise";

// As a user
// When I press the shuffle button on an exercise
// Then a random replacement takes its place, favoring exercises I haven't
//   done yet and higher effectiveness; if every on-target exercise is taken,
//   an unused exercise for the same muscles is used instead
export function randomReplaceExercise(
  gateways: Gateways,
  input: AssignmentContext,
): InteractorResult<Exercise> {
  const assignment = assignmentFor(input);
  if (!assignment || assignment.locked) return unchanged();
  const target = { ...input, mode: "replace" as const };
  const eligible: Exercise[] = replacementOptions(
    defaultReplacementQuery(target),
  ).map((option) => option.exercise);
  let candidates = eligible.filter(
    (exercise) => gateways.exercises.stats(exercise.id).chosenCount === 0,
  );
  let outsideTarget = false;
  if (!candidates.length) {
    const current = gateways.exercises.find(assignment.exerciseId);
    const used = new Set(allAssignments().map((item) => item.exerciseId));
    used.delete(assignment.exerciseId);
    const possibleOutside = gateways.exercises.all().filter((exercise) => {
      if (
        used.has(exercise.id) ||
        exercise.id === assignment.exerciseId ||
        gateways.exercises.isHidden(exercise.id) ||
        gateways.exercises.isDeleted(exercise.id) ||
        matchesAutomaticReplacementEligibility(exercise, input)
      )
        return false;
      if (
        input.position === "optionalActivator" &&
        !exercise.total_body_activator
      )
        return false;
      if (
        isNoEquipmentTarget(targetIdForDay(input.dayId)) &&
        !isEquipmentFreeExercise(exercise)
      )
        return false;
      if (
        !adjacentExercises(input).every((partner) =>
          canCombine(exercise, partner),
        )
      )
        return false;
      if (
        requiresBothSides(exercise) &&
        otherCircuitExercises(input).some(requiresBothSides)
      )
        return false;
      return true;
    });
    const sameBodyPart = possibleOutside.filter((exercise) =>
      exercise.body_parts.some((part) => current.body_parts.includes(part)),
    );
    candidates = sameBodyPart.length ? sameBodyPart : possibleOutside;
    outsideTarget = candidates.length > 0;
  }
  if (!candidates.length) candidates = eligible;
  if (!candidates.length) {
    return failed(
      "No unused replacement is available for today's target muscles.",
    );
  }
  const selected = weightedRandomExercise(candidates);
  const result = replaceExercise(gateways, {
    target,
    exerciseId: selected.id,
    showAll: outsideTarget,
  });
  return { ...result, value: selected };
}
