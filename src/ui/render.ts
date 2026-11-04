import { gateways } from "../gateways/registry";
import { cardioWeek } from "../services/cardio";
import { completedCircuits, currentStreak, enabledDays, isWeekFinished } from "../services/week";
import { updateWorkoutTimer } from "./timer-view";
import { ui } from "./ui-state";
import { renderLibrary } from "./views/library";
import { renderSettings } from "./views/settings";
import { renderTabs, renderWorkout } from "./views/workout";


export function render() {
  const complete = completedCircuits();
  const circuitTotal = enabledDays().length * 3;
  const streak = currentStreak();
  document.getElementById("streak-count").textContent =
    `${streak} week${streak === 1 ? "" : "s"}`;
  document.getElementById("streak-note").textContent = isWeekFinished()
    ? "This week is done ✓"
    : "";
  document.getElementById("week-progress-label").textContent =
    `${complete} of ${circuitTotal} circuits complete`;
  document.getElementById("week-progress-bar").style.width =
    `${circuitTotal ? (complete / circuitTotal) * 100 : 0}%`;
  const cardioGoal = gateways.cardio.settings().weeklyGoalMinutes;
  const cardioDone = Math.min(cardioGoal, cardioWeek().at(-1).doneThrough);
  document.getElementById("cardio-progress-label").textContent =
    `${cardioDone} of ${cardioGoal} cardio min`;
  document.getElementById("cardio-progress-bar").style.width =
    `${(cardioDone / cardioGoal) * 100}%`;
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
