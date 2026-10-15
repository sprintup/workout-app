import { gateways } from "../../gateways/registry";
import { COOLDOWN_INTERVAL_OPTIONS, MAX_CIRCUIT_REP_BUDGET, MIN_CIRCUIT_REP_BUDGET } from "../../config/constants";
import { cycleDisplayName, cycleTargetLabel } from "../../entities/cycles";
import { cooldownIntervalLabel, normalizeCooldownInterval } from "../../entities/routines";
import { splitForId } from "../../services/cycle-schedule";
import { bodyPartCoverage } from "../../services/targeting";
import { escapeHtml } from "../html";
import { ui } from "../ui-state";


export function renderCooldownIntervalField(exercise) {
  const interval = normalizeCooldownInterval(exercise.intervalDays);
  const options = COOLDOWN_INTERVAL_OPTIONS.includes(interval)
    ? COOLDOWN_INTERVAL_OPTIONS
    : [...COOLDOWN_INTERVAL_OPTIONS, interval].sort((a, b) => a - b);
  return `<label class="form-field routine-interval-field"><span>Schedule</span><select data-cooldown-setting="intervalDays" data-cooldown-id="${escapeHtml(exercise.id)}" aria-label="How often to schedule ${escapeHtml(exercise.label)}">
    ${options.map((value) => `<option value="${value}" ${value === interval ? "selected" : ""}>${cooldownIntervalLabel(value)}</option>`).join("")}
  </select></label>`;
}


export function renderRoutineSettingsPanel(kind, exercises) {
  const warmup = kind === "warmup";
  const title = warmup ? "Warm-up exercises" : "Cool-down exercises";
  const adjective = warmup ? "Warm-up" : "Cool-down";
  const description = warmup
    ? "Shown before the circuits on every training day."
    : "Shown after the circuits and excluded from workout time. Exercises scheduled every few days stay hidden until they are due again.";
  const emptyMessage = warmup
    ? "No warm-up exercises. Add one whenever you want a pre-circuit checklist."
    : "No cool-down exercises. Add one whenever you want a post-workout checklist.";
  return `<section class="routine-settings-panel ${kind}-settings-panel">
    <header>
      <div><strong>${title}</strong><span>${description}</span></div>
      <button class="button button-quiet" type="button" data-action="add-${kind}-exercise" ${exercises.length >= 24 ? "disabled" : ""}>+ Add ${kind === "warmup" ? "warm-up" : "cool-down"} exercise</button>
    </header>
    <div class="routine-settings-list">
      ${
        exercises.length
          ? exercises
              .map(
                (exercise, index) =>
                  `<div class="routine-settings-row">
                    <span class="routine-order">${index + 1}</span>
                    <label class="form-field"><span>Exercise ${index + 1}</span><input data-${kind}-setting="label" data-${kind}-id="${escapeHtml(exercise.id)}" maxlength="100" value="${escapeHtml(exercise.label)}" aria-label="${adjective} exercise ${index + 1}" /></label>
                    ${warmup ? "" : renderCooldownIntervalField(exercise)}
                    <div class="routine-row-actions">
                      <button type="button" data-action="move-${kind}-exercise" data-${kind}-id="${escapeHtml(exercise.id)}" data-direction="-1" ${index === 0 ? "disabled" : ""} aria-label="Move ${escapeHtml(exercise.label)} earlier">&uarr;</button>
                      <button type="button" data-action="move-${kind}-exercise" data-${kind}-id="${escapeHtml(exercise.id)}" data-direction="1" ${index === exercises.length - 1 ? "disabled" : ""} aria-label="Move ${escapeHtml(exercise.label)} later">&darr;</button>
                      <button class="routine-delete" type="button" data-action="delete-${kind}-exercise" data-${kind}-id="${escapeHtml(exercise.id)}" aria-label="Delete ${escapeHtml(exercise.label)}">Delete</button>
                    </div>
                  </div>`,
              )
              .join("")
          : `<div class="routine-empty">${emptyMessage}</div>`
      }
    </div>
  </section>`;
}


export function renderSettings() {
  const coverage = bodyPartCoverage();
  const activeSplit = splitForId(gateways.cycles.activeSplitId());
  document.getElementById("settings-view").innerHTML = `
    <div class="content-frame">
      <header class="view-header">
        <div>
          <span class="eyebrow">Continuous training rotation</span>
          <h1>Workout <span>cycles</span></h1>
          <p class="view-subtitle">Choose a split, define its reusable cycles, and arrange a 1&ndash;16 day rotation independent of weekdays. Scheduled rest entries advance the rotation; calendar rest days defer the pending entry.</p>
        </div>
      </header>
      <section class="rep-budget-settings" aria-labelledby="rep-budget-title">
        <div>
          <strong id="rep-budget-title">Circuit rep budget</strong>
          <span>Used when workouts are generated. Two-sided exercises count once for each side; manual circuit edits remain flexible.</span>
        </div>
        <label>
          <span>Reps per round</span>
          <input id="circuit-rep-budget" type="number" min="${MIN_CIRCUIT_REP_BUDGET}" max="${MAX_CIRCUIT_REP_BUDGET}" step="3" value="${gateways.preferences.circuitRepBudget()}" />
        </label>
      </section>
      ${renderRoutineSettingsPanel("warmup", gateways.routines.warmups())}
      <hr class="settings-section-divider" aria-hidden="true" />
      <div class="cycle-section-heading">
        <div><span class="eyebrow">Rotation sequence</span><h2>Active split</h2></div>
        <div class="cycle-section-actions">
          <span class="current-split-status">Current split <strong>${activeSplit ? escapeHtml(activeSplit.name) : "Custom rotation"}</strong></span>
          <button class="button button-primary" type="button" data-action="open-split-dialog">+ Edit splits</button>
        </div>
      </div>
      <div class="cycle-sequence-summary">
        <strong>${activeSplit ? `${escapeHtml(activeSplit.name)} &middot; ` : ""}${gateways.cycles.all().length} rotation entr${gateways.cycles.all().length === 1 ? "y" : "ies"}</strong>
        <span>${gateways.cycles.all()
          .map((cycle, index) => {
            const name = cycleDisplayName(cycle, index);
            const target = cycleTargetLabel(cycle);
            return escapeHtml(name === target ? name : `${name}: ${target}`);
          })
          .join(" &rarr; ")}</span>
        <button class="coverage-toggle" type="button" data-action="toggle-body-part-coverage" aria-expanded="${ui.showBodyPartCoverage}">Body-part coverage</button>
      </div>
      ${
        ui.showBodyPartCoverage
          ? `<section class="body-part-coverage-panel" aria-label="Body-part coverage throughout cycles">
              <header><strong>Body-part coverage</strong><span>Number of cycles that target each body part; warm-up and cool-down items are excluded</span></header>
              <div class="body-part-coverage-list">
                ${coverage
                  .map(
                    ({ bodyPart, count }) =>
                      `<div class="body-part-coverage-item" data-body-part-coverage="${escapeHtml(bodyPart)}"><span>${escapeHtml(bodyPart)}</span><strong>${count}</strong></div>`,
                  )
                  .join("")}
              </div>
            </section>`
          : ""
      }
      <hr class="settings-section-divider" aria-hidden="true" />
      ${renderRoutineSettingsPanel("cooldown", gateways.routines.cooldowns())}
    </div>`;
}
