// The "Unsaved changes" marker next to the Save button.
import { gateways } from "../gateways/registry";
import { byId } from "./dom";

export function showSaveState(): void {
  const unsaved = gateways.saveStatus.hasUnsavedChanges();
  const marker = byId("save-state");
  if (marker) marker.hidden = !unsaved;
  // The button that would save them: Save while the database is connected.
  const toDatabase = gateways.database.isConnected();
  byId("save-button")?.classList.toggle("has-unsaved-changes", unsaved && !toDatabase);
  byId("db-save-button")?.classList.toggle("has-unsaved-changes", unsaved && toDatabase);
}

export const UNSAVED_CHANGES_WARNING =
  "You have changes that aren't saved yet.";

/** Asks before replacing unsaved changes; true when it is fine to continue. */
export function confirmDiscardUnsavedChanges(action: string): boolean {
  return (
    !gateways.saveStatus.hasUnsavedChanges() ||
    window.confirm(`${UNSAVED_CHANGES_WARNING} ${action} Continue?`)
  );
}
