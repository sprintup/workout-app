"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const exerciseDataScript = fs.readFileSync(path.join(root, "exercise-data.js"), "utf8");
const equipmentExerciseDataScript = fs.readFileSync(path.join(root, "equipment-exercises.js"), "utf8");
const appScript = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const exampleSave = JSON.parse(fs.readFileSync(path.join(root, "basement-45-workouts.json"), "utf8"));

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
    close() {
      this.open = false;
    },
    focus() {},
    reportValidity() {
      return true;
    },
    reset() {},
    remove() {},
    setSelectionRange() {},
    showModal() {
      this.open = true;
    },
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
    prompt: () => "Test favorite circuit",
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
  vm.runInContext(equipmentExerciseDataScript, context, { filename: "equipment-exercises.js" });
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
  assert.ok(app.Basement45.exercises.length > 300, "the equipment expansion should add a comprehensive catalog");
  assert.deepEqual(Array.from(app.Basement45.validateWeek()), [], "generated week should pass every validation");

  const state = app.Basement45.getState();
  const catalog = app.Basement45.exercises;
  const catalogById = new Map(catalog.map((exercise) => [exercise.id, exercise]));
  assert.equal(new Set(catalog.map((exercise) => exercise.id)).size, catalog.length, "catalog IDs should be unique");
  assert.ok(catalog.every((exercise) => exercise.equipment_varieties.length > 0));
  assert.ok(catalog.every((exercise) => exercise.always_locked || exercise.instruction_url));
  assert.ok(catalog.every((exercise) => exercise.difficulty_score >= 1 && exercise.difficulty_score <= 5));
  assert.ok(catalog.every((exercise) => exercise.setup_difficulty >= 1 && exercise.setup_difficulty <= 5));
  assert.ok(catalog.every((exercise) => exercise.effectiveness_score >= 1 && exercise.effectiveness_score <= 5));
  assert.ok(
    catalog.filter((exercise) => exercise.equipment_varieties.includes("Physio ball")).length >= 7,
    "the available equipment catalog should include the physio-ball exercise set",
  );
  assert.equal(catalog.find((exercise) => exercise.id === "kettlebell-swing").custom, false);
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
  assert.ok(
    days.every((day) => day.circuits.every((circuit) => catalogById.get(circuit.bridge.exerciseId).total_body_activator)),
    "every activator slot should contain a checked total-body activator",
  );
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
assert.equal((workoutHtml.match(/Total Body activator/g) || []).length, 3);
assert.ok(!workoutHtml.includes("Between rounds"));
assert.equal((workoutHtml.match(/data-action="daily-check"/g) || []).length, 3);
assert.equal((workoutHtml.match(/data-action="core-check"/g) || []).length, 1);
assert.equal((workoutHtml.match(/data-action="cardio-check"/g) || []).length, 1);
assert.ok((workoutHtml.match(/data-action="random-replace"/g) || []).length > 0);
assert.ok((workoutHtml.match(/class="exercise-note"/g) || []).length > 0);
assert.ok((workoutHtml.match(/class="equipment-needed"/g) || []).length > 0);
assert.ok((workoutHtml.match(/data-action="set-preference"/g) || []).length > 0);
assert.ok((workoutHtml.match(/data-action="toggle-hide-workout"/g) || []).length > 0);
assert.ok((workoutHtml.match(/data-action="edit-workout-exercise"/g) || []).length > 0);
assert.ok((workoutHtml.match(/data-action="toggle-favorite-circuit"/g) || []).length === 3);
assert.ok((workoutHtml.match(/class="recommendation-score"/g) || []).length > 0);
assert.ok(!workoutHtml.includes(">Neutral<"));
assert.ok(
  workoutHtml.indexOf('class="bridge-wrap activator-wrap ') < workoutHtml.indexOf('class="round-checks"') &&
    workoutHtml.indexOf('class="round-checks"') < workoutHtml.indexOf('class="exercise-cycle"'),
  "the total-body activator and sticky round controls should come before the cycle exercises",
);
assert.ok(!workoutHtml.includes("circuit-sticky-progress"));
assert.match(styles, /\.sidebar\s*{[^}]*position:\s*sticky/s);
assert.match(styles, /\.round-checks\s*{[^}]*position:\s*sticky/s);
assert.match(styles, /\.pre-routine:not\(\.is-complete\)\s*{[^}]*position:\s*sticky/s);
assert.match(styles, /\.activator-wrap\.is-pending\s*{[^}]*position:\s*sticky/s);
assert.match(styles, /\.replace-option\s*{[^}]*min-height:\s*76px/s);

