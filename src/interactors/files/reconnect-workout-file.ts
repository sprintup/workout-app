import type { Gateways } from "../../gateways/gateways";
import { unchanged, type InteractorResult } from "../interactor";

// As a user
// When I reopen the app after saving to or loading from a JSON file
// Then Save writes to that same file again, if the browser still allows it
export async function reconnectWorkoutFile(
  gateways: Gateways,
): Promise<InteractorResult> {
  const path = await gateways.workoutFile.restoreConnection();
  if (!path) return unchanged();
  return unchanged({
    fileStatus: { message: `Connected · ${path}`, connected: true },
  });
}
