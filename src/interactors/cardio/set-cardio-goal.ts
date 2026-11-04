import { normalizeCardioGoal } from "../../entities/cardio";
import type { Gateways } from "../../gateways/gateways";
import { changed, type InteractorResult } from "../interactor";

// As a user
// When I change my weekly cardio goal in Settings
// Then every day's cardio shows time done and remaining against the new goal
export function setCardioGoal(
  gateways: Gateways,
  input: { minutes: string | number },
): InteractorResult<number> {
  const settings = gateways.cardio.settings();
  const weeklyGoalMinutes = normalizeCardioGoal(
    input.minutes,
    settings.weeklyGoalMinutes,
  );
  gateways.cardio.replaceSettings({ ...settings, weeklyGoalMinutes });
  return changed({
    refresh: ["all"],
    value: weeklyGoalMinutes,
    toast: `Weekly cardio goal is now ${weeklyGoalMinutes} minutes.`,
  });
}
