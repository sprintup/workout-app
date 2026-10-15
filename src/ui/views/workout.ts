import { gateways } from "../../gateways/registry";
import { DEFAULT_CIRCUIT_REP_BUDGET } from "../../config/constants";
import { DAY_CONFIG } from "../../data/training";
import { isCircuitComplete, mainAssignments } from "../../entities/circuits";
import { cycleDisplayName, cycleTargetLabel, isRestCycle } from "../../entities/cycles";
import { exerciseEffectivenessScore } from "../../entities/exercise";
import { roundDeadlineMs, timerDuration, timerElapsed } from "../../entities/timer";
import { libraryTotalCount } from "../../services/exercise-catalog";
import { favoritesForSlot, isFavoriteCircuit } from "../../services/favorites";
import { assignmentRepBasis, assignmentReps, circuitTotalReps } from "../../services/reps";
import { isCooldownDue, nextCooldownDueKey } from "../../services/routine-schedule";
import { targetBodyPartsForDay } from "../../services/targeting";
import { displayDay } from "../../services/week";
import { formatDueDate } from "../format";
import { escapeHtml } from "../html";
import { ICONS } from "../icons";
import { updateWorkoutTimer } from "../timer-view";
import { ui } from "../ui-state";


export function renderTabs() {
  const tabs = DAY_CONFIG.map((baseDay) => {
    const day = displayDay(baseDay);
    const dayData = gateways.week.current().days[day.id];
    const completeCount = dayData.rest
      ? 0
      : dayData.circuits.filter(isCircuitComplete).length;
    const active = ui.currentView === day.id;
    return `
      <button class="day-tab ${dayData.rest ? "is-rest" : ""} ${active ? "active" : ""}" type="button" data-view="${day.id}" aria-current="${active ? "page" : "false"}">
        <span class="day-short">${day.short}</span>
        <span><strong>${day.name}</strong><small>${dayData.rest ? (day.rotationRest ? `${escapeHtml(day.cycleName)} &middot; Scheduled rest` : `Rest &middot; ${escapeHtml(day.cycleName)} waits`) : `${escapeHtml(day.cycleName)} &middot; ${escapeHtml(day.focus)}`}</small></span>
        <span class="tab-status ${completeCount === 3 ? "complete" : ""}" aria-label="${dayData.rest ? "Rest day" : `${completeCount} of 3 circuits complete`}">${dayData.rest ? "&mdash;" : "&#10003;"}</span>
      </button>`;
  }).join("");

  const libraryActive = ui.currentView === "library";
  document.getElementById("day-tabs").innerHTML = `${tabs}
    <button class="day-tab library-tab ${libraryActive ? "active" : ""}" type="button" data-view="library" aria-current="${libraryActive ? "page" : "false"}">
      <span class="day-short">${ICONS.book}</span>
      <span><strong>Exercise library</strong><small>${libraryTotalCount()} total exercises</small></span>
      <span class="tab-status">${ICONS.arrow}</span>
    </button>
    <button class="day-tab library-tab ${ui.currentView === "settings" ? "active" : ""}" type="button" data-view="settings" aria-current="${ui.currentView === "settings" ? "page" : "false"}">
      <span class="day-short">&#9881;</span>
      <span><strong>Settings</strong><small>Cycles, targets, and descriptions</small></span>
      <span class="tab-status">${ICONS.arrow}</span>
    </button>`;
}


export function cautionText(exercise) {
  if (exercise.shoulder_caution && exercise.back_caution)
    return "Shoulder + back aware";
  if (exercise.shoulder_caution) return "Shoulder aware";
  if (exercise.back_caution) return "Back aware";
  return "";
}


