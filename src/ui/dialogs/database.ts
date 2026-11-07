// The Load and Save buttons and the Database window (sign in, disconnect).
// The login is read from the form, handed to the interactor, and cleared;
// nothing on screen keeps it.
import { gateways } from "../../gateways/registry";
import type { InteractorResult } from "../../interactors/interactor";
import { connectDatabase } from "../../interactors/database/connect-database";
import { disconnectDatabase } from "../../interactors/database/disconnect-database";
import { forgetDatabaseDetails } from "../../interactors/database/forget-database-details";
import { recallDatabaseDetails } from "../../interactors/database/recall-database-details";
import { loadFromDatabase } from "../../interactors/database/load-from-database";
import { saveToDatabase } from "../../interactors/database/save-to-database";
import { byId, dialogById, formById } from "../dom";
import { present } from "../presenter";
import { showSaveState } from "../save-indicator";


export function savedTime(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "an unknown time";
}


/** Toasts sit behind an open dialog, so results also show inside it. */
function presentInDialog(result: InteractorResult<unknown>) {
  const dialog = dialogById("database-dialog");
  const message = byId("database-message");
  message.hidden = !dialog.open || !result.toast;
  message.textContent = result.toast?.message || "";
  message.classList.toggle("error", result.toast?.tone === "error");
  present(result);
  // The form is taller than small windows; bring the message into view.
  if (!message.hidden) message.scrollIntoView({ block: "nearest", behavior: "smooth" });
}


export function renderDatabaseDialog() {
  const connected = gateways.database.isConnected();
  byId("database-button-label").textContent = connected
    ? "Connected"
    : "Connect database";
  byId("db-load-button").hidden = !connected;
  byId("db-save-button").hidden = !connected;
  showSaveState();
  byId("database-connect").hidden = connected;
  byId("database-connected").hidden = !connected;
  const syncedAt = gateways.database.syncedAt();
  byId("database-synced").textContent = syncedAt
    ? `This browser has your data as saved ${savedTime(syncedAt)}.`
    : "Press Load to get your latest data, or Save to store this browser's data there.";
}


/** Fills empty sign-in fields with the details this browser remembers. */
function fillRememberedDetails() {
  const details = recallDatabaseDetails(gateways).value;
  if (!details) return;
  const form = formById("database-form");
  const fields = {
    url: details.url,
    "db-host": details.host,
    "db-name": details.database,
    username: details.user,
  };
  for (const [name, value] of Object.entries(fields)) {
    const input = form.elements.namedItem(name) as HTMLInputElement | null;
    if (input && !input.value) input.value = value;
  }
}


export function openDatabaseDialog(note?: string) {
  fillRememberedDetails();
  const message = byId("database-message");
  message.hidden = !note;
  message.textContent = note || "";
  message.classList.remove("error");
  renderDatabaseDialog();
  const dialog = dialogById("database-dialog");
  if (!dialog.open) dialog.showModal();
}


export async function submitDatabaseForm(event) {
  event.preventDefault();
  const form = formById("database-form");
  const data = new FormData(form);
  const result = await connectDatabase(gateways, {
    url: data.get("url") as string,
    host: data.get("db-host") as string,
    database: data.get("db-name") as string,
    user: data.get("username") as string,
    password: data.get("password") as string,
  });
  if (gateways.database.isConnected()) form.reset();
  presentInDialog(result);
}


/** Save, asking first when it would overwrite changes this browser hasn't loaded. */
export async function saveClicked(): Promise<void> {
  if (!gateways.database.isConnected())
    return openDatabaseDialog("Sign in to save to your database.");
  const result = await saveToDatabase(gateways);
  const confirm = result.value?.confirm;
  if (!confirm) return present(result);
  const question =
    confirm.reason === "changed"
      ? `Your database changed since this browser last loaded it (saved ${savedTime(confirm.savedAt)}, probably from another device). Saving replaces those changes with this browser's data.`
      : `Your database has different data (saved ${savedTime(confirm.savedAt)}) that this browser hasn't loaded. Saving replaces it with this browser's data. To get it instead, cancel and press Load.`;
  if (window.confirm(`${question}\n\nSave anyway?`))
    present(await saveToDatabase(gateways, { confirmed: true }));
}


/** Load, asking first when it would change this browser's data. */
export async function loadClicked(): Promise<void> {
  if (!gateways.database.isConnected())
    return openDatabaseDialog("Sign in to load from your database.");
  const result = await loadFromDatabase(gateways);
  const confirm = result.value?.confirm;
  if (!confirm) return present(result);
  const question = `Load your data as saved ${savedTime(confirm.savedAt)}? It replaces what's in this browser${confirm.losesUnsavedChanges ? ", including changes you haven't saved" : ""}.`;
  if (window.confirm(question))
    present(await loadFromDatabase(gateways, { confirmed: true }));
}


export function forgetDatabaseDetailsClicked() {
  if (
    !window.confirm(
      "Forget the database address, host, name and username saved in this browser?",
    )
  )
    return;
  for (const name of ["url", "db-host", "db-name", "username"]) {
    const input = formById("database-form").elements.namedItem(name) as HTMLInputElement | null;
    if (input) input.value = "";
  }
  presentInDialog(forgetDatabaseDetails(gateways));
}


export function disconnectDatabaseClicked() {
  presentInDialog(disconnectDatabase(gateways));
}
