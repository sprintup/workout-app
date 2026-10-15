import { BODY_PART_OPTIONS, DAY_CONFIG } from "../../data/training";
import type { Gateways } from "../../gateways/gateways";
import { reusableCycleForId, splitForId } from "../../services/cycle-schedule";
import { generateWeek } from "../../services/generation";
import { validateWeek } from "../../services/validation";
import type { Cycle, DayId, SplitDefinition } from "../../types";
import { changed, failed, unchanged, type InteractorResult } from "../interactor";

export interface ApplySplitInput {
  splitId: string;
  beginDayId: DayId;
}

function beginDayFor(dayId: DayId) {
  return DAY_CONFIG.find((day) => day.id === dayId) || DAY_CONFIG[0];
}

export function applySplitConfirmation(
  input: ApplySplitInput,
): string | null {
  const split = splitForId(input.splitId);
  if (!split) return null;
  return `Use the ${split.name} split beginning on ${beginDayFor(input.beginDayId).name}? This replaces the current rotation, clears current workout progress and calendar rest overrides, and removes favorites tied to the old cycles.`;
}

function cyclesForSplit(gateways: Gateways, split: SplitDefinition): Cycle[] {
  const stamp = `${gateways.clock.nowMs()}-${gateways.random.token(5)}`;
  return split.entries.map((entry, index) => {
    if (entry === "rest") {
      return {
        id: `split-${split.id}-rest-${index + 1}-${stamp}`,
        kind: "rest",
        name: "",
        target: null,
        bodyParts: [],
        description: "Scheduled recovery within this training split.",
        circuitExerciseCounts: [null, null, null],
        lockedAssignments: [],
      };
    }
    const cycle = reusableCycleForId(entry);
    return {
      id: `split-${split.id}-${entry}-${index + 1}-${stamp}`,
      kind: "training",
      name: cycle?.name || entry,
      target: cycle?.target || "custom",
      designation: cycle?.name || entry,
      bodyParts: [...(cycle?.bodyParts || BODY_PART_OPTIONS)],
      description:
        cycle?.description ||
        `${cycle?.name || entry} training focused on the selected target muscles.`,
      circuitExerciseCounts: [null, null, null],
      lockedAssignments: [],
    };
  });
}

// As a user
// When I choose a training split (such as PPL or a custom split) and the day
//   it begins on
// Then the split replaces my cycle rotation, lined up so the split's first
//   day falls on that weekday, and a fresh week is generated
export function applySplit(
  gateways: Gateways,
  input: ApplySplitInput,
): InteractorResult {
  const split = splitForId(input.splitId);
  const beginDay = beginDayFor(input.beginDayId);
  if (!split) return unchanged();
  const backup = gateways.appState.snapshot();
  try {
    gateways.cycles.replaceAll(cyclesForSplit(gateways, split));
    gateways.cycles.setActiveSplitId(split.id);
    gateways.cycles.setSplitWeekStartDay(beginDay.id as DayId);
    const cycles = gateways.cycles.all();
    const beginDayIndex = DAY_CONFIG.findIndex((day) => day.id === beginDay.id);
    const mondayCycleIndex =
      (cycles.length - (beginDayIndex % cycles.length)) % cycles.length;
    gateways.week.setStartCycleId(cycles[mondayCycleIndex].id);
    gateways.week.setNextCycleId(gateways.week.startCycleId());
    gateways.favorites.replaceAll([]);
    generateWeek(null, { restDayIds: [], cycleOverrides: {} });
    const issues = validateWeek(gateways.week.current());
    if (issues.length) throw new Error(issues[0]);
  } catch (error) {
    gateways.appState.restore(backup);
    return failed(
      `The split could not be applied: ${(error as Error).message}`,
      { refresh: ["all"] },
    );
  }
  return changed({
    refresh: ["all"],
    toast: `${split.name} is now your active rotation and begins on ${beginDay.name}.`,
  });
}
