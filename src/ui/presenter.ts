// Applies an interactor's result to the screen: stores the browser copy and
// tracks unsaved changes, switches view, redraws what the result names, and
// shows the toast.
import { gateways } from "../gateways/registry";
import type { InteractorResult, RefreshTarget } from "../interactors/interactor";
import type { DayId } from "../types";
import { renderEquipmentCatalogDialog } from "./dialogs/equipment";
import { renderFavoriteResults } from "./dialogs/favorites";
import { renderReplacementResults } from "./dialogs/replacement";
import { renderSplitDialog } from "./dialogs/split";
import { showToast } from "./feedback";
import { setFileStatus } from "./file-status";
import { render } from "./render";
import { showSaveState } from "./save-indicator";
import { storeSession } from "./session";
import { updateWorkoutTimer } from "./timer-view";
import { ui } from "./ui-state";
import { renderLibrary } from "./views/library";
import { renderSettings } from "./views/settings";
import { renderTabs, renderWorkout } from "./views/workout";

export interface PresentOptions {
  /** The day to redraw for a "workout" refresh. */
  dayId?: DayId;
}

function dialogOpen(id: string): boolean {
  return Boolean((document.getElementById(id) as HTMLDialogElement | null)?.open);
}

/** A newly generated week starts with every activator pane collapsed. */
function forgetStaleWorkoutPanes(): void {
  const week = gateways.week.current();
  if (ui.renderedWeek !== week) {
    ui.expandedActivators.clear();
    ui.renderedWeek = week;
  }
}

const REFRESHERS: Record<RefreshTarget, (options: PresentOptions) => void> = {
  all: () => render(),
  settings: () => renderSettings(),
  tabs: () => renderTabs(),
  library: () => renderLibrary(),
  workout: ({ dayId }) => renderWorkout(dayId || ui.currentView),
  timer: () => updateWorkoutTimer(),
  "replacement-results": () => {
    if (dialogOpen("replace-dialog")) renderReplacementResults();
  },
  "favorite-results": () => {
    if (dialogOpen("favorite-dialog")) renderFavoriteResults();
  },
  "split-dialog": () => renderSplitDialog(),
  "equipment-dialog": () => renderEquipmentCatalogDialog(),
};

export function present(
  result: InteractorResult<unknown>,
  options: PresentOptions = {},
): void {
  if (result.changed) storeSession();
  if (result.inSyncWithFile) {
    gateways.saveStatus.markSaved();
    showSaveState();
  }
  if (result.view) ui.currentView = result.view;
  if (result.fileStatus)
    setFileStatus(result.fileStatus.message, result.fileStatus.connected);
  forgetStaleWorkoutPanes();
  for (const target of result.refresh) REFRESHERS[target](options);
  if (result.toast) showToast(result.toast.message, result.toast.tone);
}
