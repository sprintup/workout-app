import { APP_VERSION } from "../../config/constants";
import type { Gateways } from "../../gateways/gateways";
import { generateWeek } from "../../services/generation";
import { applyPendingStateMigrations } from "../../services/state-migrations";
import { createState } from "../../services/state-factory";
import { validateWeek } from "../../services/validation";
import { changed, unchanged, type InteractorResult } from "../interactor";

/** The browser copy of the document, or null when it is missing or unusable. */
function loadBrowserCopy(gateways: Gateways): unknown | null {
  try {
    const parsed = gateways.browserStorage.load() as {
      version?: number;
      week?: { days?: unknown };
      customExercises?: [];
      exerciseEdits?: {};
    } | null;
    if (!parsed || typeof parsed !== "object" || !parsed.week?.days)
      return null;
    if (Number(parsed.version) > APP_VERSION) {
      console.warn(
        `The browser data was saved by a newer Basement 45 version (${parsed.version}).`,
      );
      return null;
    }
    gateways.exercises.rebuildCatalog(
      parsed.customExercises || [],
      parsed.exerciseEdits || {},
    );
    return parsed;
  } catch (error) {
    console.warn("The saved browser state could not be read.", error);
    return null;
  }
}

// As a user
// When I open the app
// Then my last session in this browser is restored, or a new first week is
//   generated if there is none
export function openApp(gateways: Gateways): InteractorResult {
  const stored = loadBrowserCopy(gateways);
  if (stored) {
    try {
      gateways.appState.restore(stored);
    } catch (error) {
      console.warn("The saved browser state could not be read.", error);
      gateways.appState.replace(null);
    }
  }
  let result: InteractorResult = unchanged();
  if (!gateways.appState.hasState()) {
    gateways.exercises.rebuildCatalog([]);
    gateways.appState.replace(createState());
    generateWeek(null);
    result = changed();
  } else if (applyPendingStateMigrations()) {
    result = changed();
  }
  const issues = validateWeek(gateways.week.current());
  if (issues.length) console.warn("Workout validation warnings:", issues);
  return result;
}
