import type { Gateways } from "../../gateways/gateways";
import { generateWeek } from "../../services/generation";
import { validateWeek } from "../../services/validation";
import { archiveCurrentWeek, enabledDays } from "../../services/week";
import { changed, failed, type InteractorResult } from "../interactor";

export const START_NEW_WEEK_CONFIRMATION =
  "Start a new week? This archives the current calendar week, continues with the next cycle in the rotation, keeps cycle locks and saved loads, and clears every checkmark.";

// As a user
// When I finish a week of training and start a new week
// Then the old week is archived and a fresh week is generated with blank
//   checkmarks, continuing the cycle rotation and keeping my locks and loads
export function startNewWeek(gateways: Gateways): InteractorResult {
  const backup = gateways.appState.snapshot();
  try {
    archiveCurrentWeek();
    gateways.week.setNumber(gateways.week.number() + 1);
    gateways.week.setStartedAt(gateways.clock.nowIso());
    gateways.week.setStartCycleId(gateways.week.nextCycleId());
    generateWeek(null, { restDayIds: [] });
    const issues = validateWeek(gateways.week.current());
    if (issues.length) throw new Error(issues[0]);
    return changed({
      refresh: ["all"],
      view: enabledDays()[0]?.id || "settings",
      toast: `Week ${gateways.week.number()} is ready with blank round checkmarks.`,
    });
  } catch (error) {
    gateways.appState.restore(backup);
    return failed(
      `A new week could not be generated: ${(error as Error).message}`,
    );
  }
}
