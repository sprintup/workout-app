import { gateways } from "../gateways/registry";
import { mainAssignments } from "../entities/circuits";
import { transitionCost } from "../entities/transitions";
import { optionalActivatorSlot } from "./generation";
import { circuitDefinitionsForDay, targetIdForDay } from "./targeting";


export function slotFor(context) {
  if (context.position === "optionalActivator")
    return optionalActivatorSlot(targetIdForDay(context.dayId));
  const definition = circuitDefinitionsForDay(context.dayId)[
    context.circuitIndex
  ];
  if (context.position === "extra-new") return definition.extra;
  const assignment = assignmentFor(context);
  return definition[
    assignment?.slotKey ||
      (context.position?.startsWith("extra") ? "extra" : context.position)
  ];
}


export function assignmentFor(context) {
  const circuit =
    gateways.week.current().days[context.dayId].circuits[context.circuitIndex];
  if (context.position?.startsWith("extra-")) {
    return circuit.extras[Number(context.position.split("-")[1])];
  }
  if (context.position === "extra-new") return null;
  return circuit[context.position];
}


export function adjacentExercises(context) {
  if (context.position === "optionalActivator") return [];
  const circuit =
    gateways.week.current().days[context.dayId].circuits[context.circuitIndex];
  const assignments = mainAssignments(circuit);
  let index;
  if (context.position === "first") index = 0;
  else if (context.position === "second") index = 1;
  else if (context.position === "extra-new") index = assignments.length;
  else index = Number(context.position.split("-")[1]) + 2;

  return [assignments[index - 1], assignments[index + 1]]
    .filter(Boolean)
    .map((assignment) => gateways.exercises.find(assignment.exerciseId))
    .filter(Boolean);
}


export function otherCircuitExercises(context) {
  if (context.position === "optionalActivator") return [];
  const circuit =
    gateways.week.current().days[context.dayId].circuits[context.circuitIndex];
  const current = assignmentFor(context);
  return mainAssignments(circuit)
    .filter((assignment) => !current || assignment !== current)
    .map((assignment) => gateways.exercises.find(assignment.exerciseId))
    .filter(Boolean);
}


export function automaticTransitionCost(exercise, context) {
  const adjacent = adjacentExercises(context);
  return adjacent.length
    ? Math.max(
        ...adjacent.map((partner) => transitionCost(exercise, partner)),
      )
    : 0;
}


export function positionIndex(position) {
  if (position === "first") return 0;
  if (position === "second") return 1;
  if (position?.startsWith("extra-"))
    return Number(position.split("-")[1]) + 2;
  return -1;
}


export function writeMainAssignments(circuit, assignments) {
  circuit.first = assignments[0];
  circuit.second = assignments[1];
  circuit.extras = assignments.slice(2);
  circuit.preferredExerciseCount = assignments.length;
}


export function markManualSetupTransitions(assignments) {
  for (let index = 1; index < assignments.length; index += 1) {
    const previous = gateways.exercises.find(assignments[index - 1].exerciseId);
    const current = gateways.exercises.find(assignments[index].exerciseId);
    if (transitionCost(previous, current) > 2)
      assignments[index].manualOverride = true;
  }
}