const favoriteOriginalIds = [
  interactionApp.Basement45.getState().week.days.monday.circuits[0].first.exerciseId,
  interactionApp.Basement45.getState().week.days.monday.circuits[0].second.exerciseId,
  ...interactionApp.Basement45.getState().week.days.monday.circuits[0].extras.map(
    (assignment) => assignment.exerciseId,
  ),
  interactionApp.Basement45.getState().week.days.monday.circuits[0].bridge.exerciseId,
];
clickAction(interactionApp, "toggle-favorite-circuit", { day: "monday", circuit: "0" });
const favoriteId = interactionApp.Basement45.getState().favoriteCircuits[0].id;
assert.ok(favoriteId);
assert.equal(interactionApp.Basement45.getState().favoriteCircuits[0].name, "Test favorite circuit");
clickAction(interactionApp, "random-replace", { day: "monday", circuit: "0", position: "first" });
clickAction(interactionApp, "open-favorite-circuits", { day: "monday", circuit: "0" });
assert.ok(interactionApp.__elements.get("favorite-results").innerHTML.includes("Use circuit"));
clickAction(interactionApp, "apply-favorite-circuit", { favoriteId });
const favoriteRestoredCircuit = interactionApp.Basement45.getState().week.days.monday.circuits[0];
assert.deepEqual(
  [
    favoriteRestoredCircuit.first.exerciseId,
    favoriteRestoredCircuit.second.exerciseId,
    ...favoriteRestoredCircuit.extras.map((assignment) => assignment.exerciseId),
    favoriteRestoredCircuit.bridge.exerciseId,
  ],
  favoriteOriginalIds,
);
assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);
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
clickAction(interactionApp, "edit-workout-exercise", { exerciseId: noteExerciseId });
assert.ok(interactionApp.__elements.get("exercise-dialog-title").textContent.startsWith("Edit "));
clickAction(interactionApp, "close-exercise-dialog");
inputSetting(interactionApp, { setting: "notes", exerciseId: noteExerciseId }, "Keep the tempo controlled");
inputSetting(interactionApp, { setting: "measureType", exerciseId: noteExerciseId }, "seconds");
assert.equal(interactionApp.Basement45.getState().exerciseState[noteExerciseId].notes, "Keep the tempo controlled");
assert.equal(interactionApp.Basement45.getState().exerciseState[noteExerciseId].measureType, "seconds");
clickAction(interactionApp, "set-preference", { exerciseId: noteExerciseId, value: "1" });
assert.equal(interactionApp.Basement45.getState().exerciseState[noteExerciseId].preference, 1);
assert.ok(interactionApp.__elements.get("workout-view").innerHTML.includes('class="feedback-button active"'));
clickAction(interactionApp, "toggle-hide-workout", { exerciseId: noteExerciseId });
assert.ok(interactionApp.Basement45.getState().hiddenExerciseIds.includes(noteExerciseId));
assert.ok(interactionApp.__elements.get("workout-view").innerHTML.includes("exercise-item is-hidden"));
clickAction(interactionApp, "toggle-hide-workout", { exerciseId: noteExerciseId });
assert.ok(!interactionApp.Basement45.getState().hiddenExerciseIds.includes(noteExerciseId));

const exerciseLookup = new Map(interactionApp.Basement45.exercises.map((exercise) => [exercise.id, exercise]));
assert.ok(exerciseLookup.get("cable-y-raise").equipment_varieties.includes("D-handles"));
assert.ok(exerciseLookup.get("kettlebell-swing").equipment_varieties.includes("Kettlebell"));
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

clickAction(interactionApp, "replace", { day: "monday", circuit: "0", position: "bridge" });
interactionApp.document._listeners.change[0]({
  target: {
    id: "show-all-replacements",
    checked: true,
    dataset: {},
    closest() {
      return null;
    },
  },
});
const activatorReplacementHtml = interactionApp.__elements.get("replace-results").innerHTML;
assert.ok(activatorReplacementHtml.includes('data-action="hide-replacement"'));
const activatorReplacementIds = [...activatorReplacementHtml.matchAll(/data-exercise-id="([^"]+)"/g)].map(
  (match) => match[1],
);
assert.ok(activatorReplacementIds.length > 0);
assert.ok(
  activatorReplacementIds.every((exerciseId) => exerciseLookup.get(exerciseId).total_body_activator),
  "even Show all must keep the activator slot limited to checked exercises",
);
const hiddenReplacementId = activatorReplacementIds[0];
clickAction(interactionApp, "hide-replacement", { exerciseId: hiddenReplacementId });
assert.ok(interactionApp.Basement45.getState().hiddenExerciseIds.includes(hiddenReplacementId));
assert.ok(!interactionApp.__elements.get("replace-results").innerHTML.includes(`data-exercise-id="${hiddenReplacementId}"`));
clickAction(interactionApp, "toggle-hide-library", { exerciseId: hiddenReplacementId });
assert.ok(!interactionApp.Basement45.getState().hiddenExerciseIds.includes(hiddenReplacementId));
clickAction(interactionApp, "choose-replacement", { exerciseId: activatorReplacementIds[0] });
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
assert.equal(interactionApp.Basement45.getState().week.days.tuesday.circuits[0].extras.length, 1);
assert.equal(interactionApp.Basement45.getState().week.days.tuesday.circuits[0].extras[0].manualOverride, false);
assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);
const automaticAddReload = launchApp(JSON.stringify(interactionApp.Basement45.getState()));
assert.deepEqual(Array.from(automaticAddReload.Basement45.validateWeek()), []);
clickAction(interactionApp, "remove-round-exercise", { day: "tuesday", circuit: "0" });
assert.equal(interactionApp.Basement45.getState().week.days.tuesday.circuits[0].extras.length, 0);

