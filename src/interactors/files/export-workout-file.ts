import type { Gateways } from "../../gateways/gateways";
import { saveFileText } from "../../services/workout-file-format";
import { failed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I press Export (or Ctrl+S while my database isn't connected)
// Then my data is written to a JSON file on this computer (asking where the
//   first time; later exports go to the same file) and the unsaved-changes
//   marker clears. The file is only written when I do this
export async function exportWorkoutFile(
  gateways: Gateways,
): Promise<InteractorResult> {
  try {
    const outcome = await gateways.workoutFile.write(saveFileText(), {
      chooseIfMissing: true,
      requestPermission: true,
    });
    switch (outcome.status) {
      case "saved":
        return unchanged({
          fileStatus: { message: `Saved · ${outcome.displayPath}`, connected: true },
          inSyncWithFile: true,
          toast: `Exported to ${outcome.fileName}.`,
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
