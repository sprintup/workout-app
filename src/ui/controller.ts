// Turns DOM events into interactor calls. Each user action reads its input
// from the element, asks for confirmation when the story needs it, calls the
// interactor, and hands the result to the presenter. Actions that only change
// what is on screen (opening dialogs, filters, unsaved drafts) are handled
// here directly.
import { BODY_PART_OPTIONS, DAY_CONFIG } from "../data/training";
import { gateways } from "../gateways/registry";
import { addRoundExercise } from "../interactors/circuits/add-round-exercise";
import { deleteCircuitExercise } from "../interactors/circuits/delete-circuit-exercise";
import { hideWorkoutExercise } from "../interactors/circuits/hide-workout-exercise";
import { moveCircuitExercise } from "../interactors/circuits/move-circuit-exercise";
import { randomReplaceExercise } from "../interactors/circuits/random-replace-exercise";
import { removeRoundExercise } from "../interactors/circuits/remove-round-exercise";
import { replaceExercise } from "../interactors/circuits/replace-exercise";
import { toggleExerciseLock } from "../interactors/circuits/toggle-exercise-lock";
import { addRestCycle, addRestCycleConfirmation } from "../interactors/cycles/add-rest-cycle";
import { addTrainingCycle, addTrainingCycleConfirmation } from "../interactors/cycles/add-training-cycle";
import { deleteCycle, deleteCycleConfirmation } from "../interactors/cycles/delete-cycle";
import { describeCycle } from "../interactors/cycles/describe-cycle";
import { moveCycle, moveCycleConfirmation } from "../interactors/cycles/move-cycle";
import { renameCycle } from "../interactors/cycles/rename-cycle";
import { setCycleBodyParts, setCycleBodyPartsConfirmation } from "../interactors/cycles/set-cycle-body-parts";
import { setCycleDesignation, setCycleDesignationConfirmation } from "../interactors/cycles/set-cycle-designation";
import { setCycleTarget, setCycleTargetConfirmation } from "../interactors/cycles/set-cycle-target";
import { applyFavoriteCircuit } from "../interactors/favorites/apply-favorite-circuit";
import { deleteFavoriteCircuit } from "../interactors/favorites/delete-favorite-circuit";
import { favoriteNameSuggestion, toggleFavoriteCircuit } from "../interactors/favorites/toggle-favorite-circuit";
import { deleteLibraryExercise, deleteLibraryExerciseConfirmation } from "../interactors/library/delete-library-exercise";
import { toggleHiddenExercise } from "../interactors/library/toggle-hidden-exercise";
import { addCooldownExercise } from "../interactors/routines/add-cooldown-exercise";
import { addWarmupExercise } from "../interactors/routines/add-warmup-exercise";
import { deleteCooldownExercise } from "../interactors/routines/delete-cooldown-exercise";
import { deleteWarmupExercise } from "../interactors/routines/delete-warmup-exercise";
import { moveCooldownExercise } from "../interactors/routines/move-cooldown-exercise";
import { moveWarmupExercise } from "../interactors/routines/move-warmup-exercise";
import { renameCooldownExercise } from "../interactors/routines/rename-cooldown-exercise";
import { renameWarmupExercise } from "../interactors/routines/rename-warmup-exercise";
import { setCooldownInterval } from "../interactors/routines/set-cooldown-interval";
import { applySplit, applySplitConfirmation } from "../interactors/splits/apply-split";
import { deleteCycleDefinition, deleteCycleDefinitionConfirmation } from "../interactors/splits/delete-cycle-definition";
import { saveCustomSplit } from "../interactors/splits/save-custom-split";
import { saveCycleDefinition } from "../interactors/splits/save-cycle-definition";
import { selectDayCycle, selectDayCycleConfirmation } from "../interactors/week/select-day-cycle";
import { setCircuitRepBudget } from "../interactors/week/set-circuit-rep-budget";
import { START_NEW_WEEK_CONFIRMATION, startNewWeek } from "../interactors/week/start-new-week";
import { toggleRestDay, toggleRestDayConfirmation } from "../interactors/week/toggle-rest-day";
import { adjustWorkoutTimer } from "../interactors/workout/adjust-workout-timer";
import { checkCooldownExercise } from "../interactors/workout/check-cooldown-exercise";
import { checkWarmupExercise } from "../interactors/workout/check-warmup-exercise";
import { completeOptionalActivator } from "../interactors/workout/complete-optional-activator";
import { completeRound } from "../interactors/workout/complete-round";
import { increaseExerciseLoad, loadIncreasePrompt } from "../interactors/workout/increase-exercise-load";
import { rateExercise } from "../interactors/workout/rate-exercise";
import { resetWorkoutTimer } from "../interactors/workout/reset-workout-timer";
import { setAssignmentRepBasis } from "../interactors/workout/set-assignment-rep-basis";
import { setAssignmentReps } from "../interactors/workout/set-assignment-reps";
import { setExerciseEffectiveness } from "../interactors/workout/set-exercise-effectiveness";
import { setExerciseMeasurement } from "../interactors/workout/set-exercise-measurement";
import { toggleWorkoutTimer } from "../interactors/workout/toggle-workout-timer";
import { updateExerciseLog } from "../interactors/workout/update-exercise-log";
import { reusableCycleForId, splitForId } from "../services/cycle-schedule";
import { openEquipmentDialog, saveEquipmentForm } from "./dialogs/equipment";
import { openEditExerciseDialog, openExerciseDialog, saveExerciseForm } from "./dialogs/exercise";
import { openFavoriteCircuits } from "./dialogs/favorites";
import { loadInputFile, openJsonFile, saveJson } from "./dialogs/json-file";
import { openReplacement, renderReplacementResults } from "./dialogs/replacement";
import {
  addSplitDay,
  moveSplitDay,
  openCycleDefinitionEditor,
  openSplitDialog,
  openSplitEditor,
  removeSplitDay,
  renderCycleManager,
  renderSplitEditor,
  renderSplitOptions,
} from "./dialogs/split";
import { present } from "./presenter";
import { render } from "./render";
import { confirmDiscardUnsavedChanges } from "./save-indicator";
import { timerDayId } from "./timer-view";
import { ui } from "./ui-state";
import { renderLibrary } from "./views/library";
import { renderSettings } from "./views/settings";
import { renderWorkout } from "./views/workout";
import { dialogById, inputById } from "./dom";

