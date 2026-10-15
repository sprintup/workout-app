import { circuitExerciseIds } from "../../entities/circuits";
import type { Gateways } from "../../gateways/gateways";
import { favoriteUnavailableReason } from "../../services/favorites";
import { syncCycleTemplateFromDay } from "../../services/generation";
import { resetCircuitCompletion } from "../../services/replacement";
import { validateWeek } from "../../services/validation";
import { allAssignments } from "../../services/week";
import { changed, failed, unchanged, type InteractorResult } from "../interactor";
import type { FavoriteSlot } from "./toggle-favorite-circuit";

// As a user
// When I choose one of my favorite circuits for a circuit position
// Then its exercises and reps replace the current circuit, and the swapped
//   exercises count as skipped or chosen
export function applyFavoriteCircuit(
  gateways: Gateways,
  input: { favoriteId: string; target: FavoriteSlot },
): InteractorResult {
  const { target } = input;
  const favorite = gateways.favorites
    .all()
    .find((item) => item.id === input.favoriteId);
  if (!target || !favorite || favoriteUnavailableReason(favorite, target))
    return unchanged();
  const day = gateways.week.day(target.dayId);
  const circuit = day.circuits[target.circuitIndex];
  const previous = JSON.parse(JSON.stringify(circuit));
  const previousIds = circuitExerciseIds(circuit);
  const nextIds = favorite.assignments.map(
    (assignment) => assignment.exerciseId,
  );
  const usedElsewhere = new Set(
    allAssignments()
      .filter(
        (assignment) =>
          assignment.dayId !== target.dayId ||
          Number(assignment.circuitIndex) !== Number(target.circuitIndex),
      )
      .map((assignment) => assignment.exerciseId),
  );
  const seenFavoriteIds = new Set<string>();
  const favoriteAssignments = favorite.assignments.map((assignment) => {
    const repeats =
      usedElsewhere.has(assignment.exerciseId) ||
      seenFavoriteIds.has(assignment.exerciseId);
    seenFavoriteIds.add(assignment.exerciseId);
    return {
      ...JSON.parse(JSON.stringify(assignment)),
      manualOverride: true,
      rotationRepeat: Boolean(assignment.rotationRepeat || repeats),
    };
  });
  circuit.first = favoriteAssignments[0];
  circuit.second = favoriteAssignments[1];
  circuit.extras = favoriteAssignments.slice(2);
  circuit.preferredExerciseCount = favorite.assignments.length;
  resetCircuitCompletion(circuit);
  const issues = validateWeek(gateways.week.current());
  if (issues.length) {
    day.circuits[target.circuitIndex] = previous;
    return failed(`That favorite cannot be used here: ${issues[0]}`);
  }
  syncCycleTemplateFromDay(target.dayId);
  previousIds
    .filter((id) => !nextIds.includes(id))
    .forEach((id) => {
      gateways.exercises.stats(id).skippedCount += 1;
    });
  nextIds
    .filter((id) => !previousIds.includes(id))
    .forEach((id) => {
      gateways.exercises.stats(id).chosenCount += 1;
    });
  return changed({ refresh: ["all"], toast: "Favorite circuit substituted." });
}
