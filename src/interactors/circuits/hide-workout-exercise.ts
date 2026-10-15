import type { Gateways } from "../../gateways/gateways";
import { assignmentFor } from "../../services/circuit-editing";
import type { AssignmentContext } from "../../types";
import { toggleHiddenExercise } from "../library/toggle-hidden-exercise";
import { unchanged, type InteractorResult } from "../interactor";
import { randomReplaceExercise } from "./random-replace-exercise";

// As a user
// When I hide an exercise from today's workout
// Then it is hidden from future recommendations and a random replacement
//   takes its place; if nothing can replace it, it stays
export function hideWorkoutExercise(
  gateways: Gateways,
  input: AssignmentContext & { exerciseId: string },
): InteractorResult {
  const exercise = gateways.exercises.find(input.exerciseId);
  const assignment = assignmentFor(input);
  if (
    !exercise ||
    !assignment ||
    assignment.exerciseId !== input.exerciseId ||
    exercise.always_locked ||
    assignment.fixed ||
    gateways.exercises.isDeleted(input.exerciseId)
  )
    return unchanged();
  if (gateways.exercises.isHidden(input.exerciseId))
    return toggleHiddenExercise(gateways, { exerciseId: input.exerciseId });
  const wasLocked = assignment.locked;
  gateways.exercises.hiddenIds().push(input.exerciseId);
  assignment.locked = false;
  const replaced = randomReplaceExercise(gateways, {
    dayId: input.dayId,
    circuitIndex: input.circuitIndex,
    position: input.position,
  });
  if (!replaced.value) {
    gateways.exercises.replaceHiddenIds(
      gateways.exercises.hiddenIds().filter((id) => id !== input.exerciseId),
    );
    assignment.locked = wasLocked;
    return {
      changed: true,
      refresh: ["all"],
      toast: {
        message: `${exercise.name} was kept because no replacement is available.`,
        tone: "error",
      },
    };
  }
  return {
    ...replaced,
    value: undefined,
    toast: {
      message: `${exercise.name} hidden. ${replaced.value.name} selected instead.`,
      tone: "success",
    },
  };
}
