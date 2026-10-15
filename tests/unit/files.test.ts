import assert from "node:assert/strict";
import { test } from "node:test";
import { loadWorkoutFile } from "../../src/interactors/files/load-workout-file";
import { saveWorkoutFile } from "../../src/interactors/files/save-workout-file";
import { createTestGateways, pickedFile } from "./fakes";

test("saving writes the whole document to the workout file", async () => {
  const gateways = createTestGateways();
  const result = await saveWorkoutFile(gateways);

  const saved = JSON.parse(gateways.workoutFile.written!);
  assert.equal(saved.app, "Basement 45");
  assert.equal(saved.appState.weekNumber, 1);
  assert.equal(result.toast?.message, "Saved directly to workouts.json.");
  assert.deepEqual(result.fileStatus, {
    message: "Saved · workouts.json",
    connected: true,
  });
  assert.equal(result.inSyncWithFile, true);
});

test("saving reports when the browser cannot write files", async () => {
  const gateways = createTestGateways();
  gateways.workoutFile.nextOutcome = "unsupported";
  const result = await saveWorkoutFile(gateways);
  assert.equal(result.toast?.tone, "error");
  assert.equal(gateways.workoutFile.written, null);
  assert.equal(result.inSyncWithFile, undefined);
});

test("cancelling the save dialog is silent", async () => {
  const gateways = createTestGateways();
  gateways.workoutFile.nextOutcome = "cancelled";
  const result = await saveWorkoutFile(gateways);
  assert.equal(result.toast, undefined);
});

test("a saved file loads back into a fresh session", async () => {
  const original = createTestGateways({ seed: 1 });
  original.week.setNumber(9);
  await saveWorkoutFile(original);
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
