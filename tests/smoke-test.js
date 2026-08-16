"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const exerciseDataScript = fs.readFileSync(path.join(root, "exercise-data.js"), "utf8");
const equipmentExerciseDataScript = fs.readFileSync(path.join(root, "equipment-exercises.js"), "utf8");
const appScript = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
    setAttribute(name, value) {
      this[name] = String(value);
    },
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

function changeAssignmentSetup(app, dataset, value) {
  const target = {
    value,
    dataset: { assignmentSetting: "setupScore", ...dataset },
  };
  app.document._listeners.change[0]({ target });
}

function changeExerciseEffectiveness(app, exerciseId, value) {
  const target = {
    value,
    dataset: { exerciseSetting: "effectivenessScore", exerciseId },
  };
  app.document._listeners.change[0]({ target });
}

function changeDayTarget(app, day, target) {
  app.document._listeners.change[0]({
    target: {
      value: target,
      dataset: { daySetting: "target", day },
      closest() {
        return null;
      },
    },
  });
}

function selectView(app, view) {
  const target = {
    dataset: { view },
    closest(selector) {
      return selector === "[data-view]" ? this : null;
    },
  };
  app.document._listeners.click[0]({ target });
}

function expectedDefaultSetup(exercise) {
  const equipmentLabel = String(exercise.equipment_label || "").toLowerCase();
  const onlyBodyWeight =
    exercise.equipment_varieties.length > 0 &&
    exercise.equipment_varieties.every((item) => item.toLowerCase() === "body weight");
  return onlyBodyWeight || equipmentLabel.includes("body weight or") || equipmentLabel.includes("bodyweight or") ? 5 : 4;
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
  assert.ok(
    catalog.every(
      (exercise) => exercise.always_locked || exercise.instruction_url || exercise.id.startsWith("pt-exercise-"),
    ),
  );
  assert.ok(catalog.every((exercise) => exercise.effectiveness_score >= 1 && exercise.effectiveness_score <= 5));
  assert.ok(catalog.every((exercise) => !("difficulty_score" in exercise) && !("setup_difficulty" in exercise)));
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
  assert.deepEqual(
    Array.from(Object.values(state.daySettings), (settings) => settings.target),
    ["arms_upper", "legs", "shoulders_rotator", "push", "pull", "total_body", "total_body"],
  );

  const assignments = days.flatMap((day) =>
    day.circuits.flatMap((circuit) => [circuit.first, circuit.second, ...circuit.extras]),
  );
  assert.ok(assignments.length >= 42 && assignments.length <= 84);
  assert.equal(new Set(assignments.map((assignment) => assignment.exerciseId)).size, assignments.length);
  assert.ok(days.every((day) => day.circuits.every((circuit) => !("bridge" in circuit))));
  assert.ok(
    days.every((day) =>
      day.circuits.every(
        (circuit) =>
          circuit.optionalActivator &&
          catalogById.get(circuit.optionalActivator.exerciseId)?.total_body_activator,
      ),
    ),
    "each circuit should have one eligible optional activator stored outside its round exercises",
  );
  assert.ok(
    days.every((day) =>
      day.circuits.every(
        (circuit) => ![circuit.first, circuit.second, ...circuit.extras].some(
          (assignment) => assignment.exerciseId === circuit.optionalActivator.exerciseId,
        ),
      ),
    ),
  );
  assert.ok(days.every((day) => day.timer.durationMs === 45 * 60 * 1000 && day.timer.elapsedMs === 0 && day.timer.startedAt === null));
  assert.ok(
    assignments.every(
      (assignment) =>
        assignment.setupScore === expectedDefaultSetup(catalogById.get(assignment.exerciseId)),
    ),
    "generated assignments should default setup to 5 without equipment and 4 with equipment",
  );
  assert.deepEqual(
    [...new Set(days.flatMap((day) => day.circuits.map((circuit) => 2 + circuit.extras.length)))].sort(),
    [2, 3, 4],
    "the generated week should mix focused, standard, and challenge circuits",
  );

  const chosenCount = Object.values(state.exerciseState).reduce((sum, item) => sum + item.chosenCount, 0);
  assert.equal(chosenCount, assignments.length, "each generated exercise should be counted once");

  assert.ok([1, 2, 3].every((number) => catalogById.get(`pt-exercise-${number}`).always_locked === false));
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
assert.ok(html.includes("Not connected · basement-45-workouts.json"));
assert.equal(interactionApp.__elements.get("timer-display").textContent, "45:00");
assert.ok(html.includes('data-action="adjust-workout-timer"'));
clickAction(interactionApp, "toggle-workout-timer");
assert.equal(interactionApp.Basement45.getState().week.days.monday.timer.startedAt, null);
assert.equal((workoutHtml.match(/data-action="complete-round"/g) || []).length, 9);
assert.equal((workoutHtml.match(/data-action="toggle-optional-activator-pane"/g) || []).length, 3);
assert.equal((workoutHtml.match(/data-action="complete-optional-activator"/g) || []).length, 0);
assert.equal((workoutHtml.match(/data-action="complete-bridge"/g) || []).length, 0);
assert.equal((workoutHtml.match(/Total Body activator/g) || []).length, 0);
assert.ok(!workoutHtml.includes("Between rounds"));
assert.equal((workoutHtml.match(/data-action="daily-check"/g) || []).length, 3);
assert.equal((workoutHtml.match(/data-action="core-check"/g) || []).length, 1);
assert.equal((workoutHtml.match(/data-action="cardio-check"/g) || []).length, 0);
assert.ok(!workoutHtml.includes("20 minutes cardio"));
assert.ok((workoutHtml.match(/data-action="random-replace"/g) || []).length > 0);
assert.ok((workoutHtml.match(/class="exercise-note"/g) || []).length > 0);
assert.ok((workoutHtml.match(/class="equipment-needed"/g) || []).length > 0);
assert.ok((workoutHtml.match(/data-action="set-preference"/g) || []).length > 0);
assert.ok((workoutHtml.match(/data-action="toggle-hide-workout"/g) || []).length > 0);
assert.ok((workoutHtml.match(/data-action="edit-workout-exercise"/g) || []).length > 0);
assert.ok((workoutHtml.match(/data-action="toggle-favorite-circuit"/g) || []).length === 3);
assert.ok((workoutHtml.match(/class="exercise-score-row"/g) || []).length > 0);
assert.equal((workoutHtml.match(/class="circuit-total-score"/g) || []).length, 3);
assert.ok((workoutHtml.match(/data-assignment-setting="setupScore"/g) || []).length > 0);
assert.ok((workoutHtml.match(/data-exercise-setting="effectivenessScore"/g) || []).length > 0);
assert.equal(
  (workoutHtml.match(/class="exercise-divider"/g) || []).length,
  (workoutHtml.match(/class="exercise-item/g) || []).length - 3,
  "each circuit should render an HR only between its exercises",
);
assert.ok((workoutHtml.match(/class="load-progress-mark /g) || []).length > 0);
assert.ok(!workoutHtml.includes("transition-divider"));
assert.ok(!html.includes('name="difficultyScore"'));
assert.ok(!html.includes('name="setupDifficulty"'));
assert.ok(!workoutHtml.includes(">Neutral<"));
assert.ok(
  workoutHtml.indexOf('class="round-checks"') < workoutHtml.indexOf('class="exercise-cycle"'),
  "the sticky round controls should come before the cycle exercises",
);
assert.ok(!workoutHtml.includes("circuit-sticky-progress"));
assert.match(styles, /\.sidebar\s*{[^}]*position:\s*sticky/s);
assert.match(styles, /\.circuit-grid\s*{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s);
assert.match(styles, /\.round-checks\s*{[^}]*position:\s*sticky/s);
assert.match(styles, /\.pre-routine:not\(\.is-complete\)\s*{[^}]*position:\s*sticky/s);
assert.match(styles, /\.round-checks\s*{[^}]*background:\s*rgb\(215 222 217/s);
assert.match(styles, /\.round-check\.is-overdue:not\(:has\(input:checked\)\)/);
assert.match(styles, /\.compact-field\.has-recommended-weight/);
assert.match(styles, /\.exercise-score-row\s*{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s);
assert.match(styles, /\.exercise-total-score\s*{[^}]*background:\s*#e8f3ee/s);
assert.match(styles, /\.replace-option\s*{[^}]*min-height:\s*76px/s);

clickAction(interactionApp, "toggle-optional-activator-pane", { day: "monday", circuit: "0" });
const expandedActivatorHtml = interactionApp.__elements.get("workout-view").innerHTML;
assert.equal((expandedActivatorHtml.match(/class="optional-activator-content"/g) || []).length, 1);
assert.equal((expandedActivatorHtml.match(/class="exercise-item activator-item/g) || []).length, 1);
assert.equal((expandedActivatorHtml.match(/data-action="complete-optional-activator"/g) || []).length, 1);
assert.ok(expandedActivatorHtml.includes("Independent of circuit score"));
changeAction(interactionApp, "complete-optional-activator", { day: "monday", circuit: "0" }, true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.circuits[0].optionalActivatorCompleted, true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.circuits[0].roundsCompleted.every(Boolean), false);
assert.ok(interactionApp.__elements.get("workout-view").innerHTML.includes("optional-activator-panel is-complete is-expanded"));

changeAssignmentSetup(
  interactionApp,
  { day: "monday", circuit: "0", position: "first" },
  "4",
);
const scoredCircuit = interactionApp.Basement45.getState().week.days.monday.circuits[0];
assert.equal(scoredCircuit.first.setupScore, 4);
const scoredExerciseId = scoredCircuit.first.exerciseId;
const priorEffectiveness = interactionApp.Basement45.exercises.find(
  (exercise) => exercise.id === scoredExerciseId,
).effectiveness_score;
const updatedEffectiveness = priorEffectiveness === 5 ? 4 : 5;
changeExerciseEffectiveness(interactionApp, scoredExerciseId, String(updatedEffectiveness));
assert.equal(
  interactionApp.Basement45.exercises.find((exercise) => exercise.id === scoredExerciseId).effectiveness_score,
  updatedEffectiveness,
  "effectiveness should be editable directly on a workout card",
);
assert.equal(interactionApp.Basement45.getState().exerciseEdits[scoredExerciseId].effectivenessScore, updatedEffectiveness);
const expectedCircuitScore = [scoredCircuit.first, scoredCircuit.second, ...scoredCircuit.extras].reduce(
  (total, assignment) =>
    total +
    interactionApp.Basement45.exercises.find((exercise) => exercise.id === assignment.exerciseId).effectiveness_score +
    (assignment.setupScore || 0),
  0,
);
assert.ok(interactionApp.__elements.get("workout-view").innerHTML.includes(`Total score ${expectedCircuitScore}`));

const favoriteOriginalIds = [
  interactionApp.Basement45.getState().week.days.monday.circuits[0].first.exerciseId,
  interactionApp.Basement45.getState().week.days.monday.circuits[0].second.exerciseId,
  ...interactionApp.Basement45.getState().week.days.monday.circuits[0].extras.map(
    (assignment) => assignment.exerciseId,
  ),
];
clickAction(interactionApp, "toggle-favorite-circuit", { day: "monday", circuit: "0" });
const favoriteId = interactionApp.Basement45.getState().favoriteCircuits[0].id;
assert.ok(favoriteId);
assert.equal(interactionApp.Basement45.getState().favoriteCircuits[0].name, "Test favorite circuit");
assert.equal(interactionApp.Basement45.getState().favoriteCircuits[0].assignments[0].setupScore, 4);
clickAction(interactionApp, "delete-circuit-exercise", { day: "monday", circuit: "0", position: "extra-0" });
assert.ok(
  [
    interactionApp.Basement45.getState().week.days.monday.circuits[0].first,
    interactionApp.Basement45.getState().week.days.monday.circuits[0].second,
    ...interactionApp.Basement45.getState().week.days.monday.circuits[0].extras,
  ].every(
    (assignment) =>
      assignment.setupScore ===
      expectedDefaultSetup(interactionApp.Basement45.exercises.find((exercise) => exercise.id === assignment.exerciseId)),
  ),
  "changing circuit composition should restore contextual setup defaults",
);
clickAction(interactionApp, "open-favorite-circuits", { day: "monday", circuit: "0" });
assert.ok(interactionApp.__elements.get("favorite-results").innerHTML.includes("Use circuit"));
assert.ok(interactionApp.__elements.get("favorite-results").innerHTML.includes(`Total score ${expectedCircuitScore}`));
clickAction(interactionApp, "apply-favorite-circuit", { favoriteId });
const favoriteRestoredCircuit = interactionApp.Basement45.getState().week.days.monday.circuits[0];
assert.deepEqual(
  [
    favoriteRestoredCircuit.first.exerciseId,
    favoriteRestoredCircuit.second.exerciseId,
    ...favoriteRestoredCircuit.extras.map((assignment) => assignment.exerciseId),
  ],
  favoriteOriginalIds,
);
assert.equal(favoriteRestoredCircuit.first.setupScore, 4, "favorites should restore per-circuit setup scores");
assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);
changeAction(interactionApp, "complete-round", { day: "monday", circuit: "0", round: "0" }, true);
changeAction(interactionApp, "daily-check", { day: "monday", item: "stretch" }, true);
changeAction(interactionApp, "core-check", { day: "monday" }, true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.circuits[0].roundsCompleted[0], true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.preChecklist.stretch, true);
assert.equal(interactionApp.Basement45.getState().week.days.monday.coreCompleted, true);
assert.ok(
  interactionApp.__elements.get("workout-view").innerHTML.includes("core-routine is-complete"),
  "the finisher should complete as soon as its core checkbox is checked",
);
changeAction(interactionApp, "daily-check", { day: "monday", item: "pushups" }, true);
changeAction(interactionApp, "daily-check", { day: "monday", item: "pullups" }, true);
assert.ok(
  interactionApp.__elements.get("workout-view").innerHTML.includes("pre-routine is-complete"),
  "the Before Circuits pane should immediately complete after its final checkbox",
);
clickAction(interactionApp, "toggle-workout-timer");
assert.ok(interactionApp.Basement45.getState().week.days.monday.timer.startedAt);
clickAction(interactionApp, "toggle-workout-timer");
assert.equal(interactionApp.Basement45.getState().week.days.monday.timer.startedAt, null);
clickAction(interactionApp, "adjust-workout-timer", { minutes: "5" });
assert.equal(interactionApp.Basement45.getState().week.days.monday.timer.durationMs, 50 * 60 * 1000);
clickAction(interactionApp, "toggle-workout-timer");
clickAction(interactionApp, "adjust-workout-timer", { minutes: "5" });
assert.equal(
  interactionApp.Basement45.getState().week.days.monday.timer.durationMs,
  50 * 60 * 1000,
  "a running timer should have to be paused before adjustment",
);
clickAction(interactionApp, "toggle-workout-timer");
clickAction(interactionApp, "reset-workout-timer");
assert.deepEqual(
  interactionApp.Basement45.getState().week.days.monday.timer,
  { durationMs: 50 * 60 * 1000, elapsedMs: 0, startedAt: null },
  "reset should preserve the selected duration",
);
assert.equal(interactionApp.__elements.get("timer-display").textContent, "50:00");
changeAction(interactionApp, "complete-round", { day: "monday", circuit: "0", round: "1" }, true);
changeAction(interactionApp, "complete-round", { day: "monday", circuit: "0", round: "2" }, true);
assert.ok(
  interactionApp.__elements.get("workout-view").innerHTML.includes('class="circuit-card is-complete"'),
  "a circuit should receive the completed-pane class once all three rounds are done",
);
for (const assignment of [
  interactionApp.Basement45.getState().week.days.monday.circuits[0].first,
  interactionApp.Basement45.getState().week.days.monday.circuits[0].second,
  ...interactionApp.Basement45.getState().week.days.monday.circuits[0].extras,
]) {
  assert.equal(interactionApp.Basement45.getState().exerciseState[assignment.exerciseId].loadProgressCount, 1);
}

const noteExerciseId = interactionApp.Basement45.getState().week.days.monday.circuits[0].first.exerciseId;
clickAction(interactionApp, "edit-workout-exercise", { exerciseId: noteExerciseId });
assert.ok(interactionApp.__elements.get("exercise-dialog-title").textContent.startsWith("Edit "));
clickAction(interactionApp, "close-exercise-dialog");
inputSetting(interactionApp, { setting: "notes", exerciseId: noteExerciseId }, "Keep the tempo controlled");
inputSetting(interactionApp, { setting: "measureType", exerciseId: noteExerciseId }, "seconds");
inputSetting(interactionApp, { setting: "weight", exerciseId: noteExerciseId }, "25");
assert.equal(interactionApp.Basement45.getState().exerciseState[noteExerciseId].notes, "Keep the tempo controlled");
assert.equal(interactionApp.Basement45.getState().exerciseState[noteExerciseId].measureType, "seconds");
assert.equal(interactionApp.Basement45.getState().exerciseState[noteExerciseId].weight, "25");
clickAction(interactionApp, "set-preference", { exerciseId: noteExerciseId, value: "1" });
assert.equal(interactionApp.Basement45.getState().exerciseState[noteExerciseId].preference, 1);
assert.ok(interactionApp.__elements.get("workout-view").innerHTML.includes('class="feedback-button active"'));
assert.ok(interactionApp.__elements.get("workout-view").innerHTML.includes("has-recommended-weight"));
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

clickAction(interactionApp, "replace", { day: "tuesday", circuit: "1", position: "first" });
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
const hideableReplacementHtml = interactionApp.__elements.get("replace-results").innerHTML;
assert.ok(hideableReplacementHtml.includes('data-action="hide-replacement"'));
const hideableReplacementIds = [...hideableReplacementHtml.matchAll(/data-exercise-id="([^"]+)"/g)].map(
  (match) => match[1],
);
assert.ok(hideableReplacementIds.length > 0);
const hiddenReplacementId = hideableReplacementIds[0];
clickAction(interactionApp, "hide-replacement", { exerciseId: hiddenReplacementId });
assert.ok(interactionApp.Basement45.getState().hiddenExerciseIds.includes(hiddenReplacementId));
assert.ok(!interactionApp.__elements.get("replace-results").innerHTML.includes(`data-exercise-id="${hiddenReplacementId}"`));
clickAction(interactionApp, "toggle-hide-library", { exerciseId: hiddenReplacementId });
assert.ok(!interactionApp.Basement45.getState().hiddenExerciseIds.includes(hiddenReplacementId));
clickAction(interactionApp, "choose-replacement", { exerciseId: hideableReplacementIds[0] });
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

selectView(interactionApp, "settings");
const settingsHtml = interactionApp.__elements.get("settings-view").innerHTML;
for (const label of ["Arms &amp; upper", "Legs", "Shoulder &amp; Rotator cuff", "Push", "Pull", "Total Body"]) {
  assert.ok(settingsHtml.includes(`>${label}</option>`), `settings should include the ${label} target`);
}
const mondayIdsBeforeTargetChange = interactionApp.Basement45.getState().week.days.monday.circuits.flatMap(
  (circuit) => [circuit.first.exerciseId, circuit.second.exerciseId, ...circuit.extras.map((assignment) => assignment.exerciseId)],
);
changeDayTarget(interactionApp, "monday", "total_body");
const targetedState = interactionApp.Basement45.getState();
assert.equal(targetedState.daySettings.monday.target, "total_body");
assert.equal(targetedState.week.days.monday.target, "total_body");
const targetedMondayAssignments = targetedState.week.days.monday.circuits.flatMap(
  (circuit) => [circuit.first, circuit.second, ...circuit.extras],
);
assert.notDeepEqual(
  targetedMondayAssignments.map((assignment) => assignment.exerciseId),
  mondayIdsBeforeTargetChange,
  "changing a target should immediately rebuild that day",
);
assert.ok(
  targetedMondayAssignments.every((assignment) => {
    const exercise = interactionApp.Basement45.exercises.find((item) => item.id === assignment.exerciseId);
    return (
      exercise.total_body_activator ||
      exercise.movement_role === "total_body" ||
      (exercise.movement_role === "compound" && exercise.force_type !== "other")
    );
  }),
  "a Total Body day should only contain exercises from the Total Body qualification pool",
);
assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);
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
changeDayTarget(interactionApp, "saturday", "legs");
assert.equal(interactionApp.Basement45.getState().daySettings.saturday.target, "legs");
assert.equal(interactionApp.Basement45.getState().week.days.saturday.target, "legs");
assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);
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
assert.ok(interactionApp.__elements.get("file-status").textContent.includes("workouts.json"));
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
          (circuit) =>
            circuit.roundsCompleted.every((round) => !round) &&
            !circuit.optionalActivatorCompleted &&
            Boolean(circuit.optionalActivator) &&
            !circuit.completionCredited,
        ),
      ),
      "a new week should have blank round checkmarks",
    );
    assert.deepEqual(Array.from(multiWeekApp.Basement45.validateWeek()), []);
  }
  roundTripState = multiWeekApp.Basement45.getState();
}

const reloadedApp = launchApp(JSON.stringify(roundTripState));
assert.deepEqual(Array.from(reloadedApp.Basement45.validateWeek()), []);
assert.equal(reloadedApp.Basement45.getState().weekNumber, 15, "local JSON state should survive a reload");

const overdueState = JSON.parse(JSON.stringify(roundTripState));
overdueState.week.days.monday.preChecklist = { stretch: true, pushups: true, pullups: true };
overdueState.week.days.monday.timer = { durationMs: 45 * 60 * 1000, elapsedMs: 5 * 60 * 1000, startedAt: null };
const overdueApp = launchApp(JSON.stringify(overdueState));
assert.equal(overdueApp.__elements.get("timer-toggle").textContent, "Resume");
assert.equal(
  (overdueApp.__elements.get("workout-view").innerHTML.match(/class="round-check is-overdue"/g) || []).length,
  1,
  "only the first unchecked round should be overdue at the five-minute deadline",
);

const scaledDeadlineState = JSON.parse(JSON.stringify(overdueState));
scaledDeadlineState.week.days.monday.timer = {
  durationMs: 90 * 60 * 1000,
  elapsedMs: 5 * 60 * 1000,
  startedAt: null,
};
const scaledDeadlineApp = launchApp(JSON.stringify(scaledDeadlineState));
assert.equal(
  (scaledDeadlineApp.__elements.get("workout-view").innerHTML.match(/class="round-check is-overdue"/g) || []).length,
  0,
  "round deadlines should scale when more workout time is added",
);

const timerApp = launchApp();
for (const item of ["stretch", "pushups", "pullups"]) {
  changeAction(timerApp, "daily-check", { day: "monday", item }, true);
}
clickAction(timerApp, "toggle-workout-timer");
assert.ok(timerApp.Basement45.getState().week.days.monday.timer.startedAt);
for (let circuit = 0; circuit < 3; circuit += 1) {
  for (let round = 0; round < 3; round += 1) {
    changeAction(timerApp, "complete-round", { day: "monday", circuit: String(circuit), round: String(round) }, true);
  }
}
assert.equal(timerApp.Basement45.getState().week.days.monday.timer.startedAt, null);
assert.ok(timerApp.__elements.get("workout-view").innerHTML.includes("3 of 3 circuits complete"));

const loadProgressState = timerApp.Basement45.getState();
const progressedExerciseId = loadProgressState.week.days.monday.circuits[0].first.exerciseId;
loadProgressState.exerciseState[progressedExerciseId].weight = "25";
loadProgressState.exerciseState[progressedExerciseId].loadProgressCount = 4;
const loadProgressApp = launchApp(JSON.stringify(loadProgressState));
assert.ok(loadProgressApp.__elements.get("workout-view").innerHTML.includes('data-action="increase-load"'));
assert.equal((loadProgressApp.__elements.get("workout-view").innerHTML.match(/load-progress-mark is-complete/g) || []).length >= 4, true);
loadProgressApp.prompt = () => "30";
clickAction(loadProgressApp, "increase-load", { exerciseId: progressedExerciseId });
assert.equal(loadProgressApp.Basement45.getState().exerciseState[progressedExerciseId].weight, "30");
assert.equal(loadProgressApp.Basement45.getState().exerciseState[progressedExerciseId].loadProgressCount, 0);
assert.ok(!loadProgressApp.__elements.get("workout-view").innerHTML.includes('data-action="increase-load"'));

const legacyState = JSON.parse(JSON.stringify(roundTripState));
legacyState.version = 1;
for (const day of Object.values(legacyState.week.days)) {
  for (const circuit of day.circuits) {
    circuit.extras = undefined;
    circuit.preferredExerciseCount = undefined;
    circuit.completed = false;
    circuit.roundsCompleted = undefined;
    circuit.optionalActivatorCompleted = undefined;
    circuit.completionCredited = undefined;
  }
}
legacyState.week.days.monday.circuits[0].completed = true;
const migratedApp = launchApp(JSON.stringify(legacyState));
assert.deepEqual(Array.from(migratedApp.Basement45.validateWeek()), []);
const migratedCircuit = migratedApp.Basement45.getState().week.days.monday.circuits[0];
assert.deepEqual(migratedCircuit.roundsCompleted, [true, true, true]);
assert.equal("bridge" in migratedCircuit, false);

const fiveDayState = JSON.parse(JSON.stringify(roundTripState));
fiveDayState.version = 3;
delete fiveDayState.week.days.saturday;
delete fiveDayState.week.days.sunday;
delete fiveDayState.daySettings.saturday;
delete fiveDayState.daySettings.sunday;
const weekendMigratedApp = launchApp(JSON.stringify(fiveDayState));
assert.deepEqual(Array.from(weekendMigratedApp.Basement45.validateWeek()), []);
assert.equal(weekendMigratedApp.Basement45.getState().weekNumber, fiveDayState.weekNumber);
assert.equal(weekendMigratedApp.Basement45.getState().week.days.saturday.circuits.length, 3);
assert.equal(weekendMigratedApp.Basement45.getState().week.days.sunday.circuits.length, 3);
assert.equal(weekendMigratedApp.Basement45.getState().daySettings.saturday.enabled, false);
assert.equal(weekendMigratedApp.Basement45.getState().daySettings.sunday.enabled, false);

const preActivatorState = JSON.parse(JSON.stringify(roundTripState));
preActivatorState.version = 5;
preActivatorState.week.days.monday.circuits[0].bridge = {
  exerciseId: "flat-dumbbell-bench-press",
  slotLabel: "Between rounds",
};
preActivatorState.week.days.monday.circuits[0].bridgeCompleted = true;
const activatorMigratedApp = launchApp(JSON.stringify(preActivatorState));
assert.equal("bridge" in activatorMigratedApp.Basement45.getState().week.days.monday.circuits[0], false);
assert.equal("bridgeCompleted" in activatorMigratedApp.Basement45.getState().week.days.monday.circuits[0], false);
assert.ok(
  activatorMigratedApp.Basement45.exercises.find(
    (exercise) =>
      exercise.id === activatorMigratedApp.Basement45.getState().week.days.monday.circuits[0].optionalActivator.exerciseId,
  ).total_body_activator,
);
assert.deepEqual(Array.from(activatorMigratedApp.Basement45.validateWeek()), []);

assert.equal(exampleSave.schemaVersion, 7, "the provided example should document its original schema version");
const exampleApp = launchApp(JSON.stringify(exampleSave.appState));
assert.deepEqual(Array.from(exampleApp.Basement45.validateWeek()), []);
assert.equal(exampleApp.Basement45.getState().version, 14);
assert.deepEqual(
  Array.from(Object.values(exampleApp.Basement45.getState().daySettings), (settings) => settings.target),
  ["arms_upper", "legs", "shoulders_rotator", "push", "pull", "total_body", "total_body"],
);
assert.ok(exampleApp.Basement45.exercises.some((exercise) => exercise.id === "egyptian-raise"));
assert.ok(
  Object.values(exampleApp.Basement45.getState().week.days).every(
    (day) =>
      !("cardioCompleted" in day) &&
      day.circuits.every(
        (circuit) =>
          typeof circuit.optionalActivatorCompleted === "boolean" &&
          Boolean(circuit.optionalActivator) &&
          typeof circuit.completionCredited === "boolean" &&
          [circuit.first, circuit.second, ...circuit.extras].every(
            (assignment) => assignment.setupScore === 4 || assignment.setupScore === 5,
          ),
      ),
  ),
  "older saves should migrate away from cardio and initialize per-circuit setup defaults",
);
assert.ok(
  Object.values(exampleApp.Basement45.getState().week.days).every((day) =>
    day.circuits.every((circuit) =>
      [circuit.first, circuit.second, ...circuit.extras].every((assignment) =>
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
  "Smoke test passed randomized starts, 140 generated weeks, target-driven generation, example/portable JSON migration, favorites with circuit setup scores, effectiveness scoring, expandable optional activators, load progression, equipment varieties, recommendation feedback, adjustable workout timing, direct-file save, editing, settings, and v1-v14 persistence.",
);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
