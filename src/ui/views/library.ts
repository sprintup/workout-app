import { gateways } from "../../gateways/registry";
import { matchesEquipmentSelection } from "../../entities/equipment";
import { exerciseEffectivenessScore } from "../../entities/exercise";
import { fuzzyExerciseScore } from "../../entities/search";
import { categoryOptions, equipmentOptions, libraryTotalCount } from "../../services/exercise-catalog";
import { requiresBothSides } from "../../services/reps";
import { escapeHtml } from "../html";
import { ICONS } from "../icons";
import { ui } from "../ui-state";
import { cautionText } from "./workout";


export function filteredLibrary() {
  const search = ui.librarySearch.trim().toLowerCase();
  const searchScores = new Map();
  const filtered = gateways.exercises.all().filter((exercise) => {
    if (gateways.exercises.isDeleted(exercise.id)) return false;
    if (gateways.exercises.isHidden(exercise.id) && !ui.showHidden) return false;
    const matchesCategory =
      ui.libraryCategory === "all" ||
      exercise.primary_body_part === ui.libraryCategory;
    const matchesEquipment = matchesEquipmentSelection(
      exercise,
      ui.libraryEquipment,
    );
    const searchScore = fuzzyExerciseScore(exercise, search);
    searchScores.set(exercise.id, searchScore);
    return matchesCategory && matchesEquipment && searchScore !== null;
  });

  return filtered.sort((first, second) => {
    const relevance = search
      ? searchScores.get(first.id) - searchScores.get(second.id)
      : 0;
    if (relevance) return relevance;
    const firstStats = gateways.exercises.stats(first.id);
    const secondStats = gateways.exercises.stats(second.id);
    if (ui.librarySort === "popular") {
      return (
        secondStats.chosenCount - firstStats.chosenCount ||
        first.name.localeCompare(second.name)
      );
    }
    if (ui.librarySort === "skipped") {
      return (
        secondStats.skippedCount - firstStats.skippedCount ||
        first.name.localeCompare(second.name)
      );
    }
    if (ui.librarySort === "score") {
      return (
        exerciseEffectivenessScore(second) -
          exerciseEffectivenessScore(first) ||
        first.name.localeCompare(second.name)
      );
    }
    if (ui.librarySort === "category") {
      return (
        first.primary_body_part.localeCompare(second.primary_body_part) ||
        first.name.localeCompare(second.name)
      );
    }
    if (ui.librarySort === "equipment") {
      const firstEquipment =
        first.equipment_varieties[0] || first.equipment_label;
      const secondEquipment =
        second.equipment_varieties[0] || second.equipment_label;
      return (
        firstEquipment.localeCompare(secondEquipment) ||
        first.name.localeCompare(second.name)
      );
    }
    return first.name.localeCompare(second.name);
  });
}


export function renderLibraryCard(exercise) {
  const stats = gateways.exercises.stats(exercise.id);
  const caution = cautionText(exercise);
  const hidden = gateways.exercises.isHidden(exercise.id);
  const fixed = exercise.always_locked;
  return `
    <article class="library-card ${hidden ? "is-hidden" : ""}">
      <div class="library-name">
        <strong>${escapeHtml(exercise.name)}</strong>
        <span>${escapeHtml(exercise.primary_body_part)}${hidden ? " · Hidden from recommendations" : ""}</span>
      </div>
      <div>
        <div class="library-equipment">${escapeHtml(exercise.equipment_label)}</div>
        <div class="equipment-varieties" aria-label="Equipment varieties">
          ${exercise.equipment_varieties.map((equipment) => `<span>${escapeHtml(equipment)}</span>`).join("")}
        </div>
        <div class="library-tags">
          <span class="tag">${escapeHtml(exercise.movement_role.replace("_", " "))}</span>
          <span class="tag">${escapeHtml(exercise.force_type.replace("_", " "))}</span>
          <span class="tag score">Effectiveness ${exerciseEffectivenessScore(exercise)}</span>
          <span class="tag side-count ${requiresBothSides(exercise) ? "two-sided" : "one-sided"}">${requiresBothSides(exercise) ? "Two-sided" : "One-sided"}</span>
          ${caution ? `<span class="tag caution">${escapeHtml(caution)}</span>` : ""}
          ${exercise.total_body_activator ? '<span class="tag activator">Total-body activator</span>' : ""}
        </div>
      </div>
      <div class="library-counts" aria-label="Exercise usage">
        <span><strong>${stats.chosenCount}</strong>chosen</span>
        <span><strong>${stats.skippedCount}</strong>skipped</span>
      </div>
      <div class="library-actions">
        ${
          exercise.instruction_url
            ? `<a class="demo-button" href="${escapeHtml(exercise.instruction_url)}" target="_blank" rel="noreferrer" aria-label="View a demonstration of ${escapeHtml(exercise.name)}" title="View demo">${ICONS.external}</a>`
            : ""
        }
        <button class="library-action" type="button" data-action="edit-library" data-exercise-id="${exercise.id}">Edit</button>
        <button class="library-action" type="button" data-action="toggle-hide-library" data-exercise-id="${exercise.id}" ${fixed ? "disabled" : ""}>${hidden ? "Restore" : "Hide"}</button>
        <button class="library-action delete" type="button" data-action="delete-library" data-exercise-id="${exercise.id}" ${fixed ? "disabled" : ""}>Delete</button>
      </div>
    </article>`;
}


