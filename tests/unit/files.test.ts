import assert from "node:assert/strict";
import { test } from "node:test";
import { loadWorkoutFile } from "../../src/interactors/files/load-workout-file";
import { exportWorkoutFile } from "../../src/interactors/files/export-workout-file";
import { createTestGateways, pickedFile } from "./fakes";

test("saving writes the whole document to the workout file", async () => {
  const gateways = createTestGateways();
  const result = await exportWorkoutFile(gateways);

  const saved = JSON.parse(gateways.workoutFile.written!);
  assert.equal(saved.app, "Basement 45");
  assert.equal(saved.appState.weekNumber, 1);
  assert.equal(result.toast?.message, "Exported to workouts.json.");
  assert.deepEqual(result.fileStatus, {
    message: "Saved · workouts.json",
    connected: true,
  });
  assert.equal(result.inSyncWithFile, true);
});

test("saving reports when the browser cannot write files", async () => {
  const gateways = createTestGateways();
  gateways.workoutFile.nextOutcome = "unsupported";
  const result = await exportWorkoutFile(gateways);
  assert.equal(result.toast?.tone, "error");
  assert.equal(gateways.workoutFile.written, null);
  assert.equal(result.inSyncWithFile, undefined);
});

test("cancelling the save dialog is silent", async () => {
  const gateways = createTestGateways();
  gateways.workoutFile.nextOutcome = "cancelled";
  const result = await exportWorkoutFile(gateways);
  assert.equal(result.toast, undefined);
});

test("a saved file loads back into a fresh session", async () => {
  const original = createTestGateways({ seed: 1 });
  original.week.setNumber(9);
  await exportWorkoutFile(original);
  const contents = original.workoutFile.written!;
  const savedWeek = original.week.current();

  const reloaded = createTestGateways({ seed: 2 });
  const result = await loadWorkoutFile(reloaded, {
    file: pickedFile("my-week.json", contents),
  });

  assert.equal(result.changed, true);
  assert.equal(result.inSyncWithFile, true);
  assert.equal(reloaded.week.number(), 9);
  assert.deepEqual(
    reloaded.week.day("monday").circuits.map((circuit) => circuit.first.exerciseId),
    savedWeek.days.monday.circuits.map((circuit) => circuit.first.exerciseId),
  );
  assert.equal(result.toast?.message, "Loaded Week 9 from my-week.json.");
});

test("a file that isn't a save file is rejected and nothing changes", async () => {
  const gateways = createTestGateways();
  const before = gateways.appState.snapshot();
  const result = await loadWorkoutFile(gateways, {
    file: pickedFile("notes.json", JSON.stringify({ hello: "world" })),
  });

  assert.equal(result.changed, false);
  assert.equal(result.toast?.message, "This is not a Basement 45 save file.");
  assert.deepEqual(gateways.appState.snapshot(), before);
});

test("a save from before cardio and streaks loads with their defaults", async () => {
  const original = createTestGateways();
  await exportWorkoutFile(original);
  const payload = JSON.parse(original.workoutFile.written!);
  // Shape the file like a version 18 save.
  payload.schemaVersion = 18;
  payload.appState.version = 18;
  delete payload.appState.cardio;
  delete payload.appState.cardioWeek;
  delete payload.appState.weekStreak;
  delete payload.appState.exerciseRatings;
  const exerciseId = Object.keys(payload.appState.exerciseState)[0];
  Object.assign(payload.appState.exerciseState[exerciseId], {
    preference: 1,
    effectivenessFeedbackBase: 3,
    weight: "35",
  });

  const reloaded = createTestGateways({ seed: 2 });
  const result = await loadWorkoutFile(reloaded, {
    file: pickedFile("old.json", JSON.stringify(payload)),
  });

  assert.equal(result.changed, true, result.toast?.message);
  const state = reloaded.appState.current();
  assert.equal(state.version, 19);
  assert.deepEqual(state.cardio, { weeklyGoalMinutes: 150, splitId: "6x30", customMinutes: 30 });
  assert.deepEqual(state.cardioWeek, {});
  assert.equal(state.weekStreak, 0);
  assert.deepEqual(state.exerciseRatings, {});
  assert.equal(state.exerciseState[exerciseId].weight, "35");
  assert.equal("preference" in state.exerciseState[exerciseId], false);
});
