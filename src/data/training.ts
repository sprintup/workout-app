import { normalizedDesignationKey } from "../entities/text";
import type { DayConfig } from "../types";


export const WORKOUT_TARGETS = [
  { id: "legs", label: "Legs", templateKey: "tuesday" },
  {
    id: "shoulders_rotator",
    label: "Shoulder & Rotator cuff",
    templateKey: "wednesday",
  },
  { id: "push", label: "Push", templateKey: "thursday" },
  { id: "pull", label: "Pull", templateKey: "friday" },
  { id: "total_body", label: "Total Body", templateKey: "total_body" },
  {
    id: "total_body_no_equipment",
    label: "Total Body - No Equipment",
    templateKey: "total_body_no_equipment",
  },
  { id: "custom", label: "Custom", templateKey: "designation" },
];

export const WORKOUT_TARGET_BY_ID = new Map(
  WORKOUT_TARGETS.map((target) => [target.id, target]),
);

export const BODY_PART_OPTIONS = [
  "Chest",
  "Back",
  "Lats",
  "Shoulders",
  "Rotator cuff",
  "Biceps",
  "Triceps",
  "Forearms",
  "Grip",
  "Traps",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Hips",
  "Calves",
  "Abs/core",
  "Full body",
];

export const TARGET_BODY_PARTS = {
  legs: ["Quadriceps", "Hamstrings", "Glutes", "Hips", "Calves"],
  shoulders_rotator: ["Shoulders", "Rotator cuff"],
  push: ["Chest", "Shoulders", "Triceps"],
  pull: ["Back", "Lats", "Biceps", "Forearms", "Grip", "Traps"],
  total_body: [...BODY_PART_OPTIONS],
  total_body_no_equipment: [...BODY_PART_OPTIONS],
  custom: [...BODY_PART_OPTIONS],
};

export const TRAINING_DESIGNATIONS = [
  {
    id: "upper",
    label: "Upper body",
    aliases: ["Upper"],
    target: "custom",
    bodyParts: [
      "Chest",
      "Back",
      "Lats",
      "Shoulders",
      "Rotator cuff",
      "Biceps",
      "Triceps",
      "Forearms",
      "Grip",
      "Traps",
    ],
  },
  {
    id: "lower",
    label: "Lower body",
    aliases: ["Lower"],
    target: "legs",
    bodyParts: ["Quadriceps", "Hamstrings", "Glutes", "Hips", "Calves"],
  },
  {
    id: "push",
    label: "Push",
    target: "push",
    bodyParts: ["Chest", "Shoulders", "Triceps"],
  },
  {
    id: "pull",
    label: "Pull",
    target: "pull",
    bodyParts: ["Back", "Lats", "Biceps", "Forearms", "Grip", "Traps"],
  },
  {
    id: "legs",
    label: "Legs",
    target: "legs",
    bodyParts: ["Quadriceps", "Hamstrings", "Glutes", "Hips", "Calves"],
  },
  {
    id: "chest",
    label: "Chest",
    target: "custom",
    bodyParts: ["Chest"],
  },
  {
    id: "back",
    label: "Back",
    target: "custom",
    bodyParts: ["Back", "Lats", "Traps"],
  },
  {
    id: "arms",
    label: "Arms",
    target: "custom",
    bodyParts: ["Biceps", "Triceps", "Forearms", "Grip"],
  },
  {
    id: "delts",
    label: "Delts",
    target: "custom",
    bodyParts: ["Shoulders", "Rotator cuff"],
  },
  {
    id: "shoulders_rotator",
    label: "Shoulder & Rotator cuff",
    aliases: ["Shoulders and rotator cuff"],
    target: "shoulders_rotator",
    bodyParts: ["Shoulders", "Rotator cuff"],
  },
  {
    id: "full_body",
    label: "Full body",
    aliases: ["Total Body"],
    target: "total_body",
    bodyParts: [...BODY_PART_OPTIONS],
  },
  {
    id: "total_body_no_equipment",
    label: "Total Body - No Equipment",
    aliases: ["Full body no equipment"],
    target: "total_body_no_equipment",
    bodyParts: [...BODY_PART_OPTIONS],
  },
  {
    id: "arms_delts",
    label: "Arms / delts",
    target: "custom",
    bodyParts: [
      "Shoulders",
      "Rotator cuff",
      "Biceps",
      "Triceps",
      "Forearms",
      "Grip",
    ],
  },
];


