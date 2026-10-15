import { ACTIVATOR_LABEL } from "../../config/constants";
import { mainAssignments } from "../../entities/circuits";
import { normalizePerSideReps } from "../../entities/reps";
import type { Gateways } from "../../gateways/gateways";
import {
  adjacentExercises,
  assignmentFor,
  automaticTransitionCost,
  otherCircuitExercises,
  slotFor,
} from "../../services/circuit-editing";
import {
  canCombine,
  matchesSlot,
  syncCycleTemplateFromDay,
} from "../../services/generation";
import {
  matchesAutomaticReplacementEligibility,
  resetCircuitCompletion,
} from "../../services/replacement";
import { defaultAssignmentRepBasis, requiresBothSides } from "../../services/reps";
import { allAssignments } from "../../services/week";
import type { AssignmentContext } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

/** The circuit slot being replaced, or a new round exercise being added. */
export interface ReplacementTarget extends Omit<AssignmentContext, "position"> {
  position: AssignmentContext["position"] | "extra-new";
  mode?: "replace" | "add";
}

export interface ReplaceExerciseInput {
  target: ReplacementTarget;
  exerciseId: string;
  /** True when the list included exercises outside today's target muscles. */
  showAll: boolean;
}

// As a user
// When I pick an exercise from the replacement list
// Then it takes the slot (or joins the round as an extra exercise); the
//   exercise it replaced counts as skipped and the new one as chosen, and the
//   circuit's rounds start over
export function replaceExercise(
  gateways: Gateways,
  input: ReplaceExerciseInput,
): InteractorResult {
  const { target } = input;
  const assignment = assignmentFor(target);
  const next = gateways.exercises.find(input.exerciseId);
  if (
    !next ||
    (target.position === "optionalActivator" && !next.total_body_activator) ||
    (!input.showAll && !matchesAutomaticReplacementEligibility(next, target))
  )
    return unchanged();
  const circuit = gateways.week.day(target.dayId).circuits[target.circuitIndex];
  const repeatedElsewhere = allAssignments().some(
    (item) =>
      item.exerciseId === next.id &&
      (item.dayId !== target.dayId ||
        Number(item.circuitIndex) !== Number(target.circuitIndex) ||
        item.position !== target.position),
  );
  if (target.position === "optionalActivator") {
    const previous = gateways.exercises.find(assignment.exerciseId);
    gateways.exercises.stats(previous.id).skippedCount += 1;
    gateways.exercises.stats(next.id).chosenCount += 1;
    circuit.optionalActivator = {
      ...assignment,
      exerciseId: next.id,
      locked: false,
      fixed: false,
      slotLabel: ACTIVATOR_LABEL,
      slotKey: "optionalActivator",
    };
    circuit.optionalActivatorCompleted = false;
    return changed({
      refresh: ["all"],
      toast: `${next.name} selected as the optional activator.`,
    });
  }
  const manualOverride =
    !matchesSlot(next, slotFor(target)) ||
    automaticTransitionCost(next, target) > 2 ||
    !adjacentExercises(target).every((partner) => canCombine(next, partner)) ||
    (requiresBothSides(next) &&
      otherCircuitExercises(target).some(requiresBothSides));
  if (target.mode === "add") {
    circuit.extras.push({
      exerciseId: next.id,
      slotLabel: slotFor(target).label,
      locked: false,
      fixed: false,
      manualOverride,
      rotationRepeat: repeatedElsewhere,
      slotKey: "extra",
      reps: String(
        normalizePerSideReps(gateways.exercises.stats(next.id).reps, 10),
      ),
      repBasis: defaultAssignmentRepBasis(next),
    });
    circuit.preferredExerciseCount = mainAssignments(circuit).length;
    syncCycleTemplateFromDay(target.dayId);
    gateways.exercises.stats(next.id).chosenCount += 1;
    resetCircuitCompletion(circuit);
    return changed({
      refresh: ["all"],
      toast: `${next.name} added to the round.`,
    });
  }
  const previous = gateways.exercises.find(assignment.exerciseId);
  gateways.exercises.stats(previous.id).skippedCount += 1;
  gateways.exercises.stats(next.id).chosenCount += 1;
  assignment.exerciseId = next.id;
  assignment.locked = false;
  assignment.manualOverride = manualOverride;
  assignment.rotationRepeat = repeatedElsewhere;
  assignment.repBasis = defaultAssignmentRepBasis(next);
  resetCircuitCompletion(circuit);
  return changed({
    refresh: ["all"],
    toast: `${next.name} added. ${previous.name} counted as skipped.`,
  });
}