export function renderExerciseItem(assignment, context) {
  const exercise = gateways.exercises.find(assignment.exerciseId);
  const settings = gateways.exercises.stats(exercise.id);
  const fixed = assignment.fixed || exercise.always_locked;
  const isOptionalActivator = context.position === "optionalActivator";
  const itemClass = `${isOptionalActivator ? "exercise-item activator-item" : "exercise-item"}${gateways.exercises.isHidden(exercise.id) ? " is-hidden" : ""}`;
  const loadProgressMarkup = `<div class="load-progression" aria-label="${settings.loadProgressCount} of 4 workouts completed at this load">
    <span class="load-progress-marks" aria-hidden="true">
      ${[0, 1, 2, 3]
        .map(
          (index) =>
            `<span class="load-progress-mark ${index < settings.loadProgressCount ? "is-complete" : ""}">${index < settings.loadProgressCount ? "✓" : ""}</span>`,
        )
        .join("")}
    </span>
    ${settings.loadProgressCount >= 4 ? `<button class="increase-load-button" type="button" data-action="increase-load" data-exercise-id="${exercise.id}">Increase load</button>` : ""}
  </div>`;
  const effectivenessFieldMarkup = `<label class="effectiveness-score effectiveness-score-field">
    <span>Effectiveness</span>
    <input type="number" min="1" max="5" step="1" value="${exerciseEffectivenessScore(exercise)}" data-exercise-setting="effectivenessScore" data-exercise-id="${exercise.id}" aria-label="Effectiveness score from 1 to 5 for ${escapeHtml(exercise.name)}" />
  </label>`;
  const reps = assignmentReps(assignment);
  const repBasis = assignmentRepBasis(assignment);
  const repFieldMarkup = isOptionalActivator
    ? `<label class="compact-field measure-field">
        <select data-setting="measureType" data-exercise-id="${exercise.id}" aria-label="Measure repetitions or seconds for ${escapeHtml(exercise.name)}">
          <option value="reps" ${settings.measureType === "reps" ? "selected" : ""}>Reps</option>
          <option value="seconds" ${settings.measureType === "seconds" ? "selected" : ""}>Seconds</option>
        </select>
        <input data-setting="reps" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.reps)}" aria-label="Repetitions for ${escapeHtml(exercise.name)}" />
      </label>`
    : `<label class="compact-field measure-field circuit-rep-field">
        <span>Reps</span>
        <input type="number" min="1" max="120" step="1" inputmode="numeric" data-assignment-setting="reps" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" data-position="${context.position}" value="${reps}" aria-label="Repetitions for ${escapeHtml(exercise.name)}" />
        <select class="rep-basis-select ${repBasis === "per_side" ? "basis-two-side" : "basis-one-side"}" data-assignment-setting="repBasis" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" data-position="${context.position}" aria-label="Whether repetitions for ${escapeHtml(exercise.name)} are one-side or two-side">
          <option value="total" ${repBasis === "total" ? "selected" : ""}>one-side</option>
          <option value="per_side" ${repBasis === "per_side" ? "selected" : ""}>two-side</option>
        </select>
      </label>`;
  const exerciseTitleMarkup = exercise.instruction_url
    ? `<a class="exercise-demo-link" href="${escapeHtml(exercise.instruction_url)}" target="_blank" rel="noreferrer" title="View demo for ${escapeHtml(exercise.name)}">${escapeHtml(exercise.name)} ${ICONS.external}</a>`
    : escapeHtml(exercise.name);

  return `
    <div class="${itemClass}">
      <div class="exercise-topline">
        <span class="exercise-tools">
          ${effectivenessFieldMarkup}
          ${
            isOptionalActivator
              ? `<label class="bridge-check" title="Mark the optional total-body activator complete">
                  <input type="checkbox" data-action="complete-optional-activator" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" ${context.activatorCompleted ? "checked" : ""} />
                  <span>Done</span>
                </label>`
              : ""
          }
          ${
            !isOptionalActivator
              ? `<button class="mini-button" type="button" data-action="move-exercise" data-direction="-1" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" data-position="${context.position}" title="Move exercise up" aria-label="Move ${escapeHtml(exercise.name)} up" ${context.orderIndex === 0 ? "disabled" : ""}>↑</button>
                 <button class="mini-button" type="button" data-action="move-exercise" data-direction="1" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" data-position="${context.position}" title="Move exercise down" aria-label="Move ${escapeHtml(exercise.name)} down" ${context.orderIndex === context.exerciseCount - 1 ? "disabled" : ""}>↓</button>`
              : ""
          }
          <span class="preference-controls" aria-label="Reversible effectiveness adjustment for ${escapeHtml(exercise.name)}">
            <button class="feedback-button ${settings.preference === 1 ? "active" : ""}" type="button" data-action="set-preference" data-exercise-id="${exercise.id}" data-value="1" title="${settings.preference === 1 ? "Remove the +1 effectiveness adjustment" : "Apply a +1 effectiveness adjustment"}" aria-label="${settings.preference === 1 ? `Remove the effectiveness increase from ${escapeHtml(exercise.name)}` : `Increase ${escapeHtml(exercise.name)} effectiveness by 1`}" aria-pressed="${settings.preference === 1}">${ICONS.thumbUp}</button>
            <button class="feedback-button ${settings.preference === -1 ? "active negative" : ""}" type="button" data-action="set-preference" data-exercise-id="${exercise.id}" data-value="-1" title="${settings.preference === -1 ? "Remove the -1 effectiveness adjustment" : "Apply a -1 effectiveness adjustment"}" aria-label="${settings.preference === -1 ? `Remove the effectiveness decrease from ${escapeHtml(exercise.name)}` : `Decrease ${escapeHtml(exercise.name)} effectiveness by 1`}" aria-pressed="${settings.preference === -1}">${ICONS.thumbDown}</button>
          </span>
          <button
            class="mini-button ${assignment.locked ? "active" : ""}"
            type="button"
            data-action="toggle-lock"
            data-day="${context.dayId}"
            data-circuit="${context.circuitIndex}"
            data-position="${context.position}"
            title="${fixed ? "This user-defined exercise is fixed" : assignment.locked ? "Unlock this exercise" : "Keep this exercise in future weeks"}"
            aria-label="${fixed ? "Fixed exercise" : assignment.locked ? `Unlock ${escapeHtml(exercise.name)}` : `Lock ${escapeHtml(exercise.name)}`}"
            ${fixed ? "disabled" : ""}
          >${assignment.locked ? ICONS.lock : ICONS.unlock}</button>
          <button
            class="mini-button"
            type="button"
            data-action="random-replace"
            data-day="${context.dayId}"
            data-circuit="${context.circuitIndex}"
            data-position="${context.position}"
            title="Choose a random eligible replacement"
            aria-label="Randomly replace ${escapeHtml(exercise.name)}"
            ${assignment.locked ? "disabled" : ""}
          >${ICONS.refresh}</button>
          <button
            class="mini-button"
            type="button"
            data-action="replace"
            data-day="${context.dayId}"
            data-circuit="${context.circuitIndex}"
            data-position="${context.position}"
            title="Choose a replacement from the library"
            aria-label="Choose a replacement for ${escapeHtml(exercise.name)}"
            ${assignment.locked ? "disabled" : ""}
          >${ICONS.book}</button>
          <button
            class="mini-button"
            type="button"
            data-action="edit-workout-exercise"
            data-exercise-id="${exercise.id}"
            title="Edit exercise details"
            aria-label="Edit ${escapeHtml(exercise.name)}"
          >${ICONS.pencil}</button>
          <button
            class="mini-button ${gateways.exercises.isHidden(exercise.id) ? "active danger" : ""}"
            type="button"
            data-action="toggle-hide-workout"
            data-exercise-id="${exercise.id}"
            data-day="${context.dayId}"
            data-circuit="${context.circuitIndex}"
            data-position="${context.position}"
            title="${gateways.exercises.isHidden(exercise.id) ? "Restore to future recommendations" : "Hide from future recommendations"}"
            aria-label="${gateways.exercises.isHidden(exercise.id) ? `Restore ${escapeHtml(exercise.name)}` : `Hide ${escapeHtml(exercise.name)} from recommendations`}"
            ${fixed ? "disabled" : ""}
          >${ICONS.eyeOff}</button>
          ${
            !isOptionalActivator
              ? `<button class="mini-button danger" type="button" data-action="delete-circuit-exercise" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" data-position="${context.position}" title="Remove exercise from this circuit" aria-label="Remove ${escapeHtml(exercise.name)} from this circuit" ${context.exerciseCount <= 2 || assignment.locked ? "disabled" : ""}>×</button>`
              : ""
          }
        </span>
        <h3 class="exercise-name">${exerciseTitleMarkup}</h3>
      </div>
      <div class="exercise-fields">
        ${repFieldMarkup}
        <div class="load-control">
          <label class="compact-field load-field ${String(settings.weight).trim() ? "has-recommended-weight" : ""}">
            <span>Load</span>
            <input data-setting="weight" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.weight)}" placeholder="—" inputmode="decimal" aria-label="Weight for ${escapeHtml(exercise.name)}" />
            <small>lb</small>
            <select class="load-basis-select ${settings.loadBasis === "each" ? "basis-each" : "basis-total"}" data-setting="loadBasis" data-exercise-id="${exercise.id}" aria-label="Whether the load for ${escapeHtml(exercise.name)} is total or for each side">
              <option value="total" ${settings.loadBasis === "total" ? "selected" : ""}>total</option>
              <option value="each" ${settings.loadBasis === "each" ? "selected" : ""}>each</option>
            </select>
          </label>
          ${loadProgressMarkup}
        </div>
      </div>
      <label class="exercise-note"><span>Notes</span><input data-setting="notes" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.notes)}" maxlength="1000" placeholder="Add a cue or note" aria-label="Notes for ${escapeHtml(exercise.name)}" /></label>
    </div>`;
}


export function circuitTargetMuscles(dayId, circuit) {
  const workedMuscles = new Set(
    mainAssignments(circuit).flatMap(
      (assignment) =>
        gateways.exercises.find(assignment.exerciseId)?.body_parts || [],
    ),
  );
  return targetBodyPartsForDay(dayId).filter((part) =>
    workedMuscles.has(part),
  );
}


export function renderCircuit(dayId, circuit, circuitIndex) {
  const assignments = mainAssignments(circuit);
  const totalReps = circuitTotalReps(circuit);
  const meetsRepGoal = totalReps === DEFAULT_CIRCUIT_REP_BUDGET;
  const circuitMuscles = circuitTargetMuscles(dayId, circuit);
  const elapsed = timerElapsed(gateways.week.current().days[dayId]);
  const exerciseItems = assignments
    .map((assignment, index) => {
      const position =
        index === 0 ? "first" : index === 1 ? "second" : `extra-${index - 2}`;
      return renderExerciseItem(assignment, {
        dayId,
        circuitIndex,
        position,
        orderIndex: index,
        exerciseCount: assignments.length,
      });
    })
    .join('<hr class="exercise-divider" aria-hidden="true" />');
  const lastExtra = circuit.extras[circuit.extras.length - 1];
  const canRemove = circuit.extras.length > 0 && !lastExtra?.locked;
  const complete = isCircuitComplete(circuit);
  const activatorKey = `${dayId}-${circuitIndex}`;
  const activatorExpanded = ui.expandedActivators.has(activatorKey);
  const optionalActivatorClass = [
    "optional-activator-panel",
    circuit.optionalActivatorCompleted && "is-complete",
    meetsRepGoal && "is-rep-goal",
    activatorExpanded && "is-expanded",
  ]
    .filter(Boolean)
    .join(" ");
  const activatorExercise = gateways.exercises.find(
    circuit.optionalActivator.exerciseId,
  );
  const optionalActivatorMarkup = `<section class="${optionalActivatorClass}">
    <button class="optional-activator-toggle" type="button" data-action="toggle-optional-activator-pane" data-day="${dayId}" data-circuit="${circuitIndex}" aria-expanded="${activatorExpanded}" aria-controls="optional-activator-${dayId}-${circuitIndex}">
      <span class="optional-activator-status" aria-hidden="true">${circuit.optionalActivatorCompleted ? "✓" : ""}</span>
      <span class="optional-activator-copy"><strong>Optional total-body activator</strong><small>${escapeHtml(activatorExercise.name)}</small></span>
      <span class="optional-activator-chevron">${ICONS.arrow}</span>
    </button>
    ${
      activatorExpanded
        ? `<div id="optional-activator-${dayId}-${circuitIndex}" class="optional-activator-content">
            ${renderExerciseItem(circuit.optionalActivator, {
              dayId,
              circuitIndex,
              position: "optionalActivator",
              activatorCompleted: circuit.optionalActivatorCompleted,
            })}
          </div>`
        : ""
    }
  </section>`;
  const roundChecksMarkup = `<div class="round-checks" aria-label="Completed rounds for circuit ${circuit.number}">
    ${[0, 1, 2]
      .map(
        (
          round,
        ) => `<label class="round-check ${!circuit.roundsCompleted[round] && elapsed >= roundDeadlineMs(gateways.week.current().days[dayId], circuitIndex * 3 + round) ? "is-overdue" : ""}" data-global-round="${circuitIndex * 3 + round}">
          <input type="checkbox" data-action="complete-round" data-day="${dayId}" data-circuit="${circuitIndex}" data-round="${round}" ${circuit.roundsCompleted[round] ? "checked" : ""} />
          <span>Round ${round + 1}</span>
        </label>`,
      )
      .join("")}
  </div>`;
  return `
    <article class="circuit-card ${complete ? "is-complete" : ""}">
      <header class="circuit-header">
        <div class="circuit-number">
          <span class="number-badge">${circuit.number}</span>
          <span class="circuit-title"><span>Circuit ${circuit.number}</span><strong>${escapeHtml(circuit.category)}</strong><span class="circuit-muscle-list" aria-label="Muscles targeted in circuit ${circuit.number}">${circuitMuscles.map((part) => `<i data-circuit-muscle="${circuitIndex}:${escapeHtml(part)}">${escapeHtml(part)}</i>`).join("")}</span></span>
        </div>
        <div class="circuit-scaling">
          <button class="favorite-button ${isFavoriteCircuit(dayId, circuitIndex, circuit) ? "active" : ""}" type="button" data-action="toggle-favorite-circuit" data-day="${dayId}" data-circuit="${circuitIndex}" title="${isFavoriteCircuit(dayId, circuitIndex, circuit) ? "Remove this circuit from favorites" : "Save this circuit as a favorite"}" aria-label="${isFavoriteCircuit(dayId, circuitIndex, circuit) ? "Remove circuit from favorites" : "Favorite this circuit"}">${ICONS.star}</button>
          <button class="favorite-button" type="button" data-action="open-favorite-circuits" data-day="${dayId}" data-circuit="${circuitIndex}" title="Substitute a saved favorite circuit" aria-label="Substitute a favorite circuit" ${favoritesForSlot(dayId, circuitIndex).length ? "" : "disabled"}>${ICONS.favorites}</button>
          <span class="circuit-rep-total${meetsRepGoal ? "" : " is-off-target"}" title="${meetsRepGoal ? "Circuit meets the 30-rep goal" : "Adjust this circuit to 30 reps per round"}">${totalReps} reps / round &middot; ${totalReps * 3} total</span>
          <span class="rounds-badge">${assignments.length} exercises</span>
          <span class="scale-buttons">
            <button type="button" data-action="remove-round-exercise" data-day="${dayId}" data-circuit="${circuitIndex}" aria-label="Remove the last round exercise" title="Remove the last round exercise" ${canRemove ? "" : "disabled"}>−</button>
            <button type="button" data-action="add-round-exercise" data-day="${dayId}" data-circuit="${circuitIndex}" aria-label="Add a round exercise" title="Add a compatible round exercise" ${assignments.length >= 4 ? "disabled" : ""}>+</button>
          </span>
        </div>
      </header>
      <div class="circuit-body">
        ${optionalActivatorMarkup}
        ${roundChecksMarkup}
        <div class="exercise-cycle">${exerciseItems}</div>
      </div>
    </article>`;
}


export function renderDayCycleSelector(dayId, selectedCycleId) {
  const rotationEntries = gateways.cycles.all().map((cycle, index) => ({
    cycle,
    index,
  }));
  return `<label class="day-cycle-selector">
    <span>Cycle</span>
    <select data-day-cycle-select="true" data-day="${dayId}" aria-label="Workout cycle for ${escapeHtml(gateways.week.current().days[dayId].day)}">
      ${rotationEntries
        .map(({ cycle, index }) => {
          const name = cycleDisplayName(cycle, index);
          const target = cycleTargetLabel(cycle);
          const label = isRestCycle(cycle)
            ? `${name} — Entry ${index + 1}`
            : name === target
              ? name
              : `${name} — ${target}`;
          return `<option value="${cycle.id}" ${cycle.id === selectedCycleId ? "selected" : ""}>${escapeHtml(label)}</option>`;
        })
        .join("")}
    </select>
  </label>`;
}


export function renderWorkout(dayId) {
  const config = displayDay(DAY_CONFIG.find((day) => day.id === dayId));
  const day = gateways.week.current().days[dayId];
  if (day.rest) {
    const rotationRest = day.restSource === "rotation";
    const selectedCycleId = rotationRest ? day.cycleId : day.pendingCycleId;
    document.getElementById("workout-view").innerHTML = `
      <div class="content-frame rest-day-view">
        <header class="view-header">
          <div>
            <span class="eyebrow">${rotationRest ? "Rotation rest day" : "Cycle paused"}</span>
            <h1>${config.name} <span>&mdash; Rest day</span></h1>
            <p class="view-subtitle">${rotationRest ? `${escapeHtml(config.cycleName)} is part of the rotation, so the next entry advances to the following day.` : `${escapeHtml(config.cycleName)} remains next in the rotation and moves to the next available training day.`}</p>
          </div>
          <div class="workout-header-actions">
            ${renderDayCycleSelector(dayId, selectedCycleId)}
            ${rotationRest ? `<button class="button button-quiet" type="button" data-view="settings">Edit rotation</button>` : `<button class="button button-primary" type="button" data-action="toggle-rest-day" data-day="${dayId}">Train today instead</button>`}
          </div>
        </header>
        <section class="rest-day-panel">
          <span class="rest-day-mark" aria-hidden="true">&mdash;</span>
          <div><strong>${rotationRest ? "Scheduled recovery" : "Recover today"}</strong><p>${rotationRest ? "This rest entry was consumed and the rotation continues with the next entry." : "No cycle was consumed. Every later calendar day has shifted forward automatically."}</p></div>
        </section>
      </div>`;
    updateWorkoutTimer();
    return;
  }
  const completed = day.circuits.filter(isCircuitComplete).length;
  const beforeCircuitsComplete = Object.values(day.preChecklist).every(
    Boolean,
  );
  const dueCooldownExercises = gateways.routines.cooldowns().filter((exercise) =>
    isCooldownDue(exercise, dayId),
  );
  const restingCooldownExercises = gateways.routines.cooldowns().filter(
    (exercise) => !isCooldownDue(exercise, dayId),
  );
  const cooldownComplete = dueCooldownExercises.every(
    (exercise) => day.cooldownChecklist[exercise.id],
  );
  const dayTargetMuscles = targetBodyPartsForDay(dayId);

  document.getElementById("workout-view").innerHTML = `
    <div class="content-frame workout-content ${!gateways.routines.warmups().length || beforeCircuitsComplete ? "" : "has-pending-warmup"}">
      <header class="view-header">
        <div>
          <span class="eyebrow">${escapeHtml(config.cycleName)} &middot; ${completed} of 3 circuits complete</span>
          <h1>${config.name} <span>— ${escapeHtml(config.focus)}</span></h1>
          <p id="timer-deadline-summary" class="view-subtitle">The nine round deadlines scale evenly across your ${timerDuration(day) / 60000}-minute workout after the warm-up.</p>
        </div>
        <div class="workout-header-actions">
          ${renderDayCycleSelector(dayId, day.cycleId)}
          <button class="button button-quiet" type="button" data-action="toggle-rest-day" data-day="${dayId}" title="Make ${config.name} a rest day and shift the cycle sequence forward">Rest today</button>
          <div class="session-chip">${ICONS.clock}<span><span>Target time</span><strong id="timer-target-summary">About ${timerDuration(day) / 60000} minutes</strong></span></div>
        </div>
      </header>
      <div class="day-guidance day-muscle-summary">${ICONS.info}<div><strong>Target muscles</strong><span class="day-muscle-list">${dayTargetMuscles.map((part) => `<i data-day-target-muscle="${escapeHtml(part)}">${escapeHtml(part)}</i>`).join("")}</span></div></div>
      ${
        gateways.routines.warmups().length
          ? `<div class="routine-row pre-routine ${beforeCircuitsComplete ? "is-complete" : ""}" aria-label="Warm-up checklist">
              <strong>Warm-up</strong>
              ${gateways.routines.warmups()
                .map(
                  (exercise) =>
                    `<label><input type="checkbox" data-action="daily-check" data-day="${dayId}" data-item="${escapeHtml(exercise.id)}" ${day.preChecklist[exercise.id] ? "checked" : ""} /> ${escapeHtml(exercise.label)}</label>`,
                )
                .join("")}
            </div>`
          : ""
      }
      <div class="circuit-grid">
        ${day.circuits.map((circuit, index) => renderCircuit(dayId, circuit, index)).join("")}
      </div>
      ${
        gateways.routines.cooldowns().length
          ? `<div class="routine-row cooldown-routine ${cooldownComplete ? "is-complete" : ""}" aria-label="Cool-down checklist">
              <strong>Cool-down</strong>
              ${dueCooldownExercises
                .map(
                  (exercise) =>
                    `<label><input type="checkbox" data-action="cooldown-check" data-day="${dayId}" data-item="${escapeHtml(exercise.id)}" ${day.cooldownChecklist[exercise.id] ? "checked" : ""} /> ${escapeHtml(exercise.label)}</label>`,
                )
                .join("")}
              ${
                restingCooldownExercises.length
                  ? `<span class="cooldown-resting">Not due today: ${restingCooldownExercises
                      .map(
                        (exercise) =>
                          `${escapeHtml(exercise.label)} (next ${escapeHtml(formatDueDate(nextCooldownDueKey(exercise, dayId)))})`,
                      )
                      .join(", ")}</span>`
                  : ""
              }
            </div>`
          : ""
      }
    </div>`;
  updateWorkoutTimer();
}
