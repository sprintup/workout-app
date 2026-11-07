import type { Gateways } from "../../gateways/gateways";
import { unchanged, type InteractorResult } from "../interactor";

// As a user
// When I disconnect the database
// Then the app forgets my login; Load and Save need me to sign in again
export function disconnectDatabase(gateways: Gateways): InteractorResult {
  gateways.database.disconnect();
  const path = gateways.workoutFile.connectedPath();
  return unchanged({
    refresh: ["database-dialog"],
    fileStatus: path
      ? { message: `Connected · ${path}`, connected: true }
      : { message: "Not connected · basement-45-workouts.json", connected: false },
    toast: "Database disconnected.",
  });
}