/** Where the clicked or edited exercise sits in the week. */
function parseContext(element) {
  return {
    dayId: element.dataset.day,
    circuitIndex: Number(element.dataset.circuit),
    position: element.dataset.position,
  };
}

/** True when no question is needed or the user agreed to it. */
function confirmed(question) {
  return !question || window.confirm(question);
}

function closeDialog(id) {
  const dialog = dialogById(id);
  if (dialog?.open) dialog.close();
}

function runOnTimerDay(interactor, input = {}) {
  const dayId = timerDayId();
  if (dayId) present(interactor(gateways, { dayId, ...input }));
}

const clickActions = {
  "toggle-workout-timer": () => runOnTimerDay(toggleWorkoutTimer),
  "reset-workout-timer": () => runOnTimerDay(resetWorkoutTimer),
  "adjust-workout-timer": (button) =>
    runOnTimerDay(adjustWorkoutTimer, { minutes: button.dataset.minutes }),
  "toggle-optional-activator-pane": (button) => {
    const key = `${button.dataset.day}-${Number(button.dataset.circuit)}`;
    if (ui.expandedActivators.has(key)) ui.expandedActivators.delete(key);
    else ui.expandedActivators.add(key);
    render();
  },
  "increase-load": (button) => {
    const exerciseId = button.dataset.exerciseId;
    const prompt = loadIncreasePrompt(gateways, { exerciseId });
    if (!prompt) return;
    const requestedLoad = window.prompt(
      `Enter a higher load for ${prompt.exerciseName}:`,
      prompt.suggestion,
    );
    if (requestedLoad === null) return;
    present(increaseExerciseLoad(gateways, { exerciseId, requestedLoad }));
  },
  "toggle-rest-day": (button) => {
    const input = { dayId: button.dataset.day };
    if (!confirmed(toggleRestDayConfirmation(gateways, input))) return;
    present(toggleRestDay(gateways, input));
  },
  "toggle-body-part-coverage": () => {
    ui.showBodyPartCoverage = !ui.showBodyPartCoverage;
    renderSettings();
  },
  "add-warmup-exercise": () => present(addWarmupExercise(gateways)),
  "move-warmup-exercise": (button) =>
    present(
      moveWarmupExercise(gateways, {
        warmupId: button.dataset.warmupId,
        direction: Number(button.dataset.direction),
      }),
    ),
  "delete-warmup-exercise": (button) =>
    present(deleteWarmupExercise(gateways, { warmupId: button.dataset.warmupId })),
  "add-cooldown-exercise": () => present(addCooldownExercise(gateways)),
  "move-cooldown-exercise": (button) =>
    present(
      moveCooldownExercise(gateways, {
        cooldownId: button.dataset.cooldownId,
        direction: Number(button.dataset.direction),
      }),
    ),
  "delete-cooldown-exercise": (button) =>
    present(
      deleteCooldownExercise(gateways, { cooldownId: button.dataset.cooldownId }),
    ),
  "open-split-dialog": () => openSplitDialog(),
  "close-split-dialog": () => dialogById("split-dialog").close(),
  "select-split": (button) => {
    if (splitForId(button.dataset.splitId)) {
      ui.selectedSplitId = button.dataset.splitId;
      renderSplitOptions();
    }
  },
  "edit-split": (button) => openSplitEditor(button.dataset.splitId),
  "cancel-split-edit": () => {
    ui.editingSplitId = null;
    ui.splitDraft = null;
    renderSplitEditor();
  },
  "add-split-day": () => addSplitDay(),
  "move-split-day": (button) =>
    moveSplitDay(button.dataset.entryIndex, button.dataset.direction),
  "remove-split-day": (button) => removeSplitDay(button.dataset.entryIndex),
  "save-custom-split": () => {
    if (!ui.splitDraft) return;
    const result = saveCustomSplit(gateways, { draft: ui.splitDraft });
    if (result.changed) {
      ui.selectedSplitId = result.value.splitId;
      ui.editingSplitId = null;
      ui.splitDraft = null;
    }
    present(result);
  },
  "toggle-cycle-manager": () => {
    ui.showCycleManager = !ui.showCycleManager;
    if (!ui.showCycleManager) {
      ui.editingCycleId = null;
      ui.cycleDraft = null;
    }
    renderCycleManager();
  },
  "add-cycle-definition": () => openCycleDefinitionEditor(),
  "edit-cycle-definition": (button) =>
    openCycleDefinitionEditor(button.dataset.cycleDefinitionId),
  "cancel-cycle-edit": () => {
    ui.editingCycleId = null;
    ui.cycleDraft = null;
    renderCycleManager();
  },
  "save-cycle-definition": () => {
    const draft = ui.cycleDraft;
    if (!draft) return;
    const result = saveCycleDefinition(gateways, { draft });
    if (result.changed) {
      const savedId = result.value.cycleDefinitionId;
      if (ui.splitDraft && draft.sourceId && !draft.customId) {
        ui.splitDraft.entries = ui.splitDraft.entries.map((entry) =>
          entry === draft.sourceId ? savedId : entry,
        );
      }
      ui.editingCycleId = null;
      ui.cycleDraft = null;
    }
    present(result);
  },
  "delete-cycle-definition": (button) => {
    const input = { cycleDefinitionId: button.dataset.cycleDefinitionId };
    if (!confirmed(deleteCycleDefinitionConfirmation(gateways, input))) return;
    present(deleteCycleDefinition(gateways, input));
  },
  "apply-selected-split": () => {
    const input = {
      splitId: ui.selectedSplitId,
      beginDayId: ui.splitWeekStartDay,
    };
    const question = applySplitConfirmation(input);
    if (!question || !window.confirm(question)) return;
    const result = applySplit(gateways, input);
    if (result.changed) dialogById("split-dialog").close();
    present(result);
  },
  "add-cycle": () => {
    if (!confirmed(addTrainingCycleConfirmation(gateways))) return;
    present(addTrainingCycle(gateways));
  },
  "add-rest-cycle": () => {
    if (!confirmed(addRestCycleConfirmation(gateways))) return;
    present(addRestCycle(gateways));
  },
  "move-cycle": (button) => {
    const input = {
      cycleId: button.dataset.cycleId,
      direction: Number(button.dataset.direction),
    };
    if (!confirmed(moveCycleConfirmation(gateways, input))) return;
    present(moveCycle(gateways, input));
  },
  "delete-cycle": (button) => {
    const input = { cycleId: button.dataset.cycleId };
    if (!confirmed(deleteCycleConfirmation(gateways, input))) return;
    present(deleteCycle(gateways, input));
  },
  "apply-cycle-body-parts": (button) => {
    const card = button.closest(".settings-card");
    if (!card) return;
    const input = {
      cycleId: button.dataset.cycleId,
      bodyParts: [...card.querySelectorAll("[data-cycle-body-part]:checked")].map(
        (checkbox) => checkbox.dataset.cycleBodyPart,
      ),
    };
    if (!confirmed(setCycleBodyPartsConfirmation(gateways, input))) {
      renderSettings();
      return;
    }
    present(setCycleBodyParts(gateways, input));
  },
  replace: (button) => openReplacement(parseContext(button)),
  "random-replace": (button) => {
    const result = randomReplaceExercise(gateways, parseContext(button));
    if (result.value || result.toast) ui.replacement = null;
    present(result);
  },
  "move-exercise": (button) =>
    present(
      moveCircuitExercise(gateways, {
        ...parseContext(button),
        direction: Number(button.dataset.direction),
      }),
    ),
  "delete-circuit-exercise": (button) =>
    present(deleteCircuitExercise(gateways, parseContext(button))),
  "add-round-exercise": (button) =>
    present(
      addRoundExercise(gateways, {
        dayId: button.dataset.day,
        circuitIndex: Number(button.dataset.circuit),
      }),
    ),
  "remove-round-exercise": (button) =>
    present(
      removeRoundExercise(gateways, {
        dayId: button.dataset.day,
        circuitIndex: Number(button.dataset.circuit),
      }),
    ),
  "toggle-favorite-circuit": (button) => {
    const slot = {
      dayId: button.dataset.day,
      circuitIndex: Number(button.dataset.circuit),
    };
    const suggestion = favoriteNameSuggestion(gateways, slot);
    let name;
    if (suggestion !== null) {
      name = window.prompt("Name this favorite circuit:", suggestion);
      if (name === null) return;
    }
    present(toggleFavoriteCircuit(gateways, { ...slot, name }));
  },
  "open-favorite-circuits": (button) =>
    openFavoriteCircuits(button.dataset.day, Number(button.dataset.circuit)),
  "apply-favorite-circuit": (button) => {
    const result = applyFavoriteCircuit(gateways, {
      favoriteId: button.dataset.favoriteId,
      target: ui.favoriteTarget,
    });
    if (result.changed) {
      dialogById("favorite-dialog").close();
      ui.favoriteTarget = null;
    }
    present(result);
  },
  "delete-favorite-circuit": (button) =>
    present(
      deleteFavoriteCircuit(gateways, { favoriteId: button.dataset.favoriteId }),
    ),
  "toggle-lock": (button) =>
    present(toggleExerciseLock(gateways, parseContext(button))),
  "choose-replacement": (button) => {
    if (!ui.replacement) return;
    const result = replaceExercise(gateways, {
      target: ui.replacement,
      exerciseId: button.dataset.exerciseId,
      showAll: ui.showAllReplacements,
    });
    if (!result.changed) return;
    closeDialog("replace-dialog");
    ui.replacement = null;
    present(result);
  },
  "set-preference": (button) =>
    present(
      rateExercise(gateways, {
        exerciseId: button.dataset.exerciseId,
        thumbsUp: !(Number(button.dataset.value) < 0),
      }),
    ),
  "toggle-hide-workout": (button) => {
    const result = hideWorkoutExercise(gateways, {
      ...parseContext(button),
      exerciseId: button.dataset.exerciseId,
    });
    if (result.changed) ui.replacement = null;
    present(result);
  },
  "hide-replacement": (button) =>
    present(
      toggleHiddenExercise(gateways, {
        exerciseId: button.dataset.exerciseId,
        hideOnly: true,
      }),
    ),
  "add-exercise-from-replacement": () => {
    const replacementContext = ui.replacement ? { ...ui.replacement } : null;
    if (!replacementContext) return;
    ui.returnToReplacementAfterExerciseAdd = true;
    dialogById("replace-dialog").close();
    ui.replacement = replacementContext;
    openExerciseDialog({ fromReplacement: true });
  },
  "open-add-exercise": () => openExerciseDialog(),
  "open-equipment-dialog": () => openEquipmentDialog(),
  "close-equipment-dialog": () =>
    dialogById("equipment-dialog").close(),
  "edit-workout-exercise": (button) =>
    openEditExerciseDialog(button.dataset.exerciseId),
  "close-exercise-dialog": () => {
    const replacementContext =
      ui.returnToReplacementAfterExerciseAdd && ui.replacement
        ? { ...ui.replacement }
        : null;
    ui.editingExerciseId = null;
    ui.returnToReplacementAfterExerciseAdd = false;
    dialogById("exercise-dialog").close();
    if (replacementContext) openReplacement(replacementContext);
  },
  "edit-library": (button) => openEditExerciseDialog(button.dataset.exerciseId),
  "toggle-hide-library": (button) =>
    present(toggleHiddenExercise(gateways, { exerciseId: button.dataset.exerciseId })),
  "delete-library": (button) => {
    const input = { exerciseId: button.dataset.exerciseId };
    const question = deleteLibraryExerciseConfirmation(gateways, input);
    if (!question || !window.confirm(question)) return;
    present(deleteLibraryExercise(gateways, input));
  },
};

