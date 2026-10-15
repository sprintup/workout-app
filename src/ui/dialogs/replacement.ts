import { gateways } from "../../gateways/registry";
import { exerciseEffectivenessScore } from "../../entities/exercise";
import { workoutTarget } from "../../entities/targets";
import { assignmentFor } from "../../services/circuit-editing";
import { bodyPartOptions, equipmentOptions } from "../../services/exercise-catalog";
import { replacementOptions } from "../../services/replacement";
import { requiresBothSides } from "../../services/reps";
import { targetBodyPartsForDay, targetIdForDay } from "../../services/targeting";
import { clearDialogMessage } from "../feedback";
import { escapeHtml } from "../html";
import { ICONS } from "../icons";
import { replacementQuery, resetReplacementFilters, ui } from "../ui-state";
import { dialogById, inputById } from "../dom";


export function renderReplacementResults() {
  const target = workoutTarget(targetIdForDay(ui.replacement.dayId));
  document.getElementById("replace-description").textContent =
    ui.showAllReplacements
      ? "Search or filter every active library exercise, including exercises already scheduled this week."
      : `Showing unused exercises that target the muscles selected for this ${target.label} day.`;
  const results = replacementOptions(replacementQuery());
  document.getElementById("replace-count").textContent =
    `${results.length} option${results.length === 1 ? "" : "s"}`;
  document.getElementById("replace-results").innerHTML = results.length
    ? results
        .map(
          ({ exercise, eligible, alreadyUsed }) => `
            <article class="replace-option">
              <div class="replace-option-copy">
                <strong>${escapeHtml(exercise.name)}</strong>
                <small class="replace-option-details">
                  ${exercise.aliases.length ? `<span><em>Aliases</em> ${exercise.aliases.map(escapeHtml).join(", ")}</span>` : ""}
                  <span><em>Muscles</em> ${exercise.body_parts.map(escapeHtml).join(", ")}</span>
                  <span><em>Equipment</em> ${escapeHtml(exercise.equipment_label)}</span>
                  ${alreadyUsed ? "<span>Already scheduled elsewhere in this week</span>" : ""}
                  <span>${requiresBothSides(exercise) ? "Two-side" : "One-side"} · Chosen ${gateways.exercises.stats(exercise.id).chosenCount} times${eligible ? "" : " · outside today's target muscles"}</span>
                </small>
              </div>
              <div class="replace-option-actions">
                <span class="recommendation-score">Effectiveness ${exerciseEffectivenessScore(exercise)}</span>
                <button class="replace-option-use" type="button" data-action="choose-replacement" data-exercise-id="${exercise.id}">Use</button>
              </div>
              <button class="replace-option-hide" type="button" data-action="hide-replacement" data-exercise-id="${exercise.id}" title="Hide from future recommendations" aria-label="Hide ${escapeHtml(exercise.name)} from recommendations">${ICONS.eyeOff}<span>Hide</span></button>
            </article>`,
        )
        .join("")
    : `<div class="empty-state">${ui.showAllReplacements ? "No active library exercises match the selected search or filters." : "No unused exercises match today's target muscles and the selected filters."}</div>`;
}


export function openReplacement(context) {
  const assignment = assignmentFor(context);
  if (assignment.locked) return;
  clearDialogMessage("replace-dialog-message");
  const exercise = gateways.exercises.find(assignment.exerciseId);
  resetReplacementFilters(context);
  document.getElementById("replace-title").textContent =
    `Replace ${exercise.name}`;
  const target = workoutTarget(targetIdForDay(context.dayId));
  const targetParts = targetBodyPartsForDay(context.dayId);
  document.getElementById("replace-description").textContent =
    `Showing unused exercises that target the muscles selected for this ${target.label} day.`;
  inputById("replace-search").value = "";
  inputById("show-all-replacements").checked = false;
  inputById("replace-sides").value = "all";
  document.getElementById("replace-body-part").innerHTML =
    `<option value="all">All body parts</option>${bodyPartOptions()
      .map(
        (part) =>
          `<option value="${escapeHtml(part)}">${escapeHtml(part)}</option>`,
      )
      .join("")}`;
  document.getElementById("replace-equipment").innerHTML =
    `<option value="all">All equipment</option>${equipmentOptions()
      .map(
        (equipment) =>
          `<option value="${escapeHtml(equipment)}">${escapeHtml(equipment)}</option>`,
      )
      .join("")}`;
  document.getElementById("replacement-target-muscles").innerHTML =
    targetParts.map((part) => `<span>${escapeHtml(part)}</span>`).join("");
  renderReplacementResults();
  dialogById("replace-dialog").showModal();
  setTimeout(() => inputById("replace-search").focus(), 0);
}
