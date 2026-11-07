import { DATABASE_SYNCED_STATUS } from "../../entities/database";
import type { Gateways } from "../../gateways/gateways";
import { enabledDays } from "../../services/week";
import {
  matchesCurrentData,
  restoreSaveFile,
} from "../../services/workout-file-format";
import { changed, failed, unchanged, type InteractorResult } from "../interactor";

export interface LoadConfirmation {
  savedAt: string;
  /** This browser has changes that were never saved; loading loses them. */
  losesUnsavedChanges: boolean;
}

// As a user
// When I press Load while my database is connected
// Then I get the latest data saved from any device. If that would change
//   what's in this browser, I'm asked first (and can cancel); if it already
//   matches, nothing changes
export async function loadFromDatabase(
  gateways: Gateways,
  input: { confirmed?: boolean } = {},
): Promise<InteractorResult<{ confirm?: LoadConfirmation }>> {
  if (!gateways.database.isConnected())
    return failed("Connect your database to load from it.");
  try {
    const stored = await gateways.database.read();
    if (!stored)
      return failed(
        "Nothing is saved in your database yet. Press Save to store this browser's data there.",
      );
    if (matchesCurrentData(stored.contents)) {
      gateways.database.markLoaded(stored);
      return unchanged({
        refresh: ["database-dialog"],
        fileStatus: DATABASE_SYNCED_STATUS,
        inSyncWithFile: true,
        toast: "Already up to date with your database.",
      });
    }
    if (!input.confirmed)
      return unchanged({
        value: {
          confirm: {
            savedAt: stored.updatedAt,
            losesUnsavedChanges: gateways.saveStatus.hasUnsavedChanges(),
          },
        },
      });
    restoreSaveFile(stored.contents);
    gateways.database.markLoaded(stored);
    return changed({
      refresh: ["all", "database-dialog"],
      view: enabledDays()[0]?.id || "settings",
      fileStatus: DATABASE_SYNCED_STATUS,
      inSyncWithFile: true,
      toast: "Loaded your latest data from the database.",
    });
  } catch (error) {
    return failed(`Your data could not be loaded: ${(error as Error).message}`);
  }
}
