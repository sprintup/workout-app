import { DAY_CONFIG } from "../../data/training";
import type { Gateways } from "../../gateways/gateways";
import { changed, unchanged, type InteractorResult } from "../interactor";
import { MAX_ROUTINE_EXERCISES, nextRoutineId } from "./routine-list";

// As a user
// When I add a cool-down exercise in Settings
// Then it appears in the cool-down checklist, scheduled every day until I
//   choose another interval
export function addCooldownExercise(gateways: Gateways): InteractorResult {
  const cooldowns = gateways.routines.cooldowns();
  if (cooldowns.length >= MAX_ROUTINE_EXERCISES) return unchanged();
  const exercise = {
    id: nextRoutineId(cooldowns, "cooldown"),
    label: "New cool-down exercise",
    intervalDays: 1,
    completedDates: [],
  };
  cooldowns.push(exercise);
  for (const day of DAY_CONFIG) {
    const dayData = gateways.week.day(day.id);
    dayData.cooldownChecklist ||= {};
    dayData.cooldownChecklist[exercise.id] = false;
  }
  return changed({
    refresh: ["settings"],
    toast: "Cool-down exercise added.",
  });
}
