import { isCircuitComplete, mainAssignments } from "../../entities/circuits";
import { allRoundsComplete, pauseWorkoutTimer } from "../../entities/timer";
import type { Gateways } from "../../gateways/gateways";
import type { Circuit, DayId } from "../../types";
import { changed, type InteractorResult } from "../interactor";

export interface CompleteRoundInput {
  dayId: DayId;
  circuitIndex: number;
  round: number;
  completed: boolean;
}

// As a user
// When I check (or uncheck) a round of a circuit
// Then the round is marked complete; finishing all three rounds counts one
//   workout toward each exercise's four-workout load progression, and the
//   workout timer stops once every round of the day is done
export function completeRound(
  gateways: Gateways,
  input: CompleteRoundInput,
): InteractorResult {
  const day = gateways.week.day(input.dayId);
  const circuit = day.circuits[input.circuitIndex];
  const wasComplete = isCircuitComplete(circuit);
  circuit.roundsCompleted[input.round] = input.completed;
  const isComplete = isCircuitComplete(circuit);
  if (!wasComplete && isComplete && !circuit.completionCredited) {
    updateLoadProgress(gateways, circuit, 1);
    circuit.completionCredited = true;
  } else if (wasComplete && !isComplete && circuit.completionCredited) {
    updateLoadProgress(gateways, circuit, -1);
    circuit.completionCredited = false;
  }
  if (allRoundsComplete(day)) pauseWorkoutTimer(day);
  return changed({ refresh: ["all"] });
}

function updateLoadProgress(
  gateways: Gateways,
  circuit: Circuit,
  direction: number,
): void {
  for (const assignment of mainAssignments(circuit)) {
    const stats = gateways.exercises.stats(assignment.exerciseId);
    stats.loadProgressCount = Math.max(
      0,
      Math.min(4, stats.loadProgressCount + direction),
    );
  }
}
