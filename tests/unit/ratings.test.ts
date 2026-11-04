import assert from "node:assert/strict";
import { test } from "node:test";
import { applyFavoriteCircuit } from "../../src/interactors/favorites/apply-favorite-circuit";
import { toggleFavoriteCircuit } from "../../src/interactors/favorites/toggle-favorite-circuit";
import { rateExercise } from "../../src/interactors/workout/rate-exercise";
import { setExerciseEffectiveness } from "../../src/interactors/workout/set-exercise-effectiveness";
import { updateExerciseEffectiveness } from "../../src/services/exercise-catalog";
import { favoritesForDay } from "../../src/services/favorites";
import type { DayId } from "../../src/types";
import { createTestGateways } from "./fakes";

function trainingDays(gateways: ReturnType<typeof createTestGateways>): DayId[] {
  return (
    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
  ).filter((id) => !gateways.week.day(id).rest);
}

test("a thumbs-up adds a point each time the exercise comes up", () => {
  const gateways = createTestGateways();
  const [dayId] = trainingDays(gateways);
  const exerciseId = gateways.week.day(dayId).circuits[0].first.exerciseId;
  updateExerciseEffectiveness(exerciseId, 2);
  const here = { dayId, circuitIndex: 0, position: "first" as const };

  rateExercise(gateways, { ...here, thumbsUp: true });
  assert.equal(gateways.exercises.find(exerciseId).effectiveness_score, 3);

  // The same exercise in another circuit is a new appearance.
  gateways.week.day(dayId).circuits[1].first.exerciseId = exerciseId;
  rateExercise(gateways, { dayId, circuitIndex: 1, position: "first", thumbsUp: true });
  assert.equal(gateways.exercises.find(exerciseId).effectiveness_score, 4);

  // Pressing the same thumb again in the same spot undoes only that one.
  rateExercise(gateways, { ...here, thumbsUp: true });
  assert.equal(gateways.exercises.find(exerciseId).effectiveness_score, 3);
});

test("switching thumbs moves around the unrated score instead of stacking", () => {
  const gateways = createTestGateways();
  const [dayId] = trainingDays(gateways);
  const exerciseId = gateways.week.day(dayId).circuits[0].second.exerciseId;
  updateExerciseEffectiveness(exerciseId, 3);
  const here = { dayId, circuitIndex: 0, position: "second" as const };

  rateExercise(gateways, { ...here, thumbsUp: true });
  rateExercise(gateways, { ...here, thumbsUp: false });
  assert.equal(gateways.exercises.find(exerciseId).effectiveness_score, 2);
});

test("a thumbs-up at the top of the scale can be undone without losing a point", () => {
  const gateways = createTestGateways();
  const [dayId] = trainingDays(gateways);
  const exerciseId = gateways.week.day(dayId).circuits[0].first.exerciseId;
  updateExerciseEffectiveness(exerciseId, 5);
  const here = { dayId, circuitIndex: 0, position: "first" as const };

  rateExercise(gateways, { ...here, thumbsUp: true });
  rateExercise(gateways, { ...here, thumbsUp: true });
  assert.equal(gateways.exercises.find(exerciseId).effectiveness_score, 5);
});

test("typing a score clears this week's thumbs for that exercise", () => {
  const gateways = createTestGateways();
  const [dayId] = trainingDays(gateways);
  const exerciseId = gateways.week.day(dayId).circuits[0].first.exerciseId;
  rateExercise(gateways, { dayId, circuitIndex: 0, position: "first", thumbsUp: true });
  setExerciseEffectiveness(gateways, { exerciseId, score: 2 });

  assert.deepEqual(gateways.exercises.ratings(), {});
});

test("a favorite saved from one circuit can be used in any circuit that day", () => {
  const gateways = createTestGateways();
  const [dayId] = trainingDays(gateways);
  toggleFavoriteCircuit(gateways, { dayId, circuitIndex: 0, name: "Day favorite" });
  const [favorite] = favoritesForDay(dayId);

  const result = applyFavoriteCircuit(gateways, {
    favoriteId: favorite.id,
    target: { dayId, circuitIndex: 2 },
  });

  assert.equal(result.changed, true, result.toast?.message);
  assert.deepEqual(
    gateways.week.day(dayId).circuits[2].first.exerciseId,
    favorite.assignments[0].exerciseId,
  );
});