export function handleClick(event) {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    ui.currentView = viewButton.dataset.view;
    render();
    document.getElementById("main-content").focus({ preventScroll: true });
    return;
  }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  clickActions[actionButton.dataset.action]?.(actionButton);
}

/** A cycle setting that may regenerate the cycle's days. */
function changeCycleSetting(target, confirmation, interactor, input) {
  if (!confirmed(confirmation(gateways, input))) {
    renderSettings();
    return;
  }
  const result = interactor(gateways, input);
  if (!result.changed && result.value !== undefined) target.value = result.value;
  present(result);
}

export function handleChange(event) {
  const target = event.target;
  if (target.id === "circuit-rep-budget") {
    present(setCircuitRepBudget(gateways, { reps: target.value }));
    return;
  }
  if (target.id === "split-week-start") {
    ui.splitWeekStartDay = DAY_CONFIG.some((day) => day.id === target.value)
      ? target.value
      : "monday";
    target.value = ui.splitWeekStartDay;
    renderSplitOptions();
    return;
  }
  if (target.dataset?.splitEntryIndex !== undefined && ui.splitDraft) {
    const index = Number(target.dataset.splitEntryIndex);
    const validEntry =
      target.value === "rest" || Boolean(reusableCycleForId(target.value));
    if (
      Number.isInteger(index) &&
      index >= 0 &&
      index < ui.splitDraft.entries.length &&
      validEntry
    ) {
      ui.splitDraft.entries[index] = target.value;
    }
    return;
  }
  if (target.dataset?.cycleDraftBodyPart && ui.cycleDraft) {
    const part = target.dataset.cycleDraftBodyPart;
    if (!BODY_PART_OPTIONS.includes(part)) return;
    ui.cycleDraft.bodyParts = target.checked
      ? [...new Set([...ui.cycleDraft.bodyParts, part])]
      : ui.cycleDraft.bodyParts.filter((item) => item !== part);
    return;
  }
  if (target.dataset?.dayCycleSelect && target.dataset.day) {
    const input = { dayId: target.dataset.day, cycleId: target.value };
    if (!confirmed(selectDayCycleConfirmation(gateways, input))) {
      renderWorkout(input.dayId);
      return;
    }
    present(selectDayCycle(gateways, input));
    return;
  }
  if (
    target.dataset?.cooldownSetting === "intervalDays" &&
    target.dataset.cooldownId
  ) {
    present(
      setCooldownInterval(gateways, {
        cooldownId: target.dataset.cooldownId,
        intervalDays: target.value,
      }),
    );
    return;
  }
  if (target.dataset?.cooldownSetting === "label" && target.dataset.cooldownId) {
    const result = renameCooldownExercise(gateways, {
      cooldownId: target.dataset.cooldownId,
      label: target.value,
      final: true,
    });
    if (result.changed) target.value = result.value;
    present(result);
    return;
  }
  if (target.dataset?.warmupSetting === "label" && target.dataset.warmupId) {
    const result = renameWarmupExercise(gateways, {
      warmupId: target.dataset.warmupId,
      label: target.value,
      final: true,
    });
    if (result.changed) target.value = result.value;
    present(result);
    return;
  }
  if (target.dataset?.cycleSetting === "designation" && target.dataset.cycleId) {
    changeCycleSetting(target, setCycleDesignationConfirmation, setCycleDesignation, {
      cycleId: target.dataset.cycleId,
      designation: target.value,
    });
    return;
  }
  if (target.dataset?.cycleSetting === "target" && target.dataset.cycleId) {
    changeCycleSetting(target, setCycleTargetConfirmation, setCycleTarget, {
      cycleId: target.dataset.cycleId,
      target: target.value,
    });
    return;
  }
  if (
    target.dataset?.exerciseSetting === "effectivenessScore" &&
    target.dataset.exerciseId
  ) {
    present(
      setExerciseEffectiveness(gateways, {
        exerciseId: target.dataset.exerciseId,
        score: target.value,
      }),
    );
    return;
  }
  if (target.dataset?.assignmentSetting === "reps") {
    present(
      setAssignmentReps(gateways, {
        dayId: target.dataset.day,
        circuitIndex: Number(target.dataset.circuit),
        position: target.dataset.position,
        reps: target.value,
      }),
    );
    return;
  }
  if (target.dataset?.assignmentSetting === "repBasis") {
    present(
      setAssignmentRepBasis(gateways, {
        dayId: target.dataset.day,
        circuitIndex: Number(target.dataset.circuit),
        position: target.dataset.position,
        repBasis: target.value,
      }),
    );
    return;
  }
  if (
    ["measureType", "loadBasis"].includes(target.dataset?.setting) &&
    target.dataset.exerciseId
  ) {
    present(
      setExerciseMeasurement(gateways, {
        exerciseId: target.dataset.exerciseId,
        setting: target.dataset.setting,
        value: target.value,
      }),
    );
    return;
  }
  const round = target.closest('[data-action="complete-round"]');
  if (round) {
    present(
      completeRound(gateways, {
        dayId: round.dataset.day,
        circuitIndex: Number(round.dataset.circuit),
        round: Number(round.dataset.round),
        completed: round.checked,
      }),
    );
    return;
  }
  const optionalActivator = target.closest(
    '[data-action="complete-optional-activator"]',
  );
  if (optionalActivator) {
    present(
      completeOptionalActivator(gateways, {
        dayId: optionalActivator.dataset.day,
        circuitIndex: Number(optionalActivator.dataset.circuit),
        completed: optionalActivator.checked,
      }),
    );
    return;
  }
  const daily = target.closest('[data-action="daily-check"]');
  if (daily) {
    present(
      checkWarmupExercise(gateways, {
        dayId: daily.dataset.day,
        warmupId: daily.dataset.item,
        completed: daily.checked,
      }),
    );
    return;
  }
  const cooldown = target.closest('[data-action="cooldown-check"]');
  if (cooldown) {
    present(
      checkCooldownExercise(gateways, {
        dayId: cooldown.dataset.day,
        cooldownId: cooldown.dataset.item,
        completed: cooldown.checked,
      }),
    );
    return;
  }

  if (target.id === "library-category") {
    ui.libraryCategory = target.value;
    renderLibrary();
  }
  if (target.id === "library-equipment") {
    ui.libraryEquipment = target.value;
    renderLibrary();
  }
  if (target.id === "library-sort") {
    ui.librarySort = target.value;
    renderLibrary();
  }
  if (target.id === "show-hidden") {
    ui.showHidden = target.checked;
    renderLibrary();
  }
  if (target.id === "show-all-replacements") {
    ui.showAllReplacements = target.checked;
    renderReplacementResults();
  }
  if (target.id === "replace-body-part") {
    ui.replaceBodyPart = target.value;
    renderReplacementResults();
  }
  if (target.id === "replace-equipment") {
    ui.replaceEquipment = target.value;
    renderReplacementResults();
  }
  if (target.id === "replace-sides") {
    ui.replaceSides = target.value;
    renderReplacementResults();
  }
}

