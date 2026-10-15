// After every change: keep the browser copy current (so a reload never loses
// work) and mark the changes as not yet saved to the workout file. The file
// itself is only written when the user presses Save.
import { gateways } from "../gateways/registry";
import { showSaveState } from "./save-indicator";

export function storeSession(): void {
  gateways.browserStorage.save(gateways.appState.current());
  gateways.saveStatus.markUnsaved();
  showSaveState();
}