clickAction(interactionApp, "replace", { day: "tuesday", circuit: "0", position: "first" });
const replacementHtml = interactionApp.__elements.get("replace-results").innerHTML;
assert.ok(replacementHtml.includes('class="replace-option"'));
assert.ok(replacementHtml.includes('data-action="choose-replacement"'));
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
assert.equal(interactionApp.Basement45.getState().week.days.tuesday.circuits[0].first.exerciseId, replacementId);
assert.equal(interactionApp.Basement45.getState().week.days.tuesday.circuits[0].first.manualOverride, true);
assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);
const manualOverrideReload = launchApp(JSON.stringify(interactionApp.Basement45.getState()));
assert.deepEqual(Array.from(manualOverrideReload.Basement45.validateWeek()), []);

const customForm = interactionApp.__elements.get("exercise-form");
customForm._formData = new Map([
  ["name", "Test supported row"],
  ["category", "Back and Lats"],
  ["equipment", "Adjustable dumbbell + bench"],
  ["equipmentVarieties", "Dumbbells\nBench\nD-handles"],
  ["movementPattern", "pull"],
  ["movementRole", "compound"],
  ["forceType", "pull"],
  ["defaultReps", "10"],
  ["instructionUrl", ""],
  ["totalBodyActivator", "on"],
  ["bothSides", "on"],
  ["difficultyScore", "1"],
  ["setupDifficulty", "1"],
  ["effectivenessScore", "5"],
]);
customForm._listeners.submit[0]({ preventDefault() {}, currentTarget: customForm });
assert.equal(interactionApp.Basement45.getState().customExercises.length, 1);
assert.deepEqual(
  Array.from(interactionApp.Basement45.exercises.find((exercise) => exercise.id === "test-supported-row").equipment_varieties),
  ["Bench", "D-handles", "Dumbbells"],
);
assert.equal(
  interactionApp.Basement45.exercises.find((exercise) => exercise.id === "test-supported-row").total_body_activator,
  true,
);
assert.equal(interactionApp.Basement45.exercises.find((exercise) => exercise.id === "test-supported-row").unilateral, true);
assert.equal(
  interactionApp.Basement45.exercises.find((exercise) => exercise.id === "test-supported-row").effectiveness_score,
  5,
);

