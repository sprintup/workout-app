import { gateways } from "../../gateways/registry";
import { equipmentFilterKey } from "../../entities/equipment";
import { addCustomExercise } from "../../interactors/library/add-custom-exercise";
import { editExercise } from "../../interactors/library/edit-exercise";
import type { ExerciseFormValues } from "../../interactors/library/exercise-form";
import { bodyPartOptions, categoryOptions, equipmentOptions } from "../../services/exercise-catalog";
import { matchesAutomaticReplacementEligibility } from "../../services/replacement";
import { openReplacement, renderReplacementResults } from "./replacement";
import { clearDialogMessage, showToast } from "../feedback";
import { escapeHtml } from "../html";
import { present } from "../presenter";
import { ui } from "../ui-state";
import { dialogById, formById, formField, inputById } from "../dom";


export function clearExerciseFormError() {
  const error = document.getElementById("exercise-form-error");
  if (!error) return;
  error.textContent = "";
  error.hidden = true;
}


export function showExerciseFormError(message) {
  const error = document.getElementById("exercise-form-error");
  if (error) {
    error.textContent = message;
    error.hidden = false;
    error.scrollIntoView?.({ block: "nearest" });
  }
  showToast(message, "error");
}


export function openExerciseDialog(
  options: { fromReplacement?: boolean } = {},
) {
  const form = formById("exercise-form");
  clearDialogMessage("exercise-dialog-message");
  ui.editingExerciseId = null;
  ui.returnToReplacementAfterExerciseAdd = Boolean(options.fromReplacement);
  form.reset();
  clearExerciseFormError();
  const categories = categoryOptions();
  document.getElementById("custom-category").innerHTML = categories
    .map(
      (category) =>
        `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
    )
    .join("");
  document.getElementById("exercise-body-part-options").innerHTML =
    bodyPartOptions()
      .map(
        (part) => `<label>
          <input type="checkbox" name="bodyParts" value="${escapeHtml(part)}" />
          <span>${escapeHtml(part)}</span>
        </label>`,
      )
      .join("");
  document.getElementById("exercise-equipment-options").innerHTML =
    equipmentOptions()
      .map(
        (equipment) => `<label>
          <input type="checkbox" name="equipmentVarieties" value="${escapeHtml(equipment)}" />
          <span>${escapeHtml(equipment)}</span>
        </label>`,
      )
      .join("");
  document.getElementById("exercise-dialog-title").textContent =
    "Add an exercise";
  document.getElementById("exercise-dialog-description").textContent =
    "Select every body part it trains; its primary category and movement fields determine where it can safely appear.";
  document.getElementById("exercise-form-submit").textContent =
    "Add to library";
  dialogById("exercise-dialog").showModal();
  setTimeout(() => formField(form, "name").focus(), 0);
}


export function openEditExerciseDialog(exerciseId) {
  const exercise = gateways.exercises.find(exerciseId);
  if (!exercise) return;
  openExerciseDialog();
  ui.editingExerciseId = exerciseId;
  const form = formById("exercise-form");
  const exerciseSettings = gateways.exercises.stats(exerciseId);
  const setValue = (name, value) => {
    formField(form, name).value = value ?? "";
  };
  setValue("name", exercise.name);
  setValue("aliases", exercise.aliases.join("\n"));
  setValue("category", exercise.primary_body_part);
  const bodyPartInputs = document
    .getElementById("exercise-body-part-options")
    .querySelectorAll?.<HTMLInputElement>('input[name="bodyParts"]');
  bodyPartInputs?.forEach((input) => {
    input.checked = exercise.body_parts.includes(input.value);
  });
  const equipmentInputs = document
    .getElementById("exercise-equipment-options")
    .querySelectorAll?.<HTMLInputElement>('input[name="equipmentVarieties"]');
  equipmentInputs?.forEach((input) => {
    input.checked = exercise.equipment_varieties.some(
      (equipment) =>
        equipmentFilterKey(equipment) === equipmentFilterKey(input.value),
    );
  });
  setValue("movementPattern", exercise.movement_pattern);
  setValue("movementRole", exercise.movement_role);
  setValue("forceType", exercise.force_type);
  setValue("measureType", exerciseSettings.measureType);
  setValue("defaultReps", exerciseSettings.reps);
  setValue("defaultLoad", exerciseSettings.weight);
  setValue("loadBasis", exerciseSettings.loadBasis);
  setValue("effectivenessScore", exercise.effectiveness_score);
  setValue("instructionUrl", exercise.instruction_url);
  setValue("notes", exercise.notes);
  formField(form, "shoulderCaution").checked = exercise.shoulder_caution;
  formField(form, "backCaution").checked = exercise.back_caution;
  formField(form, "totalBodyActivator").checked = exercise.total_body_activator;
  formField(form, "bothSides").checked = exercise.unilateral;
  document.getElementById("exercise-dialog-title").textContent =
    `Edit ${exercise.name}`;
  document.getElementById("exercise-dialog-description").textContent =
    "Changes apply throughout the library and current workout while preserving history.";
  document.getElementById("exercise-form-submit").textContent =
    "Save changes";
}


/** Reads the exercise dialog's fields as entered. */
function exerciseFormValues(form: HTMLFormElement): ExerciseFormValues {
  const data = new FormData(form);
  const all = (name: string) =>
    (typeof data.getAll === "function"
      ? data.getAll(name)
      : data.get(name)) as string[] | string;
  return {
    name: String(data.get("name") || ""),
    aliases: data.get("aliases") as string | null,
    category: String(data.get("category") || ""),
    equipmentVarieties:
      typeof data.getAll === "function"
        ? (data.getAll("equipmentVarieties") as string[])
        : String(data.get("equipmentVarieties") || "")
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean),
    bodyParts: all("bodyParts"),
    instructionUrl: String(data.get("instructionUrl") || ""),
    movementPattern: String(data.get("movementPattern") || ""),
    movementRole: String(data.get("movementRole") || ""),
    forceType: String(data.get("forceType") || ""),
    defaultReps: String(data.get("defaultReps") || ""),
    measureType: String(data.get("measureType")),
    defaultLoad: String(data.get("defaultLoad") || ""),
    loadBasis: String(data.get("loadBasis")),
    effectivenessScore: data.get("effectivenessScore") as string | null,
    shoulderCaution: data.get("shoulderCaution") === "on",
    backCaution: data.get("backCaution") === "on",
    totalBodyActivator: data.get("totalBodyActivator") === "on",
    bothSides: data.get("bothSides") === "on",
    notes: String(data.get("notes") || ""),
  };
}


export function saveExerciseForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearExerciseFormError();
  if (!form.reportValidity()) {
    showExerciseFormError("Complete the highlighted required fields.");
    return;
  }
  const values = exerciseFormValues(form);
  const editingId = ui.editingExerciseId;
  const result = editingId
    ? editExercise(gateways, { exerciseId: editingId, values })
    : addCustomExercise(gateways, values);
  if (result.value?.formError) {
    showExerciseFormError(result.value.formError);
    return;
  }
  if (!result.changed) return;
  const replacementContext =
    !editingId && ui.returnToReplacementAfterExerciseAdd && ui.replacement
      ? { ...ui.replacement }
      : null;
  dialogById("exercise-dialog").close();
  ui.editingExerciseId = null;
  ui.returnToReplacementAfterExerciseAdd = false;
  if (!replacementContext) {
    present(result);
    return;
  }
  present({ ...result, toast: undefined });
  openReplacement(replacementContext);
  const savedExercise = gateways.exercises.find(result.value.exerciseId);
  ui.replaceSearch = savedExercise.name;
  ui.showAllReplacements = !matchesAutomaticReplacementEligibility(
    savedExercise,
    replacementContext,
  );
  inputById("replace-search").value = savedExercise.name;
  inputById("show-all-replacements").checked =
    ui.showAllReplacements;
  renderReplacementResults();
  showToast(`${savedExercise.name} added and ready to use as the replacement.`);
}
