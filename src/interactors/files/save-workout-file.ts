import type { Gateways } from "../../gateways/gateways";
import { exportPayload } from "../../services/workout-file-format";
import { failed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I press Save (or Ctrl+S)
// Then my workouts are written to my JSON file (asking where to save it the
//   first time) and the unsaved-changes marker clears; nothing is written to
//   the file until I do this
export async function saveWorkoutFile(
  gateways: Gateways,
): Promise<InteractorResult> {
  try {
    const outcome = await gateways.workoutFile.write(
      JSON.stringify(exportPayload(), null, 2),
      { chooseIfMissing: true, requestPermission: true },
    );
    switch (outcome.status) {
      case "saved":
        return unchanged({
          toast: `Saved directly to ${outcome.fileName}.`,
          fileStatus: { message: `Saved · ${outcome.displayPath}`, connected: true },
          inSyncWithFile: true,
        });
      case "unsupported":
        return failed(
          "Direct file saving requires a current Chrome or Edge browser. Your work is still kept in this browser.",
        );
      case "permission-denied":
        return failed("Permission to write the workout file was not granted.");
      default:
        return unchanged();
    }
  } catch (error) {
    return failed(
      `The workout file could not be saved: ${(error as Error).message}`,
    );
  }
}
