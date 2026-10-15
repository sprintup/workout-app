import assert from "node:assert/strict";
import { test } from "node:test";
import { addCooldownExercise } from "../../src/interactors/routines/add-cooldown-exercise";
import { deleteCooldownExercise } from "../../src/interactors/routines/delete-cooldown-exercise";
import { renameCooldownExercise } from "../../src/interactors/routines/rename-cooldown-exercise";
import { setCooldownInterval } from "../../src/interactors/routines/set-cooldown-interval";
import { checkCooldownExercise } from "../../src/interactors/workout/check-cooldown-exercise";
import { isCooldownDue } from "../../src/services/routine-schedule";
import { createTestGateways } from "./fakes";

test("a cool-down scheduled every 2 days skips the next day and returns the day after", () => {
  const gateways = createTestGateways();
  const [core] = gateways.routines.cooldowns();
  setCooldownInterval(gateways, { cooldownId: core.id, intervalDays: 2 });

  checkCooldownExercise(gateways, {
    dayId: "monday",
    cooldownId: core.id,
    completed: true,
  });

  assert.deepEqual(core.completedDates, ["2026-10-12"]);
  assert.equal(isCooldownDue(core, "tuesday"), false);
  assert.equal(isCooldownDue(core, "wednesday"), true);
});

test("a cool-down scheduled every 3 days looks back over the previous two days", () => {
  const gateways = createTestGateways();
  const [core] = gateways.routines.cooldowns();
  setCooldownInterval(gateways, { cooldownId: core.id, intervalDays: 3 });
  checkCooldownExercise(gateways, {
    dayId: "monday",
    cooldownId: core.id,
    completed: true,
  });

  assert.equal(isCooldownDue(core, "tuesday"), false);
  assert.equal(isCooldownDue(core, "wednesday"), false);
  assert.equal(isCooldownDue(core, "thursday"), true);
});

test("unchecking a cool-down forgets that day's completion", () => {
  const gateways = createTestGateways();
  const [core] = gateways.routines.cooldowns();
  setCooldownInterval(gateways, { cooldownId: core.id, intervalDays: 2 });
  const input = { dayId: "monday" as const, cooldownId: core.id };
  checkCooldownExercise(gateways, { ...input, completed: true });
  checkCooldownExercise(gateways, { ...input, completed: false });

  assert.deepEqual(core.completedDates, []);
  assert.equal(isCooldownDue(core, "tuesday"), true);
});

test("an every-day cool-down is always due", () => {
  const gateways = createTestGateways();
  const [core] = gateways.routines.cooldowns();
  checkCooldownExercise(gateways, {
    dayId: "monday",
    cooldownId: core.id,
    completed: true,
  });
  assert.equal(isCooldownDue(core, "tuesday"), true);
});

test("setting an interval reports it and stores a whole number of days", () => {
  const gateways = createTestGateways();
  const [core] = gateways.routines.cooldowns();
  const result = setCooldownInterval(gateways, {
    cooldownId: core.id,
    intervalDays: "3",
  });
  assert.equal(result.changed, true);
  assert.equal(core.intervalDays, 3);
  assert.equal(result.toast?.message, "5 core: every 3 days.");
});

test("adding and deleting a cool-down exercise updates every day's checklist", () => {
  const gateways = createTestGateways();
  addCooldownExercise(gateways);
  const added = gateways.routines.cooldowns().at(-1)!;
  assert.equal(added.intervalDays, 1);
  assert.equal(gateways.week.day("friday").cooldownChecklist[added.id], false);

  const result = deleteCooldownExercise(gateways, { cooldownId: added.id });
  assert.equal(result.toast?.message, "New cool-down exercise removed from the cool-down.");
  assert.equal(added.id in gateways.week.day("friday").cooldownChecklist, false);
});

test("renaming keeps typed text and falls back to a numbered name when cleared", () => {
  const gateways = createTestGateways();
  const [core] = gateways.routines.cooldowns();
  renameCooldownExercise(gateways, { cooldownId: core.id, label: " Plank ", final: false });
  assert.equal(core.label, " Plank ");
  const result = renameCooldownExercise(gateways, { cooldownId: core.id, label: "  ", final: true });
  assert.equal(result.value, "Cool-down exercise 1");
});
