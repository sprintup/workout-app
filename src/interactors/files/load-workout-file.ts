import type { Gateways, PickedWorkoutFile } from "../../gateways/gateways";
import { enabledDays } from "../../services/week";
import { restoreSaveFile } from "../../services/workout-file-format";
import { changed, failed, type InteractorResult } from "../interactor";

// As a user
// When I press Import and choose a JSON workout file
// Then the saved week, settings and exercise history replace what is on
//   screen, and (where the browser allows) later exports go back to that file.
//   While my database is connected, the imported data reaches it when I
//   press Save
export async function loadWorkoutFile(
  gateways: Gateways,
  input: { file: PickedWorkoutFile },
): Promise<InteractorResult> {
  const { file } = input;
  try {
    const { recoveredCount, removedLegacyArmsCycle, normalizedCoreCooldown } =
      restoreSaveFile(await file.text());
    const toDatabase = gateways.database.isConnected();
    let fileStatus;
    if (toDatabase) {
      fileStatus = undefined;
    } else if (file.handle) {
      await gateways.workoutFile.connect(file);
      fileStatus = { message: `Connected · ${file.displayPath}`, connected: true };
    } else {
      fileStatus = { message: `Opened · ${file.displayPath}`, connected: false };
    }
    return changed({
      refresh: ["all"],
      view: enabledDays()[0]?.id || "settings",
      fileStatus,
      inSyncWithFile: !toDatabase,
      toast: `Loaded Week ${gateways.week.number()} from ${file.name}.${removedLegacyArmsCycle ? " Removed the retired Arms & upper cycle." : ""}${normalizedCoreCooldown ? " Consolidated the core auxiliary exercise into 5 core." : ""}${recoveredCount ? ` Recovered ${recoveredCount} portable library exercise${recoveredCount === 1 ? "" : "s"}.` : ""}${toDatabase ? " Press Save to store it in your database." : ""}`,
    });
  } catch (error) {
    return failed(
      (error as Error).message || "The JSON file could not be loaded.",
    );
  }
}
