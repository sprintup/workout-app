"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const exerciseDataScript = fs.readFileSync(
  path.join(root, "exercise-data.js"),
  "utf8",
);
const equipmentExerciseDataScript = fs.readFileSync(
  path.join(root, "equipment-exercises.js"),
  "utf8",
);
const appScript = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const exampleSave = JSON.parse(
  fs.readFileSync(path.join(root, "basement-45-workouts.json"), "utf8"),
);

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
  vm.runInContext(exerciseDataScript, context, {
    filename: "exercise-data.js",
  });
  vm.runInContext(equipmentExerciseDataScript, context, {
    filename: "equipment-exercises.js",
  });
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
  const cycleId = app.Basement45.getState().week.days[day].cycleId;
  app.document._listeners.change[0]({
    target: {
      value: target,
      dataset: { cycleSetting: "target", cycleId },
      closest() {
        return null;
      },
    },
  });
}

function changeDayCycle(app, day, cycleId) {
  app.document._listeners.change[0]({
    target: {
      value: cycleId,
      dataset: { dayCycleSelect: "true", day },
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
    exercise.equipment_varieties.every(
      (item) => item.toLowerCase() === "body weight",
    );
  return onlyBodyWeight ||
    equipmentLabel.includes("body weight or") ||
    equipmentLabel.includes("bodyweight or")
    ? 5
    : 4;
}

function inputSetting(app, dataset, value) {
  app.document._listeners.input[0]({
    target: { dataset, value, id: "" },
  });
}

async function main() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const app = launchApp();
    assert.equal(
      app.EXERCISE_SOURCE.length,
      201,
      "all spreadsheet exercises should be imported",
    );
    assert.ok(
      app.Basement45.exercises.length > 300,
      "the equipment expansion should add a comprehensive catalog",
    );
    assert.deepEqual(
      Array.from(app.Basement45.validateWeek()),
      [],
      "generated week should pass every validation",
    );

    const state = app.Basement45.getState();
    const catalog = app.Basement45.exercises;
    const catalogById = new Map(
      catalog.map((exercise) => [exercise.id, exercise]),
    );
    assert.equal(
      new Set(catalog.map((exercise) => exercise.id)).size,
      catalog.length,
      "catalog IDs should be unique",
    );
    assert.ok(
      catalog.every((exercise) => exercise.equipment_varieties.length > 0),
    );
    assert.ok(state.equipmentCatalog.includes("FT"));
    assert.equal(
      new Set(
        state.equipmentCatalog.map((equipment) => equipment.toLowerCase()),
      ).size,
      state.equipmentCatalog.length,
      "the master equipment list should not contain duplicate names",
    );
    assert.ok(
      catalog.every((exercise) => exercise.body_parts.length > 0),
      "every exercise should list its worked body parts",
    );
    assert.ok(
      catalog.every(
        (exercise) =>
          exercise.always_locked ||
          exercise.instruction_url ||
          exercise.id.startsWith("pt-exercise-"),
      ),
    );
    assert.ok(
      catalog.every(
        (exercise) =>
          exercise.effectiveness_score >= 1 &&
          exercise.effectiveness_score <= 5,
      ),
    );
    assert.ok(
      catalog.every(
        (exercise) =>
          !("difficulty_score" in exercise) &&
          !("setup_difficulty" in exercise),
      ),
    );
    assert.ok(
      catalog.filter((exercise) =>
        exercise.equipment_varieties.includes("Physio ball"),
      ).length >= 7,
      "the available equipment catalog should include the physio-ball exercise set",
    );
    assert.equal(
      catalog.find((exercise) => exercise.id === "kettlebell-swing").custom,
      false,
    );
    const days = Object.values(state.week.days);
    assert.equal(days.length, 7);
    assert.ok(days.every((day) => day.circuits.length === 3));
    assert.equal(state.cycles.length, 4);
    assert.equal(state.weekStartCycleId, state.cycles[0].id);
    assert.equal(state.nextCycleId, state.cycles[3].id);
    assert.deepEqual({ ...state.week.cycleOverrides }, {});
    assert.ok(
      Object.values(state.week.days).every((day) => day.rest === false),
    );
    assert.ok(
      state.cycles.every(
        (cycle) =>
          Array.isArray(cycle.bodyParts) && cycle.bodyParts.length === 0,
      ),
    );
    assert.ok(
      Object.values(state.exerciseState).every(
        (settings) => settings.loadBasis === "total",
      ),
    );
    assert.deepEqual(
      Array.from(state.cycles, (cycle) => cycle.target),
      ["legs", "shoulders_rotator", "push", "pull"],
    );
    assert.deepEqual(
      Array.from(Object.values(state.week.days), (day) => day.cycleId),
      [
        state.cycles[0].id,
        state.cycles[1].id,
        state.cycles[2].id,
        state.cycles[3].id,
        state.cycles[0].id,
        state.cycles[1].id,
        state.cycles[2].id,
      ],
    );

    const assignments = days.flatMap((day) =>
      day.circuits.flatMap((circuit) => [
        circuit.first,
        circuit.second,
        ...circuit.extras,
      ]),
    );
    assert.ok(assignments.length >= 42 && assignments.length <= 84);
    const strictlyUniqueAssignments = assignments.filter(
      (assignment) => !assignment.cycleLock && !assignment.rotationRepeat,
    );
    assert.equal(
      new Set(
        strictlyUniqueAssignments.map((assignment) => assignment.exerciseId),
      ).size,
      strictlyUniqueAssignments.length,
    );
    assert.ok(
      days.every((day) =>
        day.circuits.every((circuit) => !("bridge" in circuit)),
      ),
    );
    assert.ok(
      days.every((day) =>
        day.circuits.every(
          (circuit) =>
            circuit.optionalActivator &&
            catalogById.get(circuit.optionalActivator.exerciseId)
              ?.total_body_activator,
        ),
      ),
      "each circuit should have one eligible optional activator stored outside its round exercises",
    );
    assert.ok(
      days.every((day) =>
        day.circuits.every(
          (circuit) =>
            ![circuit.first, circuit.second, ...circuit.extras].some(
              (assignment) =>
                assignment.exerciseId === circuit.optionalActivator.exerciseId,
            ),
        ),
      ),
    );
    assert.ok(
      days.every(
        (day) =>
          day.timer.durationMs === 45 * 60 * 1000 &&
          day.timer.elapsedMs === 0 &&
          day.timer.startedAt === null,
      ),
    );
    assert.ok(
      assignments.every(
        (assignment) =>
          assignment.setupScore ===
          expectedDefaultSetup(catalogById.get(assignment.exerciseId)),
      ),
      "generated assignments should default setup to 5 without equipment and 4 with equipment",
    );
    assert.deepEqual(
      [
        ...new Set(
          days.flatMap((day) =>
            day.circuits.map((circuit) => 2 + circuit.extras.length),
          ),
        ),
      ].sort(),
      [2, 3, 4],
      "the generated week should mix focused, standard, and challenge circuits",
    );

    const chosenCount = Object.values(state.exerciseState).reduce(
      (sum, item) => sum + item.chosenCount,
      0,
    );
    assert.equal(
      chosenCount,
      assignments.length,
      "each generated exercise should be counted once",
    );

    assert.ok(
      [1, 2, 3].every(
        (number) =>
          catalogById.get(`pt-exercise-${number}`).always_locked === false,
      ),
    );
    assert.ok(
      state.week.days.tuesday.circuits.some(
        (circuit) =>
          circuit.first.exerciseId === "shoulder-exercise-placeholder" ||
          circuit.second.exerciseId === "shoulder-exercise-placeholder",
      ),
    );
  }

  const cycleLockApp = launchApp();
  const cycleLockState = cycleLockApp.Basement45.getState();
  assert.equal(
    cycleLockState.week.days.monday.cycleId,
    cycleLockState.week.days.friday.cycleId,
  );
  const lockedExerciseId =
    cycleLockState.week.days.monday.circuits[0].first.exerciseId;
  assert.notEqual(
    lockedExerciseId,
    cycleLockState.week.days.friday.circuits[0].first.exerciseId,
    "unlocked positions should be freshly generated for repeated cycle occurrences",
  );
  clickAction(cycleLockApp, "toggle-lock", {
    day: "monday",
    circuit: "0",
    position: "first",
  });
  const afterCycleLock = cycleLockApp.Basement45.getState();
  assert.equal(
    afterCycleLock.week.days.friday.circuits[0].first.exerciseId,
    lockedExerciseId,
    "locking an exercise should propagate it to a later occurrence of that cycle",
  );
  assert.ok(
    afterCycleLock.cycles[0].lockedAssignments.some(
      (lock) =>
        lock.circuitIndex === 0 &&
        lock.position === "first" &&
        lock.assignment.exerciseId === lockedExerciseId,
    ),
  );
  const expectedNextCycleId = afterCycleLock.nextCycleId;
  cycleLockApp.__elements.get("new-week-button")._listeners.click[0]();
  const continuedCycleState = cycleLockApp.Basement45.getState();
  assert.equal(continuedCycleState.weekStartCycleId, expectedNextCycleId);
  const nextLockedOccurrence = Object.values(
    continuedCycleState.week.days,
  ).find((day) => day.cycleId === afterCycleLock.cycles[0].id);
  assert.equal(
    nextLockedOccurrence.circuits[0].first.exerciseId,
    lockedExerciseId,
    "cycle locks should continue across calendar-week boundaries",
  );

  const cycleSelectorApp = launchApp();
  let cycleSelectorState = cycleSelectorApp.Basement45.getState();
  const selectableCycles = cycleSelectorState.cycles;
  const initialWorkoutHtml =
    cycleSelectorApp.__elements.get("workout-view").innerHTML;
  assert.ok(initialWorkoutHtml.includes('data-day-cycle-select="true"'));
  const initialCycleSelectorHtml = initialWorkoutHtml.match(
    /<label class="day-cycle-selector">[\s\S]*?<\/label>/,
  )[0];
  assert.equal(
    (initialCycleSelectorHtml.match(/<option value=/g) || []).length,
    selectableCycles.length,
    "the workout selector should list every training cycle",
  );
  assert.ok(
    initialCycleSelectorHtml.includes(
      `<option value="${selectableCycles[0].id}" selected>`,
    ),
    "the scheduled cycle should be selected by default",
  );
  changeDayCycle(cycleSelectorApp, "monday", selectableCycles[2].id);
  cycleSelectorState = cycleSelectorApp.Basement45.getState();
  assert.equal(
    cycleSelectorState.week.days.monday.cycleId,
    selectableCycles[2].id,
  );
  assert.equal(
    cycleSelectorState.week.days.tuesday.cycleId,
    selectableCycles[3].id,
  );
  assert.equal(
    cycleSelectorState.week.days.wednesday.cycleId,
    selectableCycles[0].id,
  );
  assert.equal(
    cycleSelectorState.week.cycleOverrides.monday,
    selectableCycles[2].id,
    "a selected day cycle should be saved as the sequence anchor",
  );

  clickAction(cycleSelectorApp, "add-rest-cycle");
  cycleSelectorState = cycleSelectorApp.Basement45.getState();
  const selectorRestCycle = cycleSelectorState.cycles.at(-1);
  changeDayCycle(cycleSelectorApp, "monday", selectableCycles[3].id);
  cycleSelectorState = cycleSelectorApp.Basement45.getState();
  assert.equal(
    cycleSelectorState.week.days.monday.cycleId,
    selectableCycles[3].id,
  );
  assert.equal(cycleSelectorState.week.days.tuesday.restSource, "rotation");
  assert.equal(
    cycleSelectorState.week.days.tuesday.cycleId,
    selectorRestCycle.id,
  );
  assert.equal(
    cycleSelectorState.week.days.wednesday.cycleId,
    selectableCycles[0].id,
  );
  const reloadedCycleSelectorApp = launchApp(
    JSON.stringify(cycleSelectorState),
  );
  const reloadedCycleSelectorState =
    reloadedCycleSelectorApp.Basement45.getState();
  assert.equal(
    reloadedCycleSelectorState.week.days.monday.cycleId,
    selectableCycles[3].id,
  );
  assert.equal(
    reloadedCycleSelectorState.week.days.tuesday.restSource,
    "rotation",
    "the day selector should continue into a scheduled rest after reload",
  );

  const cycleSettingsApp = launchApp();
  const firstCycleId = cycleSettingsApp.Basement45.getState().cycles[0].id;
  inputSetting(
    cycleSettingsApp,
    { cycleSetting: "name", cycleId: firstCycleId },
    "Upper strength",
  );
  assert.equal(
    cycleSettingsApp.Basement45.getState().cycles[0].name,
    "Upper strength",
  );
  assert.ok(
    cycleSettingsApp.__elements
      .get("day-tabs")
      .innerHTML.includes("Upper strength"),
  );
  clickAction(cycleSettingsApp, "add-cycle");
  let managedCycles = cycleSettingsApp.Basement45.getState().cycles;
  assert.equal(managedCycles.length, 5);
  const addedCycleId = managedCycles[4].id;
  clickAction(cycleSettingsApp, "move-cycle", {
    cycleId: addedCycleId,
    direction: "-1",
  });
  managedCycles = cycleSettingsApp.Basement45.getState().cycles;
  assert.equal(managedCycles[3].id, addedCycleId);
  clickAction(cycleSettingsApp, "delete-cycle", { cycleId: addedCycleId });
  assert.equal(cycleSettingsApp.Basement45.getState().cycles.length, 4);

  clickAction(cycleSettingsApp, "add-rest-cycle");
  let rotationRestState = cycleSettingsApp.Basement45.getState();
  assert.equal(rotationRestState.cycles.length, 5);
  const rotationRestCycle = rotationRestState.cycles[4];
  assert.equal(rotationRestCycle.kind, "rest");
  assert.equal(rotationRestState.week.days.friday.rest, true);
  assert.equal(rotationRestState.week.days.friday.restSource, "rotation");
  assert.equal(
    rotationRestState.week.days.friday.cycleId,
    rotationRestCycle.id,
  );
  assert.deepEqual(
    [...rotationRestState.week.restDayIds],
    [],
    "a rotation rest entry must not become a calendar rest override",
  );
  selectView(cycleSettingsApp, "friday");
  const rotationRestHtml =
    cycleSettingsApp.__elements.get("workout-view").innerHTML;
  assert.ok(rotationRestHtml.includes("Scheduled recovery"));
  assert.ok(rotationRestHtml.includes('data-view="settings"'));
  assert.equal(
    rotationRestHtml.includes('data-action="toggle-rest-day"'),
    false,
  );

  const reloadedRotationRestApp = launchApp(JSON.stringify(rotationRestState));
  const reloadedRotationRestState =
    reloadedRotationRestApp.Basement45.getState();
  assert.equal(
    reloadedRotationRestState.week.days.friday.restSource,
    "rotation",
  );
  assert.equal(
    reloadedRotationRestState.week.days.friday.cycleId,
    rotationRestCycle.id,
    "scheduled rest entries should retain their rotation position after reload",
  );
  assert.deepEqual([...reloadedRotationRestState.week.restDayIds], []);

  clickAction(cycleSettingsApp, "toggle-rest-day", { day: "thursday" });
  rotationRestState = cycleSettingsApp.Basement45.getState();
  assert.equal(rotationRestState.week.days.thursday.restSource, "calendar");
  assert.equal(rotationRestState.week.days.friday.rest, false);
  assert.equal(rotationRestState.week.days.saturday.restSource, "rotation");
  assert.deepEqual([...rotationRestState.week.restDayIds], ["thursday"]);
  clickAction(cycleSettingsApp, "toggle-rest-day", { day: "thursday" });
  rotationRestState = cycleSettingsApp.Basement45.getState();
  assert.equal(rotationRestState.week.days.friday.restSource, "rotation");
  assert.deepEqual([...rotationRestState.week.restDayIds], []);

  clickAction(cycleSettingsApp, "move-cycle", {
    cycleId: rotationRestCycle.id,
    direction: "-1",
  });
  rotationRestState = cycleSettingsApp.Basement45.getState();
  assert.equal(rotationRestState.cycles[3].id, rotationRestCycle.id);
  assert.equal(rotationRestState.week.days.thursday.restSource, "rotation");
  clickAction(cycleSettingsApp, "delete-cycle", {
    cycleId: rotationRestCycle.id,
  });
  assert.equal(cycleSettingsApp.Basement45.getState().cycles.length, 4);
  assert.equal(
    Object.values(cycleSettingsApp.Basement45.getState().week.days).some(
      (day) => day.restSource === "rotation",
    ),
    false,
  );

  selectView(cycleSettingsApp, "settings");
  let cycleSettingsHtml =
    cycleSettingsApp.__elements.get("settings-view").innerHTML;
  assert.equal(
    (cycleSettingsHtml.match(/data-warmup-setting="label"/g) || []).length,
    3,
    "settings should list the three default warm-up exercises",
  );
  clickAction(cycleSettingsApp, "toggle-body-part-coverage");
  cycleSettingsHtml =
    cycleSettingsApp.__elements.get("settings-view").innerHTML;
  assert.ok(
    cycleSettingsHtml.includes(
      'data-body-part-coverage="Shoulders"><span>Shoulders</span><strong>2</strong>',
    ),
    "body-part coverage should count every cycle that targets shoulders",
  );
  assert.ok(
    cycleSettingsHtml.includes(
      'data-body-part-coverage="Core"><span>Core</span><strong>0</strong>',
    ),
    "the shared Core cool-down should not be counted as a cycle target",
  );
  assert.equal(
    (cycleSettingsHtml.match(/class="settings-section-divider"/g) || []).length,
    2,
  );
  assert.ok(
    cycleSettingsHtml.indexOf("warmup-settings-panel") <
      cycleSettingsHtml.indexOf("cycle-section-heading") &&
      cycleSettingsHtml.indexOf("cycle-section-heading") <
        cycleSettingsHtml.indexOf("cycle-sequence-summary") &&
      cycleSettingsHtml.indexOf("cycle-sequence-summary") <
        cycleSettingsHtml.indexOf("cycle-settings-grid") &&
      cycleSettingsHtml.indexOf('data-action="add-cycle"') >
        cycleSettingsHtml.indexOf("warmup-settings-panel") &&
      cycleSettingsHtml.indexOf("cycle-settings-grid") <
        cycleSettingsHtml.indexOf("cooldown-settings-panel"),
    "warm-up settings should precede cycles and cool-down settings should follow them",
  );
  assert.ok(cycleSettingsHtml.includes('data-action="add-rest-cycle"'));
  clickAction(cycleSettingsApp, "add-warmup-exercise");
  let warmups = cycleSettingsApp.Basement45.getState().warmupExercises;
  assert.equal(warmups.length, 4);
  const addedWarmupId = warmups[3].id;
  inputSetting(
    cycleSettingsApp,
    { warmupSetting: "label", warmupId: addedWarmupId },
    "Band shoulder warm-up",
  );
  warmups = cycleSettingsApp.Basement45.getState().warmupExercises;
  assert.equal(warmups[3].label, "Band shoulder warm-up");
  clickAction(cycleSettingsApp, "move-warmup-exercise", {
    warmupId: addedWarmupId,
    direction: "-1",
  });
  assert.equal(
    cycleSettingsApp.Basement45.getState().warmupExercises[2].id,
    addedWarmupId,
    "warm-up exercises should be reorderable without changing their IDs",
  );
  selectView(cycleSettingsApp, "monday");
  const customWarmupWorkoutHtml =
    cycleSettingsApp.__elements.get("workout-view").innerHTML;
  assert.ok(customWarmupWorkoutHtml.includes("Band shoulder warm-up"));
  assert.equal(
    (customWarmupWorkoutHtml.match(/data-action="daily-check"/g) || []).length,
    4,
  );
  selectView(cycleSettingsApp, "settings");
  clickAction(cycleSettingsApp, "delete-warmup-exercise", {
    warmupId: addedWarmupId,
  });
  assert.equal(
    cycleSettingsApp.Basement45.getState().warmupExercises.length,
    3,
  );
  assert.equal(
    Object.hasOwn(
      cycleSettingsApp.Basement45.getState().week.days.monday.preChecklist,
      addedWarmupId,
    ),
    false,
    "deleting a warm-up should remove its completion state from workout days",
  );

  let cooldowns = cycleSettingsApp.Basement45.getState().cooldownExercises;
  assert.deepEqual(
    Array.from(cooldowns, (exercise) => exercise.label),
    ["5 core"],
    "5 core should be the only default cool-down exercise",
  );
  clickAction(cycleSettingsApp, "add-cooldown-exercise");
  clickAction(cycleSettingsApp, "add-cooldown-exercise");
  cooldowns = cycleSettingsApp.Basement45.getState().cooldownExercises;
  assert.equal(cooldowns.length, 3);
  assert.equal(cooldowns[0].id, "core");
  const firstCooldownId = cooldowns[1].id;
  const secondCooldownId = cooldowns[2].id;
  inputSetting(
    cycleSettingsApp,
    { cooldownSetting: "label", cooldownId: firstCooldownId },
    "Hip flexor stretch",
  );
  inputSetting(
    cycleSettingsApp,
    { cooldownSetting: "label", cooldownId: secondCooldownId },
    "Slow breathing",
  );
  clickAction(cycleSettingsApp, "move-cooldown-exercise", {
    cooldownId: secondCooldownId,
    direction: "-1",
  });
  cooldowns = cycleSettingsApp.Basement45.getState().cooldownExercises;
  assert.deepEqual(
    Array.from(cooldowns, (exercise) => exercise.id),
    ["core", secondCooldownId, firstCooldownId],
    "cool-down exercises should be reorderable",
  );
  selectView(cycleSettingsApp, "monday");
  const cooldownWorkoutHtml =
    cycleSettingsApp.__elements.get("workout-view").innerHTML;
  assert.equal(
    (cooldownWorkoutHtml.match(/data-action="cooldown-check"/g) || []).length,
    3,
  );
  assert.ok(
    cooldownWorkoutHtml.indexOf("Slow breathing") <
      cooldownWorkoutHtml.indexOf("Hip flexor stretch"),
    "the workout should use the configured cool-down order",
  );
  changeAction(
    cycleSettingsApp,
    "cooldown-check",
    { day: "monday", item: "core" },
    true,
  );
  changeAction(
    cycleSettingsApp,
    "cooldown-check",
    { day: "monday", item: secondCooldownId },
    true,
  );
  changeAction(
    cycleSettingsApp,
    "cooldown-check",
    { day: "monday", item: firstCooldownId },
    true,
  );
  assert.ok(
    cycleSettingsApp.__elements
      .get("workout-view")
      .innerHTML.includes("cooldown-routine is-complete"),
    "the cool-down pane should complete when every configured item is checked",
  );
  selectView(cycleSettingsApp, "settings");
  clickAction(cycleSettingsApp, "delete-cooldown-exercise", {
    cooldownId: firstCooldownId,
  });
  assert.equal(
    Object.hasOwn(
      cycleSettingsApp.Basement45.getState().week.days.monday.cooldownChecklist,
      firstCooldownId,
    ),
    false,
  );

  const interactionApp = launchApp();
  const workoutHtml = interactionApp.__elements.get("workout-view").innerHTML;
  assert.ok(html.includes("Your rotation. Your rest days. Keep moving."));
  assert.ok(!html.includes("Five days. Three circuits. Done."));
  assert.ok(html.includes("Not connected · basement-45-workouts.json"));
  assert.equal(
    interactionApp.__elements.get("timer-display").textContent,
    "45:00",
  );
  assert.ok(html.includes('data-action="adjust-workout-timer"'));
  assert.ok(
    workoutHtml.includes('data-action="toggle-rest-day" data-day="monday"'),
    "the active training day should expose its rest control in the workout header",
  );
  assert.ok(
    !interactionApp.__elements
      .get("day-tabs")
      .innerHTML.includes('data-action="toggle-rest-day"'),
    "rest controls should not appear in the sidebar",
  );
  clickAction(interactionApp, "toggle-workout-timer");
  assert.equal(
    interactionApp.Basement45.getState().week.days.monday.timer.startedAt,
    null,
  );
  assert.equal(
    (workoutHtml.match(/data-action="complete-round"/g) || []).length,
    9,
  );
  assert.equal(
    (workoutHtml.match(/data-action="toggle-optional-activator-pane"/g) || [])
      .length,
    3,
  );
  assert.equal(
    (workoutHtml.match(/data-action="complete-optional-activator"/g) || [])
      .length,
    0,
  );
  assert.equal(
    (workoutHtml.match(/data-action="complete-bridge"/g) || []).length,
    0,
  );
  assert.equal((workoutHtml.match(/Total Body activator/g) || []).length, 0);
  assert.ok(!workoutHtml.includes("Between rounds"));
  assert.equal(
    (workoutHtml.match(/data-action="daily-check"/g) || []).length,
    3,
  );
  assert.equal(
    (workoutHtml.match(/data-action="core-check"/g) || []).length,
    0,
  );
  assert.equal(
    (workoutHtml.match(/data-action="cardio-check"/g) || []).length,
    0,
  );
  assert.equal(
    (workoutHtml.match(/data-action="cooldown-check"/g) || []).length,
    1,
    "5 core should be the default cool-down checklist item",
  );
  assert.ok(workoutHtml.includes("5 core"));
  assert.ok(!workoutHtml.includes("20 minutes cardio"));
  assert.ok(
    (workoutHtml.match(/data-action="random-replace"/g) || []).length > 0,
  );
  assert.ok((workoutHtml.match(/class="exercise-note"/g) || []).length > 0);
  assert.ok((workoutHtml.match(/class="equipment-needed"/g) || []).length > 0);
  assert.ok(
    (workoutHtml.match(/data-action="set-preference"/g) || []).length > 0,
  );
  assert.ok(
    (workoutHtml.match(/data-action="toggle-hide-workout"/g) || []).length > 0,
  );
  assert.ok(
    (workoutHtml.match(/data-action="edit-workout-exercise"/g) || []).length >
      0,
  );
  assert.ok(
    (workoutHtml.match(/data-action="toggle-favorite-circuit"/g) || [])
      .length === 3,
  );
  assert.ok(
    (workoutHtml.match(/class="exercise-score-row"/g) || []).length > 0,
  );
  assert.equal(
    (workoutHtml.match(/class="circuit-total-score"/g) || []).length,
    3,
  );
  assert.ok(
    (workoutHtml.match(/data-assignment-setting="setupScore"/g) || []).length >
      0,
  );
  assert.ok(
    (workoutHtml.match(/data-exercise-setting="effectivenessScore"/g) || [])
      .length > 0,
  );
  assert.ok((workoutHtml.match(/data-setting="loadBasis"/g) || []).length > 0);
  assert.equal(
    (workoutHtml.match(/class="exercise-divider"/g) || []).length,
    (workoutHtml.match(/class="exercise-item/g) || []).length - 3,
    "each circuit should render an HR only between its exercises",
  );
  assert.ok(
    (workoutHtml.match(/class="load-progress-mark /g) || []).length > 0,
  );
  assert.ok(!workoutHtml.includes("transition-divider"));
  assert.ok(!html.includes('name="difficultyScore"'));
  assert.ok(!html.includes('name="setupDifficulty"'));
  assert.ok(html.includes('id="replace-body-part"'));
  assert.ok(html.includes('id="replace-equipment"'));
  assert.ok(html.includes('data-action="add-exercise-from-replacement"'));
  assert.ok(html.includes('id="exercise-body-part-options"'));
  assert.ok(html.includes('id="exercise-equipment-options"'));
  assert.ok(html.includes('id="equipment-dialog"'));
  assert.ok(html.includes('id="equipment-form"'));
  assert.ok(!html.includes('textarea name="bodyParts"'));
  assert.ok(!html.includes('textarea name="equipmentVarieties"'));
  assert.ok(!html.includes("Compatible movement"));
  assert.ok(!html.includes("Quick transition"));
  assert.ok(!html.includes("Eligible exercises with easy transitions"));
  assert.ok(!workoutHtml.includes(">Neutral<"));
  assert.ok(
    workoutHtml.indexOf('class="round-checks"') <
      workoutHtml.indexOf('class="exercise-cycle"'),
    "the sticky round controls should come before the cycle exercises",
  );
  assert.ok(!workoutHtml.includes("circuit-sticky-progress"));
  assert.match(styles, /\.sidebar\s*{[^}]*position:\s*sticky/s);
  assert.match(
    styles,
    /\.circuit-grid\s*{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s,
  );
  assert.match(styles, /\.round-checks\s*{[^}]*position:\s*sticky/s);
  assert.match(
    styles,
    /\.pre-routine:not\(\.is-complete\)\s*{[^}]*position:\s*sticky/s,
  );
  assert.match(
    styles,
    /\.round-checks\s*{[^}]*background:\s*rgb\(215 222 217/s,
  );
  assert.match(
    styles,
    /\.round-check\.is-overdue:not\(:has\(input:checked\)\)/,
  );
  assert.match(styles, /\.compact-field\.has-recommended-weight/);
  assert.match(
    styles,
    /\.exercise-score-row\s*{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s,
  );
  assert.match(styles, /\.exercise-total-score\s*{[^}]*background:\s*#e8f3ee/s);
  assert.match(styles, /\.replace-option\s*{[^}]*min-height:\s*76px/s);
  assert.match(styles, /\.library-list\s*{[^}]*overflow-y:\s*auto/s);

  const equipmentEligibilityApp = launchApp();
  const targetMusclesByDay = {
    monday: ["Quadriceps", "Hamstrings", "Glutes", "Hips", "Calves"],
    tuesday: ["Shoulders", "Rotator cuff"],
    wednesday: ["Chest", "Shoulders", "Triceps"],
    thursday: ["Back", "Lats", "Biceps", "Forearms", "Grip", "Traps"],
    friday: ["Quadriceps", "Hamstrings", "Glutes", "Hips", "Calves"],
    saturday: ["Shoulders", "Rotator cuff"],
    sunday: ["Chest", "Shoulders", "Triceps"],
  };
  for (const [dayId, targetMuscles] of Object.entries(targetMusclesByDay)) {
    clickAction(equipmentEligibilityApp, "replace", {
      day: dayId,
      circuit: "0",
      position: "first",
    });
    const targetMuscleHtml = equipmentEligibilityApp.__elements.get(
      "replacement-target-muscles",
    ).innerHTML;
    for (const muscle of targetMuscles) {
      assert.ok(targetMuscleHtml.includes(`>${muscle}</span>`));
    }
    assert.ok(
      equipmentEligibilityApp.__elements
        .get("replace-equipment")
        .innerHTML.includes('<option value="FT">FT</option>'),
    );
    equipmentEligibilityApp.document._listeners.change[0]({
      target: {
        id: "replace-equipment",
        value: "FT",
        dataset: {},
        closest() {
          return null;
        },
      },
    });
    const resultHtml =
      equipmentEligibilityApp.__elements.get("replace-results").innerHTML;
    const ftIds = [
      ...new Set(
        [...resultHtml.matchAll(/data-exercise-id="([^"]+)"/g)].map(
          (match) => match[1],
        ),
      ),
    ];
    assert.ok(
      ftIds.length > 0,
      `${dayId} eligibility should include FT exercises for its target muscles`,
    );
    const eligibilityState = equipmentEligibilityApp.Basement45.getState();
    const currentId =
      eligibilityState.week.days[dayId].circuits[0].first.exerciseId;
    const usedIds = new Set(
      Object.values(eligibilityState.week.days).flatMap((day) =>
        day.circuits.flatMap((circuit) => [
          circuit.first.exerciseId,
          circuit.second.exerciseId,
          ...circuit.extras.map((assignment) => assignment.exerciseId),
          circuit.optionalActivator?.exerciseId,
        ]),
      ),
    );
    usedIds.delete(currentId);
    const expectedFtIds = [...equipmentEligibilityApp.Basement45.exercises]
      .filter(
        (exercise) =>
          exercise.id !== currentId &&
          !usedIds.has(exercise.id) &&
          !eligibilityState.hiddenExerciseIds.includes(exercise.id) &&
          !eligibilityState.deletedExerciseIds.includes(exercise.id) &&
          exercise.equipment_varieties.includes("Functional trainer") &&
          exercise.body_parts.some((part) => targetMuscles.includes(part)),
      )
      .map((exercise) => exercise.id)
      .sort();
    assert.deepEqual(
      ftIds.slice().sort(),
      expectedFtIds,
      `${dayId} should list every unused FT exercise matching at least one target muscle`,
    );
    assert.ok(resultHtml.includes("<em>Muscles</em>"));
    assert.ok(resultHtml.includes("<em>Equipment</em>"));
    assert.ok(
      ftIds.every((id) => {
        const exercise = equipmentEligibilityApp.Basement45.exercises.find(
          (item) => item.id === id,
        );
        return (
          exercise.equipment_varieties.includes("Functional trainer") &&
          exercise.body_parts.some((part) => targetMuscles.includes(part))
        );
      }),
    );
  }

  clickAction(interactionApp, "toggle-optional-activator-pane", {
    day: "monday",
    circuit: "0",
  });
  const expandedActivatorHtml =
    interactionApp.__elements.get("workout-view").innerHTML;
  assert.equal(
    (expandedActivatorHtml.match(/class="optional-activator-content"/g) || [])
      .length,
    1,
  );
  assert.equal(
    (expandedActivatorHtml.match(/class="exercise-item activator-item/g) || [])
      .length,
    1,
  );
  assert.equal(
    (
      expandedActivatorHtml.match(
        /data-action="complete-optional-activator"/g,
      ) || []
    ).length,
    1,
  );
  assert.ok(expandedActivatorHtml.includes("Independent of circuit score"));
  changeAction(
    interactionApp,
    "complete-optional-activator",
    { day: "monday", circuit: "0" },
    true,
  );
  assert.equal(
    interactionApp.Basement45.getState().week.days.monday.circuits[0]
      .optionalActivatorCompleted,
    true,
  );
  assert.equal(
    interactionApp.Basement45.getState().week.days.monday.circuits[0].roundsCompleted.every(
      Boolean,
    ),
    false,
  );
  assert.ok(
    interactionApp.__elements
      .get("workout-view")
      .innerHTML.includes("optional-activator-panel is-complete is-expanded"),
  );

  changeAssignmentSetup(
    interactionApp,
    { day: "monday", circuit: "0", position: "first" },
    "4",
  );
  const scoredCircuit =
    interactionApp.Basement45.getState().week.days.monday.circuits[0];
  assert.equal(scoredCircuit.first.setupScore, 4);
  const scoredExerciseId = scoredCircuit.first.exerciseId;
  const priorEffectiveness = interactionApp.Basement45.exercises.find(
    (exercise) => exercise.id === scoredExerciseId,
  ).effectiveness_score;
  const updatedEffectiveness = priorEffectiveness === 5 ? 4 : 5;
  changeExerciseEffectiveness(
    interactionApp,
    scoredExerciseId,
    String(updatedEffectiveness),
  );
  assert.equal(
    interactionApp.Basement45.exercises.find(
      (exercise) => exercise.id === scoredExerciseId,
    ).effectiveness_score,
    updatedEffectiveness,
    "effectiveness should be editable directly on a workout card",
  );
  assert.equal(
    interactionApp.Basement45.getState().exerciseEdits[scoredExerciseId]
      .effectivenessScore,
    updatedEffectiveness,
  );
  const expectedCircuitScore = [
    scoredCircuit.first,
    scoredCircuit.second,
    ...scoredCircuit.extras,
  ].reduce(
    (total, assignment) =>
      total +
      interactionApp.Basement45.exercises.find(
        (exercise) => exercise.id === assignment.exerciseId,
      ).effectiveness_score +
      (assignment.setupScore || 0),
    0,
  );
  assert.ok(
    interactionApp.__elements
      .get("workout-view")
      .innerHTML.includes(`Total score ${expectedCircuitScore}`),
  );

  const favoriteOriginalIds = [
    interactionApp.Basement45.getState().week.days.monday.circuits[0].first
      .exerciseId,
    interactionApp.Basement45.getState().week.days.monday.circuits[0].second
      .exerciseId,
    ...interactionApp.Basement45.getState().week.days.monday.circuits[0].extras.map(
      (assignment) => assignment.exerciseId,
    ),
  ];
  clickAction(interactionApp, "toggle-favorite-circuit", {
    day: "monday",
    circuit: "0",
  });
  const favoriteId =
    interactionApp.Basement45.getState().favoriteCircuits[0].id;
  assert.ok(favoriteId);
  assert.equal(
    interactionApp.Basement45.getState().favoriteCircuits[0].name,
    "Test favorite circuit",
  );
  assert.equal(
    interactionApp.Basement45.getState().favoriteCircuits[0].assignments[0]
      .setupScore,
    4,
  );
  clickAction(interactionApp, "delete-circuit-exercise", {
    day: "monday",
    circuit: "0",
    position: "extra-0",
  });
  assert.ok(
    [
      interactionApp.Basement45.getState().week.days.monday.circuits[0].first,
      interactionApp.Basement45.getState().week.days.monday.circuits[0].second,
      ...interactionApp.Basement45.getState().week.days.monday.circuits[0]
        .extras,
    ].every(
      (assignment) =>
        assignment.setupScore ===
        expectedDefaultSetup(
          interactionApp.Basement45.exercises.find(
            (exercise) => exercise.id === assignment.exerciseId,
          ),
        ),
    ),
    "changing circuit composition should restore contextual setup defaults",
  );
  clickAction(interactionApp, "open-favorite-circuits", {
    day: "monday",
    circuit: "0",
  });
  assert.ok(
    interactionApp.__elements
      .get("favorite-results")
      .innerHTML.includes("Use circuit"),
  );
  assert.ok(
    interactionApp.__elements
      .get("favorite-results")
      .innerHTML.includes(`Total score ${expectedCircuitScore}`),
  );
  clickAction(interactionApp, "apply-favorite-circuit", { favoriteId });
  const favoriteRestoredCircuit =
    interactionApp.Basement45.getState().week.days.monday.circuits[0];
  assert.deepEqual(
    [
      favoriteRestoredCircuit.first.exerciseId,
      favoriteRestoredCircuit.second.exerciseId,
      ...favoriteRestoredCircuit.extras.map(
        (assignment) => assignment.exerciseId,
      ),
    ],
    favoriteOriginalIds,
  );
  assert.equal(
    favoriteRestoredCircuit.first.setupScore,
    4,
    "favorites should restore per-circuit setup scores",
  );
  assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);
  changeAction(
    interactionApp,
    "complete-round",
    { day: "monday", circuit: "0", round: "0" },
    true,
  );
  changeAction(
    interactionApp,
    "daily-check",
    { day: "monday", item: "stretch" },
    true,
  );
  changeAction(
    interactionApp,
    "cooldown-check",
    { day: "monday", item: "core" },
    true,
  );
  assert.equal(
    interactionApp.Basement45.getState().week.days.monday.circuits[0]
      .roundsCompleted[0],
    true,
  );
  assert.equal(
    interactionApp.Basement45.getState().week.days.monday.preChecklist.stretch,
    true,
  );
  assert.equal(
    interactionApp.Basement45.getState().week.days.monday.cooldownChecklist
      .core,
    true,
  );
  assert.ok(
    interactionApp.__elements
      .get("workout-view")
      .innerHTML.includes("cooldown-routine is-complete"),
    "the default cool-down should complete as soon as 5 core is checked",
  );
  changeAction(
    interactionApp,
    "daily-check",
    { day: "monday", item: "pushups" },
    true,
  );
  changeAction(
    interactionApp,
    "daily-check",
    { day: "monday", item: "pullups" },
    true,
  );
  assert.ok(
    interactionApp.__elements
      .get("workout-view")
      .innerHTML.includes("pre-routine is-complete"),
    "the Before Circuits pane should immediately complete after its final checkbox",
  );
  assert.ok(
    interactionApp.Basement45.getState().week.days.monday.timer.startedAt,
    "the workout timer should automatically start when the final warm-up item is checked",
  );
  clickAction(interactionApp, "toggle-workout-timer");
  assert.equal(
    interactionApp.Basement45.getState().week.days.monday.timer.startedAt,
    null,
  );
  clickAction(interactionApp, "adjust-workout-timer", { minutes: "5" });
  assert.equal(
    interactionApp.Basement45.getState().week.days.monday.timer.durationMs,
    50 * 60 * 1000,
  );
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
  assert.equal(
    interactionApp.__elements.get("timer-display").textContent,
    "50:00",
  );
  changeAction(
    interactionApp,
    "complete-round",
    { day: "monday", circuit: "0", round: "1" },
    true,
  );
  changeAction(
    interactionApp,
    "complete-round",
    { day: "monday", circuit: "0", round: "2" },
    true,
  );
  assert.ok(
    interactionApp.__elements
      .get("workout-view")
      .innerHTML.includes('class="circuit-card is-complete"'),
    "a circuit should receive the completed-pane class once all three rounds are done",
  );
  for (const assignment of [
    interactionApp.Basement45.getState().week.days.monday.circuits[0].first,
    interactionApp.Basement45.getState().week.days.monday.circuits[0].second,
    ...interactionApp.Basement45.getState().week.days.monday.circuits[0].extras,
  ]) {
    assert.equal(
      interactionApp.Basement45.getState().exerciseState[assignment.exerciseId]
        .loadProgressCount,
      1,
    );
  }

  const noteExerciseId =
    interactionApp.Basement45.getState().week.days.monday.circuits[0].first
      .exerciseId;
  clickAction(interactionApp, "edit-workout-exercise", {
    exerciseId: noteExerciseId,
  });
  assert.ok(
    interactionApp.__elements
      .get("exercise-dialog-title")
      .textContent.startsWith("Edit "),
  );
  clickAction(interactionApp, "close-exercise-dialog");
  inputSetting(
    interactionApp,
    { setting: "notes", exerciseId: noteExerciseId },
    "Keep the tempo controlled",
  );
  inputSetting(
    interactionApp,
    { setting: "measureType", exerciseId: noteExerciseId },
    "seconds",
  );
  inputSetting(
    interactionApp,
    { setting: "weight", exerciseId: noteExerciseId },
    "25",
  );
  inputSetting(
    interactionApp,
    { setting: "loadBasis", exerciseId: noteExerciseId },
    "each",
  );
  assert.equal(
    interactionApp.Basement45.getState().exerciseState[noteExerciseId].notes,
    "Keep the tempo controlled",
  );
  assert.equal(
    interactionApp.Basement45.getState().exerciseState[noteExerciseId]
      .measureType,
    "seconds",
  );
  assert.equal(
    interactionApp.Basement45.getState().exerciseState[noteExerciseId].weight,
    "25",
  );
  assert.equal(
    interactionApp.Basement45.getState().exerciseState[noteExerciseId]
      .loadBasis,
    "each",
  );
  clickAction(interactionApp, "set-preference", {
    exerciseId: noteExerciseId,
    value: "1",
  });
  assert.equal(
    interactionApp.Basement45.getState().exerciseState[noteExerciseId]
      .preference,
    1,
  );
  assert.ok(
    interactionApp.__elements
      .get("workout-view")
      .innerHTML.includes('class="feedback-button active"'),
  );
  assert.ok(
    interactionApp.__elements
      .get("workout-view")
      .innerHTML.includes("has-recommended-weight"),
  );
  clickAction(interactionApp, "toggle-hide-workout", {
    exerciseId: noteExerciseId,
  });
  assert.ok(
    interactionApp.Basement45.getState().hiddenExerciseIds.includes(
      noteExerciseId,
    ),
  );
  assert.ok(
    interactionApp.__elements
      .get("workout-view")
      .innerHTML.includes("exercise-item is-hidden"),
  );
  clickAction(interactionApp, "toggle-hide-workout", {
    exerciseId: noteExerciseId,
  });
  assert.ok(
    !interactionApp.Basement45.getState().hiddenExerciseIds.includes(
      noteExerciseId,
    ),
  );

  const exerciseLookup = new Map(
    interactionApp.Basement45.exercises.map((exercise) => [
      exercise.id,
      exercise,
    ]),
  );
  assert.ok(
    exerciseLookup
      .get("cable-y-raise")
      .equipment_varieties.includes("D-handles"),
  );
  assert.ok(
    exerciseLookup
      .get("kettlebell-swing")
      .equipment_varieties.includes("Kettlebell"),
  );
  const mondayCircuit =
    interactionApp.Basement45.getState().week.days.monday.circuits[0];
  const beforeOrder = [
    mondayCircuit.first,
    mondayCircuit.second,
    ...mondayCircuit.extras,
  ].map((assignment) => assignment.exerciseId);
  let moveIndex = -1;
  for (let index = 0; index < beforeOrder.length - 1; index += 1) {
    const reordered = beforeOrder.slice();
    [reordered[index], reordered[index + 1]] = [
      reordered[index + 1],
      reordered[index],
    ];
    const valid = reordered.every(
      (id, itemIndex) =>
        itemIndex === 0 ||
        !(
          exerciseLookup.get(reordered[itemIndex - 1]).unilateral &&
          exerciseLookup.get(id).unilateral
        ),
    );
    if (valid) {
      moveIndex = index;
      break;
    }
  }
  assert.ok(moveIndex >= 0);
  const movePosition =
    moveIndex === 0
      ? "first"
      : moveIndex === 1
        ? "second"
        : `extra-${moveIndex - 2}`;
  clickAction(interactionApp, "move-exercise", {
    day: "monday",
    circuit: "0",
    position: movePosition,
    direction: "1",
  });
  const afterOrderCircuit =
    interactionApp.Basement45.getState().week.days.monday.circuits[0];
  const afterOrder = [
    afterOrderCircuit.first,
    afterOrderCircuit.second,
    ...afterOrderCircuit.extras,
  ].map((assignment) => assignment.exerciseId);
  assert.notDeepEqual(afterOrder, beforeOrder);
  assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);

  let randomChanged = false;
  for (const dayId of [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]) {
    for (
      let circuitIndex = 0;
      circuitIndex < 3 && !randomChanged;
      circuitIndex += 1
    ) {
      for (const position of ["first", "second"]) {
        const before =
          interactionApp.Basement45.getState().week.days[dayId].circuits[
            circuitIndex
          ][position];
        if (before.locked) continue;
        clickAction(interactionApp, "random-replace", {
          day: dayId,
          circuit: String(circuitIndex),
          position,
        });
        const after =
          interactionApp.Basement45.getState().week.days[dayId].circuits[
            circuitIndex
          ][position];
        if (after.exerciseId !== before.exerciseId) {
          randomChanged = true;
          break;
        }
      }
    }
    if (randomChanged) break;
  }
  assert.equal(
    randomChanged,
    true,
    "the random eligible replacement action should change an exercise",
  );
  assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);

  clickAction(interactionApp, "replace", {
    day: "monday",
    circuit: "1",
    position: "first",
  });
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
  const hideableReplacementHtml =
    interactionApp.__elements.get("replace-results").innerHTML;
  assert.ok(hideableReplacementHtml.includes('data-action="hide-replacement"'));
  const hideableReplacementIds = [
    ...hideableReplacementHtml.matchAll(/data-exercise-id="([^"]+)"/g),
  ].map((match) => match[1]);
  assert.ok(hideableReplacementIds.length > 0);
  assert.ok(
    interactionApp.__elements
      .get("replace-body-part")
      .innerHTML.includes("All body parts"),
  );
  assert.ok(
    interactionApp.__elements
      .get("replace-equipment")
      .innerHTML.includes("All equipment"),
  );
  const filterExercise = interactionApp.Basement45.exercises.find(
    (exercise) => exercise.id === hideableReplacementIds[0],
  );
  interactionApp.document._listeners.change[0]({
    target: {
      id: "replace-body-part",
      value: filterExercise.body_parts[0],
      dataset: {},
      closest() {
        return null;
      },
    },
  });
  const bodyFilteredIds = [
    ...interactionApp.__elements
      .get("replace-results")
      .innerHTML.matchAll(/data-exercise-id="([^"]+)"/g),
  ].map((match) => match[1]);
  assert.ok(bodyFilteredIds.length > 0);
  assert.ok(
    bodyFilteredIds.every((id) =>
      interactionApp.Basement45.exercises
        .find((exercise) => exercise.id === id)
        .body_parts.includes(filterExercise.body_parts[0]),
    ),
  );
  interactionApp.document._listeners.change[0]({
    target: {
      id: "replace-body-part",
      value: "all",
      dataset: {},
      closest() {
        return null;
      },
    },
  });
  interactionApp.document._listeners.change[0]({
    target: {
      id: "replace-equipment",
      value: filterExercise.equipment_varieties[0],
      dataset: {},
      closest() {
        return null;
      },
    },
  });
  const equipmentFilteredIds = [
    ...interactionApp.__elements
      .get("replace-results")
      .innerHTML.matchAll(/data-exercise-id="([^"]+)"/g),
  ].map((match) => match[1]);
  assert.ok(equipmentFilteredIds.length > 0);
  assert.ok(
    equipmentFilteredIds.every((id) =>
      interactionApp.Basement45.exercises
        .find((exercise) => exercise.id === id)
        .equipment_varieties.includes(filterExercise.equipment_varieties[0]),
    ),
  );
  interactionApp.document._listeners.change[0]({
    target: {
      id: "replace-equipment",
      value: "all",
      dataset: {},
      closest() {
        return null;
      },
    },
  });
  const hiddenReplacementId = hideableReplacementIds[0];
  clickAction(interactionApp, "hide-replacement", {
    exerciseId: hiddenReplacementId,
  });
  assert.ok(
    interactionApp.Basement45.getState().hiddenExerciseIds.includes(
      hiddenReplacementId,
    ),
  );
  assert.ok(
    !interactionApp.__elements
      .get("replace-results")
      .innerHTML.includes(`data-exercise-id="${hiddenReplacementId}"`),
  );
  clickAction(interactionApp, "toggle-hide-library", {
    exerciseId: hiddenReplacementId,
  });
  assert.ok(
    !interactionApp.Basement45.getState().hiddenExerciseIds.includes(
      hiddenReplacementId,
    ),
  );
  clickAction(interactionApp, "choose-replacement", {
    exerciseId: hideableReplacementIds[0],
  });
  assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);

  const deleteTarget = Object.entries(
    interactionApp.Basement45.getState().week.days,
  )
    .flatMap(([dayId, day]) =>
      day.circuits.map((circuit, circuitIndex) => ({
        dayId,
        circuitIndex,
        circuit,
      })),
    )
    .find(
      ({ circuit }) =>
        circuit.extras.length > 0 &&
        !circuit.extras[circuit.extras.length - 1].locked,
    );
  assert.ok(deleteTarget, "a generated circuit should have a removable extra");
  const deleteCircuitBefore = deleteTarget.circuit;
  const deleteCountBefore = 2 + deleteCircuitBefore.extras.length;
  clickAction(interactionApp, "delete-circuit-exercise", {
    day: deleteTarget.dayId,
    circuit: String(deleteTarget.circuitIndex),
    position: `extra-${deleteCircuitBefore.extras.length - 1}`,
  });
  assert.equal(
    2 +
      interactionApp.Basement45.getState().week.days[deleteTarget.dayId]
        .circuits[deleteTarget.circuitIndex].extras.length,
    deleteCountBefore - 1,
  );
  assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);

  const addTarget = Object.entries(
    interactionApp.Basement45.getState().week.days,
  )
    .flatMap(([dayId, day]) =>
      day.circuits.map((circuit, circuitIndex) => ({
        dayId,
        circuitIndex,
        circuit,
      })),
    )
    .find(({ circuit }) => circuit.extras.length < 2);
  assert.ok(addTarget, "a generated circuit should allow an added exercise");
  const addCountBefore = addTarget.circuit.extras.length;
  clickAction(interactionApp, "add-round-exercise", {
    day: addTarget.dayId,
    circuit: String(addTarget.circuitIndex),
  });
  assert.equal(
    interactionApp.Basement45.getState().week.days[addTarget.dayId].circuits[
      addTarget.circuitIndex
    ].extras.length,
    addCountBefore + 1,
  );
  assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);
  const automaticAddReload = launchApp(
    JSON.stringify(interactionApp.Basement45.getState()),
  );
  assert.deepEqual(
    Array.from(automaticAddReload.Basement45.validateWeek()),
    [],
  );
  clickAction(interactionApp, "remove-round-exercise", {
    day: addTarget.dayId,
    circuit: String(addTarget.circuitIndex),
  });
  assert.equal(
    interactionApp.Basement45.getState().week.days[addTarget.dayId].circuits[
      addTarget.circuitIndex
    ].extras.length,
    addCountBefore,
  );

  clickAction(interactionApp, "replace", {
    day: "monday",
    circuit: "0",
    position: "first",
  });
  interactionApp.document._listeners.change[0]({
    target: {
      id: "show-all-replacements",
      checked: false,
      closest() {
        return null;
      },
    },
  });
  const replacementHtml =
    interactionApp.__elements.get("replace-results").innerHTML;
  assert.ok(replacementHtml.includes('class="replace-option"'));
  assert.ok(replacementHtml.includes('data-action="choose-replacement"'));
  assert.ok(
    !replacementHtml.includes('data-exercise-id="decline-dumbbell-press"'),
  );
  interactionApp.document._listeners.change[0]({
    target: {
      id: "show-all-replacements",
      checked: true,
      closest() {
        return null;
      },
    },
  });
  const allReplacementHtml =
    interactionApp.__elements.get("replace-results").innerHTML;
  const allReplacementIds = [
    ...allReplacementHtml.matchAll(/data-exercise-id="([^"]+)"/g),
  ].map((match) => match[1]);
  const replacementId = allReplacementIds.find(
    (exerciseId) =>
      !replacementHtml.includes(`data-exercise-id="${exerciseId}"`),
  );
  assert.ok(
    replacementId,
    "show all should expose at least one available library exercise",
  );
  const replacementExercise = interactionApp.Basement45.exercises.find(
    (exercise) => exercise.id === replacementId,
  );
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
  const fuzzyReplacementHtml =
    interactionApp.__elements.get("replace-results").innerHTML;
  assert.ok(
    fuzzyReplacementHtml.includes(`data-exercise-id="${replacementId}"`),
    "replacement search should tolerate partial words and small misspellings",
  );
  clickAction(interactionApp, "choose-replacement", {
    exerciseId: replacementId,
  });
  assert.equal(
    interactionApp.Basement45.getState().week.days.monday.circuits[0].first
      .exerciseId,
    replacementId,
  );
  assert.equal(
    interactionApp.Basement45.getState().week.days.monday.circuits[0].first
      .manualOverride,
    true,
  );
  assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);
  const manualOverrideReload = launchApp(
    JSON.stringify(interactionApp.Basement45.getState()),
  );
  assert.deepEqual(
    Array.from(manualOverrideReload.Basement45.validateWeek()),
    [],
  );

  const customForm = interactionApp.__elements.get("exercise-form");
  clickAction(interactionApp, "replace", {
    day: "monday",
    circuit: "0",
    position: "first",
  });
  clickAction(interactionApp, "add-exercise-from-replacement");
  assert.equal(interactionApp.__elements.get("exercise-dialog").open, true);
  assert.ok(
    (
      interactionApp.__elements
        .get("exercise-body-part-options")
        .innerHTML.match(/name="bodyParts"/g) || []
    ).length >= 17,
    "the exercise detail form should show a multi-select checkbox for every body part",
  );
  customForm._formData = new Map([
    ["name", "Test supported row"],
    ["category", "Back and Lats"],
    ["bodyParts", "Back\nLats\nBiceps"],
    ["equipment", "Adjustable dumbbell + bench"],
    ["equipmentVarieties", "Dumbbells\nBench\nD-handles"],
    ["movementPattern", "pull"],
    ["movementRole", "compound"],
    ["forceType", "pull"],
    ["defaultReps", "10"],
    ["measureType", "reps"],
    ["defaultLoad", "35"],
    ["loadBasis", "each"],
    ["instructionUrl", ""],
    ["totalBodyActivator", "on"],
    ["bothSides", "on"],
    ["effectivenessScore", "5"],
  ]);
  customForm._listeners.submit[0]({
    preventDefault() {},
    currentTarget: customForm,
  });
  assert.equal(interactionApp.Basement45.getState().customExercises.length, 1);
  assert.equal(
    interactionApp.__elements.get("replace-dialog").open,
    true,
    "saving from the swap should return to the swap",
  );
  assert.deepEqual(
    Array.from(
      interactionApp.Basement45.exercises.find(
        (exercise) => exercise.id === "test-supported-row",
      ).equipment_varieties,
    ),
    ["Bench", "D-handles", "Dumbbells"],
  );
  assert.deepEqual(
    Array.from(
      interactionApp.Basement45.exercises.find(
        (exercise) => exercise.id === "test-supported-row",
      ).body_parts,
    ),
    ["Back", "Lats", "Biceps"],
  );
  assert.equal(
    interactionApp.Basement45.exercises.find(
      (exercise) => exercise.id === "test-supported-row",
    ).total_body_activator,
    true,
  );
  assert.equal(
    interactionApp.Basement45.exercises.find(
      (exercise) => exercise.id === "test-supported-row",
    ).unilateral,
    true,
  );
  assert.equal(
    interactionApp.Basement45.exercises.find(
      (exercise) => exercise.id === "test-supported-row",
    ).effectiveness_score,
    5,
  );
  assert.equal(
    interactionApp.Basement45.getState().exerciseState["test-supported-row"]
      .weight,
    "35",
  );
  assert.equal(
    interactionApp.Basement45.getState().exerciseState["test-supported-row"]
      .loadBasis,
    "each",
  );
  const resumedReplacementId = interactionApp.__elements
    .get("replace-results")
    .innerHTML.match(/data-exercise-id="([^"]+)"/)?.[1];
  assert.ok(resumedReplacementId);
  clickAction(interactionApp, "choose-replacement", {
    exerciseId: resumedReplacementId,
  });
  assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);

  clickAction(interactionApp, "edit-library", {
    exerciseId: "flat-dumbbell-bench-press",
  });
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
  customForm._listeners.submit[0]({
    preventDefault() {},
    currentTarget: customForm,
  });
  assert.equal(
    interactionApp.Basement45.exercises.find(
      (exercise) => exercise.id === "flat-dumbbell-bench-press",
    ).name,
    "Flat dumbbell bench press — edited",
  );
  assert.ok(
    interactionApp.Basement45.getState().exerciseEdits[
      "flat-dumbbell-bench-press"
    ],
  );
  assert.ok(
    interactionApp.Basement45.exercises
      .find((exercise) => exercise.id === "flat-dumbbell-bench-press")
      .equipment_varieties.includes("D-handles"),
  );

  clickAction(interactionApp, "toggle-hide-library", {
    exerciseId: "test-supported-row",
  });
  assert.deepEqual(interactionApp.Basement45.getState().hiddenExerciseIds, [
    "test-supported-row",
  ]);
  clickAction(interactionApp, "delete-library", {
    exerciseId: "test-supported-row",
  });
  assert.deepEqual(interactionApp.Basement45.getState().deletedExerciseIds, [
    "test-supported-row",
  ]);
  const customReloadApp = launchApp(
    JSON.stringify(interactionApp.Basement45.getState()),
  );
  assert.equal(customReloadApp.Basement45.getState().customExercises.length, 1);
  assert.deepEqual(customReloadApp.Basement45.getState().deletedExerciseIds, [
    "test-supported-row",
  ]);
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
  const dHandleLibraryHtml =
    interactionApp.__elements.get("library-view").innerHTML;
  assert.ok(dHandleLibraryHtml.includes("Cable Y raise"));
  assert.ok(!dHandleLibraryHtml.includes("Back extension machine side bend"));
  assert.ok(!dHandleLibraryHtml.includes('data-setting="measureType"'));
  assert.ok(!dHandleLibraryHtml.includes('data-setting="reps"'));
  assert.ok(!dHandleLibraryHtml.includes('data-setting="weight"'));
  assert.ok(!dHandleLibraryHtml.includes('data-setting="loadBasis"'));
  assert.ok(dHandleLibraryHtml.includes('class="library-actions"'));
  assert.ok(
    !dHandleLibraryHtml.includes('data-action="toggle-activator-library"'),
  );
  const currentLibraryTotal =
    interactionApp.Basement45.exercises.length -
    interactionApp.Basement45.getState().deletedExerciseIds.length;
  assert.ok(
    interactionApp.__elements
      .get("day-tabs")
      .innerHTML.includes(`${currentLibraryTotal} total exercises`),
    "the library tab should show the current total catalog size",
  );
  assert.ok(
    dHandleLibraryHtml.includes(
      `of <strong>${currentLibraryTotal}</strong> exercises showing`,
    ),
  );
  assert.ok(dHandleLibraryHtml.includes('data-action="open-equipment-dialog"'));
  assert.ok(dHandleLibraryHtml.includes(">Edit equipment</button>"));
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
  assert.ok(
    interactionApp.__elements
      .get("library-view")
      .innerHTML.includes('<option value="equipment" selected>'),
  );
  assert.equal(
    customReloadApp.Basement45.exercises.find(
      (exercise) => exercise.id === "flat-dumbbell-bench-press",
    ).name,
    "Flat dumbbell bench press — edited",
  );

  clickAction(interactionApp, "open-equipment-dialog");
  const equipmentForm = interactionApp.__elements.get("equipment-form");
  assert.equal(interactionApp.__elements.get("equipment-dialog").open, true);
  assert.ok(
    interactionApp.__elements
      .get("equipment-catalog-list")
      .innerHTML.includes("FT"),
  );
  equipmentForm._formData = new Map([["equipmentName", "Landmine attachment"]]);
  equipmentForm._listeners.submit[0]({
    preventDefault() {},
    currentTarget: equipmentForm,
  });
  assert.ok(
    interactionApp.Basement45.getState().equipmentCatalog.includes(
      "Landmine attachment",
    ),
  );
  const equipmentCount =
    interactionApp.Basement45.getState().equipmentCatalog.length;
  equipmentForm._formData = new Map([
    ["equipmentName", "  landmine attachment  "],
  ]);
  equipmentForm._listeners.submit[0]({
    preventDefault() {},
    currentTarget: equipmentForm,
  });
  assert.equal(
    interactionApp.Basement45.getState().equipmentCatalog.length,
    equipmentCount,
    "equipment names should be deduplicated case-insensitively",
  );

  selectView(interactionApp, "settings");
  const settingsHtml = interactionApp.__elements.get("settings-view").innerHTML;
  assert.equal((settingsHtml.match(/data-cycle-card=/g) || []).length, 4);
  assert.ok(settingsHtml.includes('data-action="add-cycle"'));
  assert.ok(settingsHtml.includes('data-action="move-cycle"'));
  assert.ok(settingsHtml.includes('data-action="delete-cycle"'));
  assert.ok(settingsHtml.includes('data-action="toggle-body-part-coverage"'));
  assert.ok(settingsHtml.includes('data-action="add-warmup-exercise"'));
  assert.ok(settingsHtml.includes('data-action="move-warmup-exercise"'));
  assert.ok(settingsHtml.includes('data-action="add-cooldown-exercise"'));
  assert.equal(
    (settingsHtml.match(/data-cooldown-setting="label"/g) || []).length,
    1,
    "5 core should appear as the default editable cool-down exercise",
  );
  assert.ok(settingsHtml.includes('value="5 core"'));
  assert.equal(
    (settingsHtml.match(/data-action="delete-warmup-exercise"/g) || []).length,
    3,
  );
  assert.ok(!settingsHtml.includes("Include this day"));
  assert.ok(!settingsHtml.includes("Arms &amp; upper"));
  for (const label of [
    "Legs",
    "Shoulder &amp; Rotator cuff",
    "Push",
    "Pull",
    "Total Body",
    "Total Body - No Equipment",
  ]) {
    assert.ok(
      settingsHtml.includes(`>${label}</option>`),
      `settings should include the ${label} target`,
    );
  }
  const mondayIdsBeforeTargetChange =
    interactionApp.Basement45.getState().week.days.monday.circuits.flatMap(
      (circuit) => [
        circuit.first.exerciseId,
        circuit.second.exerciseId,
        ...circuit.extras.map((assignment) => assignment.exerciseId),
      ],
    );
  changeDayTarget(interactionApp, "monday", "total_body");
  const targetedState = interactionApp.Basement45.getState();
  assert.equal(
    targetedState.cycles.find(
      (cycle) => cycle.id === targetedState.week.days.monday.cycleId,
    ).target,
    "total_body",
    interactionApp.__elements.get("toast").textContent,
  );
  assert.equal(targetedState.week.days.monday.target, "total_body");
  const targetedMondayAssignments =
    targetedState.week.days.monday.circuits.flatMap((circuit) => [
      circuit.first,
      circuit.second,
      ...circuit.extras,
    ]);
  assert.notDeepEqual(
    targetedMondayAssignments.map((assignment) => assignment.exerciseId),
    mondayIdsBeforeTargetChange,
    "changing a target should immediately rebuild that day",
  );
  assert.ok(
    targetedMondayAssignments.every((assignment) => {
      const exercise = interactionApp.Basement45.exercises.find(
        (item) => item.id === assignment.exerciseId,
      );
      return (
        exercise.total_body_activator ||
        exercise.movement_role === "total_body" ||
        (exercise.movement_role === "compound" &&
          exercise.force_type !== "other")
      );
    }),
    "a Total Body day should only contain exercises from the Total Body qualification pool",
  );
  assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);

  const noEquipmentApp = launchApp();
  changeDayTarget(noEquipmentApp, "saturday", "total_body_no_equipment");
  const noEquipmentState = noEquipmentApp.Basement45.getState();
  assert.equal(
    noEquipmentState.cycles.find(
      (cycle) => cycle.id === noEquipmentState.week.days.saturday.cycleId,
    ).target,
    "total_body_no_equipment",
    noEquipmentApp.__elements.get("toast").textContent,
  );
  assert.equal(
    noEquipmentState.week.days.saturday.target,
    "total_body_no_equipment",
  );
  for (const circuit of noEquipmentState.week.days.saturday.circuits) {
    for (const assignment of [
      circuit.first,
      circuit.second,
      ...circuit.extras,
      circuit.optionalActivator,
    ]) {
      const exercise = noEquipmentApp.Basement45.exercises.find(
        (item) => item.id === assignment.exerciseId,
      );
      assert.equal(
        expectedDefaultSetup(exercise),
        5,
        `${exercise.name} should not require equipment in the no-equipment target`,
      );
    }
  }
  assert.deepEqual(Array.from(noEquipmentApp.Basement45.validateWeek()), []);
  const selectedSaturdayBodyParts = [
    "Core",
    "Chest",
    "Quadriceps",
    "Hamstrings",
    "Glutes",
    "Hips",
    "Full body",
  ];
  const settingsCardStub = {
    querySelectorAll() {
      return selectedSaturdayBodyParts.map((part) => ({
        dataset: { cycleBodyPart: part },
      }));
    },
  };
  const saturdayCycleId =
    noEquipmentApp.Basement45.getState().week.days.saturday.cycleId;
  const applyBodyPartsButton = {
    dataset: {
      action: "apply-cycle-body-parts",
      cycleId: saturdayCycleId,
    },
    closest(selector) {
      if (selector === "[data-action]") return this;
      if (selector === ".settings-card") return settingsCardStub;
      return null;
    },
  };
  noEquipmentApp.document._listeners.click[0]({ target: applyBodyPartsButton });
  const bodyPartState = noEquipmentApp.Basement45.getState();
  assert.deepEqual(
    Array.from(
      bodyPartState.cycles.find((cycle) => cycle.id === saturdayCycleId)
        .bodyParts,
    ),
    selectedSaturdayBodyParts,
  );
  assert.ok(
    bodyPartState.week.days.saturday.circuits
      .flatMap((circuit) => [circuit.first, circuit.second, ...circuit.extras])
      .every((assignment) => {
        const exercise = noEquipmentApp.Basement45.exercises.find(
          (item) => item.id === assignment.exerciseId,
        );
        return exercise.body_parts.some((part) =>
          selectedSaturdayBodyParts.includes(part),
        );
      }),
    "day body-part settings should constrain every generated round exercise",
  );
  assert.deepEqual(Array.from(noEquipmentApp.Basement45.validateWeek()), []);
  const scheduleBeforeRest = interactionApp.Basement45.getState();
  clickAction(interactionApp, "toggle-rest-day", { day: "tuesday" });
  const restedSchedule = interactionApp.Basement45.getState();
  assert.equal(restedSchedule.week.days.tuesday.rest, true);
  assert.equal(restedSchedule.week.days.tuesday.circuits.length, 0);
  assert.equal(
    restedSchedule.week.days.wednesday.cycleId,
    scheduleBeforeRest.week.days.tuesday.cycleId,
    "a rest day should defer the pending cycle to the next calendar day",
  );
  assert.ok(
    interactionApp.__elements
      .get("day-tabs")
      .innerHTML.includes('data-view="tuesday"'),
    "rest days should remain visible in the sidebar",
  );
  selectView(interactionApp, "tuesday");
  const restDayHtml = interactionApp.__elements.get("workout-view").innerHTML;
  assert.ok(
    restDayHtml.includes("Train today instead"),
    "a rest day should expose its Train control at the top of the day",
  );
  assert.equal(
    (restDayHtml.match(/data-action="toggle-rest-day"/g) || []).length,
    1,
    "the rest-day toggle should not be repeated inside the recovery pane",
  );
  clickAction(interactionApp, "toggle-rest-day", { day: "tuesday" });
  const restoredSchedule = interactionApp.Basement45.getState();
  assert.equal(restoredSchedule.week.days.tuesday.rest, false);
  assert.equal(
    [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]
      .map((dayId) => restoredSchedule.week.days[dayId].cycleId)
      .join("|"),
    [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]
      .map((dayId) => scheduleBeforeRest.week.days[dayId].cycleId)
      .join("|"),
    "removing a rest day should shift the cycle sequence back",
  );
  const guardedRestApp = launchApp();
  changeAction(
    guardedRestApp,
    "complete-round",
    { day: "monday", circuit: "0", round: "0" },
    true,
  );
  guardedRestApp.confirm = () => false;
  clickAction(guardedRestApp, "toggle-rest-day", { day: "monday" });
  assert.equal(
    guardedRestApp.Basement45.getState().week.days.monday.rest,
    false,
    "declining the progress warning should leave the cycle schedule unchanged",
  );
  assert.ok(
    interactionApp.__elements
      .get("day-tabs")
      .innerHTML.includes('data-view="saturday"'),
  );
  changeDayTarget(interactionApp, "saturday", "legs");
  assert.equal(
    interactionApp.Basement45.getState().cycles.find(
      (cycle) =>
        cycle.id ===
        interactionApp.Basement45.getState().week.days.saturday.cycleId,
    ).target,
    "legs",
    interactionApp.__elements.get("toast").textContent,
  );
  assert.equal(
    interactionApp.Basement45.getState().week.days.saturday.target,
    "legs",
  );
  assert.deepEqual(Array.from(interactionApp.Basement45.validateWeek()), []);

  const hiddenFromNextWeek =
    interactionApp.Basement45.getState().week.days.friday.circuits[2].first
      .exerciseId;
  clickAction(interactionApp, "toggle-hide-library", {
    exerciseId: hiddenFromNextWeek,
  });
  interactionApp.__elements.get("new-week-button")._listeners.click[0]();
  const nextWeekIds = Object.values(
    interactionApp.Basement45.getState().week.days,
  ).flatMap((day) =>
    day.circuits.flatMap((circuit) => [
      circuit.first.exerciseId,
      circuit.second.exerciseId,
      ...circuit.extras.map((assignment) => assignment.exerciseId),
    ]),
  );
  assert.ok(
    !nextWeekIds.includes(hiddenFromNextWeek),
    "hidden exercises must not be recommended",
  );

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
  assert.ok(
    interactionApp.__elements
      .get("file-status")
      .textContent.includes("workouts.json"),
  );
  assert.equal(
    JSON.parse(directFileContents).exerciseLibrary.find(
      (exercise) => exercise.id === noteExerciseId,
    ).recommendation_preference,
    1,
  );

  let roundTripState;
  for (let sequence = 0; sequence < 10; sequence += 1) {
    const multiWeekApp = launchApp();
    for (let week = 2; week <= 15; week += 1) {
      const expectedWeekStartCycleId =
        multiWeekApp.Basement45.getState().nextCycleId;
      const newWeekButton = multiWeekApp.__elements.get("new-week-button");
      newWeekButton._listeners.click[0]();
      const current = multiWeekApp.Basement45.getState();
      assert.equal(
        current.weekNumber,
        week,
        multiWeekApp.__elements.get("toast").textContent,
      );
      assert.equal(current.weekStartCycleId, expectedWeekStartCycleId);
      assert.deepEqual(Array.from(current.week.restDayIds), []);
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
  assert.equal(
    reloadedApp.Basement45.getState().weekNumber,
    15,
    "local JSON state should survive a reload",
  );

  const separateCoreState = JSON.parse(JSON.stringify(roundTripState));
  delete separateCoreState.cooldownExercises;
  for (const [dayId, day] of Object.entries(separateCoreState.week.days)) {
    delete day.cooldownChecklist;
    day.coreCompleted = dayId === "monday";
  }
  const migratedCoreApp = launchApp(JSON.stringify(separateCoreState));
  const migratedCoreState = migratedCoreApp.Basement45.getState();
  assert.equal(migratedCoreState.cooldownExercises[0].id, "core");
  assert.equal(migratedCoreState.cooldownExercises[0].label, "5 core");
  assert.equal(
    migratedCoreState.week.days.monday.cooldownChecklist.core,
    true,
    "the former standalone Core completion should migrate into the cool-down checklist",
  );
  assert.equal(
    Object.hasOwn(migratedCoreState.week.days.monday, "coreCompleted"),
    false,
  );

  const duplicateCoreState = JSON.parse(JSON.stringify(roundTripState));
  duplicateCoreState.cooldownExercises = [
    { id: "core", label: "Core complete" },
    { id: "cooldown-1", label: "5 core" },
  ];
  for (const [dayId, day] of Object.entries(duplicateCoreState.week.days)) {
    day.cooldownChecklist = {
      core: false,
      "cooldown-1": dayId === "monday",
    };
  }
  const deduplicatedCoreApp = launchApp(JSON.stringify(duplicateCoreState));
  const deduplicatedCoreState = deduplicatedCoreApp.Basement45.getState();
  assert.deepEqual(
    Array.from(deduplicatedCoreState.cooldownExercises, (exercise) => ({
      id: exercise.id,
      label: exercise.label,
    })),
    [{ id: "core", label: "5 core" }],
    "Core complete and 5 core should collapse into one 5 core cool-down",
  );
  assert.equal(
    deduplicatedCoreState.week.days.monday.cooldownChecklist.core,
    true,
    "deduplicating the core cool-down should preserve completion",
  );

  const retiredTargetState = JSON.parse(JSON.stringify(roundTripState));
  retiredTargetState.cycles.unshift({
    id: "retired-arms-cycle",
    name: "Retired upper cycle",
    target: "arms_upper",
    bodyParts: [],
    description: "Legacy Arms & upper cycle",
    circuitExerciseCounts: [2, 2, 2],
    lockedAssignments: [],
  });
  retiredTargetState.weekStartCycleId = "retired-arms-cycle";
  retiredTargetState.week.startCycleId = "retired-arms-cycle";
  const retiredTargetApp = launchApp(JSON.stringify(retiredTargetState));
  const migratedTargetState = retiredTargetApp.Basement45.getState();
  assert.equal(migratedTargetState.weekNumber, retiredTargetState.weekNumber);
  assert.equal(migratedTargetState.cycles.length, 4);
  assert.ok(
    migratedTargetState.cycles.every((cycle) => cycle.target !== "arms_upper"),
    "legacy Arms & upper cycles should be removed from current v18 state",
  );
  assert.deepEqual(Array.from(retiredTargetApp.Basement45.validateWeek()), []);

  const overdueState = JSON.parse(JSON.stringify(roundTripState));
  overdueState.week.days.monday.preChecklist = {
    stretch: true,
    pushups: true,
    pullups: true,
  };
  overdueState.week.days.monday.timer = {
    durationMs: 45 * 60 * 1000,
    elapsedMs: 5 * 60 * 1000,
    startedAt: null,
  };
  const overdueApp = launchApp(JSON.stringify(overdueState));
  assert.equal(overdueApp.__elements.get("timer-toggle").textContent, "Resume");
  assert.equal(
    (
      overdueApp.__elements
        .get("workout-view")
        .innerHTML.match(/class="round-check is-overdue"/g) || []
    ).length,
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
    (
      scaledDeadlineApp.__elements
        .get("workout-view")
        .innerHTML.match(/class="round-check is-overdue"/g) || []
    ).length,
    0,
    "round deadlines should scale when more workout time is added",
  );

  const timerApp = launchApp();
  for (const item of ["stretch", "pushups", "pullups"]) {
    changeAction(timerApp, "daily-check", { day: "monday", item }, true);
  }
  assert.ok(
    timerApp.Basement45.getState().week.days.monday.timer.startedAt,
    "finishing the warm-up should start the circuit timer without another click",
  );
  for (let circuit = 0; circuit < 3; circuit += 1) {
    for (let round = 0; round < 3; round += 1) {
      changeAction(
        timerApp,
        "complete-round",
        { day: "monday", circuit: String(circuit), round: String(round) },
        true,
      );
    }
  }
  assert.equal(
    timerApp.Basement45.getState().week.days.monday.timer.startedAt,
    null,
  );
  assert.ok(
    timerApp.__elements
      .get("workout-view")
      .innerHTML.includes("3 of 3 circuits complete"),
  );

  const loadProgressState = timerApp.Basement45.getState();
  const progressedExerciseId =
    loadProgressState.week.days.monday.circuits[0].first.exerciseId;
  loadProgressState.exerciseState[progressedExerciseId].weight = "25";
  loadProgressState.exerciseState[progressedExerciseId].loadProgressCount = 4;
  const loadProgressApp = launchApp(JSON.stringify(loadProgressState));
  assert.ok(
    loadProgressApp.__elements
      .get("workout-view")
      .innerHTML.includes('data-action="increase-load"'),
  );
  assert.equal(
    (
      loadProgressApp.__elements
        .get("workout-view")
        .innerHTML.match(/load-progress-mark is-complete/g) || []
    ).length >= 4,
    true,
  );
  loadProgressApp.prompt = () => "30";
  clickAction(loadProgressApp, "increase-load", {
    exerciseId: progressedExerciseId,
  });
  assert.equal(
    loadProgressApp.Basement45.getState().exerciseState[progressedExerciseId]
      .weight,
    "30",
  );
  assert.equal(
    loadProgressApp.Basement45.getState().exerciseState[progressedExerciseId]
      .loadProgressCount,
    0,
  );
  assert.ok(
    !loadProgressApp.__elements
      .get("workout-view")
      .innerHTML.includes('data-action="increase-load"'),
  );

  assert.equal(exampleSave.schemaVersion, 7);
  const legacyState = JSON.parse(JSON.stringify(roundTripState));
  legacyState.version = 17;
  const freshFromLegacyApp = launchApp(JSON.stringify(legacyState));
  assert.equal(freshFromLegacyApp.Basement45.getState().version, 18);
  assert.equal(freshFromLegacyApp.Basement45.getState().weekNumber, 1);
  assert.equal(freshFromLegacyApp.Basement45.getState().cycles.length, 4);
  assert.deepEqual(
    Array.from(freshFromLegacyApp.Basement45.validateWeek()),
    [],
  );

  const rejectedLegacyFileApp = launchApp();
  const beforeRejectedLoad = rejectedLegacyFileApp.Basement45.getState();
  await rejectedLegacyFileApp.__elements
    .get("load-input")
    ._listeners.change[0]({
      target: {
        files: [
          {
            name: "legacy-v7.json",
            async text() {
              return JSON.stringify(exampleSave);
            },
          },
        ],
      },
    });
  assert.equal(
    rejectedLegacyFileApp.__elements.get("toast").textContent,
    "This cycle-based version requires a fresh v18 workout file.",
  );
  assert.equal(
    rejectedLegacyFileApp.Basement45.getState().weekStartedAt,
    beforeRejectedLoad.weekStartedAt,
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
              schemaVersion: 18,
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
  assert.ok(
    portableApp.Basement45.exercises.some(
      (exercise) => exercise.id === "portable-missing-exercise",
    ),
  );

  console.log(
    "Smoke test passed randomized starts, 140 continuous cycle weeks, rest-day shifting, cross-week continuation, cycle locks and management, target/body-part generation, replacement filters and fuzzy search, fresh-v18 and portable JSON handling, favorites with circuit setup scores, effectiveness scoring, expandable optional activators, load basis and progression, master equipment, equipment varieties, recommendation feedback, automatic/adjustable workout timing, direct-file save, editing, and settings.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
