import { BODY_PART_OPTIONS, DAY_CONFIG, SPLIT_PRESETS, TARGET_BODY_PARTS, TRAINING_DESIGNATIONS } from "../data/training";
import { normalizeBodyParts } from "./exercise";
import { defaultDesignationLabel, normalizeWorkoutTarget } from "./targets";
import { cyclePosition } from "../services/cycle-schedule";
import type { Cycle } from "../types";


export function createDefaultCycles(): Cycle[] {
  return DAY_CONFIG.slice(1, 5).map((day, index) => ({
    id: `cycle-${index + 1}`,
    kind: "training",
    name: "",
    target: day.defaultTarget,
    designation: defaultDesignationLabel(day.defaultTarget),
    bodyParts: [],
    description: day.guidance,
    circuitExerciseCounts: [null, null, null],
    lockedAssignments: [],
  }));
}


export function isRestCycle(cycle) {
  return cycle?.kind === "rest" || cycle?.rest === true;
}


export function assignmentWithoutSetupScore(assignment) {
  const cleaned = { ...(assignment || {}) };
  delete cleaned.setupScore;
  return cleaned;
}


export function builtInCycleDefinitions() {
  return TRAINING_DESIGNATIONS.map((designation) => ({
    id: designation.id,
    name: designation.label,
    target: designation.target,
    bodyParts: [...designation.bodyParts],
    description: `${designation.label} training focused on the selected target muscles.`,
    template: true,
  }));
}


export function normalizeCustomCycleDefinitions(values) {
  const seen = new Set(TRAINING_DESIGNATIONS.map((cycle) => cycle.id));
  return (Array.isArray(values) ? values : [])
    .slice(0, 64)
    .map((cycle, index) => {
      const requestedId = String(cycle?.id || `custom-cycle-${index + 1}`);
      const id = seen.has(requestedId)
        ? `custom-cycle-${index + 1}-${Date.now()}`
        : requestedId;
      seen.add(id);
      const bodyParts = normalizeBodyParts(cycle?.bodyParts);
      return {
        id,
        name:
          String(cycle?.name || "")
            .trim()
            .slice(0, 80) || `Custom cycle ${index + 1}`,
        target: normalizeWorkoutTarget(cycle?.target, "custom"),
        bodyParts: bodyParts.length ? bodyParts : [...BODY_PART_OPTIONS],
        description: String(cycle?.description || "").slice(0, 600),
      };
    });
}


export function normalizeCustomSplits(values, customCycles = []) {
  const validCycleIds = new Set([
    "rest",
    ...TRAINING_DESIGNATIONS.map((cycle) => cycle.id),
    ...customCycles.map((cycle) => cycle.id),
  ]);
  const seen = new Set(SPLIT_PRESETS.map((split) => split.id));
  return (Array.isArray(values) ? values : [])
    .slice(0, 32)
    .map((split, index) => {
      const requestedId = String(split?.id || `custom-split-${index + 1}`);
      const id = seen.has(requestedId)
        ? `custom-split-${index + 1}-${Date.now()}`
        : requestedId;
      seen.add(id);
      const entries = (Array.isArray(split?.entries) ? split.entries : [])
        .map(String)
        .filter((entry) => validCycleIds.has(entry))
        .slice(0, 16);
      if (!entries.some((entry) => entry !== "rest")) return null;
      return {
        id,
        name:
          String(split?.name || "")
            .trim()
            .slice(0, 80) || `Custom split ${index + 1}`,
        description: String(split?.description || "").slice(0, 300),
        entries,
      };
    })
    .filter(Boolean);
}


export function targetBodyPartsForCycle(cycle) {
  if (isRestCycle(cycle)) return [];
  const selected = normalizeBodyParts(cycle?.bodyParts);
  if (selected.length) return selected;
  const targetId = normalizeWorkoutTarget(cycle?.target);
  return [...(TARGET_BODY_PARTS[targetId] || BODY_PART_OPTIONS)];
}


export function cycleDisplayName(cycle, index = cyclePosition(cycle?.id)) {
  return (
    String(cycle?.name || "").trim() ||
    (isRestCycle(cycle) ? "Rest day" : `Cycle ${index + 1}`)
  );
}


export function cycleTargetLabel(cycle) {
  return isRestCycle(cycle)
    ? "Rest day"
    : String(cycle?.designation || "").trim() ||
        defaultDesignationLabel(cycle?.target);
}
