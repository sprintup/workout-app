import { ACTIVATOR_LABEL } from "../config/constants";
import { isEquipmentFreeExercise } from "../entities/circuits";
import { idFor } from "../entities/exercise";
import type { CircuitDefinition } from "../types";
import { BASE_EXERCISES, BASE_EXERCISE_BY_ID } from "./exercise-library";


export const SLOTS: Record<string, CircuitDefinition[]> = {
  monday: [
    {
      category: "Compound",
      first: {
        label: "Push",
        names: [
          "Neutral-grip dumbbell bench press",
          "Incline dumbbell press",
          "Single-arm dumbbell bench press",
          "Dumbbell floor press",
          "Push-up",
          "Incline push-up",
        ],
      },
      second: {
        label: "Pull",
        names: [
          "One-arm dumbbell row",
          "Chest-supported dumbbell row",
          "Seated cable row",
          "Single-arm cable row",
          "Split-stance cable row",
          "Pull-up",
          "Lat pulldown",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: [
          "Dumbbell shrug",
          "Pallof press",
          "Suitcase carry",
          "Farmer carry",
        ],
      },
    },
    {
      category: "Integrated",
      first: {
        label: "Push",
        names: [
          "Renegade row to push-up",
          "Physio-ball push-up",
          "Burpee without overhead jump",
          "Bear crawl",
          "Mountain climber",
        ],
      },
      second: {
        label: "Pull",
        names: [
          "Dumbbell clean",
          "Single-arm dumbbell clean",
          "Dumbbell lateral lunge to row",
          "Dumbbell reverse lunge to curl",
          "Cable rotational row",
          "Renegade row",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: [
          "Suitcase march",
          "Pallof press isometric hold",
          "Cable wood chop, high to low",
          "Dumbbell shrug",
        ],
      },
    },
    {
      category: "Isolation",
      first: {
        label: "Push",
        names: [
          "Dumbbell skull crusher",
          "Dumbbell triceps kickback",
          "Rope triceps pushdown",
          "Single-arm cable pushdown",
          "Cross-body cable triceps extension",
          "Dumbbell chest fly",
        ],
      },
      second: {
        label: "Pull",
        names: [
          "Incline dumbbell curl",
          "Standing dumbbell curl",
          "Dumbbell hammer curl",
          "Concentration curl",
          "FT2 curl-bar curl",
          "Cable curl with straight bar",
          "Single-arm cable curl",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: [
          "Farmer carry",
          "Side plank",
          "Half-kneeling Pallof press",
          "Suitcase carry",
        ],
      },
    },
  ],
  tuesday: [
    {
      category: "Squat + hinge",
      first: {
        label: "Squat",
        names: [
          "Goblet squat",
          "Dumbbell front squat",
          "Dumbbell box squat",
          "Barbell box squat",
          "Barbell back squat",
          "Dumbbell sumo squat",
        ],
      },
      second: {
        label: "Hinge",
        names: [
          "Dumbbell Romanian deadlift",
          "Kickstand dumbbell Romanian deadlift",
          "Cable pull-through",
          "Bodyweight glute bridge",
          "Dumbbell glute bridge",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: ["Wall sit"],
        defaultName: "Wall sit",
      },
    },
    {
      category: "Unilateral + hips",
      first: {
        label: "Unilateral",
        names: [
          "Dumbbell split squat",
          "Reverse lunge",
          "Bulgarian split squat",
          "Step-up",
          "Lateral lunge",
          "Single-leg dumbbell Romanian deadlift",
        ],
      },
      second: {
        label: "Hip strength",
        names: [
          "Dumbbell hip thrust",
          "Dumbbell glute bridge",
          "Single-leg glute bridge",
          "Cable glute kickback",
          "Clamshell",
          "Fire hydrant",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: [
          "Standing two-leg calf raise",
          "Standing single-leg calf raise",
          "Seated dumbbell calf raise",
        ],
      },
    },
    {
      category: "Hamstrings + stability",
      first: {
        label: "Hamstrings",
        names: [
          "Physio-ball hamstring curl",
          "Physio-ball single-leg hamstring curl",
          "Sliding hamstring curl",
          "Hamstring walkout",
          "Physio-ball hip extension",
        ],
      },
      second: {
        label: "Stability",
        names: [
          "Airplane balance exercise",
          "Single-leg glute bridge",
          "Clamshell",
          "Fire hydrant",
          "Quadruped hip extension",
          "Split-squat isometric hold",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: [
          "Tibialis raise against wall",
          "Single-leg tibialis raise",
          "Bent-knee standing calf raise",
        ],
      },
    },
  ],
  wednesday: [
    {
      category: "Rear delt + control",
      first: {
        label: "Rear delt",
        names: [
          "Standing rear-delt cable crossover",
          "Single-arm cable rear-delt fly",
          "Chest-supported reverse fly",
          "Bent-over dumbbell reverse fly",
        ],
        defaultName: "Standing rear-delt cable crossover",
      },
      second: {
        label: "Scapular control",
        names: [
          "Dumbbell scaption raise",
          "Prone Y raise",
          "Prone T raise",
          "Prone W raise",
          "Wall slide",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: [
          "Dumbbell pronation and supination",
          "Dumbbell wrist curl, palms up",
          "Plate pinch hold",
        ],
      },
    },
    {
      category: "Press + rotator cuff",
      first: {
        label: "Seated press",
        names: [
          "Seated neutral-grip dumbbell shoulder press",
          "Seated dumbbell shoulder press",
          "Seated Arnold press",
        ],
        defaultName: "Seated neutral-grip dumbbell shoulder press",
      },
      second: {
        label: "Rotator cuff",
        names: [
          "Cable external rotation",
          "Side-lying dumbbell external rotation",
          "Face pull with external rotation",
          "Cable internal rotation",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: [
          "Dumbbell reverse wrist curl, palms down",
          "Reverse barbell wrist curl",
          "Dead hang",
        ],
      },
    },
    {
      category: "Personal + shoulder health",
      first: {
        label: "Personal movement",
        names: ["Shoulder Exercise Placeholder"],
        defaultName: "Shoulder Exercise Placeholder",
        alwaysLocked: true,
      },
      second: {
        label: "Shoulder health",
        names: [
          "Face pull",
          "Scapular push-up",
          "Wall slide",
          "Prone W raise",
          "Arm circles",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: ["Barbell wrist curl", "Reverse curl", "Towel dead hang"],
      },
    },
  ],
  thursday: [
    {
      category: "Chest strength",
      first: {
        label: "Dumbbell press",
        names: [
          "Neutral-grip dumbbell bench press",
          "Flat dumbbell bench press",
          "Incline dumbbell press",
          "Single-arm dumbbell bench press",
          "Dumbbell squeeze press",
          "Dumbbell floor press",
        ],
      },
      second: {
        label: "Complement",
        names: [
          "Push-up",
          "Incline push-up",
          "Tempo push-up",
          "Close-grip push-up",
          "Physio-ball push-up",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: [
          "Standing two-leg calf raise",
          "Standing single-leg calf raise",
          "Deficit calf raise",
        ],
      },
    },
    {
      category: "Cable fly + triceps",
      first: {
        label: "Cable fly",
        names: [
          "Standing cable chest fly",
          "Single-arm cable fly",
          "Low-to-high cable fly",
          "High-to-low cable fly",
        ],
        defaultName: "Standing cable chest fly",
      },
      second: {
        label: "Triceps",
        names: [
          "Cross-body cable triceps extension",
          "Single-arm cable pushdown",
          "Rope triceps pushdown",
          "Straight-bar triceps pushdown",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: [
          "Seated dumbbell calf raise",
          "Bent-knee standing calf raise",
          "Tibialis raise against wall",
        ],
      },
    },
    {
      category: "Shoulders + triceps",
      first: {
        label: "Seated press",
        names: [
          "Seated neutral-grip dumbbell shoulder press",
          "Seated dumbbell shoulder press",
          "Seated Arnold press",
        ],
      },
      second: {
        label: "Triceps",
        names: [
          "Dumbbell skull crusher",
          "Single-dumbbell skull crusher",
          "Dumbbell triceps kickback",
          "Seated dumbbell overhead triceps extension",
          "Close-grip dumbbell press",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: [
          "Barbell calf raise",
          "Single-leg tibialis raise",
          "Farmer walk on toes",
        ],
      },
    },
  ],
  friday: [
    {
      category: "Vertical pull",
      first: {
        label: "Vertical pull",
        names: [
          "Pull-up",
          "Chin-up",
          "Neutral-grip pull-up",
          "Lat pulldown",
          "Underhand lat pulldown",
        ],
      },
      second: {
        label: "Complement",
        names: [
          "Straight-arm cable pulldown",
          "Scapular pull-up",
          "Single-arm kneeling lat pulldown",
          "High cable row",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: ["PT Exercise 1"],
        defaultName: "PT Exercise 1",
        alwaysLocked: true,
      },
    },
    {
      category: "Row + curl",
      first: {
        label: "Row",
        names: [
          "Seated cable row",
          "Single-arm cable row",
          "Split-stance cable row",
          "One-arm dumbbell row",
          "Chest-supported dumbbell row",
          "Barbell bent-over row",
        ],
      },
      second: {
        label: "Curl",
        names: [
          "FT2 curl-bar curl",
          "Cable curl with straight bar",
          "Single-arm cable curl",
          "Dumbbell hammer curl",
          "Standing dumbbell curl",
          "Incline dumbbell curl",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: ["PT Exercise 2"],
        defaultName: "PT Exercise 2",
        alwaysLocked: true,
      },
    },
    {
      category: "Hinge + arms",
      first: {
        label: "Conservative hinge",
        names: [
          "Dumbbell deadlift",
          "Barbell conventional deadlift",
          "Dumbbell Romanian deadlift",
          "Barbell Romanian deadlift",
          "Kickstand dumbbell Romanian deadlift",
        ],
      },
      second: {
        label: "Curl",
        names: [
          "Cross-body hammer curl",
          "Alternating dumbbell curl",
          "Zottman curl",
          "Barbell curl",
          "Reverse curl",
          "Bayesian cable curl",
        ],
      },
      bridge: {
        label: "Between rounds",
        names: ["PT Exercise 3"],
        defaultName: "PT Exercise 3",
        alwaysLocked: true,
      },
    },
  ],
};


export const flexibleExerciseNames = BASE_EXERCISES
  .filter((exercise) => !exercise.always_locked)
  .map((exercise) => exercise.name);

// The slot tables are built once from the built-in library when the page
// loads; callers at run time pass the current catalog instead.
export const namesMatching = (predicate, exercises = BASE_EXERCISES) =>
  exercises
    .filter((exercise) => !exercise.always_locked && predicate(exercise))
    .map((exercise) => exercise.name);

export const pushNames = namesMatching((exercise) => exercise.force_type === "push");

export const pullNames = namesMatching((exercise) => exercise.force_type === "pull");

export const squatNames = namesMatching(
  (exercise) => exercise.force_type === "squat",
);

export const hingeNames = namesMatching(
  (exercise) => exercise.force_type === "hinge",
);

export const recoveryNames = namesMatching(
  (exercise) =>
    exercise.movement_role === "bridge" ||
    [
      "Core",
      "Calves and Lower Legs",
      "Forearms, Grip and Traps",
      "Shoulders and Rotator Cuff",
    ].includes(exercise.primary_body_part),
);

export const weekendNamePools = Array.from({ length: 6 }, (_, pool) =>
  flexibleExerciseNames.filter((_, index) => index % 6 === pool),
);


SLOTS.saturday = [
  {
    category: "Upper body",
    first: { label: "Push", names: pushNames },
    second: { label: "Pull", names: pullNames },
    bridge: { label: "Between rounds", names: recoveryNames },
  },
  {
    category: "Lower body",
    first: { label: "Squat", names: squatNames },
    second: { label: "Hinge", names: hingeNames },
    bridge: { label: "Between rounds", names: recoveryNames },
  },
  {
    category: "Full body",
    first: { label: "Movement 1", names: weekendNamePools[4] },
    second: { label: "Movement 2", names: weekendNamePools[5] },
    bridge: { label: "Between rounds", names: recoveryNames },
  },
];


SLOTS.sunday = [
  "Mobility + core",
  "Balance + control",
  "Choose your focus",
].map((category, index) => ({
  category,
  first: { label: "Movement 1", names: weekendNamePools[index * 2] },
  second: { label: "Movement 2", names: weekendNamePools[index * 2 + 1] },
  bridge: { label: "Between rounds", names: recoveryNames },
}));


export const totalBodyRoundNames = namesMatching(
  (exercise) =>
    exercise.total_body_activator ||
    exercise.movement_role === "total_body" ||
    (exercise.movement_role === "compound" &&
      exercise.force_type !== "other"),
);

export const totalBodyNamePools = Array.from({ length: 6 }, (_, pool) =>
  totalBodyRoundNames.filter((_, index) => index % 6 === pool),
);

export const totalBodyNoEquipmentNames = totalBodyRoundNames.filter((name) =>
  isEquipmentFreeExercise(BASE_EXERCISE_BY_ID.get(idFor(name))),
);

SLOTS.total_body = [
  "Strength + movement",
  "Integrated total body",
  "Power + control",
].map((category, index) => ({
  category,
  first: { label: "Total body", names: totalBodyNamePools[index * 2] },
  second: { label: "Total body", names: totalBodyNamePools[index * 2 + 1] },
  bridge: { label: "Between rounds", names: recoveryNames },
}));

SLOTS.total_body_no_equipment = [
  "Bodyweight strength",
  "Integrated bodyweight",
  "Bodyweight control",
].map((category, index) => ({
  category,
  first: {
    label: "No-equipment total body",
    names: totalBodyNoEquipmentNames,
    noEquipmentOnly: true,
  },
  second: {
    label: "No-equipment total body",
    names: totalBodyNoEquipmentNames,
    noEquipmentOnly: true,
  },
  bridge: { label: "Between rounds", names: recoveryNames },
}));

SLOTS.designation = ["Primary work", "Secondary work", "Accessory work"].map(
  (category) => ({
    category,
    first: { label: "Target movement", names: flexibleExerciseNames },
    second: { label: "Target movement", names: flexibleExerciseNames },
    bridge: { label: "Between rounds", names: recoveryNames },
  }),
);


for (const circuits of Object.values(SLOTS)) {
  for (const circuit of circuits) circuit.bridge.label = ACTIVATOR_LABEL;
}


export const CIRCUIT_SCALING: Record<
  string,
  Array<{ defaultCount: number; names: string[] }>
> = {
  monday: [
    {
      defaultCount: 3,
      names: [
        "Dumbbell pullover",
        "Straight-arm cable pulldown",
        "Scapular pull-up",
        "Close-grip push-up",
        "Dead hang",
        "Face pull",
        "Dumbbell squeeze press",
      ],
    },
    {
      defaultCount: 4,
      names: [
        "Split-stance cable press and row",
        "Plank dumbbell drag",
        "Cable anti-rotation reverse lunge",
        "Bear crawl",
        "Mountain climber",
        "Physio-ball rollout",
        "Cable golf swing pattern",
        "Crab walk",
      ],
    },
    {
      defaultCount: 3,
      names: [
        "Tate press",
        "Reverse curl",
        "High cable curl",
        "Diamond push-up",
        "Cable shrug",
        "Dumbbell pronation and supination",
        "Bench dip",
      ],
    },
  ],
  tuesday: [
    {
      defaultCount: 2,
      names: [
        "Bodyweight squat",
        "Frog pump",
        "Quadruped hip extension",
        "Airplane balance exercise",
        "Standing two-leg calf raise",
      ],
    },
    {
      defaultCount: 3,
      names: [
        "Cable hip abduction",
        "Cable hip adduction",
        "Cable standing hip flexion",
        "Frog pump",
        "Quadruped hip extension",
        "Airplane balance exercise",
        "Lateral lunge",
      ],
    },
    {
      defaultCount: 4,
      names: [
        "Bird dog",
        "Dead bug",
        "Side plank",
        "Physio-ball plank",
        "Front plank",
        "Clamshell",
        "Fire hydrant",
        "Bodyweight glute bridge",
      ],
    },
  ],
  wednesday: [
    {
      defaultCount: 3,
      names: [
        "Face pull",
        "Scapular push-up",
        "Arm circles",
        "Wall slide",
        "Cable external rotation",
        "Prone W raise",
      ],
    },
    {
      defaultCount: 2,
      names: [
        "Dumbbell lateral raise",
        "Single-arm cable lateral raise",
        "Wall slide",
        "Arm circles",
        "Prone T raise",
      ],
    },
    {
      defaultCount: 4,
      names: [
        "Cable external rotation",
        "Dumbbell scaption raise",
        "Prone Y raise",
        "Prone T raise",
        "Prone W raise",
        "Wall slide",
        "Scapular push-up",
        "Arm circles",
      ],
    },
  ],
  thursday: [
    {
      defaultCount: 3,
      names: [
        "Dumbbell squeeze press",
        "Diamond push-up",
        "Dumbbell triceps kickback",
        "Tate press",
        "Bench dip",
        "Dumbbell chest fly",
      ],
    },
    {
      defaultCount: 4,
      names: [
        "Cable front raise",
        "Single-arm cable lateral raise",
        "Lean-away cable lateral raise",
        "Cable external rotation",
        "Scapular push-up",
        "Wall slide",
        "Face pull",
        "Cable internal rotation",
      ],
    },
    {
      defaultCount: 2,
      names: [
        "Dumbbell lateral raise",
        "Dumbbell front raise",
        "Dumbbell chest fly",
        "Tate press",
        "Diamond push-up",
        "Close-grip push-up",
      ],
    },
  ],
  friday: [
    {
      defaultCount: 2,
      names: [
        "Dead hang",
        "Towel dead hang",
        "Face pull",
        "Cable curl with straight bar",
        "Scapular pull-up",
      ],
    },
    {
      defaultCount: 3,
      names: [
        "Dumbbell pullover",
        "High cable row",
        "Straight-arm cable pulldown",
        "Face pull",
        "Dumbbell shrug",
        "Cable shrug",
        "Dead hang",
        "Bent-over dumbbell row",
        "Renegade row",
        "Dumbbell pronation and supination",
        "Farmer carry",
        "Single-arm cable rear-delt fly",
        "High cable curl",
        "Cable crunch",
        "Reverse curl",
      ],
    },
    {
      defaultCount: 2,
      names: [
        "Dumbbell shrug",
        "Barbell shrug",
        "Cable shrug",
        "Farmer carry",
        "Plate pinch hold",
        "Dead hang",
      ],
    },
  ],
  saturday: [0, 1, 2].map(() => ({
    defaultCount: 2,
    names: flexibleExerciseNames,
  })),
  sunday: [0, 1, 2].map(() => ({
    defaultCount: 2,
    names: flexibleExerciseNames,
  })),
  total_body: [
    { defaultCount: 3, names: totalBodyRoundNames },
    { defaultCount: 3, names: totalBodyRoundNames },
    { defaultCount: 3, names: totalBodyRoundNames },
  ],
  total_body_no_equipment: [
    { defaultCount: 3, names: totalBodyNoEquipmentNames },
    { defaultCount: 3, names: totalBodyNoEquipmentNames },
    { defaultCount: 3, names: totalBodyNoEquipmentNames },
  ],
  designation: [0, 1, 2].map(() => ({
    defaultCount: 3,
    names: flexibleExerciseNames,
  })),
};


for (const [templateKey, circuits] of Object.entries(SLOTS)) {
  circuits.forEach((circuit, index) => {
    const scaling = CIRCUIT_SCALING[templateKey][index];
    circuit.defaultCount = scaling.defaultCount;
    circuit.extra = {
      label: "Round exercise",
      names: scaling.names,
      noEquipmentOnly: templateKey === "total_body_no_equipment",
    };
  });
}
