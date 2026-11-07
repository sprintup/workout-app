import { DATABASE_SYNCED_STATUS } from "../../entities/database";
import type { Gateways } from "../../gateways/gateways";
import {
  matchesCurrentData,
  saveFileText,
} from "../../services/workout-file-format";
import { failed, unchanged, type InteractorResult } from "../interactor";

export interface SaveConfirmation {
  savedAt: string | null;
  /**
   * "changed": another device saved since this browser loaded or saved.
   * "not-loaded": the database holds different data this browser never
   * loaded this session.
   */
  reason: "changed" | "not-loaded";
}

// As a user
// When I press Save (or Ctrl+S) while my database is connected
// Then this browser's data replaces the one copy in my database and the
//   unsaved-changes marker clears. If that would overwrite changes this
//   browser hasn't loaded, I'm asked first and can cancel
export async function saveToDatabase(
  gateways: Gateways,
  input: { confirmed?: boolean } = {},
): Promise<InteractorResult<{ confirm?: SaveConfirmation }>> {
  if (!gateways.database.isConnected())
    return failed("Connect your database to save to it.");
  try {
    const contents = saveFileText();
    let base = gateways.database.syncedRevision();
    if (base === null) {
      const stored = await gateways.database.read();
      if (stored && !matchesCurrentData(stored.contents) && !input.confirmed)
        return confirmFirst({ savedAt: stored.updatedAt, reason: "not-loaded" });
      base = stored?.revision ?? 0;
    }
    let outcome = await gateways.database.write(contents, base);
    if (outcome.status === "conflict") {
      if (!input.confirmed)
        return confirmFirst({ savedAt: outcome.updatedAt, reason: "changed" });
      const latest = await gateways.database.read();
      outcome = await gateways.database.write(contents, latest?.revision ?? 0);
      if (outcome.status === "conflict")
        return failed("Another device saved at the same moment. Press Save again.");
    }
    return unchanged({
      refresh: ["database-dialog"],
      fileStatus: DATABASE_SYNCED_STATUS,
      inSyncWithFile: true,
      toast: "Saved to your database.",
    });
  } catch (error) {
    return failed(
      `Not saved to your database: ${(error as Error).message} Your work is still kept in this browser.`,
    );
  }
}

function confirmFirst(
  confirm: SaveConfirmation,
): InteractorResult<{ confirm?: SaveConfirmation }> {
  return unchanged({ value: { confirm } });
}
