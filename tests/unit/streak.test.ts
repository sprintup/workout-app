import assert from "node:assert/strict";
import { test } from "node:test";
import { completeCardio } from "../../src/interactors/cardio/complete-cardio";
import { startNewWeek } from "../../src/interactors/week/start-new-week";
import { completeRound } from "../../src/interactors/workout/complete-round";
import { currentStreak, enabledDays, isWeekFinished } from "../../src/services/week";
import { DAY_CONFIG } from "../../src/data/training";
import { createTestGateways } from "./fakes";

function finishStrength(gateways: ReturnType<typeof createTestGateways>) {
  for (const day of enabledDays())
    for (const circuitIndex of [0, 1, 2])
      for (const round of [0, 1, 2])
        completeRound(gateways, { dayId: day.id, circuitIndex, round, completed: true });
}

function finishCardio(gateways: ReturnType<typeof createTestGateways>) {
  for (const day of DAY_CONFIG.slice(0, 5))
    completeCardio(gateways, { dayId: day.id, completed: true });
}

test("a week counts toward the streak only with every circuit and the cardio goal done", () => {
  const gateways = createTestGateways();
  assert.equal(currentStreak(), 0);

  finishStrength(gateways);
  assert.equal(isWeekFinished(), false, "cardio is still outstanding");

  finishCardio(gateways);
  assert.equal(isWeekFinished(), true);
  assert.equal(currentStreak(), 1);
});

test("starting a new week keeps a finished week's streak and resets an unfinished one", () => {
  const gateways = createTestGateways();
  finishStrength(gateways);
  finishCardio(gateways);
  startNewWeek(gateways);
  assert.equal(currentStreak(), 1);

  finishStrength(gateways);
  finishCardio(gateways);
  startNewWeek(gateways);
  assert.equal(currentStreak(), 2);

  finishStrength(gateways); // no cardio this time
  startNewWeek(gateways);
  assert.equal(currentStreak(), 0);
});
