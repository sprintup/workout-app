import type { Gateways, PickedWorkoutFile } from "../../gateways/gateways";
import { applyPendingStateMigrations } from "../../services/state-migrations";
import { enabledDays } from "../../services/week";
import {
  parseSaveFile,
  stateWithPortableExercises,
} from "../../services/workout-file-format";
import { changed, failed, type InteractorResult } from "../interactor";

// As a user
// When I press Load and choose a JSON workout file
// Then the saved week, settings and exercise history replace what is on
//   screen, and (where the browser allows) later saves go back to that file
export async function loadWorkoutFile(
  gateways: Gateways,
  input: { file: PickedWorkoutFile },
): Promise<InteractorResult> {
  const { file } = input;
  const previousCustomExercises = gateways.exercises.customRecords().slice();
  const previousExerciseEdits = { ...gateways.exercises.edits() };
  try {
    const parsed = parseSaveFile(await file.text());
    const { candidate, recoveredCount } = stateWithPortableExercises(parsed);
    gateways.appState.restore(candidate);
    const state = gateways.appState.current();
    const removedLegacyArmsCycle = Boolean(state.needsCycleRegeneration);
    const normalizedCoreCooldown = Boolean(state.needsCooldownNormalization);
    applyPendingStateMigrations();
    let fileStatus;
    if (file.handle) {
      await gateways.workoutFile.connect(file);
      fileStatus = { message: `Connected · ${file.displayPath}`, connected: true };
    } else {
      fileStatus = { message: `Opened · ${file.displayPath}`, connected: false };
    }
    return changed({
      refresh: ["all"],
      view: enabledDays()[0]?.id || "settings",
      fileStatus,
      inSyncWithFile: true,
      toast: `Loaded Week ${gateways.week.number()} from ${file.name}.${removedLegacyArmsCycle ? " Removed the retired Arms & upper cycle." : ""}${normalizedCoreCooldown ? " Consolidated the core cool-down into 5 core." : ""}${recoveredCount ? ` Recovered ${recoveredCount} portable library exercise${recoveredCount === 1 ? "" : "s"}.` : ""}`,
    });
  } catch (error) {
    gateways.exercises.rebuildCatalog(
      previousCustomExercises,
      previousExerciseEdits,
    );
    return failed(
      (error as Error).message || "The JSON file could not be loaded.",
    );
  }
}
