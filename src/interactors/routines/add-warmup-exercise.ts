import { DAY_CONFIG } from "../../data/training";
import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";
import { MAX_ROUTINE_EXERCISES, nextRoutineId } from "./routine-list";

// As a user
// When I add a warm-up exercise in Settings
// Then it appears in every training day's warm-up checklist
export function addWarmupExercise(gateways: Gateways): InteractorResult {
  const warmups = gateways.routines.warmups();
  if (warmups.length >= MAX_ROUTINE_EXERCISES) return unchanged();
  const exercise = {
    id: nextRoutineId(warmups, "warmup"),
    label: "New warm-up exercise",
  };
  warmups.push(exercise);
  for (const day of DAY_CONFIG) {
    const dayData = gateways.week.day(day.id);
    dayData.preChecklist ||= {};
    dayData.preChecklist[exercise.id] = false;
  }
  return changed({
    refresh: ["settings"],
    toast: "Warm-up exercise added.",
  });
}