clickAction(interactionApp, "edit-library", { exerciseId: "flat-dumbbell-bench-press" });
customForm._formData = new Map([
  ["name", "Flat dumbbell bench press — edited"],
  ["category", "Chest"],
  ["equipment", "Adjustable dumbbells + bench"],
  ["equipmentVarieties", "Dumbbells\nBench\nD-handles"],
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
assert.ok(
  interactionApp.Basement45.exercises
    .find((exercise) => exercise.id === "flat-dumbbell-bench-press")
    .equipment_varieties.includes("D-handles"),
);

clickAction(interactionApp, "toggle-hide-library", { exerciseId: "test-supported-row" });
assert.deepEqual(interactionApp.Basement45.getState().hiddenExerciseIds, ["test-supported-row"]);
clickAction(interactionApp, "delete-library", { exerciseId: "test-supported-row" });
assert.deepEqual(interactionApp.Basement45.getState().deletedExerciseIds, ["test-supported-row"]);
const customReloadApp = launchApp(JSON.stringify(interactionApp.Basement45.getState()));
assert.equal(customReloadApp.Basement45.getState().customExercises.length, 1);
assert.deepEqual(customReloadApp.Basement45.getState().deletedExerciseIds, ["test-supported-row"]);
assert.ok(
  customReloadApp.Basement45.exercises
    .find((exercise) => exercise.id === "flat-dumbbell-bench-press")
    .equipment_varieties.includes("D-handles"),
);

interactionApp.document._listeners.click[0]({
  target: {
    dataset: { view: "library" },
    closest(selector) {
      return selector === "[data-view]" ? this : null;
    },
  },
});
interactionApp.document._listeners.change[0]({
  target: {
    id: "library-equipment",
    value: "D-handles",
    dataset: {},
    closest() {
      return null;
    },
  },
});
const dHandleLibraryHtml = interactionApp.__elements.get("library-view").innerHTML;
assert.ok(dHandleLibraryHtml.includes("Cable Y raise"));
assert.ok(!dHandleLibraryHtml.includes("Back extension machine side bend"));
assert.ok(!dHandleLibraryHtml.includes('data-action="toggle-activator-library"'));
const currentLibraryTotal =
  interactionApp.Basement45.exercises.length - interactionApp.Basement45.getState().deletedExerciseIds.length;
assert.ok(
  interactionApp.__elements.get("day-tabs").innerHTML.includes(`${currentLibraryTotal} total exercises`),
  "the library tab should show the current total catalog size",
);
assert.ok(dHandleLibraryHtml.includes(`of <strong>${currentLibraryTotal}</strong> exercises showing`));
assert.ok(!dHandleLibraryHtml.includes("spreadsheet exercises"));
assert.ok(!dHandleLibraryHtml.includes("equipment additions"));
interactionApp.document._listeners.change[0]({
  target: {
    id: "library-sort",
    value: "equipment",
    dataset: {},
    closest() {
      return null;
    },
  },
});
assert.ok(interactionApp.__elements.get("library-view").innerHTML.includes('<option value="equipment" selected>'));
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
assert.equal(
  JSON.parse(directFileContents).exerciseLibrary.find((exercise) => exercise.id === noteExerciseId)
    .recommendation_preference,
  1,
);

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

const preActivatorState = JSON.parse(JSON.stringify(roundTripState));
preActivatorState.version = 5;
preActivatorState.week.days.monday.circuits[0].bridge.exerciseId = "flat-dumbbell-bench-press";
const activatorMigratedApp = launchApp(JSON.stringify(preActivatorState));
const migratedActivatorId = activatorMigratedApp.Basement45.getState().week.days.monday.circuits[0].bridge.exerciseId;
assert.equal(
  activatorMigratedApp.Basement45.exercises.find((exercise) => exercise.id === migratedActivatorId).total_body_activator,
  true,
);
assert.deepEqual(Array.from(activatorMigratedApp.Basement45.validateWeek()), []);

assert.equal(exampleSave.schemaVersion, 7, "the provided example should document its original schema version");
const exampleApp = launchApp(JSON.stringify(exampleSave.appState));
assert.deepEqual(Array.from(exampleApp.Basement45.validateWeek()), []);
assert.equal(exampleApp.Basement45.getState().version, 8);
assert.ok(exampleApp.Basement45.exercises.some((exercise) => exercise.id === "egyptian-raise"));
assert.ok(
  Object.values(exampleApp.Basement45.getState().week.days).every((day) =>
    day.circuits.every((circuit) =>
      [circuit.first, circuit.second, ...circuit.extras, circuit.bridge].every((assignment) =>
        exampleApp.Basement45.exercises.some((exercise) => exercise.id === assignment.exerciseId),
      ),
    ),
  ),
  "every exercise referenced by the example save should resolve in the current catalog",
);

const portableApp = launchApp();
const portableState = portableApp.Basement45.getState();
await portableApp.__elements.get("load-input")._listeners.change[0]({
  target: {
    files: [
      {
        name: "portable-save.json",
        async text() {
          return JSON.stringify({
            app: "Basement 45",
            schemaVersion: 7,
            appState: portableState,
            exerciseLibrary: [
              {
                id: "portable-missing-exercise",
                name: "Portable missing exercise",
                primary_body_part: "Core",
                equipment_label: "Physio ball + body weight",
                equipment_varieties: ["Physio ball", "Body weight"],
                movement_pattern: "isometric",
                movement_role: "bridge",
                force_type: "isometric",
                default_reps: "30 sec",
                unilateral: false,
                difficulty_score: 2,
                setup_difficulty: 1,
                effectiveness_score: 4,
              },
            ],
          });
        },
      },
    ],
  },
});
assert.ok(portableApp.Basement45.exercises.some((exercise) => exercise.id === "portable-missing-exercise"));

console.log(
  "Smoke test passed randomized starts, 140 generated weeks, example/portable JSON migration, favorites, exercise scoring, equipment varieties, recommendation feedback, activator eligibility, direct-file save, editing, settings, and v1-v8 persistence.",
);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
