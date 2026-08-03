(function () {
  "use strict";

  const APP_VERSION = 2;
  const STORAGE_KEY = "basement45-state-v1";
  const IMPORTED_EXERCISE_COUNT = window.EXERCISE_SOURCE.length;

  const ICONS = {
    arrow:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    book: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22V5.5Zm0 0V19"/></svg>',
    clock:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    external:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/></svg>',
    info: '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>',
    lock: '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    refresh:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 9A7 7 0 0 1 18 6l2 2M17.9 15A7 7 0 0 1 6 18l-2-2"/></svg>',
    search:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>',
    unlock:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/></svg>',
  };

  const DAY_CONFIG = [
    {
      id: "monday",
      short: "MON",
      name: "Monday",
      focus: "Arms & upper body",
      guidance:
        "Balanced by design: one compound, one integrated, and one isolation pairing — each with one push and one pull.",
    },
    {
      id: "tuesday",
      short: "TUE",
      name: "Tuesday",
      focus: "Legs",
      guidance:
        "Use controlled depth and conservative loading. The first squat round can be a lighter ramp-up; no separate warm-up block is needed.",
    },
    {
      id: "wednesday",
      short: "WED",
      name: "Wednesday",
      focus: "Shoulders & rotator cuff",
      guidance:
        "Keep pressing neutral-grip and seated. Use light, controlled ranges for cuff work and replace anything that causes painful catching.",
    },
    {
      id: "thursday",
      short: "THU",
      name: "Thursday",
      focus: "Push",
      guidance:
        "Chest and shoulder presses stay with dumbbells. Cable flyes use a comfortable range; overhead triceps work stays seated.",
    },
    {
      id: "friday",
      short: "FRI",
      name: "Friday",
      focus: "Pull",
      guidance:
        "Keep hinges crisp and conservative. The three PT bridge slots are fixed and carry forward into every new week.",
    },
  ];

  const CUSTOM_EXERCISES = [
    {
      name: "Shoulder Exercise Placeholder",
      category: "Shoulders and Rotator Cuff",
      equipment: "User-defined",
      instructionUrl: null,
      sourceRow: null,
      custom: true,
      alwaysLocked: true,
    },
    ...[1, 2, 3].map((number) => ({
      name: `PT Exercise ${number}`,
      category: "User-defined PT",
      equipment: "User-defined",
      instructionUrl: null,
      sourceRow: null,
      custom: true,
      alwaysLocked: true,
    })),
  ];

  function slugify(value) {
    return value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function includesAny(value, words) {
    const normalized = value.toLowerCase();
    return words.some((word) => normalized.includes(word));
  }

  function inferEquipment(equipmentText) {
    const equipment = [];
    const value = equipmentText.toLowerCase();

    if (includesAny(value, ["ft2", "cable"])) equipment.push("FT2");
    if (value.includes("dumbbell")) equipment.push("dumbbells");
    if (value.includes("barbell")) equipment.push("barbell");
    if (includesAny(value, ["bench", "box"])) equipment.push("bench");
    if (value.includes("squat rack")) equipment.push("squat rack");
    if (value.includes("physio ball")) equipment.push("physio ball");
    if (value.includes("body weight")) equipment.push("body weight");
    if (value.includes("wall")) equipment.push("wall");
    if (value.includes("plate")) equipment.push("plates");

    return equipment.length ? [...new Set(equipment)] : ["user-defined"];
  }

  function inferMovementPattern(record) {
    const value = record.name.toLowerCase();
    if (includesAny(value, ["deadlift", "romanian", "good morning", "pull-through"])) return "hinge";
    if (includesAny(value, ["squat", "lunge", "step-up", "wall sit"])) return "squat";
    if (includesAny(value, ["carry", "march", "walk on toes"])) return "carry";
    if (includesAny(value, ["row", "pull-up", "pulldown", "chin-up"])) return "pull";
    if (includesAny(value, ["press", "push-up", "dip"])) return "push";
    if (includesAny(value, ["rotation", "wood chop", "golf swing", "pronation", "supination"])) return "rotation";
    if (includesAny(value, ["plank", "hold", "dead hang"])) return "isometric";
    if (includesAny(value, ["curl", "raise", "fly", "extension", "pushdown"])) return "isolation";
    return "other";
  }

  function inferMovementRole(record) {
    if (record.movementRole) return record.movementRole;
    if (record.custom) return record.name.startsWith("PT Exercise") ? "bridge" : "isolation";
    if (record.category === "Full Body and Golf Support") return "total_body";
    if (
      ["Forearms, Grip and Traps", "Calves and Lower Legs", "Core"].includes(record.category) ||
      includesAny(record.name, ["wall sit", "airplane balance", "clamshell", "fire hydrant"])
    ) {
      return "bridge";
    }
    if (
      ["Biceps", "Triceps", "Shoulders and Rotator Cuff"].includes(record.category) ||
      includesAny(record.name, ["fly", "pullover", "hamstring curl", "glute kickback", "hip abduction", "hip adduction"])
    ) {
      return "isolation";
    }
    return "compound";
  }

  function inferForceType(record, movementPattern) {
    const value = record.name.toLowerCase();
    const category = record.category;

    if (includesAny(value, ["pallof", "anti-rotation"])) return "anti_rotation";
    if (includesAny(value, ["wood chop", "cable lift", "rotational", "golf swing"])) return "rotation";
    if (includesAny(value, ["carry", "suitcase march", "walk on toes"])) return "carry";
    if (movementPattern === "hinge" || ["Hamstrings", "Glutes and Hips"].includes(category)) return "hinge";
    if (movementPattern === "squat" || category === "Quadriceps") return "squat";
    if (movementPattern === "isometric") return "isometric";
    if (["Chest", "Triceps"].includes(category)) return "push";
    if (["Back and Lats", "Biceps"].includes(category)) return "pull";
    if (category === "Shoulders and Rotator Cuff") {
      if (includesAny(value, ["press", "front raise", "lateral raise", "scaption"])) return "push";
      if (includesAny(value, ["rear-delt", "reverse fly", "face pull"])) return "pull";
    }
    if (record.category === "Full Body and Golf Support") {
      if (includesAny(value, ["push-up", "burpee", "press and row", "bear crawl", "mountain climber"])) return "push";
      if (includesAny(value, ["row", "clean", "curl"])) return "pull";
    }
    return "other";
  }

  function inferBenchPosition(record) {
    const value = `${record.name} ${record.equipment}`.toLowerCase();
    if (value.includes("incline")) return "incline";
    if (includesAny(value, ["seated", "shoulder press", "arnold press", "overhead triceps"])) return "seated_upright";
    if (includesAny(value, ["bench press", "skull crusher", "chest fly", "floor press"])) return "flat";
    return "none";
  }

  function inferPulleyHeight(record) {
    if (!includesAny(record.equipment, ["FT2", "cable"])) return "none";
    const value = record.name.toLowerCase();
    if (includesAny(value, ["high cable", "high-to-low", "pulldown", "pushdown"])) return "high";
    if (includesAny(value, ["low-to-high", "cable front raise", "cable curl", "cable lift"])) return "low";
    if (includesAny(value, ["fly", "row", "rotation", "pallof", "lateral raise"])) return "middle";
    return "variable";
  }

  function inferAttachment(record) {
    const value = record.equipment.toLowerCase();
    if (value.includes("rope")) return "rope";
    if (value.includes("curl bar")) return "curl bar";
    if (includesAny(value, ["straight bar", "lat bar"])) return "bar";
    if (value.includes("ankle strap")) return "ankle strap";
    if (includesAny(value, ["handle", "handles"])) return "handle";
    return null;
  }

  function inferDefaultReps(record) {
    const value = record.name.toLowerCase();
    if (record.custom) return "10–15";
    if (includesAny(value, ["wall sit", "plank", "hold", "dead hang"])) return "30 sec";
    if (includesAny(value, ["carry", "march", "walk on toes"])) return "30 sec";
    if (record.category === "Shoulders and Rotator Cuff" && !value.includes("press")) return "12–15";
    if (includesAny(value, ["clean", "deadlift", "turkish get-up", "burpee"])) return "6–8";
    if (includesAny(value, ["single-arm", "single-leg", "one-arm", "one adjustable"])) return "10 / side";
    return "10";
  }

  function enrichExercise(record) {
    const movementPattern = record.movementPattern || inferMovementPattern(record);
    const forceType = record.forceType || inferForceType(record, movementPattern);
    const value = record.name.toLowerCase();
    const overhead = includesAny(value, ["overhead", "shoulder press", "arnold press"]);
    const shoulderCaution =
      record.shoulderCaution ??
      includesAny(value, ["press", "fly", "dip", "pullover", "turkish get-up", "front raise"]);
    const backCaution =
      record.backCaution ??
      includesAny(value, [
        "deadlift",
        "romanian",
        "good morning",
        "back squat",
        "front squat",
        "bent-over",
        "pendlay",
      ]);
    const advanced = includesAny(value, [
      "turkish get-up",
      "pendlay",
      "nordic",
      "clean to",
      "barbell conventional",
    ]);

    return {
      id: slugify(record.name),
      name: record.name,
      primary_body_part: record.category,
      secondary_body_parts: [],
      movement_pattern: movementPattern,
      movement_role: inferMovementRole(record),
      force_type: forceType,
      equipment: inferEquipment(record.equipment),
      equipment_label: record.equipment,
      setup_location: includesAny(record.equipment, ["FT2", "cable"])
        ? "FT2"
        : includesAny(record.equipment, ["bench", "box"])
          ? "bench area"
          : record.equipment.toLowerCase().includes("squat rack")
            ? "squat rack"
            : "open floor",
      bench_position: inferBenchPosition(record),
      pulley_height: inferPulleyHeight(record),
      attachment: inferAttachment(record),
      unilateral: includesAny(value, ["single-arm", "single-leg", "one-arm", "unilateral", "split-stance"]),
      overhead,
      must_be_seated: overhead,
      shoulder_caution: shoulderCaution,
      back_caution: backCaution,
      technical_difficulty: advanced ? "advanced" : backCaution || record.category === "Full Body and Golf Support" ? "intermediate" : "beginner",
      default_reps: record.defaultReps || inferDefaultReps(record),
      instruction_url: record.instructionUrl || null,
      user_locked: Boolean(record.alwaysLocked),
      notes: overhead
        ? "Keep this movement seated because of the low ceiling."
        : shoulderCaution
          ? "Use a comfortable, controlled range and replace if painful."
          : backCaution
            ? "Use conservative loading and controlled repetitions."
            : null,
      source_row: record.sourceRow,
      custom: Boolean(record.custom),
      always_locked: Boolean(record.alwaysLocked),
    };
  }

  const BASE_EXERCISES = [...window.EXERCISE_SOURCE, ...CUSTOM_EXERCISES].map(enrichExercise);
  let exercises = [...BASE_EXERCISES];
  let exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const idFor = (name) => slugify(name);

  function rebuildExerciseCatalog(customRecords = []) {
    const seen = new Set(BASE_EXERCISES.map((exercise) => exercise.id));
    const userExercises = [];
    for (const record of customRecords) {
      const exercise = enrichExercise({ ...record, custom: true });
      if (!exercise.id || seen.has(exercise.id)) continue;
      seen.add(exercise.id);
      userExercises.push(exercise);
    }
    exercises = [...BASE_EXERCISES, ...userExercises];
    exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }

  const SLOTS = {
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
          names: ["Dumbbell shrug", "Pallof press", "Suitcase carry", "Farmer carry"],
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
          names: ["Suitcase march", "Pallof press isometric hold", "Cable wood chop, high to low", "Dumbbell shrug"],
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
          names: ["Farmer carry", "Side plank", "Half-kneeling Pallof press", "Suitcase carry"],
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
        bridge: { label: "Between rounds", names: ["Wall sit"], defaultName: "Wall sit" },
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
          names: ["Standing two-leg calf raise", "Standing single-leg calf raise", "Seated dumbbell calf raise"],
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
          names: ["Tibialis raise against wall", "Single-leg tibialis raise", "Bent-knee standing calf raise"],
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
          names: ["Dumbbell scaption raise", "Prone Y raise", "Prone T raise", "Prone W raise", "Wall slide"],
        },
        bridge: {
          label: "Between rounds",
          names: ["Dumbbell pronation and supination", "Dumbbell wrist curl, palms up", "Plate pinch hold"],
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
          names: ["Dumbbell reverse wrist curl, palms down", "Reverse barbell wrist curl", "Dead hang"],
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
          names: ["Face pull", "Scapular push-up", "Wall slide", "Prone W raise", "Arm circles"],
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
          names: ["Push-up", "Incline push-up", "Tempo push-up", "Close-grip push-up", "Physio-ball push-up"],
        },
        bridge: {
          label: "Between rounds",
          names: ["Standing two-leg calf raise", "Standing single-leg calf raise", "Deficit calf raise"],
        },
      },
      {
        category: "Cable fly + triceps",
        first: {
          label: "Cable fly",
          names: ["Standing cable chest fly", "Single-arm cable fly", "Low-to-high cable fly", "High-to-low cable fly"],
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
          names: ["Seated dumbbell calf raise", "Bent-knee standing calf raise", "Tibialis raise against wall"],
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
          names: ["Barbell calf raise", "Single-leg tibialis raise", "Farmer walk on toes"],
        },
      },
    ],
    friday: [
      {
        category: "Vertical pull",
        first: {
          label: "Vertical pull",
          names: ["Pull-up", "Chin-up", "Neutral-grip pull-up", "Lat pulldown", "Underhand lat pulldown"],
        },
        second: {
          label: "Complement",
          names: ["Straight-arm cable pulldown", "Scapular pull-up", "Single-arm kneeling lat pulldown", "High cable row"],
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

  const CIRCUIT_SCALING = {
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
  };

  for (const day of DAY_CONFIG) {
    SLOTS[day.id].forEach((circuit, index) => {
      const scaling = CIRCUIT_SCALING[day.id][index];
      circuit.defaultCount = scaling.defaultCount;
      circuit.extra = { label: "Round exercise", names: scaling.names };
    });
  }

  const ui = {
    currentView: "monday",
    librarySearch: "",
    libraryCategory: "all",
    librarySort: "popular",
    showHidden: false,
    replacement: null,
    replaceSearch: "",
    showAllReplacements: false,
  };

  let state;
  let toastTimer;

  function initialExerciseState() {
    return Object.fromEntries(
      exercises.map((exercise) => [
        exercise.id,
        {
          chosenCount: 0,
          skippedCount: 0,
          reps: exercise.default_reps,
          weight: "",
        },
      ]),
    );
  }

  function createState() {
    return {
      version: APP_VERSION,
      weekNumber: 1,
      weekStartedAt: new Date().toISOString(),
      exerciseState: initialExerciseState(),
      customExercises: [],
      hiddenExerciseIds: [],
      deletedExerciseIds: [],
      history: [],
      week: null,
    };
  }

  function matchesSlot(exercise, slot) {
    if (slot.names.some((name) => idFor(name) === exercise.id)) return true;
    if (!exercise.custom || exercise.always_locked) return false;

    const references = slot.names.map((name) => exerciseById.get(idFor(name))).filter(Boolean);
    return references.some(
      (reference) =>
        reference.primary_body_part === exercise.primary_body_part &&
        reference.force_type === exercise.force_type &&
        (reference.movement_pattern === exercise.movement_pattern ||
          reference.movement_role === exercise.movement_role),
    );
  }

  function isHidden(exerciseId) {
    return state?.hiddenExerciseIds?.includes(exerciseId) || false;
  }

  function isDeleted(exerciseId) {
    return state?.deletedExerciseIds?.includes(exerciseId) || false;
  }

  function stateFor(exerciseId) {
    if (!state.exerciseState[exerciseId]) {
      const exercise = exerciseById.get(exerciseId);
      state.exerciseState[exerciseId] = {
        chosenCount: 0,
        skippedCount: 0,
        reps: exercise?.default_reps || "10",
        weight: "",
      };
    }
    return state.exerciseState[exerciseId];
  }

  function transitionCost(first, second) {
    if (!first || !second) return 5;

    const firstEquipment = new Set(first.equipment);
    const secondEquipment = new Set(second.equipment);
    const shares = (name) => firstEquipment.has(name) && secondEquipment.has(name);
    const firstBodyweight = firstEquipment.has("body weight") || first.equipment[0] === "user-defined";
    const secondBodyweight = secondEquipment.has("body weight") || second.equipment[0] === "user-defined";

    let cost;
    if (firstBodyweight && secondBodyweight) cost = 0;
    else if (shares("dumbbells")) cost = 0;
    else if (shares("FT2")) cost = 1;
    else if (shares("barbell")) cost = 1;
    else if (shares("physio ball")) cost = 0;
    else if (firstBodyweight || secondBodyweight) cost = 1;
    else if (first.setup_location === second.setup_location) cost = 2;
    else cost = 3;

    if (
      first.bench_position !== "none" &&
      second.bench_position !== "none" &&
      first.bench_position !== second.bench_position
    ) {
      cost += 1;
    }

    if (shares("FT2")) {
      if (first.attachment && second.attachment && first.attachment !== second.attachment) cost += 1;
      if (
        first.pulley_height !== "variable" &&
        second.pulley_height !== "variable" &&
        first.pulley_height !== second.pulley_height
      ) {
        cost += 1;
      }
    }

    if (shares("dumbbells") && first.bench_position !== second.bench_position) cost += 1;
    return Math.min(5, cost);
  }

  function recentIds() {
    return new Set(state.history.slice(-3).flatMap((week) => week.exerciseIds || []));
  }

  function exerciseScore(exercise, slot, recent) {
    const stats = stateFor(exercise.id);
    const preferredIndex = slot.names.findIndex((name) => idFor(name) === exercise.id);
    let score = Math.random() * 16 + preferredIndex * 0.8 + stats.chosenCount * 0.35;
    if (recent.has(exercise.id)) score += 28;
    if (slot.defaultName && exercise.id === idFor(slot.defaultName)) score -= 18;
    if (exercise.technical_difficulty === "advanced") score += 8;
    return score;
  }

  function candidatesFor(slot, used) {
    return exercises.filter(
      (exercise) =>
        !used.has(exercise.id) &&
        !isHidden(exercise.id) &&
        !isDeleted(exercise.id) &&
        matchesSlot(exercise, slot),
    );
  }

  function preservedAssignment(oldCircuit, position, slot, used, previousOverride = null) {
    const previous = previousOverride || oldCircuit?.[position];
    if (
      previous?.locked &&
      !isDeleted(previous.exerciseId) &&
      !isHidden(previous.exerciseId) &&
      exerciseById.has(previous.exerciseId) &&
      (previous.manualOverride || matchesSlot(exerciseById.get(previous.exerciseId), slot))
    ) {
      if (!used.has(previous.exerciseId)) return { ...previous };
    }

    if (slot.alwaysLocked) {
      const fixedId = idFor(slot.defaultName || slot.names[0]);
      if (!used.has(fixedId)) {
        return {
          exerciseId: fixedId,
          slotLabel: slot.label,
          locked: true,
          fixed: true,
        };
      }
    }

    return null;
  }

  function choosePair(firstSlot, secondSlot, used, oldCircuit) {
    const recent = recentIds();
    const preservedFirst = preservedAssignment(oldCircuit, "first", firstSlot, used);
    if (preservedFirst) used.add(preservedFirst.exerciseId);
    const preservedSecond = preservedAssignment(oldCircuit, "second", secondSlot, used);
    if (preservedSecond) used.add(preservedSecond.exerciseId);

    const firstCandidates = preservedFirst
      ? [exerciseById.get(preservedFirst.exerciseId)]
      : candidatesFor(firstSlot, used);
    const secondCandidates = preservedSecond
      ? [exerciseById.get(preservedSecond.exerciseId)]
      : candidatesFor(secondSlot, used);

    if (preservedFirst) used.delete(preservedFirst.exerciseId);
    if (preservedSecond) used.delete(preservedSecond.exerciseId);

    const pairOptions = [];
    for (const first of firstCandidates) {
      if (used.has(first.id)) continue;
      for (const second of secondCandidates) {
        if (used.has(second.id) || first.id === second.id) continue;
        const cost = transitionCost(first, second);
        pairOptions.push({
          first,
          second,
          cost,
          score:
            cost * 24 +
            exerciseScore(first, firstSlot, recent) +
            exerciseScore(second, secondSlot, recent),
        });
      }
    }

    const preferredOptions = pairOptions.filter((option) => option.cost <= 2);
    const best = (preferredOptions.length ? preferredOptions : pairOptions).sort((a, b) => a.score - b.score)[0];
    if (!best) {
      throw new Error(`No valid exercise pair remains for ${firstSlot.label} + ${secondSlot.label}.`);
    }

    const makeAssignment = (exercise, slot, preserved) => ({
      exerciseId: exercise.id,
      slotLabel: slot.label,
      locked: Boolean(preserved?.locked || slot.alwaysLocked),
      fixed: Boolean(slot.alwaysLocked),
      manualOverride: Boolean(preserved?.manualOverride),
    });

    return {
      first: makeAssignment(best.first, firstSlot, preservedFirst),
      second: makeAssignment(best.second, secondSlot, preservedSecond),
      transitionCost: best.cost,
    };
  }

  function chooseExtra(slot, used, previousExercise, oldAssignment = null) {
    const recent = recentIds();
    const preserved = preservedAssignment(null, null, slot, used, oldAssignment);
    const candidates = preserved
      ? [exerciseById.get(preserved.exerciseId)]
      : candidatesFor(slot, used);
    const valid = candidates
      .filter((exercise) => exercise && (preserved?.manualOverride || transitionCost(previousExercise, exercise) <= 2))
      .sort(
        (first, second) =>
          transitionCost(previousExercise, first) * 24 + exerciseScore(first, slot, recent) -
          (transitionCost(previousExercise, second) * 24 + exerciseScore(second, slot, recent)),
      );
    const selected = valid[0];
    if (!selected) throw new Error(`No compatible exercise remains for ${slot.label}.`);

    return {
      exerciseId: selected.id,
      slotLabel: slot.label,
      locked: Boolean(preserved?.locked),
      fixed: false,
      manualOverride: Boolean(preserved?.manualOverride),
    };
  }

  function chooseBridge(slot, used, oldCircuit) {
    const preserved = preservedAssignment(oldCircuit, "bridge", slot, used);
    if (preserved) return preserved;

    const recent = recentIds();
    const candidates = candidatesFor(slot, used).sort(
      (a, b) => exerciseScore(a, slot, recent) - exerciseScore(b, slot, recent),
    );
    const selected = candidates[0];
    if (!selected) throw new Error(`No bridge exercise remains for ${slot.label}.`);

    return {
      exerciseId: selected.id,
      slotLabel: slot.label,
      locked: Boolean(slot.alwaysLocked),
      fixed: Boolean(slot.alwaysLocked),
    };
  }

  function generateWeek(previousWeek) {
    const used = new Set();
    const days = {};

    for (const day of DAY_CONFIG) {
      const circuits = SLOTS[day.id].map((definition, index) => {
        const oldCircuit = previousWeek?.days?.[day.id]?.circuits?.[index];
        const pair = choosePair(definition.first, definition.second, used, oldCircuit);
        used.add(pair.first.exerciseId);
        used.add(pair.second.exerciseId);
        const oldExtras = Array.isArray(oldCircuit?.extras) ? oldCircuit.extras : [];
        const lockedExtraCount = oldExtras.filter((assignment) => assignment.locked).length;
        const desiredCount = Math.min(
          4,
          Math.max(2, Number(oldCircuit?.preferredExerciseCount) || definition.defaultCount, 2 + lockedExtraCount),
        );
        const extras = [];
        let previousExercise = exerciseById.get(pair.second.exerciseId);
        for (let extraIndex = 0; extraIndex < desiredCount - 2; extraIndex += 1) {
          let extra;
          try {
            extra = chooseExtra(definition.extra, used, previousExercise, oldExtras[extraIndex]);
          } catch (error) {
            throw new Error(`${day.name} circuit ${index + 1}: ${error.message}`);
          }
          extras.push(extra);
          used.add(extra.exerciseId);
          previousExercise = exerciseById.get(extra.exerciseId);
        }
        const bridge = chooseBridge(definition.bridge, used, oldCircuit);
        used.add(bridge.exerciseId);

        return {
          number: index + 1,
          category: definition.category,
          first: pair.first,
          second: pair.second,
          extras,
          bridge,
          rounds: 3,
          preferredExerciseCount: desiredCount,
          roundsCompleted: [false, false, false],
          bridgeCompleted: false,
        };
      });

      days[day.id] = {
        day: day.name,
        focus: day.focus,
        circuits,
      };
    }

    state.week = {
      number: state.weekNumber,
      startedAt: state.weekStartedAt,
      days,
    };

    for (const exerciseId of used) stateFor(exerciseId).chosenCount += 1;
  }

  function archiveCurrentWeek() {
    if (!state.week) return;
    const exerciseIds = DAY_CONFIG.flatMap((day) =>
      state.week.days[day.id].circuits.flatMap((circuit) => [
        circuit.first.exerciseId,
        circuit.second.exerciseId,
        ...(circuit.extras || []).map((assignment) => assignment.exerciseId),
        circuit.bridge.exerciseId,
      ]),
    );
    state.history.push({
      weekNumber: state.weekNumber,
      startedAt: state.weekStartedAt,
      exerciseIds,
    });
    state.history = state.history.slice(-12);
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Local browser storage is unavailable.", error);
    }
  }

  function loadLocalState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (![1, APP_VERSION].includes(parsed.version) || !parsed.week?.days) return null;
      rebuildExerciseCatalog(parsed.customExercises || []);
      return normalizeState(parsed);
    } catch (error) {
      console.warn("The saved browser state could not be read.", error);
      return null;
    }
  }

  function normalizeState(candidate) {
    rebuildExerciseCatalog(candidate.customExercises || []);
    const normalized = createState();
    normalized.weekNumber = Number(candidate.weekNumber) || Number(candidate.week?.number) || 1;
    normalized.weekStartedAt = candidate.weekStartedAt || candidate.week?.startedAt || new Date().toISOString();
    normalized.customExercises = Array.isArray(candidate.customExercises) ? candidate.customExercises : [];
    normalized.hiddenExerciseIds = Array.isArray(candidate.hiddenExerciseIds)
      ? candidate.hiddenExerciseIds.filter((id) => exerciseById.has(id) && !exerciseById.get(id).always_locked)
      : [];
    normalized.deletedExerciseIds = Array.isArray(candidate.deletedExerciseIds)
      ? candidate.deletedExerciseIds.filter((id) => exerciseById.has(id) && !exerciseById.get(id).always_locked)
      : [];
    normalized.history = Array.isArray(candidate.history) ? candidate.history.slice(-12) : [];

    if (candidate.exerciseState && typeof candidate.exerciseState === "object") {
      for (const exercise of exercises) {
        const loaded = candidate.exerciseState[exercise.id];
        if (!loaded) continue;
        normalized.exerciseState[exercise.id] = {
          chosenCount: Math.max(0, Number(loaded.chosenCount) || 0),
          skippedCount: Math.max(0, Number(loaded.skippedCount) || 0),
          reps: String(loaded.reps ?? exercise.default_reps).slice(0, 40),
          weight: String(loaded.weight ?? "").slice(0, 40),
        };
      }
    }

    normalized.week = JSON.parse(JSON.stringify(candidate.week));
    for (const day of DAY_CONFIG) {
      for (const circuit of normalized.week.days[day.id].circuits) {
        circuit.extras = Array.isArray(circuit.extras) ? circuit.extras.slice(0, 2) : [];
        circuit.preferredExerciseCount = Math.min(
          4,
          Math.max(2, Number(circuit.preferredExerciseCount) || 2 + circuit.extras.length),
        );
        const wasComplete = Boolean(circuit.completed);
        circuit.roundsCompleted = Array.isArray(circuit.roundsCompleted)
          ? [0, 1, 2].map((index) => Boolean(circuit.roundsCompleted[index]))
          : [wasComplete, wasComplete, wasComplete];
        circuit.bridgeCompleted =
          typeof circuit.bridgeCompleted === "boolean" ? circuit.bridgeCompleted : wasComplete;
        delete circuit.completed;
      }
    }
    const issues = validateWeek(normalized.week);
    if (issues.length) throw new Error(`The saved week is invalid: ${issues[0]}`);
    return normalized;
  }

  function allAssignments(week = state.week) {
    return DAY_CONFIG.flatMap((day) =>
      week.days[day.id].circuits.flatMap((circuit, circuitIndex) => [
        { ...circuit.first, dayId: day.id, circuitIndex, position: "first" },
        { ...circuit.second, dayId: day.id, circuitIndex, position: "second" },
        ...(circuit.extras || []).map((assignment, extraIndex) => ({
          ...assignment,
          dayId: day.id,
          circuitIndex,
          position: `extra-${extraIndex}`,
        })),
        { ...circuit.bridge, dayId: day.id, circuitIndex, position: "bridge" },
      ]),
    );
  }

  function mainAssignments(circuit) {
    return [circuit.first, circuit.second, ...(circuit.extras || [])];
  }

  function isCircuitComplete(circuit) {
    return (
      Array.isArray(circuit.roundsCompleted) &&
      circuit.roundsCompleted.length === 3 &&
      circuit.roundsCompleted.every(Boolean) &&
      Boolean(circuit.bridgeCompleted)
    );
  }

  function difficultyFor(circuit) {
    const count = mainAssignments(circuit).length;
    if (count === 2) return "Focused";
    if (count === 3) return "Standard";
    return "Challenge";
  }

  function validateWeek(week) {
    const issues = [];
    if (!week?.days) return ["Missing workout days."];
    const ids = [];

    for (const day of DAY_CONFIG) {
      const dayData = week.days[day.id];
      if (!dayData || dayData.circuits?.length !== 3) {
        issues.push(`${day.name} must contain three circuits.`);
        continue;
      }

      for (const circuit of dayData.circuits) {
        if (!circuit.first || !circuit.second || !circuit.bridge || !Array.isArray(circuit.extras)) {
          issues.push(`${day.name} circuit ${circuit.number} is incomplete.`);
          continue;
        }
        const assignments = mainAssignments(circuit);
        if (assignments.length < 2 || assignments.length > 4) {
          issues.push(`${day.name} circuit ${circuit.number} must contain two to four round exercises.`);
        }
        if (!Array.isArray(circuit.roundsCompleted) || circuit.roundsCompleted.length !== 3) {
          issues.push(`${day.name} circuit ${circuit.number} must track three rounds.`);
        }
        if (typeof circuit.bridgeCompleted !== "boolean") {
          issues.push(`${day.name} circuit ${circuit.number} must track its between-rounds movement.`);
        }
        ids.push(...assignments.map((assignment) => assignment.exerciseId), circuit.bridge.exerciseId);
        const mainExercises = assignments.map((assignment) => exerciseById.get(assignment.exerciseId));
        const bridge = exerciseById.get(circuit.bridge.exerciseId);
        if (mainExercises.some((exercise) => !exercise) || !bridge) {
          issues.push(`${day.name} references an unknown exercise.`);
        }
        for (let index = 1; index < mainExercises.length; index += 1) {
          if (
            mainExercises[index - 1] &&
            mainExercises[index] &&
            transitionCost(mainExercises[index - 1], mainExercises[index]) > 2 &&
            !assignments[index - 1].manualOverride &&
            !assignments[index].manualOverride
          ) {
            issues.push(`${day.name} circuit ${circuit.number} has a setup score above 2.`);
          }
        }
        for (const exercise of [...mainExercises, bridge].filter(Boolean)) {
          if (exercise.overhead && !exercise.must_be_seated) {
            issues.push(`${exercise.name} violates the low-ceiling rule.`);
          }
          if (includesAny(exercise.name, ["smith machine", "leg extension machine", "leg curl machine"])) {
            issues.push(`${exercise.name} requires unavailable equipment.`);
          }
        }
      }
    }

    if (ids.length !== new Set(ids).size) issues.push("An exercise is repeated within the weekly plan.");

    const monday = week.days.monday?.circuits || [];
    if (monday.filter((circuit) => circuit.first.slotLabel === "Push").length !== 3) {
      issues.push("Monday must contain three push movements.");
    }
    if (monday.filter((circuit) => circuit.second.slotLabel === "Pull").length !== 3) {
      issues.push("Monday must contain three pull movements.");
    }

    const wednesdayIds = new Set(
      (week.days.wednesday?.circuits || []).flatMap((circuit) => [
        circuit.first.exerciseId,
        circuit.second.exerciseId,
        ...(circuit.extras || []).map((assignment) => assignment.exerciseId),
        circuit.bridge.exerciseId,
      ]),
    );
    if (!wednesdayIds.has(idFor("Shoulder Exercise Placeholder"))) {
      issues.push("Wednesday must preserve the shoulder exercise placeholder.");
    }

    for (const circuit of week.days.thursday?.circuits || []) {
      for (const assignment of mainAssignments(circuit)) {
        const exercise = exerciseById.get(assignment.exerciseId);
        if (
          !assignment.manualOverride &&
          exercise?.equipment.includes("FT2") &&
          exercise.name.toLowerCase().includes("press") &&
          !exercise.name.toLowerCase().includes("pushdown")
        ) {
          issues.push("Thursday contains an FT2 pressing exercise.");
        }
      }
    }

    const fridayBridges = (week.days.friday?.circuits || []).map((circuit) => circuit.bridge.exerciseId);
    [1, 2, 3].forEach((number, index) => {
      if (fridayBridges[index] !== idFor(`PT Exercise ${number}`)) {
        issues.push(`Friday must preserve PT Exercise ${number}.`);
      }
    });

    return issues;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Starting today";
    return `Started ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date)}`;
  }

  function completedCircuits() {
    return DAY_CONFIG.reduce(
      (total, day) => total + state.week.days[day.id].circuits.filter(isCircuitComplete).length,
      0,
    );
  }

  function renderTabs() {
    const tabs = DAY_CONFIG.map((day) => {
      const completeCount = state.week.days[day.id].circuits.filter(isCircuitComplete).length;
      const active = ui.currentView === day.id;
      return `
        <button class="day-tab ${active ? "active" : ""}" type="button" data-view="${day.id}" aria-current="${active ? "page" : "false"}">
          <span class="day-short">${day.short}</span>
          <span><strong>${day.name}</strong><small>${escapeHtml(day.focus)}</small></span>
          <span class="tab-status ${completeCount === 3 ? "complete" : ""}" aria-label="${completeCount} of 3 circuits complete">&#10003;</span>
        </button>`;
    }).join("");

    const libraryActive = ui.currentView === "library";
    document.getElementById("day-tabs").innerHTML = `${tabs}
      <button class="day-tab library-tab ${libraryActive ? "active" : ""}" type="button" data-view="library" aria-current="${libraryActive ? "page" : "false"}">
        <span class="day-short">${ICONS.book}</span>
        <span><strong>Exercise library</strong><small>${IMPORTED_EXERCISE_COUNT} spreadsheet exercises</small></span>
        <span class="tab-status">${ICONS.arrow}</span>
      </button>`;
  }

  function cautionText(exercise) {
    if (exercise.shoulder_caution && exercise.back_caution) return "Shoulder + back aware";
    if (exercise.shoulder_caution) return "Shoulder aware";
    if (exercise.back_caution) return "Back aware";
    return "";
  }

  function renderExerciseItem(assignment, context) {
    const exercise = exerciseById.get(assignment.exerciseId);
    const settings = stateFor(exercise.id);
    const fixed = assignment.fixed || exercise.always_locked;
    const caution = cautionText(exercise);
    const itemClass = context.position === "bridge" ? "exercise-item bridge-item" : "exercise-item";

    return `
      <div class="${itemClass}">
        <div class="exercise-topline">
          <span class="slot-label">${escapeHtml(assignment.slotLabel)}</span>
          <span class="exercise-tools">
            ${
              context.position === "bridge"
                ? `<label class="bridge-check" title="Mark the between-rounds movement complete">
                    <input type="checkbox" data-action="complete-bridge" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" ${context.bridgeCompleted ? "checked" : ""} />
                    <span>Done</span>
                  </label>`
                : ""
            }
            <button
              class="mini-button ${assignment.locked ? "active" : ""}"
              type="button"
              data-action="toggle-lock"
              data-day="${context.dayId}"
              data-circuit="${context.circuitIndex}"
              data-position="${context.position}"
              title="${fixed ? "This user-defined exercise is fixed" : assignment.locked ? "Unlock this exercise" : "Keep this exercise in future weeks"}"
              aria-label="${fixed ? "Fixed exercise" : assignment.locked ? `Unlock ${escapeHtml(exercise.name)}` : `Lock ${escapeHtml(exercise.name)}`}"
              ${fixed ? "disabled" : ""}
            >${assignment.locked ? ICONS.lock : ICONS.unlock}</button>
            <button
              class="mini-button"
              type="button"
              data-action="replace"
              data-day="${context.dayId}"
              data-circuit="${context.circuitIndex}"
              data-position="${context.position}"
              title="Replace exercise"
              aria-label="Replace ${escapeHtml(exercise.name)}"
              ${assignment.locked ? "disabled" : ""}
            >${ICONS.refresh}</button>
          </span>
        </div>
        <h3 class="exercise-name">${escapeHtml(exercise.name)}</h3>
        <div class="exercise-meta">
          ${
            exercise.instruction_url
              ? `<a href="${escapeHtml(exercise.instruction_url)}" target="_blank" rel="noreferrer">View demo ${ICONS.external}</a>`
              : `<span>Custom movement</span>`
          }
          ${caution ? `<span title="${escapeHtml(exercise.notes)}">• ${escapeHtml(caution)}</span>` : ""}
        </div>
        <div class="exercise-fields">
          <label class="compact-field">
            <span>Reps</span>
            <input data-setting="reps" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.reps)}" aria-label="Repetitions for ${escapeHtml(exercise.name)}" />
          </label>
          <label class="compact-field">
            <span>Load</span>
            <input data-setting="weight" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.weight)}" placeholder="—" inputmode="decimal" aria-label="Weight for ${escapeHtml(exercise.name)}" />
            <small>lb</small>
          </label>
        </div>
      </div>`;
  }

  function renderCircuit(dayId, circuit, circuitIndex) {
    const assignments = mainAssignments(circuit);
    const exerciseItems = assignments
      .map((assignment, index) => {
        const position = index === 0 ? "first" : index === 1 ? "second" : `extra-${index - 2}`;
        const item = renderExerciseItem(assignment, { dayId, circuitIndex, position });
        if (index === assignments.length - 1) return item;
        const current = exerciseById.get(assignment.exerciseId);
        const nextAssignment = assignments[index + 1];
        const next = exerciseById.get(nextAssignment.exerciseId);
        const cost = transitionCost(current, next);
        const manual = assignment.manualOverride || nextAssignment.manualOverride;
        return `${item}<div class="transition-divider"><span title="Setup score: 0 is no change, 1 is a small change, and 2 is one quick adjustment.">${manual ? "Manual · " : ""}Setup ${cost}/5</span></div>`;
      })
      .join("");
    const lastExtra = circuit.extras[circuit.extras.length - 1];
    const canRemove = circuit.extras.length > 0 && !lastExtra?.locked;
    const complete = isCircuitComplete(circuit);

    return `
      <article class="circuit-card ${complete ? "is-complete" : ""}">
        <header class="circuit-header">
          <div class="circuit-number">
            <span class="number-badge">${circuit.number}</span>
            <span class="circuit-title"><span>Circuit ${circuit.number}</span><strong>${escapeHtml(circuit.category)}</strong></span>
          </div>
          <div class="circuit-scaling">
            <span class="rounds-badge">${difficultyFor(circuit)} · ${assignments.length} exercises</span>
            <span class="scale-buttons">
              <button type="button" data-action="remove-round-exercise" data-day="${dayId}" data-circuit="${circuitIndex}" aria-label="Remove the last round exercise" title="Remove the last round exercise" ${canRemove ? "" : "disabled"}>−</button>
              <button type="button" data-action="add-round-exercise" data-day="${dayId}" data-circuit="${circuitIndex}" aria-label="Add a round exercise" title="Add a compatible round exercise" ${assignments.length >= 4 ? "disabled" : ""}>+</button>
            </span>
          </div>
        </header>
        <div class="circuit-body">
          ${exerciseItems}
          <div class="round-checks" aria-label="Completed rounds for circuit ${circuit.number}">
            ${[0, 1, 2]
              .map(
                (round) => `<label class="round-check">
                  <input type="checkbox" data-action="complete-round" data-day="${dayId}" data-circuit="${circuitIndex}" data-round="${round}" ${circuit.roundsCompleted[round] ? "checked" : ""} />
                  <span>Round ${round + 1}</span>
                </label>`,
              )
              .join("")}
          </div>
          <div class="bridge-wrap">
            ${renderExerciseItem(circuit.bridge, {
              dayId,
              circuitIndex,
              position: "bridge",
              bridgeCompleted: circuit.bridgeCompleted,
            })}
          </div>
        </div>
      </article>`;
  }

  function renderWorkout(dayId) {
    const config = DAY_CONFIG.find((day) => day.id === dayId);
    const day = state.week.days[dayId];
    const completed = day.circuits.filter(isCircuitComplete).length;

    document.getElementById("workout-view").innerHTML = `
      <div class="content-frame">
        <header class="view-header">
          <div>
            <span class="eyebrow">${completed} of 3 circuits complete</span>
            <h1>${config.name} <span>— ${escapeHtml(config.focus)}</span></h1>
            <p class="view-subtitle">Complete each circuit for three rounds. Focused, standard, and challenge circuits contain two to four exercises; the separate bridge movement fills part of the rest period.</p>
          </div>
          <div class="session-chip">${ICONS.clock}<span><span>Target time</span><strong>About 45 minutes</strong></span></div>
        </header>
        <div class="day-guidance">${ICONS.info}<span>${escapeHtml(config.guidance)}</span></div>
        <div class="circuit-grid">
          ${day.circuits.map((circuit, index) => renderCircuit(dayId, circuit, index)).join("")}
        </div>
      </div>`;
  }

  function categoryOptions() {
    return [...new Set(exercises.map((exercise) => exercise.primary_body_part))].sort();
  }

  function filteredLibrary() {
    const search = ui.librarySearch.trim().toLowerCase();
    const filtered = exercises.filter((exercise) => {
      if (isDeleted(exercise.id)) return false;
      if (isHidden(exercise.id) && !ui.showHidden) return false;
      const matchesCategory = ui.libraryCategory === "all" || exercise.primary_body_part === ui.libraryCategory;
      const haystack = `${exercise.name} ${exercise.primary_body_part} ${exercise.equipment_label}`.toLowerCase();
      return matchesCategory && (!search || haystack.includes(search));
    });

    return filtered.sort((first, second) => {
      const firstStats = stateFor(first.id);
      const secondStats = stateFor(second.id);
      if (ui.librarySort === "popular") {
        return secondStats.chosenCount - firstStats.chosenCount || first.name.localeCompare(second.name);
      }
      if (ui.librarySort === "skipped") {
        return secondStats.skippedCount - firstStats.skippedCount || first.name.localeCompare(second.name);
      }
      if (ui.librarySort === "category") {
        return first.primary_body_part.localeCompare(second.primary_body_part) || first.name.localeCompare(second.name);
      }
      return first.name.localeCompare(second.name);
    });
  }

  function renderLibraryCard(exercise) {
    const stats = stateFor(exercise.id);
    const caution = cautionText(exercise);
    const hidden = isHidden(exercise.id);
    const fixed = exercise.always_locked;
    return `
      <article class="library-card ${hidden ? "is-hidden" : ""}">
        <div class="library-name">
          <strong>${escapeHtml(exercise.name)}</strong>
          <span>${escapeHtml(exercise.primary_body_part)}${hidden ? " · Hidden from recommendations" : ""}</span>
        </div>
        <div>
          <div class="library-equipment">${escapeHtml(exercise.equipment_label)}</div>
          <div class="library-tags">
            <span class="tag">${escapeHtml(exercise.movement_role.replace("_", " "))}</span>
            <span class="tag">${escapeHtml(exercise.force_type.replace("_", " "))}</span>
            ${caution ? `<span class="tag caution">${escapeHtml(caution)}</span>` : ""}
          </div>
        </div>
        <div class="library-counts" aria-label="Exercise usage">
          <span><strong>${stats.chosenCount}</strong>chosen</span>
          <span><strong>${stats.skippedCount}</strong>skipped</span>
        </div>
        <div class="library-fields">
          <input data-setting="reps" data-exercise-id="${exercise.id}" value="${escapeHtml(stats.reps)}" aria-label="Default repetitions for ${escapeHtml(exercise.name)}" title="Repetitions" />
          <input data-setting="weight" data-exercise-id="${exercise.id}" value="${escapeHtml(stats.weight)}" placeholder="Load lb" inputmode="decimal" aria-label="Default load for ${escapeHtml(exercise.name)}" title="Load in pounds" />
          ${
            exercise.instruction_url
              ? `<a class="demo-button" href="${escapeHtml(exercise.instruction_url)}" target="_blank" rel="noreferrer" aria-label="View a demonstration of ${escapeHtml(exercise.name)}" title="View demo">${ICONS.external}</a>`
              : `<span></span>`
          }
          <button class="library-action" type="button" data-action="toggle-hide-library" data-exercise-id="${exercise.id}" ${fixed ? "disabled" : ""}>${hidden ? "Restore" : "Hide"}</button>
          <button class="library-action delete" type="button" data-action="delete-library" data-exercise-id="${exercise.id}" ${fixed ? "disabled" : ""}>Delete</button>
        </div>
      </article>`;
  }

  function renderLibrary() {
    const items = filteredLibrary();
    const totalChosen = exercises.reduce((total, exercise) => total + stateFor(exercise.id).chosenCount, 0);
    const totalSkipped = exercises.reduce((total, exercise) => total + stateFor(exercise.id).skippedCount, 0);

    document.getElementById("library-view").innerHTML = `
      <div class="content-frame">
        <header class="view-header">
          <div>
            <span class="eyebrow">Imported from Excel</span>
            <h1>Exercise <span>library</span></h1>
            <p class="view-subtitle">Browse every spreadsheet exercise, tune its saved reps and load, or sort by what you choose and skip most often.</p>
          </div>
          <button class="button button-primary" id="add-exercise-button" type="button" data-action="open-add-exercise">+ Add exercise</button>
        </header>
        <div class="library-toolbar">
          <label class="search-field">${ICONS.search}<span class="sr-only">Search exercise library</span><input id="library-search" type="search" value="${escapeHtml(ui.librarySearch)}" placeholder="Search name, category, or equipment" /></label>
          <label class="select-field"><span>Category</span><select id="library-category">
            <option value="all">All</option>
            ${categoryOptions().map((category) => `<option value="${escapeHtml(category)}" ${ui.libraryCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
          </select></label>
          <label class="select-field"><span>Sort</span><select id="library-sort">
            <option value="popular" ${ui.librarySort === "popular" ? "selected" : ""}>Most popular</option>
            <option value="skipped" ${ui.librarySort === "skipped" ? "selected" : ""}>Most skipped</option>
            <option value="name" ${ui.librarySort === "name" ? "selected" : ""}>Name A–Z</option>
            <option value="category" ${ui.librarySort === "category" ? "selected" : ""}>Category</option>
          </select></label>
        </div>
        <div class="library-stats">
          <span class="stat-pill"><strong>${IMPORTED_EXERCISE_COUNT}</strong> spreadsheet exercises</span>
          <span class="stat-pill"><strong>${CUSTOM_EXERCISES.length}</strong> fixed custom movements</span>
          <span class="stat-pill"><strong>${state.customExercises.length}</strong> exercises added by you</span>
          <span class="stat-pill"><strong>${totalChosen}</strong> total selections</span>
          <span class="stat-pill"><strong>${totalSkipped}</strong> replacements</span>
          <label class="stat-pill show-hidden"><input id="show-hidden" type="checkbox" ${ui.showHidden ? "checked" : ""} /> Show ${state.hiddenExerciseIds.length} hidden</label>
        </div>
        <div class="library-list">
          ${items.length ? items.map(renderLibraryCard).join("") : '<div class="empty-state">No exercises match those filters.</div>'}
        </div>
      </div>`;
  }

  function render() {
    const complete = completedCircuits();
    document.getElementById("week-number").textContent = `Week ${state.weekNumber}`;
    document.getElementById("week-date").textContent = formatDate(state.weekStartedAt);
    document.getElementById("week-progress-label").textContent = `${complete} of 15 circuits complete`;
    document.getElementById("week-progress-bar").style.width = `${(complete / 15) * 100}%`;
    renderTabs();

    const workoutView = document.getElementById("workout-view");
    const libraryView = document.getElementById("library-view");
    const showingLibrary = ui.currentView === "library";
    workoutView.hidden = showingLibrary;
    libraryView.hidden = !showingLibrary;
    if (showingLibrary) renderLibrary();
    else renderWorkout(ui.currentView);
  }

  function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast visible ${type === "error" ? "error" : ""}`;
    toastTimer = setTimeout(() => {
      toast.className = "toast";
    }, 3200);
  }

  function slotFor(context) {
    const definition = SLOTS[context.dayId][context.circuitIndex];
    if (context.position?.startsWith("extra")) return definition.extra;
    return definition[context.position];
  }

  function assignmentFor(context) {
    const circuit = state.week.days[context.dayId].circuits[context.circuitIndex];
    if (context.position?.startsWith("extra-")) {
      return circuit.extras[Number(context.position.split("-")[1])];
    }
    if (context.position === "extra-new") return null;
    return circuit[context.position];
  }

  function adjacentExercises(context) {
    if (context.position === "bridge") return [];
    const circuit = state.week.days[context.dayId].circuits[context.circuitIndex];
    const assignments = mainAssignments(circuit);
    let index;
    if (context.position === "first") index = 0;
    else if (context.position === "second") index = 1;
    else if (context.position === "extra-new") index = assignments.length;
    else index = Number(context.position.split("-")[1]) + 2;

    return [assignments[index - 1], assignments[index + 1]]
      .filter(Boolean)
      .map((assignment) => exerciseById.get(assignment.exerciseId))
      .filter(Boolean);
  }

  function setupScoreForOption(exercise, context) {
    const adjacent = adjacentExercises(context);
    return adjacent.length ? Math.max(...adjacent.map((partner) => transitionCost(exercise, partner))) : 0;
  }

  function replacementOptions() {
    if (!ui.replacement) return [];
    const slot = slotFor(ui.replacement);
    const assignment = assignmentFor(ui.replacement);
    const used = new Set(allAssignments().map((item) => item.exerciseId));
    if (assignment) used.delete(assignment.exerciseId);
    const search = ui.replaceSearch.trim().toLowerCase();

    return exercises
      .filter((exercise) => {
        if (
          used.has(exercise.id) ||
          isHidden(exercise.id) ||
          isDeleted(exercise.id) ||
          exercise.id === assignment?.exerciseId ||
          (!ui.showAllReplacements && !matchesSlot(exercise, slot))
        ) {
          return false;
        }
        if (search && !`${exercise.name} ${exercise.equipment_label}`.toLowerCase().includes(search)) return false;
        return ui.showAllReplacements || setupScoreForOption(exercise, ui.replacement) <= 2;
      })
      .sort((first, second) => {
        const firstCost = setupScoreForOption(first, ui.replacement);
        const secondCost = setupScoreForOption(second, ui.replacement);
        return firstCost - secondCost || stateFor(second.id).chosenCount - stateFor(first.id).chosenCount || first.name.localeCompare(second.name);
      })
      .map((exercise) => ({
        exercise,
        cost: setupScoreForOption(exercise, ui.replacement),
        eligible: matchesSlot(exercise, slot),
      }));
  }

  function renderReplacementResults() {
    const results = replacementOptions();
    document.getElementById("replace-count").textContent = `${results.length} option${results.length === 1 ? "" : "s"}`;
    document.getElementById("replace-results").innerHTML = results.length
      ? results
          .map(
            ({ exercise, cost, eligible }) => `
              <button class="replace-option" type="button" data-action="choose-replacement" data-exercise-id="${exercise.id}">
                <span><strong>${escapeHtml(exercise.name)}</strong><small>${escapeHtml(exercise.primary_body_part)} · ${escapeHtml(exercise.equipment_label)} · chosen ${stateFor(exercise.id).chosenCount} times${eligible ? "" : " · outside this slot's target"}</small></span>
                <span class="cost-badge cost-${cost}">${ui.replacement.position === "bridge" && eligible ? "Eligible" : `Setup ${cost}/5`}</span>
              </button>`,
          )
          .join("")
      : '<div class="empty-state">No unused eligible exercises match this search.</div>';
  }

  function openReplacement(context) {
    const assignment = assignmentFor(context);
    if (assignment.locked) return;
    const exercise = exerciseById.get(assignment.exerciseId);
    ui.replacement = context;
    ui.replaceSearch = "";
    ui.showAllReplacements = false;
    document.getElementById("replace-title").textContent = `Replace ${exercise.name}`;
    document.getElementById("replace-description").textContent = `Only exercises that fit this ${assignment.slotLabel.toLowerCase()} slot and the day's target are shown.`;
    document.getElementById("replace-search").value = "";
    document.getElementById("show-all-replacements").checked = false;
    document.getElementById("replacement-scope-note").textContent = "Only eligible, easy 0–2 options are shown.";
    renderReplacementResults();
    document.getElementById("replace-dialog").showModal();
    setTimeout(() => document.getElementById("replace-search").focus(), 0);
  }

  function openAddRoundExercise(dayId, circuitIndex) {
    const circuit = state.week.days[dayId].circuits[circuitIndex];
    if (mainAssignments(circuit).length >= 4) return;
    ui.replacement = { dayId, circuitIndex, position: "extra-new", mode: "add" };
    ui.replaceSearch = "";
    ui.showAllReplacements = false;
    document.getElementById("replace-title").textContent = "Add a round exercise";
    document.getElementById("replace-description").textContent =
      "Choose an unused exercise that fits this day and keeps adjacent setup changes easy.";
    document.getElementById("replace-search").value = "";
    document.getElementById("show-all-replacements").checked = false;
    document.getElementById("replacement-scope-note").textContent = "Only eligible, easy 0–2 options are shown.";
    renderReplacementResults();
    document.getElementById("replace-dialog").showModal();
    setTimeout(() => document.getElementById("replace-search").focus(), 0);
  }

  function resetCircuitCompletion(circuit) {
    circuit.roundsCompleted = [false, false, false];
    circuit.bridgeCompleted = false;
  }

  function replaceExercise(exerciseId) {
    if (!ui.replacement) return;
    const assignment = assignmentFor(ui.replacement);
    const next = exerciseById.get(exerciseId);
    if (!next || (!ui.showAllReplacements && !matchesSlot(next, slotFor(ui.replacement)))) return;

    const circuit = state.week.days[ui.replacement.dayId].circuits[ui.replacement.circuitIndex];
    const manualOverride =
      !matchesSlot(next, slotFor(ui.replacement)) || setupScoreForOption(next, ui.replacement) > 2;
    if (ui.replacement.mode === "add") {
      circuit.extras.push({
        exerciseId: next.id,
        slotLabel: slotFor(ui.replacement).label,
        locked: false,
        fixed: false,
        manualOverride,
      });
      circuit.preferredExerciseCount = mainAssignments(circuit).length;
      stateFor(next.id).chosenCount += 1;
      resetCircuitCompletion(circuit);
      persist();
      document.getElementById("replace-dialog").close();
      ui.replacement = null;
      render();
      showToast(`${next.name} added to the round.`);
      return;
    }

    const previous = exerciseById.get(assignment.exerciseId);
    stateFor(previous.id).skippedCount += 1;
    stateFor(next.id).chosenCount += 1;
    assignment.exerciseId = next.id;
    assignment.locked = false;
    assignment.manualOverride = manualOverride;
    resetCircuitCompletion(circuit);
    persist();
    document.getElementById("replace-dialog").close();
    ui.replacement = null;
    render();
    showToast(`${next.name} added. ${previous.name} counted as skipped.`);
  }

  function removeRoundExercise(dayId, circuitIndex) {
    const circuit = state.week.days[dayId].circuits[circuitIndex];
    const assignment = circuit.extras[circuit.extras.length - 1];
    if (!assignment || assignment.locked) return;
    const exercise = exerciseById.get(assignment.exerciseId);
    circuit.extras.pop();
    circuit.preferredExerciseCount = mainAssignments(circuit).length;
    stateFor(assignment.exerciseId).skippedCount += 1;
    resetCircuitCompletion(circuit);
    persist();
    render();
    showToast(`${exercise.name} removed from this round.`);
  }

  function startNewWeek() {
    const confirmed = window.confirm(
      "Start a new week? This archives the current exercise choices, keeps locked exercises and saved loads, and clears every circuit checkmark.",
    );
    if (!confirmed) return;

    const backup = JSON.parse(JSON.stringify(state));
    try {
      const previousWeek = state.week;
      archiveCurrentWeek();
      state.weekNumber += 1;
      state.weekStartedAt = new Date().toISOString();
      generateWeek(previousWeek);
      const issues = validateWeek(state.week);
      if (issues.length) throw new Error(issues[0]);
      ui.currentView = "monday";
      persist();
      render();
      showToast(`Week ${state.weekNumber} is ready with blank round checkmarks.`);
    } catch (error) {
      state = normalizeState(backup);
      showToast(`A new week could not be generated: ${error.message}`, "error");
    }
  }

  function exportPayload() {
    const lockedIds = new Set(allAssignments().filter((assignment) => assignment.locked).map((assignment) => assignment.exerciseId));
    return {
      app: "Basement 45",
      schemaVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      appState: state,
      exerciseLibrary: exercises.map((exercise) => ({
        ...exercise,
        chosen_count: stateFor(exercise.id).chosenCount,
        skipped_count: stateFor(exercise.id).skippedCount,
        current_reps: stateFor(exercise.id).reps,
        current_weight: stateFor(exercise.id).weight,
        user_locked: exercise.always_locked || lockedIds.has(exercise.id),
        hidden: isHidden(exercise.id),
        deleted: isDeleted(exercise.id),
      })),
    };
  }

  function saveJson() {
    const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `basement-45-week-${state.weekNumber}-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
    showToast("Workout data saved as JSON.");
  }

  async function loadJson(file) {
    if (!file) return;
    const previousCustomExercises = state.customExercises.slice();
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed.appState) throw new Error("This is not a Basement 45 save file.");
      state = normalizeState(parsed.appState);
      ui.currentView = "monday";
      persist();
      render();
      showToast(`Loaded Week ${state.weekNumber} from ${file.name}.`);
    } catch (error) {
      rebuildExerciseCatalog(previousCustomExercises);
      showToast(error.message || "The JSON file could not be loaded.", "error");
    } finally {
      document.getElementById("load-input").value = "";
    }
  }

  function openExerciseDialog() {
    const form = document.getElementById("exercise-form");
    form.reset();
    const categories = [...new Set(window.EXERCISE_SOURCE.map((record) => record.category))].sort();
    document.getElementById("custom-category").innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join("");
    document.getElementById("exercise-dialog").showModal();
    setTimeout(() => form.elements.name.focus(), 0);
  }

  function addCustomExercise(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const exerciseId = idFor(name);
    if (!exerciseId || exerciseById.has(exerciseId)) {
      showToast("An exercise with that name already exists.", "error");
      return;
    }

    const record = {
      name,
      category: String(data.get("category") || "Other"),
      equipment: String(data.get("equipment") || "User-defined").trim(),
      instructionUrl: String(data.get("instructionUrl") || "").trim() || null,
      sourceRow: null,
      custom: true,
      movementPattern: String(data.get("movementPattern") || "other"),
      movementRole: String(data.get("movementRole") || "isolation"),
      forceType: String(data.get("forceType") || "other"),
      defaultReps: String(data.get("defaultReps") || "10").trim() || "10",
      shoulderCaution: data.get("shoulderCaution") === "on",
      backCaution: data.get("backCaution") === "on",
    };

    state.customExercises.push(record);
    rebuildExerciseCatalog(state.customExercises);
    stateFor(exerciseId);
    persist();
    document.getElementById("exercise-dialog").close();
    renderLibrary();
    showToast(`${name} added to the exercise library.`);
  }

  function toggleHiddenExercise(exerciseId) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise || exercise.always_locked || isDeleted(exerciseId)) return;
    if (isHidden(exerciseId)) {
      state.hiddenExerciseIds = state.hiddenExerciseIds.filter((id) => id !== exerciseId);
      showToast(`${exercise.name} restored to recommendations.`);
    } else {
      state.hiddenExerciseIds.push(exerciseId);
      showToast(`${exercise.name} hidden from future recommendations.`);
    }
    persist();
    renderLibrary();
  }

  function deleteLibraryExercise(exerciseId) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise || exercise.always_locked || isDeleted(exerciseId)) return;
    const inCurrentWeek = allAssignments().some((assignment) => assignment.exerciseId === exerciseId);
    const message = inCurrentWeek
      ? `Delete ${exercise.name} from the library? It will remain in the current week until you replace it, but will not be recommended again.`
      : `Delete ${exercise.name} from the library and future recommendations?`;
    if (!window.confirm(message)) return;
    state.deletedExerciseIds.push(exerciseId);
    state.hiddenExerciseIds = state.hiddenExerciseIds.filter((id) => id !== exerciseId);
    persist();
    renderLibrary();
    showToast(`${exercise.name} deleted from the library.`);
  }

  function parseContext(element) {
    return {
      dayId: element.dataset.day,
      circuitIndex: Number(element.dataset.circuit),
      position: element.dataset.position,
    };
  }

  function handleClick(event) {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      ui.currentView = viewButton.dataset.view;
      render();
      document.getElementById("main-content").focus({ preventScroll: true });
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    if (actionButton.dataset.action === "replace") {
      openReplacement(parseContext(actionButton));
    }
    if (actionButton.dataset.action === "add-round-exercise") {
      openAddRoundExercise(actionButton.dataset.day, Number(actionButton.dataset.circuit));
    }
    if (actionButton.dataset.action === "remove-round-exercise") {
      removeRoundExercise(actionButton.dataset.day, Number(actionButton.dataset.circuit));
    }
    if (actionButton.dataset.action === "toggle-lock") {
      const assignment = assignmentFor(parseContext(actionButton));
      if (!assignment.fixed) {
        assignment.locked = !assignment.locked;
        persist();
        render();
        showToast(assignment.locked ? "Exercise locked for future weeks." : "Exercise unlocked.");
      }
    }
    if (actionButton.dataset.action === "choose-replacement") {
      replaceExercise(actionButton.dataset.exerciseId);
    }
    if (actionButton.dataset.action === "open-add-exercise") {
      openExerciseDialog();
    }
    if (actionButton.dataset.action === "close-exercise-dialog") {
      document.getElementById("exercise-dialog").close();
    }
    if (actionButton.dataset.action === "toggle-hide-library") {
      toggleHiddenExercise(actionButton.dataset.exerciseId);
    }
    if (actionButton.dataset.action === "delete-library") {
      deleteLibraryExercise(actionButton.dataset.exerciseId);
    }
  }

  function handleChange(event) {
    const round = event.target.closest('[data-action="complete-round"]');
    if (round) {
      const circuit = state.week.days[round.dataset.day].circuits[Number(round.dataset.circuit)];
      circuit.roundsCompleted[Number(round.dataset.round)] = round.checked;
      persist();
      render();
      return;
    }

    const bridge = event.target.closest('[data-action="complete-bridge"]');
    if (bridge) {
      const circuit = state.week.days[bridge.dataset.day].circuits[Number(bridge.dataset.circuit)];
      circuit.bridgeCompleted = bridge.checked;
      persist();
      render();
      return;
    }

    if (event.target.id === "library-category") {
      ui.libraryCategory = event.target.value;
      renderLibrary();
    }
    if (event.target.id === "library-sort") {
      ui.librarySort = event.target.value;
      renderLibrary();
    }
    if (event.target.id === "show-hidden") {
      ui.showHidden = event.target.checked;
      renderLibrary();
    }
    if (event.target.id === "show-all-replacements") {
      ui.showAllReplacements = event.target.checked;
      document.getElementById("replacement-scope-note").textContent = ui.showAllReplacements
        ? "Showing every unused library exercise; target and setup limits are intentionally relaxed."
        : "Only eligible, easy 0–2 options are shown.";
      renderReplacementResults();
    }
  }

  function handleInput(event) {
    const setting = event.target.dataset.setting;
    const exerciseId = event.target.dataset.exerciseId;
    if (setting && exerciseId && ["reps", "weight"].includes(setting)) {
      stateFor(exerciseId)[setting] = event.target.value.slice(0, 40);
      persist();
      return;
    }

    if (event.target.id === "library-search") {
      ui.librarySearch = event.target.value;
      const caret = event.target.selectionStart;
      renderLibrary();
      const input = document.getElementById("library-search");
      input.focus();
      input.setSelectionRange(caret, caret);
    }
    if (event.target.id === "replace-search") {
      ui.replaceSearch = event.target.value;
      renderReplacementResults();
    }
  }

  function bindEvents() {
    document.addEventListener("click", handleClick);
    document.addEventListener("change", handleChange);
    document.addEventListener("input", handleInput);
    document.getElementById("save-button").addEventListener("click", saveJson);
    document.getElementById("load-button").addEventListener("click", () => document.getElementById("load-input").click());
    document.getElementById("load-input").addEventListener("change", (event) => loadJson(event.target.files[0]));
    document.getElementById("new-week-button").addEventListener("click", startNewWeek);
    document.getElementById("exercise-form").addEventListener("submit", addCustomExercise);
    document.getElementById("replace-dialog").addEventListener("close", () => {
      ui.replacement = null;
      ui.replaceSearch = "";
      ui.showAllReplacements = false;
    });
  }

  function initialize() {
    try {
      state = loadLocalState();
    } catch (error) {
      console.warn(error);
      state = null;
    }

    if (!state) {
      rebuildExerciseCatalog([]);
      state = createState();
      generateWeek(null);
      persist();
    }

    const issues = validateWeek(state.week);
    if (issues.length) console.warn("Workout validation warnings:", issues);
    bindEvents();
    render();

    window.Basement45 = {
      get exercises() {
        return exercises;
      },
      getState: () => JSON.parse(JSON.stringify(state)),
      validateWeek: () => validateWeek(state.week),
      transitionCost,
    };
  }

  initialize();
})();
