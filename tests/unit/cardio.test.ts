import assert from "node:assert/strict";
import { test } from "node:test";
import { completeCardio } from "../../src/interactors/cardio/complete-cardio";
import { setCardioGoal } from "../../src/interactors/cardio/set-cardio-goal";
import { setCardioMinutes } from "../../src/interactors/cardio/set-cardio-minutes";
import { setCardioSplit } from "../../src/interactors/cardio/set-cardio-split";
import { startNewWeek } from "../../src/interactors/week/start-new-week";
import { cardioStatusForDay } from "../../src/services/cardio";
import { createTestGateways } from "./fakes";

test("a new week starts with 150 minutes of cardio split into 30-minute sessions", () => {
  createTestGateways();
  const monday = cardioStatusForDay("monday");
  const sunday = cardioStatusForDay("sunday");

  assert.equal(monday.plannedMinutes, 30);
  assert.equal(monday.remaining, 150);
  assert.equal(sunday.remaining, 150, "no cardio done all week leaves the whole goal");
});

test("checked-off cardio counts toward later days and unchecked days roll forward", () => {
  const gateways = createTestGateways();
  completeCardio(gateways, { dayId: "monday", completed: true });

  assert.equal(cardioStatusForDay("monday").doneThrough, 30);
  assert.equal(cardioStatusForDay("tuesday").doneBefore, 30);
  assert.equal(cardioStatusForDay("tuesday").remaining, 120);

  // Tuesday skipped: Wednesday still has 120 left.
  assert.equal(cardioStatusForDay("wednesday").remaining, 120);
  completeCardio(gateways, { dayId: "monday", completed: false });
  assert.equal(cardioStatusForDay("wednesday").remaining, 150);
});

test("a day's scheduled minutes can be adjusted and are kept once checked off", () => {
  const gateways = createTestGateways();
  setCardioMinutes(gateways, { dayId: "monday", minutes: "50" });
  completeCardio(gateways, { dayId: "monday", completed: true });
  assert.equal(cardioStatusForDay("tuesday").remaining, 100);

  setCardioMinutes(gateways, { dayId: "tuesday", minutes: "" });
  assert.equal(cardioStatusForDay("tuesday").customPlan, false);
  assert.equal(cardioStatusForDay("tuesday").plannedMinutes, 30);
});

test("once the goal is met the following days are cardio days off", () => {
  const gateways = createTestGateways();
  setCardioSplit(gateways, { splitId: "4x45" });
  for (const dayId of ["monday", "tuesday", "wednesday", "thursday"] as const)
    completeCardio(gateways, { dayId, completed: true });

  assert.equal(cardioStatusForDay("thursday").remaining, 0);
  assert.equal(cardioStatusForDay("thursday").goalMetBefore, false);
  assert.equal(cardioStatusForDay("friday").goalMetBefore, true);
  assert.equal(cardioStatusForDay("friday").plannedMinutes, 0);
});

test("the last session is shortened to what is left of the goal", () => {
  const gateways = createTestGateways();
  setCardioSplit(gateways, { splitId: "custom", customMinutes: "40" });
  setCardioGoal(gateways, { minutes: "100" });
  completeCardio(gateways, { dayId: "monday", completed: true });
  completeCardio(gateways, { dayId: "tuesday", completed: true });

  assert.equal(cardioStatusForDay("wednesday").plannedMinutes, 20);
});

test("starting a new week resets the cardio minutes but keeps the settings", () => {
  const gateways = createTestGateways();
  setCardioSplit(gateways, { splitId: "4x45" });
  completeCardio(gateways, { dayId: "monday", completed: true });
  startNewWeek(gateways);

  assert.equal(cardioStatusForDay("monday").completed, false);
  assert.equal(cardioStatusForDay("monday").remaining, 150);
  assert.equal(gateways.cardio.settings().splitId, "4x45");
});

test("sessions only add up to the goal; the remaining days are cardio rest", () => {
  const gateways = createTestGateways();
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
  assert.deepEqual(days.map((day) => cardioStatusForDay(day).plannedMinutes), [30, 30, 30, 30, 30, 0, 0]);

  setCardioSplit(gateways, { splitId: "4x45" });
  assert.deepEqual(days.map((day) => cardioStatusForDay(day).plannedMinutes), [45, 45, 45, 15, 0, 0, 0]);
});

test("a missed day's minutes move to the last session still ahead", () => {
  const gateways = createTestGateways();
  completeCardio(gateways, { dayId: "monday", completed: true });
  gateways.clock.set("2026-10-14T09:00:00"); // Wednesday; Tuesday was missed

  assert.equal(cardioStatusForDay("tuesday").missed, true);
  assert.equal(cardioStatusForDay("wednesday").plannedMinutes, 30);
  assert.equal(cardioStatusForDay("friday").plannedMinutes, 60);
  assert.equal(cardioStatusForDay("friday").makeUpMinutes, 30);
  assert.equal(cardioStatusForDay("saturday").plannedMinutes, 0);

  // Doing the long session makes the missed time up exactly once.
  completeCardio(gateways, { dayId: "friday", completed: true });
  assert.equal(cardioStatusForDay("thursday").plannedMinutes, 30);
  assert.equal(cardioStatusForDay("thursday").makeUpMinutes, 0);
  assert.equal(cardioStatusForDay("sunday").remaining, 60);
});

test("days before a mid-week start are not scheduled or missed", () => {
  createTestGateways({ now: "2026-10-14T09:00:00" }); // started on a Wednesday
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  assert.equal(cardioStatusForDay("monday").missed, false);
  assert.deepEqual(days.map((day) => cardioStatusForDay(day).plannedMinutes), [0, 0, 30, 30, 30, 30, 30]);
});
