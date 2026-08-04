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
  const controls = {};
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
    classList: { toggle() {} },
    className: "",
    dataset: {},
    files: [],
    hidden: false,
    innerHTML: "",
    textContent: "",
    value: "",
    elements: new Proxy(controls, {
      get(target, property) {
        if (!(property in target)) target[property] = elementStubNameControl();
        return target[property];
      },
    }),
  };
}

function elementStubNameControl() {
  return { checked: false, focus() {}, value: "" };
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

function inputSetting(app, dataset, value) {
  app.document._listeners.input[0]({
    target: { dataset, value, id: "" },
  });
}

async function main() {
for (let attempt = 0; attempt < 50; attempt += 1) {
  const app = launchApp();
  assert.equal(app.EXERCISE_SOURCE.length, 201, "all spreadsheet exercises should be imported");
  assert.equal(app.Basement45.exercises.length, 205, "four fixed custom exercises should be added");
  assert.deepEqual(Array.from(app.Basement45.validateWeek()), [], "generated week should pass every validation");

  const state = app.Basement45.getState();
  const days = Object.values(state.week.days);
  assert.equal(days.length, 7);
  assert.ok(days.every((day) => day.circuits.length === 3));
  assert.equal(state.daySettings.saturday.enabled, false);
  assert.equal(state.daySettings.sunday.enabled, false);

  const assignments = days.flatMap((day) =>
    day.circuits.flatMap((circuit) => [circuit.first, circuit.second, ...circuit.extras, circuit.bridge]),
  );
  assert.equal(assignments.length, 77);
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
assert.equal((workoutHtml.match(/Random activator/g) || []).length, 3);
assert.ok(!workoutHtml.includes("Between rounds"));
assert.equal((workoutHtml.match(/data-action="daily-check"/g) || []).length, 3);
assert.equal((workoutHtml.match(/data-action="core-check"/g) || []).length, 1);
assert.equal((workoutHtml.match(/data-action="cardio-check"/g) || []).length, 1);
assert.ok((workoutHtml.match(/data-action="random-replace"/g) || []).length > 0);
assert.ok((workoutHtml.match(/class="exercise-note"/g) || []).length > 0);
changeAction(interactionApp, "complete-round", { day: "monday", circuit: "0", round: "0" }, true);
changeAction(interactionApp, "complete-bridge", { day: "monday", circuit: "0" }, true);
changeAction(interactionApp, "daily-check", { day: "monday", item: "stretch" }, true);
changeAction(interactionApp, "core-check", { day: "monday" }, true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.circuits[0].roundsCompleted[0], true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.circuits[0].bridgeCompleted, true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.preChecklist.stretch, true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.coreCompleted, true);
assert.ok(
  !interactionApp.__elements.get("workout-view").innerHTML.includes("core-routine is-complete"),
  "the finisher should wait for cardio before changing color",
);
changeAction(interactionApp, "daily-check", { day: "monday", item: "pushups" }, true);
changeAction(interactionApp, "daily-check", { day: "monday", item: "pullups" }, true);
assert.ok(
  interactionApp.__elements.get("workout-view").innerHTML.includes("pre-routine is-complete"),
  "the Before Circuits pane should immediately complete after its final checkbox",
);
changeAction(interactionApp, "cardio-check", { day: "monday" }, true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.cardioCompleted, true);
assert.ok(interactionApp.__elements.get("workout-view").innerHTML.includes("core-routine is-complete"));
changeAction(interactionApp, "complete-round", { day: "monday", circuit: "0", round: "1" }, true);
changeAction(interactionApp, "complete-round", { day: "monday", circuit: "0", round: "2" }, true);
assert.ok(
  interactionApp.__elements.get("workout-view").innerHTML.includes('class="circuit-card is-complete"'),
  "a circuit should receive the completed-pane class once all rounds and its between-rounds movement are done",
);

const noteExerciseId = interactionApp.Basement45.getState().week.days.monday.circuits[0].first.exerciseId;
inputSetting(interactionApp, { setting: "notes", exerciseId: noteExerciseId }, "Keep the tempo controlled");
inputSetting(interactionApp, { setting: "measureType", exerciseId: noteExerciseId }, "seconds");
assert.equal(interactionApp.Basement45.getState().exerciseState[noteExerciseId].notes, "Keep the tempo controlled");
assert.equal(interactionApp.Basement45.getState().exerciseState[noteExerciseId].measureType, "seconds");

const exerciseLookup = new Map(interactionApp.Basement45.exercises.map((exercise) => [exercise.id, exercise]));
const mondayCircuit = interactionApp.Basement45.getState().week.days.monday.circuits[0];
const beforeOrder = [mondayCircuit.first, mondayCircuit.second, ...mondayCircuit.extras].map(
  (assignment) => assignment.exerciseId,
);
let moveIndex = -1;
for (let index = 0; index < beforeOrder.length - 1; index += 1) {
  const reordered = beforeOrder.slice();
  [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
  const valid = reordered.every(
    (id, itemIndex) =>
      itemIndex === 0 ||
      !(exerciseLookup.get(reordered[itemIndex - 1]).unilateral && exerciseLookup.get(id).unilateral),
  );
  if (valid) {
    moveIndex = index;
    break;
  }
}
assert.ok(moveIndex >= 0);
const movePosition = moveIndex === 0 ? "first" : moveIndex === 1 ? "second" : `extra-${moveIndex - 2}`;
clickAction(interactionApp, "move-exercise", {
  day: "monday",
  circuit: "0",
  position: movePosition,
  direction: "1",
});
const afterOrderCircuit = interactionApp.Basement45.getState().week.days.monday.circuits[0];
const afterOrder = [afterOrderCircuit.first, afterOrderCircuit.second, ...afterOrderCircuit.extras].map(
  (assignment) => assignment.exerciseId,
);
assert.notDeepEqual(afterOrder, beforeOrder);
assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);

let randomChanged = false;
for (const dayId of ["monday", "tuesday", "wednesday", "thursday", "friday"]) {
  for (let circuitIndex = 0; circuitIndex < 3 && !randomChanged; circuitIndex += 1) {
    for (const position of ["first", "second"]) {
      const before = interactionApp.Basement45.getState().week.days[dayId].circuits[circuitIndex][position];
      if (before.locked) continue;
      clickAction(interactionApp, "random-replace", {
        day: dayId,
        circuit: String(circuitIndex),
        position,
      });
      const after = interactionApp.Basement45.getState().week.days[dayId].circuits[circuitIndex][position];
      if (after.exerciseId !== before.exerciseId) {
        randomChanged = true;
        break;
      }
    }
  }
  if (randomChanged) break;
}
assert.equal(randomChanged, true, "the random eligible replacement action should change an exercise");
assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);

const deleteCircuitBefore = interactionApp.Basement45.getState().week.days.monday.circuits[0];
const deleteCountBefore = 2 + deleteCircuitBefore.extras.length;
clickAction(interactionApp, "delete-circuit-exercise", {
  day: "monday",
  circuit: "0",
  position: `extra-${deleteCircuitBefore.extras.length - 1}`,
});
assert.equal(
  2 + interactionApp.Basement45.getState().week.days.monday.circuits[0].extras.length,
  deleteCountBefore - 1,
);
assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);

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
const allReplacementIds = [...allReplacementHtml.matchAll(/data-exercise-id="([^"]+)"/g)].map((match) => match[1]);
const replacementId = allReplacementIds.find((exerciseId) => !replacementHtml.includes(`data-exercise-id="${exerciseId}"`));
assert.ok(replacementId, "show all should expose at least one available library exercise");
const replacementExercise = interactionApp.Basement45.exercises.find((exercise) => exercise.id === replacementId);
const fuzzyQuery = replacementExercise.name
  .split(/\s+/)
  .slice(0, 3)
  .map((word) => (word.length > 3 ? word.slice(0, -1) : word))
  .join(" ");
interactionApp.document._listeners.input[0]({
  target: {
    id: "replace-search",
    value: fuzzyQuery,
    dataset: {},
  },
});
const fuzzyReplacementHtml = interactionApp.__elements.get("replace-results").innerHTML;
assert.ok(
  fuzzyReplacementHtml.includes(`data-exercise-id="${replacementId}"`),
  "replacement search should tolerate partial words and small misspellings",
);
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

clickAction(interactionApp, "edit-library", { exerciseId: "flat-dumbbell-bench-press" });
customForm._formData = new Map([
  ["name", "Flat dumbbell bench press — edited"],
  ["category", "Chest"],
  ["equipment", "Adjustable dumbbells + bench"],
  ["movementPattern", "push"],
  ["movementRole", "compound"],
  ["forceType", "push"],
  ["defaultReps", "8"],
  ["instructionUrl", ""],
  ["notes", "User-edited library note"],
]);
customForm._listeners.submit[0]({ preventDefault() {}, currentTarget: customForm });
assert.equal(
  interactionApp.Basement45.exercises.find((exercise) => exercise.id === "flat-dumbbell-bench-press").name,
  "Flat dumbbell bench press — edited",
);
assert.ok(interactionApp.Basement45.getState().exerciseEdits["flat-dumbbell-bench-press"]);

clickAction(interactionApp, "toggle-hide-library", { exerciseId: "test-supported-row" });
assert.deepEqual(interactionApp.Basement45.getState().hiddenExerciseIds, ["test-supported-row"]);
clickAction(interactionApp, "delete-library", { exerciseId: "test-supported-row" });
assert.deepEqual(interactionApp.Basement45.getState().deletedExerciseIds, ["test-supported-row"]);
const customReloadApp = launchApp(JSON.stringify(interactionApp.Basement45.getState()));
assert.equal(customReloadApp.Basement45.getState().customExercises.length, 1);
assert.deepEqual(customReloadApp.Basement45.getState().deletedExerciseIds, ["test-supported-row"]);
assert.equal(
  customReloadApp.Basement45.exercises.find((exercise) => exercise.id === "flat-dumbbell-bench-press").name,
  "Flat dumbbell bench press — edited",
);

interactionApp.document._listeners.input[0]({
  target: {
    id: "",
    dataset: { daySetting: "focus", day: "monday" },
    value: "Upper strength practice",
  },
});
assert.equal(interactionApp.Basement45.getState().daySettings.monday.focus, "Upper strength practice");
interactionApp.document._listeners.change[0]({
  target: {
    checked: false,
    dataset: { dayEnabled: "tuesday" },
    closest() {
      return null;
    },
  },
});
assert.equal(interactionApp.Basement45.getState().daySettings.tuesday.enabled, false);
assert.equal(interactionApp.Basement45.getState().daySettings.saturday.enabled, false);
assert.equal(interactionApp.Basement45.getState().daySettings.sunday.enabled, false);
interactionApp.document._listeners.change[0]({
  target: {
    checked: true,
    dataset: { dayEnabled: "saturday" },
    closest() {
      return null;
    },
  },
});
assert.ok(interactionApp.__elements.get("day-tabs").innerHTML.includes('data-view="saturday"'));
interactionApp.document._listeners.change[0]({
  target: {
    checked: false,
    dataset: { dayEnabled: "saturday" },
    closest() {
      return null;
    },
  },
});

const hiddenFromNextWeek = interactionApp.Basement45.getState().week.days.friday.circuits[2].first.exerciseId;
clickAction(interactionApp, "toggle-hide-library", { exerciseId: hiddenFromNextWeek });
interactionApp.__elements.get("new-week-button")._listeners.click[0]();
const nextWeekIds = Object.values(interactionApp.Basement45.getState().week.days).flatMap((day) =>
  day.circuits.flatMap((circuit) => [
    circuit.first.exerciseId,
    circuit.second.exerciseId,
    ...circuit.extras.map((assignment) => assignment.exerciseId),
    circuit.bridge.exerciseId,
  ]),
);
assert.ok(!nextWeekIds.includes(hiddenFromNextWeek), "hidden exercises must not be recommended");

let directFileContents = "";
const directFileHandle = {
  name: "workouts.json",
  async queryPermission() {
    return "granted";
  },
  async requestPermission() {
    return "granted";
  },
  async createWritable() {
    return {
      async write(value) {
        directFileContents = value;
      },
      async close() {},
    };
  },
};
interactionApp.showSaveFilePicker = async () => directFileHandle;
await interactionApp.__elements.get("save-button")._listeners.click[0]();
assert.equal(JSON.parse(directFileContents).app, "Basement 45");

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

const fiveDayState = JSON.parse(JSON.stringify(roundTripState));
fiveDayState.version = 3;
delete fiveDayState.week.days.saturday;
delete fiveDayState.week.days.sunday;
delete fiveDayState.daySettings.saturday;
delete fiveDayState.daySettings.sunday;
const weekendMigratedApp = launchApp(JSON.stringify(fiveDayState));
assert.deepEqual(Array.from(weekendMigratedApp.Basement45.validateWeek()), []);
assert.equal(weekendMigratedApp.Basement45.getState().week.days.saturday.circuits.length, 3);
assert.equal(weekendMigratedApp.Basement45.getState().week.days.sunday.circuits.length, 3);
assert.equal(weekendMigratedApp.Basement45.getState().daySettings.saturday.enabled, false);
assert.equal(weekendMigratedApp.Basement45.getState().daySettings.sunday.enabled, false);

console.log(
  "Smoke test passed randomized starts, 140 generated weeks, weekend migration, completed panes and routines, direct-file save, editing, settings, and v1-v5 persistence.",
);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
