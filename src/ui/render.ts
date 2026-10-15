import { gateways } from "../gateways/registry";
import { completedCircuits, enabledDays } from "../services/week";
import { formatDate } from "./format";
import { updateWorkoutTimer } from "./timer-view";
import { ui } from "./ui-state";
import { renderLibrary } from "./views/library";
import { renderSettings } from "./views/settings";
import { renderTabs, renderWorkout } from "./views/workout";


export function render() {
  const complete = completedCircuits();
  const circuitTotal = enabledDays().length * 3;
  document.getElementById("week-number").textContent =
    `Week ${gateways.week.number()}`;
  document.getElementById("week-date").textContent = formatDate(
    gateways.week.startedAt(),
  );
  document.getElementById("week-progress-label").textContent =
    `${complete} of ${circuitTotal} circuits complete`;
  document.getElementById("week-progress-bar").style.width =
    `${circuitTotal ? (complete / circuitTotal) * 100 : 0}%`;
  renderTabs();

  const workoutView = document.getElementById("workout-view");
  const libraryView = document.getElementById("library-view");
  const settingsView = document.getElementById("settings-view");
  const showingLibrary = ui.currentView === "library";
  const showingSettings = ui.currentView === "settings";
  workoutView.hidden = showingLibrary || showingSettings;
  libraryView.hidden = !showingLibrary;
  settingsView.hidden = !showingSettings;
  if (showingLibrary) renderLibrary();
  else if (showingSettings) renderSettings();
  else renderWorkout(ui.currentView);
  updateWorkoutTimer();
}
