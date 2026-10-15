import { gateways } from "../../gateways/registry";
import { SPLIT_PRESETS } from "../../data/training";
import { allReusableCycles, allSplitDefinitions, reusableCycleForId, splitForId } from "../../services/cycle-schedule";
import { bodyPartOptions } from "../../services/exercise-catalog";
import { escapeHtml } from "../html";
import { ui } from "../ui-state";
import { dialogById, inputById } from "../dom";


export function splitEntryDetails(entryId) {
  if (entryId === "rest") return { label: "Rest", bodyParts: [] };
  const cycle = reusableCycleForId(entryId);
  return {
    label: cycle?.name || entryId,
    bodyParts: cycle?.bodyParts || [],
  };
}


export function splitCycleOptions(selectedCycleId) {
  return [
    `<option value="rest" ${selectedCycleId === "rest" ? "selected" : ""}>Rest day</option>`,
    ...allReusableCycles().map(
      (cycle) =>
        `<option value="${escapeHtml(cycle.id)}" ${selectedCycleId === cycle.id ? "selected" : ""}>${escapeHtml(cycle.name)}${cycle.template ? " (template)" : ""}</option>`,
    ),
  ].join("");
}


export function renderSplitEditor() {
  const editor = document.getElementById("split-editor");
  const draft = ui.splitDraft;
  if (!draft) {
    editor.innerHTML = "";
    return;
  }
  const source = splitForId(ui.editingSplitId);
  const createsCustom = source?.template !== false;
  editor.innerHTML = `<section class="split-editor-panel">
    <header>
      <div><span class="eyebrow">${createsCustom ? "New custom split" : "Custom split"}</span><h3>${createsCustom ? `Customize ${escapeHtml(source?.name || "split")}` : `Edit ${escapeHtml(source?.name || draft.name)}`}</h3><p>${createsCustom ? "The original template stays unchanged. Saving creates a named custom split." : "Changes update this reusable custom split; use Add split when you are ready to apply it."}</p></div>
      <button class="button button-quiet" type="button" data-action="cancel-split-edit">Close editor</button>
    </header>
    <label class="form-field split-name-field"><span>Custom split name</span><input data-split-draft-name="true" maxlength="80" value="${escapeHtml(draft.name)}" placeholder="Name this split" /></label>
    <div class="split-day-editor-list">
      ${draft.entries
        .map(
          (entry, index) => `<div class="split-day-editor-row">
            <strong>Day ${index + 1}</strong>
            <label><span>Cycle</span><select data-split-entry-index="${index}" aria-label="Cycle assigned to Day ${index + 1}">${splitCycleOptions(entry)}</select></label>
            <div class="split-day-actions">
              <button type="button" data-action="edit-cycle-definition" data-cycle-definition-id="${escapeHtml(entry)}" ${entry === "rest" ? "disabled" : ""}>Edit cycle</button>
              <button type="button" data-action="move-split-day" data-entry-index="${index}" data-direction="-1" ${index === 0 ? "disabled" : ""} aria-label="Move Day ${index + 1} earlier">&uarr;</button>
              <button type="button" data-action="move-split-day" data-entry-index="${index}" data-direction="1" ${index === draft.entries.length - 1 ? "disabled" : ""} aria-label="Move Day ${index + 1} later">&darr;</button>
              <button class="delete" type="button" data-action="remove-split-day" data-entry-index="${index}" ${draft.entries.length <= 1 ? "disabled" : ""}>Remove</button>
            </div>
          </div>`,
        )
        .join("")}
    </div>
    <footer>
      <button class="button button-quiet" type="button" data-action="add-split-day" ${draft.entries.length >= 16 ? "disabled" : ""}>+ Add day</button>
      <button class="button button-primary" type="button" data-action="save-custom-split">Save custom split</button>
    </footer>
  </section>`;
}


export function renderCycleManager() {
  const manager = document.getElementById("split-cycle-manager");
  if (!ui.showCycleManager) {
    manager.innerHTML = "";
    return;
  }
  const draft = ui.cycleDraft;
  manager.innerHTML = `<section class="split-cycle-manager-panel">
    <header>
      <div><span class="eyebrow">Reusable cycle library</span><h3>Edit cycles</h3><p>Name each cycle and choose every muscle it may target. Splits can assign the same cycle to multiple Day positions.</p></div>
      <button class="button button-quiet" type="button" data-action="toggle-cycle-manager">Close cycles</button>
    </header>
    ${
      draft
        ? `<div class="cycle-definition-editor">
            <header><strong>${draft.customId ? "Edit custom cycle" : draft.sourceId ? "Create a custom cycle" : "Add cycle"}</strong><span>${draft.sourceId && !draft.customId ? "The template remains unchanged; saving creates a custom cycle." : "This cycle can be used in any custom split."}</span></header>
            <label class="form-field"><span>Cycle name</span><input data-cycle-draft-name="true" maxlength="80" value="${escapeHtml(draft.name)}" placeholder="e.g. Upper strength" /></label>
            <fieldset class="cycle-muscle-picker"><legend>Muscles worked</legend><div>${bodyPartOptions()
              .map(
                (part) =>
                  `<label><input type="checkbox" data-cycle-draft-body-part="${escapeHtml(part)}" ${draft.bodyParts.includes(part) ? "checked" : ""} /> ${escapeHtml(part)}</label>`,
              )
              .join("")}</div></fieldset>
            <div class="cycle-definition-editor-actions"><button class="button button-quiet" type="button" data-action="cancel-cycle-edit">Cancel</button><button class="button button-primary" type="button" data-action="save-cycle-definition">Save cycle</button></div>
          </div>`
        : ""
    }
    <div class="cycle-definition-list">
      ${allReusableCycles()
        .map(
          (cycle) => `<article class="cycle-definition-card">
            <header><div><strong>${escapeHtml(cycle.name)}</strong><span>${cycle.template ? "Template cycle" : "Custom cycle"}</span></div><div><button class="button button-quiet" type="button" data-action="edit-cycle-definition" data-cycle-definition-id="${escapeHtml(cycle.id)}">Edit cycle</button>${cycle.template ? "" : `<button class="button button-danger" type="button" data-action="delete-cycle-definition" data-cycle-definition-id="${escapeHtml(cycle.id)}">Delete</button>`}</div></header>
            <div class="cycle-muscle-pills">${cycle.bodyParts.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}</div>
          </article>`,
        )
        .join("")}
    </div>
  </section>`;
}


