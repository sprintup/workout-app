import { gateways } from "../gateways/registry";
import { mainAssignments } from "../entities/circuits";
import { assignmentRepBasis, assignmentReps } from "./reps";


export function favoriteSignature(circuit) {
  return mainAssignments(circuit)
    .map(
      (assignment) =>
        `${assignment.exerciseId}:${assignmentReps(assignment)}:${assignmentRepBasis(assignment)}`,
    )
    .join("|");
}


export function favoritesForSlot(dayId, circuitIndex) {
  const cycleId = gateways.week.current().days[dayId]?.cycleId;
  return gateways.favorites.all().filter(
    (favorite) =>
      favorite.cycleId === cycleId &&
      Number(favorite.circuitIndex) === Number(circuitIndex),
  );
}


export function isFavoriteCircuit(dayId, circuitIndex, circuit) {
  const signature = favoriteSignature(circuit);
  return favoritesForSlot(dayId, circuitIndex).some(
    (favorite) => favorite.signature === signature,
  );
}


export function favoriteUnavailableReason(favorite, target) {
  const assignments = favorite.assignments;
  const ids = assignments.map((assignment) => assignment.exerciseId);
  if (ids.some((id) => !gateways.exercises.has(id)))
    return "An exercise is no longer in the library";
  if (ids.some((id) => gateways.exercises.isHidden(id) || gateways.exercises.isDeleted(id)))
    return "Contains a hidden or deleted exercise";
  return "";
}
