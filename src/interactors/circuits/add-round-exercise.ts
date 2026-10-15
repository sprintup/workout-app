import { mainAssignments } from "../../entities/circuits";
import type { Gateways } from "../../gateways/gateways";
import {
  defaultReplacementQuery,
  replacementOptions,
} from "../../services/replacement";
import type { DayId } from "../../types";
import { failed, unchanged, type InteractorResult } from "../interactor";
import { replaceExercise, type ReplacementTarget } from "./replace-exercise";

// As a user
// When I press "+" to add an exercise to a circuit's rounds
// Then the best unused exercise for today's target muscles joins the round
//   (a circuit holds at most four exercises)
export function addRoundExercise(
  gateways: Gateways,
  input: { dayId: DayId; circuitIndex: number },
): InteractorResult {
  const circuit = gateways.week.day(input.dayId).circuits[input.circuitIndex];
  if (mainAssignments(circuit).length >= 4) return unchanged();
  const target: ReplacementTarget = {
    dayId: input.dayId,
    circuitIndex: input.circuitIndex,
    position: "extra-new",
    mode: "add",
  };
  const recommended = replacementOptions(defaultReplacementQuery(target))[0]
    ?.exercise;
  if (!recommended) {
    return failed(
      "No unused exercise targeting today's muscles is available for this circuit.",
    );
  }
  return replaceExercise(gateways, {
    target,
    exerciseId: recommended.id,
    showAll: false,
  });
}