export function renderSplitOptions() {
  document.getElementById("split-options").innerHTML = allSplitDefinitions()
    .map((split) => {
      const isCurrent = gateways.cycles.activeSplitId() === split.id;
      const isSelected = ui.selectedSplitId === split.id;
      return `<article class="split-option ${isCurrent ? "is-active" : ""} ${isSelected ? "is-selected" : ""}">
        <header><div><small>${split.template ? "Template" : "Custom split"}</small><strong>${escapeHtml(split.name)}</strong><span>${escapeHtml(split.description)}</span></div><div class="split-option-status">${isCurrent ? "<em>Current</em>" : ""}${isSelected ? '<em class="is-selection">Selected</em>' : ""}</div></header>
        <div class="split-sequence" aria-label="${escapeHtml(split.name)} rotation">
          ${split.entries
            .map((entry, index) => {
              const details = splitEntryDetails(entry);
              return `<span class="${entry === "rest" ? "is-rest" : ""}"><small>Day ${index + 1}</small>${escapeHtml(details.label)}</span>`;
            })
            .join("")}
        </div>
        <div class="split-option-actions">
          <button class="button ${isSelected ? "button-quiet" : "button-primary"}" type="button" data-action="select-split" data-split-id="${escapeHtml(split.id)}" aria-pressed="${isSelected}">${isSelected ? "Selected" : "Select split"}</button>
          <button class="button button-quiet" type="button" data-action="edit-split" data-split-id="${escapeHtml(split.id)}">Edit split</button>
        </div>
      </article>`;
    })
    .join("");
}


export function renderSplitDialog() {
  renderCycleManager();
  renderSplitEditor();
  renderSplitOptions();
}


export function openSplitDialog() {
  ui.selectedSplitId =
    gateways.cycles.activeSplitId() && splitForId(gateways.cycles.activeSplitId())
      ? gateways.cycles.activeSplitId()
      : SPLIT_PRESETS[0].id;
  ui.splitWeekStartDay = gateways.cycles.splitWeekStartDay() || "monday";
  ui.editingSplitId = null;
  ui.splitDraft = null;
  ui.showCycleManager = false;
  ui.editingCycleId = null;
  ui.cycleDraft = null;
  renderSplitDialog();
  inputById("split-week-start").value = ui.splitWeekStartDay;
  dialogById("split-dialog").showModal();
}


// Draft editing below changes only the dialog's unsaved draft; saving it is
// the save-custom-split and save-cycle-definition stories.

export function openSplitEditor(splitId) {
  const split = splitForId(splitId);
  if (!split) return;
  ui.editingSplitId = split.id;
  ui.splitDraft = {
    customId: split.template ? null : split.id,
    name: split.template ? `${split.name} custom` : split.name,
    description: split.description,
    entries: [...split.entries],
  };
  renderSplitDialog();
}


export function moveSplitDay(entryIndex, direction) {
  if (!ui.splitDraft) return;
  const index = Number(entryIndex);
  const nextIndex = index + Number(direction);
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    nextIndex < 0 ||
    nextIndex >= ui.splitDraft.entries.length
  )
    return;
  [ui.splitDraft.entries[index], ui.splitDraft.entries[nextIndex]] = [
    ui.splitDraft.entries[nextIndex],
    ui.splitDraft.entries[index],
  ];
  renderSplitEditor();
}


export function addSplitDay() {
  if (!ui.splitDraft || ui.splitDraft.entries.length >= 16) return;
  ui.splitDraft.entries.push(allReusableCycles()[0]?.id || "rest");
  renderSplitEditor();
}


export function removeSplitDay(entryIndex) {
  if (!ui.splitDraft || ui.splitDraft.entries.length <= 1) return;
  const index = Number(entryIndex);
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= ui.splitDraft.entries.length
  )
    return;
  ui.splitDraft.entries.splice(index, 1);
  renderSplitEditor();
}


export function openCycleDefinitionEditor(cycleId = null) {
  const cycle = cycleId ? reusableCycleForId(cycleId) : null;
  if (cycleId && !cycle) return;
  ui.showCycleManager = true;
  ui.editingCycleId = cycle?.id || null;
  ui.cycleDraft = {
    customId: cycle && !cycle.template ? cycle.id : null,
    sourceId: cycle?.id || null,
    name: cycle
      ? cycle.template
        ? `${cycle.name} custom`
        : cycle.name
      : "New cycle",
    target: cycle?.target || "custom",
    bodyParts: cycle ? [...cycle.bodyParts] : [],
    description: cycle?.description || "A reusable custom training cycle.",
  };
  renderCycleManager();
}