/** Clears the load progression marks after the load is typed over. */
function resetLoadProgressDisplay(input) {
  input
    .closest?.(".load-field")
    ?.classList.toggle("has-recommended-weight", Boolean(input.value.trim()));
  const progress = input
    .closest?.(".load-control")
    ?.querySelector?.(".load-progression");
  if (!progress) return;
  progress.setAttribute("aria-label", "0 of 4 workouts completed at this load");
  progress.querySelectorAll(".load-progress-mark").forEach((mark) => {
    mark.classList.remove("is-complete");
    mark.textContent = "";
  });
  progress.querySelector(".increase-load-button")?.remove();
}

export function handleInput(event) {
  const target = event.target;
  if (target.dataset?.splitDraftName && ui.splitDraft) {
    ui.splitDraft.name = target.value.slice(0, 80);
    return;
  }
  if (target.dataset?.cycleDraftName && ui.cycleDraft) {
    ui.cycleDraft.name = target.value.slice(0, 80);
    return;
  }
  if (target.dataset?.cooldownSetting === "label" && target.dataset.cooldownId) {
    present(
      renameCooldownExercise(gateways, {
        cooldownId: target.dataset.cooldownId,
        label: target.value,
        final: false,
      }),
    );
    return;
  }
  if (target.dataset?.warmupSetting === "label" && target.dataset.warmupId) {
    present(
      renameWarmupExercise(gateways, {
        warmupId: target.dataset.warmupId,
        label: target.value,
        final: false,
      }),
    );
    return;
  }
  if (target.dataset?.cycleSetting && target.dataset.cycleId) {
    const cycleId = target.dataset.cycleId;
    if (target.dataset.cycleSetting === "name")
      present(renameCycle(gateways, { cycleId, name: target.value }));
    else if (target.dataset.cycleSetting === "description")
      present(describeCycle(gateways, { cycleId, description: target.value }));
    return;
  }
  const setting = target.dataset.setting;
  const exerciseId = target.dataset.exerciseId;
  if (setting && exerciseId && ["measureType", "loadBasis"].includes(setting)) {
    present(
      setExerciseMeasurement(gateways, { exerciseId, setting, value: target.value }),
    );
    return;
  }
  if (setting && exerciseId && ["reps", "weight", "notes"].includes(setting)) {
    present(
      updateExerciseLog(gateways, { exerciseId, field: setting, value: target.value }),
    );
    if (setting === "weight") resetLoadProgressDisplay(target);
    return;
  }

  if (target.id === "library-search") {
    ui.librarySearch = target.value;
    const caret = target.selectionStart;
    renderLibrary();
    const input = inputById("library-search");
    input.focus();
    input.setSelectionRange(caret, caret);
  }
  if (target.id === "replace-search") {
    ui.replaceSearch = target.value;
    renderReplacementResults();
  }
}

