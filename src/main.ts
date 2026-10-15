// Entry point: installs the gateways, opens the saved session and wires the UI.
import { transitionCost } from "./entities/transitions";
import { createBrowserGateways } from "./gateways/create-gateways";
import { gateways, installGateways } from "./gateways/registry";
import { openApp } from "./interactors/app/open-app";
import { reconnectWorkoutFile } from "./interactors/files/reconnect-workout-file";
import { validateWeek } from "./services/validation";
import { bindEvents } from "./ui/controller";
import { present } from "./ui/presenter";
import { render } from "./ui/render";
import { showSaveState } from "./ui/save-indicator";
import { storeSession } from "./ui/session";
import { updateWorkoutTimer } from "./ui/timer-view";

declare global {
  interface Window {
    Basement45: unknown;
  }
}

function initialize(): void {
  installGateways(createBrowserGateways());
  if (openApp(gateways).changed) storeSession();
  bindEvents();
  render();
  showSaveState();
  reconnectWorkoutFile(gateways).then((result) => present(result));
  window.setInterval?.(updateWorkoutTimer, 1000);

  // A small read-only handle for the smoke tests and the browser console.
  window.Basement45 = {
    get exercises() {
      return gateways.exercises.all();
    },
    getState: () => gateways.appState.snapshot(),
    validateWeek: () => validateWeek(gateways.week.current()),
    transitionCost,
  };
}

initialize();
