// Builds the gateway instances the browser app runs with.
import { normalizeState } from "../services/normalize-state";
import { InMemoryAppStateGateway } from "./app-state-gateway";
import { LocalStorageGateway } from "./browser-storage-gateway";
import { SystemClockGateway } from "./clock-gateway";
import { DocumentCycleGateway } from "./cycle-gateway";
import { DocumentExerciseGateway } from "./exercise-gateway";
import { DocumentFavoritesGateway } from "./favorites-gateway";
import type { Gateways } from "./gateways";
import { DocumentPreferencesGateway } from "./preferences-gateway";
import { MathRandomGateway } from "./random-gateway";
import { LocalStorageSaveStatusGateway } from "./save-status-gateway";
import { DocumentRoutineGateway } from "./routine-gateway";
import { DocumentWeekGateway } from "./week-gateway";
import { FileSystemWorkoutFileGateway } from "./workout-file-gateway";

export function createBrowserGateways(): Gateways {
  const appState = new InMemoryAppStateGateway(normalizeState);
  return {
    appState,
    week: new DocumentWeekGateway(appState),
    cycles: new DocumentCycleGateway(appState),
    routines: new DocumentRoutineGateway(appState),
    exercises: new DocumentExerciseGateway(appState),
    favorites: new DocumentFavoritesGateway(appState),
    preferences: new DocumentPreferencesGateway(appState),
    browserStorage: new LocalStorageGateway(),
    saveStatus: new LocalStorageSaveStatusGateway(),
    workoutFile: new FileSystemWorkoutFileGateway(),
    clock: new SystemClockGateway(),
    random: new MathRandomGateway(),
  };
}
