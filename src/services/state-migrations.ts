// Follow-up steps that normalization flags when it loads an older document.
import { gateways } from "../gateways/registry";
import { generateWeek } from "./generation";

/** Runs pending follow-ups; returns true when the document changed. */
export function applyPendingStateMigrations() {
  const state = gateways.appState.current();
  let changed = false;
  if (state?.needsCycleRegeneration) {
    delete state.needsCycleRegeneration;
    generateWeek(null, {
      restDayIds: Array.isArray(state.week?.restDayIds)
        ? state.week.restDayIds
        : [],
    });
    changed = true;
  }
  if (state?.needsCooldownNormalization) {
    delete state.needsCooldownNormalization;
    changed = true;
  }
  return changed;
}
