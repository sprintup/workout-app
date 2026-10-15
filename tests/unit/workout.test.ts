import assert from "node:assert/strict";
import { test } from "node:test";
import { checkWarmupExercise } from "../../src/interactors/workout/check-warmup-exercise";
import { increaseExerciseLoad, loadIncreasePrompt } from "../../src/interactors/workout/increase-exercise-load";
import { completeRound } from "../../src/interactors/workout/complete-round";
import { createTestGateways } from "./fakes";

function firstTrainingDay(gateways: ReturnType<typeof createTestGateways>) {
  const dayId = (["monday", "tuesday", "wednesday", "thursday", "friday"] as const).find(
    (id) => !gateways.week.day(id).rest,
  )!;
  return { dayId, day: gateways.week.day(dayId) };
}

test("checking off the last warm-up exercise starts the workout timer", () => {
  const gateways = createTestGateways();
  const { dayId, day } = firstTrainingDay(gateways);
  const warmupIds = Object.keys(day.preChecklist);
  gateways.clock.set("2026-10-12T18:30:00.000Z");
  for (const warmupId of warmupIds)
    checkWarmupExercise(gateways, { dayId, warmupId, completed: true });

  assert.equal(day.timer.startedAt, "2026-10-12T18:30:00.000Z");
});

test("finishing all three rounds counts toward each exercise's load progression", () => {
  const gateways = createTestGateways();
  const { dayId, day } = firstTrainingDay(gateways);
  const exerciseId = day.circuits[0].first.exerciseId;
  for (const round of [0, 1, 2])
    completeRound(gateways, { dayId, circuitIndex: 0, round, completed: true });
  assert.equal(gateways.exercises.stats(exerciseId).loadProgressCount, 1);

  completeRound(gateways, { dayId, circuitIndex: 0, round: 2, completed: false });
  assert.equal(gateways.exercises.stats(exerciseId).loadProgressCount, 0);
});

test("raising the load suggests five more and restarts the progression", () => {
  const gateways = createTestGateways();
  const { day } = firstTrainingDay(gateways);
  const exerciseId = day.circuits[0].first.exerciseId;
  const stats = gateways.exercises.stats(exerciseId);
  stats.weight = "20";
  stats.loadProgressCount = 4;

  assert.equal(loadIncreasePrompt(gateways, { exerciseId })?.suggestion, "25");
  const same = increaseExerciseLoad(gateways, { exerciseId, requestedLoad: "20" });
  assert.equal(same.toast?.tone, "error");

  increaseExerciseLoad(gateways, { exerciseId, requestedLoad: "25" });
  assert.equal(stats.weight, "25");
  assert.equal(stats.loadProgressCount, 0);
});
