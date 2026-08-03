"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const exerciseDataScript = fs.readFileSync(path.join(root, "exercise-data.js"), "utf8");
const appScript = fs.readFileSync(path.join(root, "app.js"), "utf8");

function elementStub() {
  const listeners = {};
  return {
    _listeners: listeners,
    addEventListener(type, callback) {
      listeners[type] ||= [];
      listeners[type].push(callback);
    },
    appendChild() {},
    click() {},
    close() {},
    focus() {},
    reportValidity() {
      return true;
    },
    reset() {},
    remove() {},
    setSelectionRange() {},
    showModal() {},
    style: {},
    className: "",
    dataset: {},
    files: [],
    hidden: false,
    innerHTML: "",
    textContent: "",
    value: "",
    elements: { name: elementStubNameControl() },
  };
}

function elementStubNameControl() {
  return { focus() {} };
}

function launchApp(storedState = null) {
  const elements = new Map();
  const documentListeners = {};
  const context = {
    Blob,
    URL,
    Intl,
    Math,
    Date,
    JSON,
    Map,
    Set,
    console,
    clearTimeout,
    setTimeout,
    confirm: () => true,
    FormData: class FakeFormData {
      constructor(form) {
        this.data = form._formData || new Map();
      }
      get(name) {
        return this.data.get(name) ?? null;
      }
    },
    localStorage: {
      getItem() {
        return storedState;
      },
      setItem() {},
    },
    document: {
      body: elementStub(),
      _listeners: documentListeners,
      addEventListener(type, callback) {
        documentListeners[type] ||= [];
        documentListeners[type].push(callback);
      },
      createElement() {
        return elementStub();
      },
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, elementStub());
        return elements.get(id);
      },
    },
  };
  context.window = context;
  context.__elements = elements;

  vm.createContext(context);
  vm.runInContext(exerciseDataScript, context, { filename: "exercise-data.js" });
  vm.runInContext(appScript, context, { filename: "app.js" });
  return context;
}

function clickAction(app, action, dataset = {}) {
  const target = {
    dataset: { action, ...dataset },
    closest(selector) {
      return selector === "[data-action]" ? this : null;
    },
  };
  app.document._listeners.click[0]({ target });
}

function changeAction(app, action, dataset, checked) {
  const target = {
    checked,
    dataset: { action, ...dataset },
    closest(selector) {
      return selector === `[data-action="${action}"]` ? this : null;
    },
  };
  app.document._listeners.change[0]({ target });
}

for (let attempt = 0; attempt < 50; attempt += 1) {
  const app = launchApp();
  assert.equal(app.EXERCISE_SOURCE.length, 201, "all spreadsheet exercises should be imported");
  assert.equal(app.Basement45.exercises.length, 205, "four fixed custom exercises should be added");
  assert.deepEqual(Array.from(app.Basement45.validateWeek()), [], "generated week should pass every validation");

  const state = app.Basement45.getState();
  const days = Object.values(state.week.days);
  assert.equal(days.length, 5);
  assert.ok(days.every((day) => day.circuits.length === 3));

  const assignments = days.flatMap((day) =>
    day.circuits.flatMap((circuit) => [circuit.first, circuit.second, ...circuit.extras, circuit.bridge]),
  );
  assert.equal(assignments.length, 59);
  assert.equal(new Set(assignments.map((assignment) => assignment.exerciseId)).size, assignments.length);
  assert.deepEqual(
    [...new Set(days.flatMap((day) => day.circuits.map((circuit) => 2 + circuit.extras.length)))].sort(),
    [2, 3, 4],
    "the generated week should mix focused, standard, and challenge circuits",
  );

  const chosenCount = Object.values(state.exerciseState).reduce((sum, item) => sum + item.chosenCount, 0);
  assert.equal(chosenCount, assignments.length, "each generated exercise should be counted once");

  assert.deepEqual(
    state.week.days.friday.circuits.map((circuit) => circuit.bridge.exerciseId),
    ["pt-exercise-1", "pt-exercise-2", "pt-exercise-3"],
  );
  assert.ok(
    state.week.days.wednesday.circuits.some(
      (circuit) =>
        circuit.first.exerciseId === "shoulder-exercise-placeholder" ||
        circuit.second.exerciseId === "shoulder-exercise-placeholder",
    ),
  );
}

const interactionApp = launchApp();
const workoutHtml = interactionApp.__elements.get("workout-view").innerHTML;
assert.equal((workoutHtml.match(/data-action="complete-round"/g) || []).length, 9);
assert.equal((workoutHtml.match(/data-action="complete-bridge"/g) || []).length, 3);
changeAction(interactionApp, "complete-round", { day: "monday", circuit: "0", round: "0" }, true);
changeAction(interactionApp, "complete-bridge", { day: "monday", circuit: "0" }, true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.circuits[0].roundsCompleted[0], true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.circuits[0].bridgeCompleted, true);