function startNewWeekClicked() {
  if (!window.confirm(START_NEW_WEEK_CONFIRMATION)) return;
  present(startNewWeek(gateways));
}

export function bindEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", handleInput);
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveJson();
    }
  });
  document.getElementById("save-button").addEventListener("click", saveJson);
  document.getElementById("load-button").addEventListener("click", () => {
    if (confirmDiscardUnsavedChanges("Loading a file replaces them."))
      openJsonFile();
  });
  document
    .getElementById("load-input")
    .addEventListener("change", (event) =>
      loadInputFile((event.target as HTMLInputElement).files[0]),
    );
  document
    .getElementById("new-week-button")
    .addEventListener("click", startNewWeekClicked);
  document
    .getElementById("exercise-form")
    .addEventListener("submit", saveExerciseForm);
  document
    .getElementById("equipment-form")
    .addEventListener("submit", saveEquipmentForm);
  dialogById("replace-dialog").addEventListener("close", () => {
    if (!ui.returnToReplacementAfterExerciseAdd) {
      ui.replacement = null;
      ui.replaceSearch = "";
      ui.showAllReplacements = false;
      ui.replaceBodyPart = "all";
      ui.replaceEquipment = "all";
    }
  });
  dialogById("favorite-dialog").addEventListener("close", () => {
    ui.favoriteTarget = null;
  });
  // The browser copy survives a reload, but the workout file only has what
  // was last saved, so warn before leaving with unsaved changes.
  window.addEventListener?.("beforeunload", (event) => {
    if (!gateways.saveStatus.hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = "";
  });
}
