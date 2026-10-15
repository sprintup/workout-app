import type { Gateways } from "../../gateways/gateways";
import { changed, failed, unchanged, type InteractorResult } from "../interactor";

/** What to ask before raising the load: the exercise name and a suggestion. */
export function loadIncreasePrompt(
  gateways: Gateways,
  input: { exerciseId: string },
): { exerciseName: string; suggestion: string } | null {
  const exercise = gateways.exercises.find(input.exerciseId);
  if (!exercise) return null;
  const currentLoad = String(
    gateways.exercises.stats(input.exerciseId).weight || "",
  ).trim();
  const numericLoad = Number(currentLoad);
  return {
    exerciseName: exercise.name,
    suggestion:
      currentLoad && Number.isFinite(numericLoad)
        ? String(numericLoad + 5)
        : currentLoad,
  };
}

// As a user
// When I finish four workouts at a load and enter a higher load
// Then the new load is saved and its four-workout progression starts over
export function increaseExerciseLoad(
  gateways: Gateways,
  input: { exerciseId: string; requestedLoad: string },
): InteractorResult {
  const exercise = gateways.exercises.find(input.exerciseId);
  if (!exercise) return unchanged();
  const stats = gateways.exercises.stats(input.exerciseId);
  const currentLoad = String(stats.weight || "").trim();
  const nextLoad = String(input.requestedLoad).trim().slice(0, 40);
  if (!nextLoad || nextLoad === currentLoad) {
    return failed(
      "Enter a different load to begin a new four-workout progression.",
    );
  }
  stats.weight = nextLoad;
  stats.loadProgressCount = 0;
  return changed({
    refresh: ["all"],
    toast: `${exercise.name} load updated. Progress checks reset.`,
  });
}