export const TRAINING_DESIGNATION_BY_KEY = new Map(
  TRAINING_DESIGNATIONS.flatMap((designation) =>
    [designation.id, designation.label, ...(designation.aliases || [])].map(
      (key) => [normalizedDesignationKey(key), designation],
    ),
  ),
);

export const SPLIT_PRESETS = [
  {
    id: "ulppl",
    name: "ULPPL",
    description: "Upper/lower followed by push, pull, and legs.",
    entries: ["rest", "upper", "lower", "rest", "push", "pull", "legs"],
  },
  {
    id: "ppl",
    name: "PPL",
    description: "Two push/pull/legs passes followed by recovery.",
    entries: ["push", "pull", "legs", "push", "pull", "legs", "rest"],
  },
  {
    id: "bro",
    name: "Bro split",
    description: "Dedicated chest, back, legs, arms, and delt days.",
    entries: ["rest", "chest", "back", "legs", "arms", "delts", "rest"],
  },
  {
    id: "full_body",
    name: "Full body",
    description: "Three full-body sessions separated by recovery days.",
    entries: [
      "rest",
      "full_body",
      "rest",
      "full_body",
      "rest",
      "full_body",
      "rest",
    ],
  },
  {
    id: "high_frequency_full_body",
    name: "High-frequency full body",
    description: "Five consecutive full-body sessions between rest days.",
    entries: [
      "rest",
      "full_body",
      "full_body",
      "full_body",
      "full_body",
      "full_body",
      "rest",
    ],
  },
  {
    id: "six_day_upper_lower",
    name: "6-day upper / lower",
    description: "Three alternating upper/lower pairs after recovery.",
    entries: ["rest", "upper", "lower", "upper", "lower", "upper", "lower"],
  },
  {
    id: "four_day_upper_lower_delts",
    name: "4-day upper / lower + delts",
    description: "Two upper/lower pairs plus a focused arms and delts day.",
    entries: [
      "rest",
      "upper",
      "lower",
      "rest",
      "upper",
      "lower",
      "arms_delts",
    ],
  },
];


export const DAY_CONFIG: DayConfig[] = [
  {
    id: "monday",
    short: "MON",
    name: "Monday",
    focus: "Training",
    defaultTarget: "legs",
    guidance:
      "Follow the active cycle target and keep transitions practical for the available equipment.",
  },
  {
    id: "tuesday",
    short: "TUE",
    name: "Tuesday",
    focus: "Legs",
    defaultTarget: "legs",
    guidance:
      "Use controlled depth and conservative loading. The first squat round can be a lighter ramp-up; no separate warm-up block is needed.",
  },
  {
    id: "wednesday",
    short: "WED",
    name: "Wednesday",
    focus: "Shoulder & Rotator cuff",
    defaultTarget: "shoulders_rotator",
    guidance:
      "Keep pressing neutral-grip and seated. Use light, controlled ranges for cuff work and replace anything that causes painful catching.",
  },
  {
    id: "thursday",
    short: "THU",
    name: "Thursday",
    focus: "Push",
    defaultTarget: "push",
    guidance:
      "Use chest, shoulder, and triceps movements that fit your selected equipment. Keep overhead pressing and overhead triceps work seated.",
  },
  {
    id: "friday",
    short: "FRI",
    name: "Friday",
    focus: "Pull",
    defaultTarget: "pull",
    guidance:
      "Keep hinges crisp and conservative. PT exercises remain available in the library and can be edited, hidden, or removed whenever needed.",
  },
  {
    id: "saturday",
    short: "SAT",
    name: "Saturday",
    focus: "Total Body",
    defaultTarget: "total_body",
    guidance:
      "An optional flexible session. Choose any compatible exercises from the library and adjust the circuit difficulty to fit your week.",
    defaultEnabled: false,
  },
  {
    id: "sunday",
    short: "SUN",
    name: "Sunday",
    focus: "Total Body",
    defaultTarget: "total_body",
    guidance:
      "An optional lighter session for mobility, core, balance, or any movements you want to practice.",
    defaultEnabled: false,
  },
];
