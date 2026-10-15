import assert from "node:assert/strict";
import { test } from "node:test";
import { startNewWeek } from "../../src/interactors/week/start-new-week";
import { toggleRestDay } from "../../src/interactors/week/toggle-rest-day";
import { validateWeek } from "../../src/services/validation";
import { createTestGateways } from "./fakes";

test("the same seed generates the same first week", () => {
  const first = createTestGateways({ seed: 7 }).week.current();
  const second = createTestGateways({ seed: 7 }).week.current();
  assert.deepEqual(second, first);
});

test("starting a new week archives the old one and continues the rotation", () => {
  const gateways = createTestGateways();
  const expectedStartCycle = gateways.week.nextCycleId();
  gateways.clock.set("2026-10-19T07:00:00.000Z");

  const result = startNewWeek(gateways);

  assert.equal(result.changed, true);
  assert.equal(gateways.week.number(), 2);
  assert.equal(gateways.week.startedAt(), "2026-10-19T07:00:00.000Z");
  assert.equal(gateways.week.startCycleId(), expectedStartCycle);
  assert.equal(gateways.week.history().length, 1);
  assert.deepEqual(validateWeek(gateways.week.current()), []);
  assert.equal(result.toast?.message, "Week 2 is ready with blank round checkmarks.");
});

test("resting a day shifts the rotation without using up a cycle", () => {
  const gateways = createTestGateways();
  const mondayCycle = gateways.week.day("monday").cycleId;

  const result = toggleRestDay(gateways, { dayId: "monday" });

  assert.equal(result.changed, true);
  assert.equal(gateways.week.day("monday").rest, true);
  assert.equal(gateways.week.day("monday").pendingCycleId, mondayCycle);
  assert.equal(gateways.week.day("tuesday").cycleId, mondayCycle);
});