const beforeAdd = interactionApp.Basement45.getState().week.days.tuesday.circuits[0];
assert.equal(beforeAdd.extras.length, 0);
clickAction(interactionApp, "add-round-exercise", { day: "tuesday", circuit: "0" });
const replacementHtml = interactionApp.__elements.get("replace-results").innerHTML;
assert.ok(!replacementHtml.includes('data-exercise-id="decline-dumbbell-press"'));
interactionApp.document._listeners.change[0]({
  target: {
    id: "show-all-replacements",
    checked: true,
    closest() {
      return null;
    },
  },
});
const allReplacementHtml = interactionApp.__elements.get("replace-results").innerHTML;
assert.ok(allReplacementHtml.includes('data-exercise-id="decline-dumbbell-press"'));
const replacementId = "decline-dumbbell-press";
clickAction(interactionApp, "choose-replacement", { exerciseId: replacementId });
assert.equal(interactionApp.Basement45.getState().week.days.tuesday.circuits[0].extras.length, 1);
assert.equal(interactionApp.Basement45.getState().week.days.tuesday.circuits[0].extras[0].manualOverride, true);
assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);
const manualOverrideReload = launchApp(JSON.stringify(interactionApp.Basement45.getState()));
assert.deepEqual(Array.from(manualOverrideReload.Basement45.validateWeek()), []);
clickAction(interactionApp, "remove-round-exercise", { day: "tuesday", circuit: "0" });
assert.equal(interactionApp.Basement45.getState().week.days.tuesday.circuits[0].extras.length, 0);

const customForm = interactionApp.__elements.get("exercise-form");
customForm._formData = new Map([
  ["name", "Test supported row"],
  ["category", "Back and Lats"],
  ["equipment", "Adjustable dumbbell + bench"],
  ["movementPattern", "pull"],
  ["movementRole", "compound"],
  ["forceType", "pull"],
  ["defaultReps", "10"],
  ["instructionUrl", ""],
]);
customForm._listeners.submit[0]({ preventDefault() {}, currentTarget: customForm });
assert.equal(interactionApp.Basement45.getState().customExercises.length, 1);
clickAction(interactionApp, "toggle-hide-library", { exerciseId: "test-supported-row" });
assert.deepEqual(interactionApp.Basement45.getState().hiddenExerciseIds, ["test-supported-row"]);
clickAction(interactionApp, "delete-library", { exerciseId: "test-supported-row" });
assert.deepEqual(interactionApp.Basement45.getState().deletedExerciseIds, ["test-supported-row"]);
const customReloadApp = launchApp(JSON.stringify(interactionApp.Basement45.getState()));
assert.equal(customReloadApp.Basement45.getState().customExercises.length, 1);
assert.deepEqual(customReloadApp.Basement45.getState().deletedExerciseIds, ["test-supported-row"]);

let roundTripState;
for (let sequence = 0; sequence < 10; sequence += 1) {
  const multiWeekApp = launchApp();
  for (let week = 2; week <= 15; week += 1) {
    const newWeekButton = multiWeekApp.__elements.get("new-week-button");
    newWeekButton._listeners.click[0]();
    const current = multiWeekApp.Basement45.getState();
    assert.equal(current.weekNumber, week, multiWeekApp.__elements.get("toast").textContent);
    assert.ok(
      Object.values(current.week.days).every((day) =>
        day.circuits.every(
          (circuit) => circuit.roundsCompleted.every((round) => !round) && !circuit.bridgeCompleted,
        ),
      ),
      "a new week should have blank round and bridge checkmarks",
    );
    assert.deepEqual(Array.from(multiWeekApp.Basement45.validateWeek()), []);
  }
  roundTripState = multiWeekApp.Basement45.getState();
}

const reloadedApp = launchApp(JSON.stringify(roundTripState));
assert.deepEqual(Array.from(reloadedApp.Basement45.validateWeek()), []);
assert.equal(reloadedApp.Basement45.getState().weekNumber, 15, "local JSON state should survive a reload");

const legacyState = JSON.parse(JSON.stringify(roundTripState));
legacyState.version = 1;
for (const day of Object.values(legacyState.week.days)) {
  for (const circuit of day.circuits) {
    circuit.extras = undefined;
    circuit.preferredExerciseCount = undefined;
    circuit.completed = false;
    circuit.roundsCompleted = undefined;
    circuit.bridgeCompleted = undefined;
  }
}
legacyState.week.days.monday.circuits[0].completed = true;
const migratedApp = launchApp(JSON.stringify(legacyState));
assert.deepEqual(Array.from(migratedApp.Basement45.validateWeek()), []);
const migratedCircuit = migratedApp.Basement45.getState().week.days.monday.circuits[0];
assert.deepEqual(migratedCircuit.roundsCompleted, [true, true, true]);
assert.equal(migratedCircuit.bridgeCompleted, true);

console.log(
  "Smoke test passed randomized starts, 140 generated weeks, dynamic controls, custom-library actions, and v1/v2 persistence.",
);