export function renderLibrary() {
  const items = filteredLibrary();
  const totalChosen = gateways.exercises.all().reduce(
    (total, exercise) => total + gateways.exercises.stats(exercise.id).chosenCount,
    0,
  );
  const totalSkipped = gateways.exercises.all().reduce(
    (total, exercise) => total + gateways.exercises.stats(exercise.id).skippedCount,
    0,
  );

  document.getElementById("library-view").innerHTML = `
    <div class="content-frame">
      <header class="view-header">
        <div>
          <span class="eyebrow">Workout catalog</span>
          <h1>Exercise <span>library</span></h1>
          <p class="view-subtitle">Browse every exercise, filter or sort by equipment, and edit each movement's compatible equipment varieties.</p>
        </div>
        <div class="library-header-actions">
          <button class="button button-quiet" id="add-equipment-button" type="button" data-action="open-equipment-dialog">Edit equipment</button>
          <button class="button button-primary" id="add-exercise-button" type="button" data-action="open-add-exercise">+ Add exercise</button>
        </div>
      </header>
      <div class="library-toolbar">
        <label class="search-field">${ICONS.search}<span class="sr-only">Search exercise library</span><input id="library-search" type="search" value="${escapeHtml(ui.librarySearch)}" placeholder="Search name, alias, muscle, or equipment" /></label>
        <label class="select-field"><span>Category</span><select id="library-category">
          <option value="all">All</option>
          ${categoryOptions()
            .map(
              (category) =>
                `<option value="${escapeHtml(category)}" ${ui.libraryCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>`,
            )
            .join("")}
        </select></label>
        <label class="select-field"><span>Equipment</span><select id="library-equipment">
          <option value="all">All equipment</option>
          ${equipmentOptions()
            .map(
              (equipment) =>
                `<option value="${escapeHtml(equipment)}" ${ui.libraryEquipment === equipment ? "selected" : ""}>${escapeHtml(equipment)}</option>`,
            )
            .join("")}
        </select></label>
        <label class="select-field"><span>Sort</span><select id="library-sort">
          <option value="popular" ${ui.librarySort === "popular" ? "selected" : ""}>Most popular</option>
          <option value="skipped" ${ui.librarySort === "skipped" ? "selected" : ""}>Most skipped</option>
          <option value="score" ${ui.librarySort === "score" ? "selected" : ""}>Effectiveness</option>
          <option value="name" ${ui.librarySort === "name" ? "selected" : ""}>Name A–Z</option>
          <option value="category" ${ui.librarySort === "category" ? "selected" : ""}>Category</option>
          <option value="equipment" ${ui.librarySort === "equipment" ? "selected" : ""}>Equipment</option>
        </select></label>
      </div>
      <div class="library-stats">
        <span class="stat-pill result-summary"><strong>${items.length}</strong> of <strong>${libraryTotalCount()}</strong> exercises showing</span>
        <span class="stat-pill"><strong>${totalChosen}</strong> total selections</span>
        <span class="stat-pill"><strong>${totalSkipped}</strong> replacements</span>
        <label class="stat-pill show-hidden"><input id="show-hidden" type="checkbox" ${ui.showHidden ? "checked" : ""} /> Show ${gateways.exercises.hiddenIds().length} hidden</label>
      </div>
      <div class="library-list">
        ${items.length ? items.map(renderLibraryCard).join("") : '<div class="empty-state">No exercises match those filters.</div>'}
      </div>
    </div>`;
}
