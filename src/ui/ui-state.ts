// What is on screen: the open view, filters, open dialogs and unsaved drafts.
// None of this is saved; the saved data lives behind the gateways.
import type { ReplacementTarget } from "../interactors/circuits/replace-exercise";
import type { FavoriteSlot } from "../interactors/favorites/toggle-favorite-circuit";
import type { CycleDefinitionDraft } from "../interactors/splits/save-cycle-definition";
import type { SplitDraft } from "../interactors/splits/save-custom-split";
import type { DayId, Week } from "../types";

export interface UiState {
  /** A day id, "library" or "settings". */
  currentView: string;
  librarySearch: string;
  libraryCategory: string;
  libraryEquipment: string;
  librarySort: string;
  showHidden: boolean;
  /** The slot the replacement dialog is choosing for. */
  replacement: ReplacementTarget | null;
  replaceSearch: string;
  showAllReplacements: boolean;
  replaceBodyPart: string;
  replaceEquipment: string;
  replaceSides: string;
  /** Reopen the replacement dialog after adding an exercise from it. */
  returnToReplacementAfterExerciseAdd: boolean;
  editingExerciseId: string | null;
  favoriteTarget: FavoriteSlot | null;
  /** Circuits whose optional-activator pane is open, as "dayId-circuitIndex". */
  expandedActivators: Set<string>;
  showBodyPartCoverage: boolean;
  selectedSplitId: string | null;
  splitWeekStartDay: DayId;
  editingSplitId: string | null;
  splitDraft: SplitDraft | null;
  showCycleManager: boolean;
  editingCycleId: string | null;
  cycleDraft: CycleDefinitionDraft | null;
  /** The week object last drawn; a new one collapses the activator panes. */
  renderedWeek: Week | null;
}

export const ui: UiState = {
  currentView: "monday",
  librarySearch: "",
  libraryCategory: "all",
  libraryEquipment: "all",
  librarySort: "popular",
  showHidden: false,
  replacement: null,
  replaceSearch: "",
  showAllReplacements: false,
  replaceBodyPart: "all",
  replaceEquipment: "all",
  replaceSides: "all",
  returnToReplacementAfterExerciseAdd: false,
  editingExerciseId: null,
  favoriteTarget: null,
  expandedActivators: new Set(),
  showBodyPartCoverage: false,
  selectedSplitId: null,
  splitWeekStartDay: "monday",
  editingSplitId: null,
  splitDraft: null,
  showCycleManager: false,
  editingCycleId: null,
  cycleDraft: null,
  renderedWeek: null,
};

/** The replacement dialog's current query: its target slot plus filters. */
export function replacementQuery() {
  return {
    context: ui.replacement,
    search: ui.replaceSearch,
    showAll: ui.showAllReplacements,
    bodyPart: ui.replaceBodyPart,
    equipment: ui.replaceEquipment,
    sides: ui.replaceSides,
  };
}

/** Clears the replacement dialog's filters for a new target. */
export function resetReplacementFilters(
  target: ReplacementTarget | null = null,
): void {
  ui.replacement = target;
  ui.replaceSearch = "";
  ui.showAllReplacements = false;
  ui.replaceBodyPart = "all";
  ui.replaceEquipment = "all";
  ui.replaceSides = "all";
}
