(function () {
  "use strict";

  const APP_VERSION = 8;
  const STORAGE_KEY = "basement45-state-v1";
  const ACTIVATOR_LABEL = "Total Body activator";

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
    thumbUp:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10v11H3V10h4Zm0 9h10.3a2 2 0 0 0 2-1.7l1.1-7A2 2 0 0 0 18.4 8H14l.7-3.1A2.4 2.4 0 0 0 12.3 2L7 10v9Z"/></svg>',
    thumbDown:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 14V3H3v11h4Zm0-9h10.3a2 2 0 0 1 2 1.7l1.1 7a2 2 0 0 1-2 2.3H14l.7 3.1a2.4 2.4 0 0 1-2.4 2.9L7 14V5Z"/></svg>',
    eyeOff:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 6 9 6a16.7 16.7 0 0 1-2.1 2.8M6.6 6.6C4.4 8.1 3 10 3 10s3.5 6 9 6c1 0 1.9-.2 2.7-.5"/></svg>',
    star: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>',
    favorites:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m8.5 3 1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1L4 6.3l3.1-.4L8.5 3Z"/><path d="M14 13.5h6M17 10.5v6M5 19h15"/></svg>',
    pencil:
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4ZM13.5 6.5l4 4"/></svg>',
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
        "Keep hinges crisp and conservative. The three PT total-body activator slots are fixed and carry forward into every new week.",
    },
    {
      id: "saturday",
      short: "SAT",
      name: "Saturday",
      focus: "Optional workout",
      guidance:
        "An optional flexible session. Choose any compatible exercises from the library and adjust the circuit difficulty to fit your week.",
      defaultEnabled: false,
    },
    {
      id: "sunday",
      short: "SUN",
      name: "Sunday",
      focus: "Optional recovery",
      guidance:
        "An optional lighter session for mobility, core, balance, or any movements you want to practice.",
      defaultEnabled: false,
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
    if (value.includes("kettlebell")) equipment.push("kettlebell");
    if (value.includes("band")) equipment.push("bands");
    if (value.includes("back extension")) equipment.push("back extension machine");
    if (value.includes("pull-up bar") || value.includes("pull up bar")) equipment.push("pull-up bar");
    if (value.includes("ankle strap")) equipment.push("ankle straps");
    if (value.includes("curl bar")) equipment.push("curl bar");
    if (value.includes("straight bar")) equipment.push("straight bar");
    if (includesAny(value, ["low row", "row handle", "chinning handle"])) equipment.push("low row handle");
    if (includesAny(value, ["d-handle", "d handle", "one handle", "two handles"])) equipment.push("D-handles");
    if (value.includes("rope")) equipment.push("triceps rope");

    return equipment.length ? [...new Set(equipment)] : ["user-defined"];
  }

  function inferEquipmentVarieties(record) {
    const explicit = Array.isArray(record.equipmentVarieties)
      ? record.equipmentVarieties
      : Array.isArray(record.equipment_varieties)
        ? record.equipment_varieties
        : [];
    const value = String(record.equipment || "").toLowerCase();
    const varieties = explicit.map((item) => String(item).trim()).filter(Boolean);
    const add = (label, patterns) => {
      if (includesAny(value, patterns)) varieties.push(label);
    };

    add("Functional trainer", ["ft2", "cable"]);
    add("D-handles", ["d-handle", "d handle", "one handle", "two handles", "strap handle"]);
    add("Curl bar", ["curl bar", "curl-bar"]);
    add("Straight bar", ["straight bar"]);
    add("Low row handle", ["low row", "row handle", "chinning handle"]);
    add("Triceps rope", ["triceps rope", "pushdown rope", "rope"]);
    add("Ankle straps", ["ankle strap", "ankle cuff"]);
    add("Resistance bands", ["resistance band", "loop band", "mini band"]);
    add("Kettlebell", ["kettlebell"]);
    add("Back extension machine", ["back extension machine", "45-degree back extension", "45 degree back extension"]);
    add("Pull-up bar", ["pull-up bar", "pull up bar"]);
    add("Bench", ["bench", "box"]);
    add("Dumbbells", ["dumbbell"]);
    add("Barbell", ["barbell"]);
    add("Squat rack", ["squat rack"]);
    add("Physio ball", ["physio ball", "stability ball"]);
    add("Weight plates", ["plate"]);
    add("Body weight", ["body weight", "bodyweight"]);

    if (!varieties.length && record.equipment) varieties.push(String(record.equipment).trim());
    return [...new Set(varieties)].sort((first, second) => first.localeCompare(second));
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
    if (record.custom && !record.catalogExpansion) return record.name.startsWith("PT Exercise") ? "bridge" : "isolation";
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

  function clampRating(value, fallback) {
    const rating = Number(value);
    return Number.isFinite(rating) ? Math.max(1, Math.min(5, Math.round(rating))) : fallback;
  }

  function inferSetupDifficulty(record) {
    const equipment = inferEquipment(record.equipment);
    if (equipment.includes("body weight") || equipment.includes("physio ball")) return 1;
    if (equipment.includes("barbell") || equipment.includes("squat rack")) return 4;
    if (equipment.includes("FT2") && inferAttachment(record)) return 3;
    if (equipment.includes("bench") || equipment.length > 1) return 2;
    return 2;
  }

  function inferEffectiveness(record, movementRole) {
    if (record.totalBodyActivator || movementRole === "total_body") return 5;
    if (movementRole === "compound") return 4;
    if (movementRole === "bridge") return 3;
    return 3;
  }

  function exerciseRecommendationScore(exercise) {
    const effectiveness = exercise.effectiveness_score;
    const setupEase = 6 - exercise.setup_difficulty;
    const techniqueEase = 6 - exercise.difficulty_score;
    return Math.round((effectiveness * 0.5 + setupEase * 0.25 + techniqueEase * 0.25) * 20);
  }

  function demoSearchUrl(name) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`;
  }

  function enrichExercise(record) {
    const movementPattern = record.movementPattern || inferMovementPattern(record);
    const forceType = record.forceType || inferForceType(record, movementPattern);
    const movementRole = inferMovementRole(record);
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

    const inferredTechnicalDifficulty = advanced
      ? "advanced"
      : backCaution || record.category === "Full Body and Golf Support"
        ? "intermediate"
        : "beginner";
    const difficultyScore = clampRating(
      record.difficultyScore ?? record.difficulty_score,
      { beginner: 1, intermediate: 3, advanced: 5 }[record.technicalDifficulty || inferredTechnicalDifficulty],
    );
    const setupDifficulty = clampRating(
      record.setupDifficulty ?? record.setup_difficulty,
      inferSetupDifficulty(record),
    );
    const effectivenessScore = clampRating(
      record.effectivenessScore ?? record.effectiveness_score,
      inferEffectiveness(record, movementRole),
    );
    const bothSides =
      typeof record.bothSides === "boolean"
        ? record.bothSides
        : typeof record.unilateral === "boolean"
          ? record.unilateral
          : includesAny(value, ["single-arm", "single-leg", "one-arm", "unilateral", "split-stance"]);
    const alwaysLocked = Boolean(record.alwaysLocked);

    return {
      id: String(record.id || slugify(record.name)),
      name: record.name,
      primary_body_part: record.category,
      secondary_body_parts: [],
      movement_pattern: movementPattern,
      movement_role: movementRole,
      force_type: forceType,
      equipment: inferEquipment(record.equipment),
      equipment_label: record.equipment,
      equipment_varieties: inferEquipmentVarieties(record),
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
      unilateral: bothSides,
      overhead,
      must_be_seated: overhead,
      shoulder_caution: shoulderCaution,
      back_caution: backCaution,
      technical_difficulty: difficultyScore >= 4 ? "advanced" : difficultyScore >= 2 ? "intermediate" : "beginner",
      difficulty_score: difficultyScore,
      setup_difficulty: setupDifficulty,
      effectiveness_score: effectivenessScore,
      default_reps: record.defaultReps || inferDefaultReps(record),
      instruction_url: record.instructionUrl || (!alwaysLocked ? demoSearchUrl(record.name) : null),
      user_locked: Boolean(record.alwaysLocked),
      notes:
        record.notes ??
        (overhead
          ? "Keep this movement seated because of the low ceiling."
          : shoulderCaution
            ? "Use a comfortable, controlled range and replace if painful."
            : backCaution
              ? "Use conservative loading and controlled repetitions."
              : null),
      source_row: record.sourceRow,
      custom: Boolean(record.custom),
      catalog_expansion: Boolean(record.catalogExpansion),
      total_body_activator:
        typeof record.totalBodyActivator === "boolean"
          ? record.totalBodyActivator
          : record.name.startsWith("PT Exercise") ||
            movementRole === "total_body" ||
            includesAny(value, ["carry", "turkish get-up", "bear crawl", "mountain climber"]),
      always_locked: alwaysLocked,
    };
  }

  const equipmentSource = Array.isArray(window.EQUIPMENT_EXERCISE_SOURCE) ? window.EQUIPMENT_EXERCISE_SOURCE : [];
  const equipmentSourceById = new Map(equipmentSource.map((record) => [slugify(record.name), record]));
  const originalRecords = [...window.EXERCISE_SOURCE, ...CUSTOM_EXERCISES].map((record) => {
    const expansion = equipmentSourceById.get(slugify(record.name));
    if (!expansion) return record;
    return {
      ...record,
      equipmentVarieties: [...inferEquipmentVarieties(record), ...inferEquipmentVarieties(expansion)],
    };
  });
  const originalIds = new Set(originalRecords.map((record) => slugify(record.name)));
  const expandedRecords = equipmentSource.filter((record) => !originalIds.has(slugify(record.name)));
  const BASE_EXERCISES = [...originalRecords, ...expandedRecords].map(enrichExercise);
  let exercises = [...BASE_EXERCISES];
  let exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const idFor = (name) => slugify(name);

  function applyExerciseEdit(exercise, edit) {
    if (!edit) return exercise;
    const edited = enrichExercise({
      name: edit.name || exercise.name,
      category: edit.category || exercise.primary_body_part,
      equipment: edit.equipment || exercise.equipment_label,
      instructionUrl: edit.instructionUrl ?? exercise.instruction_url,
      sourceRow: exercise.source_row,
      custom: exercise.custom,
      alwaysLocked: exercise.always_locked,
      movementPattern: edit.movementPattern || exercise.movement_pattern,
      movementRole: edit.movementRole || exercise.movement_role,
      forceType: edit.forceType || exercise.force_type,
      defaultReps: edit.defaultReps || exercise.default_reps,
      shoulderCaution: edit.shoulderCaution ?? exercise.shoulder_caution,
      backCaution: edit.backCaution ?? exercise.back_caution,
      notes: edit.notes ?? exercise.notes,
      equipmentVarieties: edit.equipmentVarieties || exercise.equipment_varieties,
      totalBodyActivator: edit.totalBodyActivator ?? exercise.total_body_activator,
      bothSides: edit.bothSides ?? exercise.unilateral,
      difficultyScore: edit.difficultyScore ?? exercise.difficulty_score,
      setupDifficulty: edit.setupDifficulty ?? exercise.setup_difficulty,
      effectivenessScore: edit.effectivenessScore ?? exercise.effectiveness_score,
      catalogExpansion: exercise.catalog_expansion,
    });
    edited.id = exercise.id;
    return edited;
  }

  function rebuildExerciseCatalog(customRecords = [], edits = {}) {
    const seen = new Set(BASE_EXERCISES.map((exercise) => exercise.id));
    const userExercises = [];
    for (const record of customRecords) {
      const exercise = enrichExercise({ ...record, custom: true });
      if (!exercise.id || seen.has(exercise.id)) continue;
      seen.add(exercise.id);
      userExercises.push(exercise);
    }
    exercises = [...BASE_EXERCISES, ...userExercises].map((exercise) =>
      applyExerciseEdit(exercise, edits[exercise.id]),
    );
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

  const flexibleExerciseNames = exercises
    .filter((exercise) => !exercise.always_locked)
    .map((exercise) => exercise.name);
  const namesMatching = (predicate) => exercises.filter((exercise) => !exercise.always_locked && predicate(exercise)).map((exercise) => exercise.name);
  const pushNames = namesMatching((exercise) => exercise.force_type === "push");
  const pullNames = namesMatching((exercise) => exercise.force_type === "pull");
  const squatNames = namesMatching((exercise) => exercise.force_type === "squat");
  const hingeNames = namesMatching((exercise) => exercise.force_type === "hinge");
  const recoveryNames = namesMatching(
    (exercise) =>
      exercise.movement_role === "bridge" ||
      ["Core", "Calves and Lower Legs", "Forearms, Grip and Traps", "Shoulders and Rotator Cuff"].includes(
        exercise.primary_body_part,
      ),
  );
  const weekendNamePools = Array.from({ length: 6 }, (_, pool) =>
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

  SLOTS.sunday = ["Mobility + core", "Balance + control", "Choose your focus"].map((category, index) => ({
    category,
    first: { label: "Movement 1", names: weekendNamePools[index * 2] },
    second: { label: "Movement 2", names: weekendNamePools[index * 2 + 1] },
    bridge: { label: "Between rounds", names: recoveryNames },
  }));

  for (const circuits of Object.values(SLOTS)) {
    for (const circuit of circuits) circuit.bridge.label = ACTIVATOR_LABEL;
  }

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
    saturday: [0, 1, 2].map(() => ({ defaultCount: 2, names: flexibleExerciseNames })),
    sunday: [0, 1, 2].map(() => ({ defaultCount: 2, names: flexibleExerciseNames })),
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
    libraryEquipment: "all",
    librarySort: "popular",
    showHidden: false,
    replacement: null,
    replaceSearch: "",
    showAllReplacements: false,
    editingExerciseId: null,
    favoriteTarget: null,
  };

  let state;
  let toastTimer;
  let fileHandle = null;
  let fileSaveTimer = null;

  function defaultMeasureType(exercise) {
    return /sec|second/i.test(exercise?.default_reps || "") ? "seconds" : "reps";
  }

  function cleanRepValue(value) {
    return String(value || "").replace(/\s*(sec|seconds)\s*/gi, "").trim();
  }

  function initialExerciseState() {
    return Object.fromEntries(
      exercises.map((exercise) => [
        exercise.id,
        {
          chosenCount: 0,
          skippedCount: 0,
          preference: 0,
          reps: cleanRepValue(exercise.default_reps),
          measureType: defaultMeasureType(exercise),
          weight: "",
          notes: "",
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
      exerciseEdits: {},
      favoriteCircuits: [],
      hiddenExerciseIds: [],
      deletedExerciseIds: [],
      daySettings: Object.fromEntries(
        DAY_CONFIG.map((day) => [
          day.id,
          { enabled: day.defaultEnabled !== false, focus: day.focus, description: day.guidance },
        ]),
      ),
      history: [],
      week: null,
    };
  }

  function matchesSlot(exercise, slot) {
    if (slot.label === ACTIVATOR_LABEL) {
      if (exercise.always_locked) return slot.names.some((name) => idFor(name) === exercise.id);
      return exercise.total_body_activator;
    }
    if (slot.names.some((name) => idFor(name) === exercise.id)) return true;
    if ((!exercise.custom && !exercise.catalog_expansion) || exercise.always_locked) return false;

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
        preference: 0,
        reps: cleanRepValue(exercise?.default_reps || "10"),
        measureType: defaultMeasureType(exercise),
        weight: "",
        notes: "",
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

  function requiresBothSides(exercise) {
    return Boolean(
      exercise?.unilateral ||
        /both sides|per side|\/ side/i.test(`${exercise?.name || ""} ${exercise?.default_reps || ""}`),
    );
  }

  function canCombine(first, second) {
    return !(requiresBothSides(first) && requiresBothSides(second));
  }

  function recentIds() {
    return new Set(state.history.slice(-3).flatMap((week) => week.exerciseIds || []));
  }

  function exerciseScore(exercise, slot, recent) {
    const stats = stateFor(exercise.id);
    const listedIndex = slot.names.findIndex((name) => idFor(name) === exercise.id);
    const preferredIndex = listedIndex >= 0 ? listedIndex : slot.names.length;
    let score = Math.random() * 16 + preferredIndex * 0.8 + stats.chosenCount * 0.35 - stats.preference * 14;
    if (recent.has(exercise.id)) score += 28;
    if (slot.defaultName && exercise.id === idFor(slot.defaultName)) score -= 18;
    if (exercise.technical_difficulty === "advanced") score += 8;
    score += (70 - exerciseRecommendationScore(exercise)) * 0.18;
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
    const previous =
      previousOverride ||
      (oldCircuit && ["first", "second"].includes(position)
        ? mainAssignments(oldCircuit).find((assignment) => assignment.slotKey === position) || oldCircuit[position]
        : oldCircuit?.[position]);
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

    let firstCandidates = preservedFirst
      ? [exerciseById.get(preservedFirst.exerciseId)]
      : candidatesFor(firstSlot, used);
    let secondCandidates = preservedSecond
      ? [exerciseById.get(preservedSecond.exerciseId)]
      : candidatesFor(secondSlot, used);

    const firstScores = new Map(firstCandidates.map((exercise) => [exercise.id, exerciseScore(exercise, firstSlot, recent)]));
    const secondScores = new Map(secondCandidates.map((exercise) => [exercise.id, exerciseScore(exercise, secondSlot, recent)]));
    if (!preservedFirst) {
      firstCandidates = firstCandidates.sort((first, second) => firstScores.get(first.id) - firstScores.get(second.id)).slice(0, 40);
    }
    if (!preservedSecond) {
      secondCandidates = secondCandidates.sort((first, second) => secondScores.get(first.id) - secondScores.get(second.id)).slice(0, 40);
    }

    if (preservedFirst) used.delete(preservedFirst.exerciseId);
    if (preservedSecond) used.delete(preservedSecond.exerciseId);

    const pairOptions = [];
    for (const first of firstCandidates) {
      if (used.has(first.id)) continue;
      for (const second of secondCandidates) {
        if (used.has(second.id) || first.id === second.id || !canCombine(first, second)) continue;
        const cost = transitionCost(first, second);
        pairOptions.push({
          first,
          second,
          cost,
          score: cost * 24 + firstScores.get(first.id) + secondScores.get(second.id),
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
      slotKey: preserved?.slotKey || null,
    });

    return {
      first: makeAssignment(best.first, firstSlot, preservedFirst),
      second: makeAssignment(best.second, secondSlot, preservedSecond),
      transitionCost: best.cost,
    };
  }

  function chooseExtra(slot, used, previousExercise, circuitExercises, oldAssignment = null) {
    const recent = recentIds();
    const preserved = preservedAssignment(null, null, slot, used, oldAssignment);
    const candidates = preserved
      ? [exerciseById.get(preserved.exerciseId)]
      : candidatesFor(slot, used);
    const valid = candidates
      .filter(
        (exercise) =>
          exercise &&
          canCombine(previousExercise, exercise) &&
          !(requiresBothSides(exercise) && circuitExercises.some(requiresBothSides)) &&
          (preserved?.manualOverride || transitionCost(previousExercise, exercise) <= 2),
      )
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
      slotKey: "extra",
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
      slotKey: "bridge",
    };
  }

  function generateWeek(previousWeek) {
    const used = new Set();
    const days = {};

    for (const day of DAY_CONFIG) {
      const circuits = SLOTS[day.id].map((definition, index) => {
        const oldCircuit = previousWeek?.days?.[day.id]?.circuits?.[index];
        const pair = choosePair(definition.first, definition.second, used, oldCircuit);
        pair.first.slotKey ||= "first";
        pair.second.slotKey ||= "second";
        used.add(pair.first.exerciseId);
        used.add(pair.second.exerciseId);
        const oldExtras = oldCircuit
          ? mainAssignments(oldCircuit).filter((assignment) => assignment.slotKey === "extra")
          : [];
        const lockedExtraCount = oldExtras.filter((assignment) => assignment.locked).length;
        const desiredCount = Math.min(
          4,
          Math.max(2, Number(oldCircuit?.preferredExerciseCount) || definition.defaultCount, 2 + lockedExtraCount),
        );
        const extras = [];
        let previousExercise = exerciseById.get(pair.second.exerciseId);
        const circuitExercises = [exerciseById.get(pair.first.exerciseId), previousExercise];
        for (let extraIndex = 0; extraIndex < desiredCount - 2; extraIndex += 1) {
          let extra;
          try {
            extra = chooseExtra(
              definition.extra,
              used,
              previousExercise,
              circuitExercises,
              oldExtras[extraIndex],
            );
          } catch (error) {
            throw new Error(`${day.name} circuit ${index + 1}: ${error.message}`);
          }
          extras.push(extra);
          used.add(extra.exerciseId);
          previousExercise = exerciseById.get(extra.exerciseId);
          circuitExercises.push(previousExercise);
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
        preChecklist: { stretch: false, pushups: false, pullups: false },
        coreCompleted: false,
        cardioCompleted: false,
      };
    }

    state.week = {
      number: state.weekNumber,
      startedAt: state.weekStartedAt,
      days,
    };

    for (const exerciseId of used) stateFor(exerciseId).chosenCount += 1;
  }

  function createMissingWorkoutDay(day, week, excludedIds = new Set()) {
    const used = new Set();
    for (const dayData of Object.values(week.days || {})) {
      for (const circuit of dayData?.circuits || []) {
        for (const assignment of [circuit.first, circuit.second, ...(circuit.extras || []), circuit.bridge]) {
          if (assignment?.exerciseId) used.add(assignment.exerciseId);
        }
      }
    }

    const candidatesForMissingSlot = (slot) =>
      slot.names
        .map((name) => exerciseById.get(idFor(name)))
        .filter(
          (exercise, index, candidates) =>
            exercise &&
            !used.has(exercise.id) &&
            !excludedIds.has(exercise.id) &&
            candidates.findIndex((candidate) => candidate?.id === exercise.id) === index,
        );

    const circuits = SLOTS[day.id].map((definition, index) => {
      const pairs = [];
      for (const first of candidatesForMissingSlot(definition.first)) {
        for (const second of candidatesForMissingSlot(definition.second)) {
          if (first.id === second.id || !canCombine(first, second)) continue;
          pairs.push({ first, second, cost: transitionCost(first, second) });
        }
      }
      pairs.sort((first, second) => first.cost - second.cost || first.first.name.localeCompare(second.first.name));
      const pair = pairs[0];
      if (!pair) throw new Error(`No exercise pair remains while adding ${day.name} circuit ${index + 1}.`);
      used.add(pair.first.id);
      used.add(pair.second.id);

      const bridge = candidatesForMissingSlot(definition.bridge)[0];
      if (!bridge) throw new Error(`No total-body activator remains while adding ${day.name}.`);
      used.add(bridge.id);
      const manualOverride = pair.cost > 2;

      return {
        number: index + 1,
        category: definition.category,
        first: {
          exerciseId: pair.first.id,
          slotLabel: definition.first.label,
          locked: false,
          fixed: false,
          manualOverride,
          slotKey: "first",
        },
        second: {
          exerciseId: pair.second.id,
          slotLabel: definition.second.label,
          locked: false,
          fixed: false,
          manualOverride,
          slotKey: "second",
        },
        extras: [],
        bridge: {
          exerciseId: bridge.id,
          slotLabel: definition.bridge.label,
          locked: false,
          fixed: false,
          slotKey: "bridge",
        },
        rounds: 3,
        preferredExerciseCount: 2,
        roundsCompleted: [false, false, false],
        bridgeCompleted: false,
      };
    });

    return {
      day: day.name,
      focus: day.focus,
      circuits,
      preChecklist: { stretch: false, pushups: false, pullups: false },
      coreCompleted: false,
      cardioCompleted: false,
    };
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
    scheduleFileAutosave();
  }

  function setFileStatus(message, connected = false) {
    const status = document.getElementById("file-status");
    status.textContent = message;
    status.classList.toggle("connected", connected);
    status.title = connected
      ? "Changes automatically save to the connected JSON file."
      : "Browser-local autosave is active. Choose Save file to connect a JSON file.";
  }

  function openFileHandleDatabase() {
    if (!("indexedDB" in window)) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("basement45-files", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("handles");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function rememberFileHandle(handle) {
    try {
      const database = await openFileHandleDatabase();
      if (!database) return;
      const transaction = database.transaction("handles", "readwrite");
      transaction.objectStore("handles").put(handle, "workout-json");
    } catch (error) {
      console.warn("The selected file handle could not be remembered.", error);
    }
  }

  async function restoreFileHandle() {
    try {
      const database = await openFileHandleDatabase();
      if (!database) return;
      const handle = await new Promise((resolve, reject) => {
        const request = database.transaction("handles", "readonly").objectStore("handles").get("workout-json");
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      if (handle && (await handle.queryPermission({ mode: "readwrite" })) === "granted") {
        fileHandle = handle;
        setFileStatus(`Autosaving · ${handle.name}`, true);
      }
    } catch (error) {
      console.warn("The previous workout file could not be restored.", error);
    }
  }

  async function canWriteToHandle(handle, requestPermission) {
    if (!handle) return false;
    if ((await handle.queryPermission({ mode: "readwrite" })) === "granted") return true;
    return requestPermission && (await handle.requestPermission({ mode: "readwrite" })) === "granted";
  }

  async function writeStateToFile(handle, announce = false, requestPermission = false) {
    if (!(await canWriteToHandle(handle, requestPermission))) return false;
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(exportPayload(), null, 2));
    await writable.close();
    setFileStatus(`Saved · ${handle.name}`, true);
    if (announce) showToast(`Saved directly to ${handle.name}.`);
    return true;
  }

  function scheduleFileAutosave() {
    clearTimeout(fileSaveTimer);
    if (!fileHandle) return;
    fileSaveTimer = setTimeout(async () => {
      try {
        await writeStateToFile(fileHandle, false, false);
      } catch (error) {
        setFileStatus("File autosave paused", false);
        console.warn("File autosave failed.", error);
      }
    }, 700);
  }

  function loadLocalState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (![1, 2, 3, 4, 5, 6, 7, APP_VERSION].includes(parsed.version) || !parsed.week?.days) return null;
      rebuildExerciseCatalog(parsed.customExercises || [], parsed.exerciseEdits || {});
      return normalizeState(parsed);
    } catch (error) {
      console.warn("The saved browser state could not be read.", error);
      return null;
    }
  }

  function normalizeState(candidate) {
    rebuildExerciseCatalog(candidate.customExercises || [], candidate.exerciseEdits || {});
    const normalized = createState();
    normalized.weekNumber = Number(candidate.weekNumber) || Number(candidate.week?.number) || 1;
    normalized.weekStartedAt = candidate.weekStartedAt || candidate.week?.startedAt || new Date().toISOString();
    normalized.customExercises = Array.isArray(candidate.customExercises) ? candidate.customExercises : [];
    normalized.exerciseEdits = candidate.exerciseEdits && typeof candidate.exerciseEdits === "object"
      ? candidate.exerciseEdits
      : {};
    normalized.favoriteCircuits = Array.isArray(candidate.favoriteCircuits)
      ? candidate.favoriteCircuits
          .filter(
            (favorite) =>
              favorite &&
              typeof favorite.id === "string" &&
              DAY_CONFIG.some((day) => day.id === favorite.dayId) &&
              Number.isInteger(Number(favorite.circuitIndex)) &&
              Array.isArray(favorite.assignments) &&
              favorite.assignments.length >= 2 &&
              favorite.assignments.length <= 4 &&
              favorite.bridge,
          )
          .slice(-30)
      : [];
    normalized.daySettings = Object.fromEntries(
      DAY_CONFIG.map((day) => {
        const loaded = candidate.daySettings?.[day.id] || {};
        return [
          day.id,
          {
            enabled: typeof loaded.enabled === "boolean" ? loaded.enabled : day.defaultEnabled !== false,
            focus: String(loaded.focus || day.focus).slice(0, 100),
            description: String(loaded.description || day.guidance).slice(0, 600),
          },
        ];
      }),
    );
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
          preference: Math.max(-1, Math.min(1, Number(loaded.preference) || 0)),
          reps: cleanRepValue(loaded.reps ?? exercise.default_reps).slice(0, 40),
          measureType: ["reps", "seconds"].includes(loaded.measureType)
            ? loaded.measureType
            : defaultMeasureType(exercise),
          weight: String(loaded.weight ?? "").slice(0, 40),
          notes: String(loaded.notes ?? "").slice(0, 1000),
        };
      }
    }

    normalized.week = JSON.parse(JSON.stringify(candidate.week));
    const excludedIds = new Set([...normalized.hiddenExerciseIds, ...normalized.deletedExerciseIds]);
    for (const day of DAY_CONFIG) {
      if (!normalized.week.days[day.id]) {
        normalized.week.days[day.id] = createMissingWorkoutDay(day, normalized.week, excludedIds);
      }
    }
    for (const day of DAY_CONFIG) {
      const dayData = normalized.week.days[day.id];
      dayData.preChecklist = {
        stretch: Boolean(dayData.preChecklist?.stretch),
        pushups: Boolean(dayData.preChecklist?.pushups),
        pullups: Boolean(dayData.preChecklist?.pullups),
      };
      dayData.coreCompleted = Boolean(dayData.coreCompleted);
      dayData.cardioCompleted = Boolean(dayData.cardioCompleted);
      for (const circuit of dayData.circuits) {
        circuit.extras = Array.isArray(circuit.extras) ? circuit.extras.slice(0, 2) : [];
        circuit.first.slotKey ||= "first";
        circuit.second.slotKey ||= "second";
        circuit.extras.forEach((assignment) => {
          assignment.slotKey ||= "extra";
        });
        circuit.bridge.slotKey ||= "bridge";
        circuit.bridge.slotLabel = ACTIVATOR_LABEL;
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
    migrateTotalBodyActivators(normalized.week, excludedIds);
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

  function migrateTotalBodyActivators(week, excludedIds = new Set()) {
    const invalid = [];
    const used = new Set();
    for (const day of DAY_CONFIG) {
      for (const circuit of week.days[day.id].circuits) {
        for (const assignment of mainAssignments(circuit)) used.add(assignment.exerciseId);
        const exercise = exerciseById.get(circuit.bridge.exerciseId);
        if (exercise?.total_body_activator) used.add(circuit.bridge.exerciseId);
        else invalid.push(circuit);
      }
    }

    const available = exercises
      .filter(
        (exercise) =>
          exercise.total_body_activator &&
          !used.has(exercise.id) &&
          !excludedIds.has(exercise.id),
      )
      .sort((first, second) => first.name.localeCompare(second.name));

    for (const circuit of invalid) {
      const replacement = available.shift();
      if (!replacement) break;
      circuit.bridge = {
        exerciseId: replacement.id,
        slotLabel: ACTIVATOR_LABEL,
        locked: false,
        fixed: false,
        slotKey: "bridge",
      };
      circuit.bridgeCompleted = false;
      used.add(replacement.id);
    }
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

  function circuitExerciseIds(circuit) {
    return [...mainAssignments(circuit).map((assignment) => assignment.exerciseId), circuit.bridge.exerciseId];
  }

  function favoriteSignature(circuit) {
    return circuitExerciseIds(circuit).join("|");
  }

  function favoritesForSlot(dayId, circuitIndex) {
    return state.favoriteCircuits.filter(
      (favorite) => favorite.dayId === dayId && Number(favorite.circuitIndex) === Number(circuitIndex),
    );
  }

  function isFavoriteCircuit(dayId, circuitIndex, circuit) {
    const signature = favoriteSignature(circuit);
    return favoritesForSlot(dayId, circuitIndex).some((favorite) => favorite.signature === signature);
  }

  function toggleFavoriteCircuit(dayId, circuitIndex) {
    const circuit = state.week.days[dayId]?.circuits?.[circuitIndex];
    if (!circuit) return;
    const signature = favoriteSignature(circuit);
    const existing = favoritesForSlot(dayId, circuitIndex).find((favorite) => favorite.signature === signature);
    if (existing) {
      state.favoriteCircuits = state.favoriteCircuits.filter((favorite) => favorite.id !== existing.id);
      showToast("Circuit removed from favorites.");
    } else {
      const exerciseNames = circuitExerciseIds(circuit)
        .map((exerciseId) => exerciseById.get(exerciseId)?.name)
        .filter(Boolean);
      const dayName = displayDay(DAY_CONFIG.find((day) => day.id === dayId)).name;
      const suggestedName = `${dayName} Circuit ${circuit.number} — ${exerciseNames.slice(0, 2).join(" + ")}`;
      const requestedName = window.prompt("Name this favorite circuit:", suggestedName);
      if (requestedName === null) return;
      const favoriteName = String(requestedName).trim().slice(0, 100) || suggestedName;
      state.favoriteCircuits.push({
        id: `favorite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dayId,
        circuitIndex,
        category: circuit.category,
        name: favoriteName,
        exerciseNames,
        signature,
        assignments: JSON.parse(JSON.stringify(mainAssignments(circuit))),
        bridge: JSON.parse(JSON.stringify(circuit.bridge)),
        savedAt: new Date().toISOString(),
      });
      state.favoriteCircuits = state.favoriteCircuits.slice(-30);
      showToast("Circuit saved as a favorite.");
    }
    persist();
    render();
  }

  function favoriteUnavailableReason(favorite, target) {
    const assignments = [...favorite.assignments, favorite.bridge];
    const ids = assignments.map((assignment) => assignment.exerciseId);
    if (ids.some((id) => !exerciseById.has(id))) return "An exercise is no longer in the library";
    if (ids.some((id) => isHidden(id) || isDeleted(id))) return "Contains a hidden or deleted exercise";
    if (!exerciseById.get(favorite.bridge.exerciseId)?.total_body_activator) return "Activator is no longer eligible";
    const usedElsewhere = new Set(
      allAssignments()
        .filter(
          (assignment) =>
            assignment.dayId !== target.dayId || Number(assignment.circuitIndex) !== Number(target.circuitIndex),
        )
        .map((assignment) => assignment.exerciseId),
    );
    if (ids.some((id) => usedElsewhere.has(id))) return "One or more exercises are already used elsewhere this week";
    const exercisesInRound = favorite.assignments.map((assignment) => exerciseById.get(assignment.exerciseId));
    if (exercisesInRound.filter(requiresBothSides).length > 1) return "Contains multiple both-sides exercises";
    for (let index = 1; index < exercisesInRound.length; index += 1) {
      if (
        transitionCost(exercisesInRound[index - 1], exercisesInRound[index]) > 2 &&
        !favorite.assignments[index - 1].manualOverride &&
        !favorite.assignments[index].manualOverride
      ) {
        return "Contains a setup transition above 2";
      }
    }
    return "";
  }

  function renderFavoriteResults() {
    const target = ui.favoriteTarget;
    if (!target) return;
    const favorites = favoritesForSlot(target.dayId, target.circuitIndex);
    document.getElementById("favorite-results").innerHTML = favorites.length
      ? favorites
          .map((favorite) => {
            const reason = favoriteUnavailableReason(favorite, target);
            return `<article class="favorite-option">
              <div><strong>${escapeHtml(favorite.name)}</strong><small>${favorite.exerciseNames.map(escapeHtml).join(" · ")}</small>${reason ? `<span class="favorite-warning">${escapeHtml(reason)}</span>` : ""}</div>
              <button class="library-action" type="button" data-action="apply-favorite-circuit" data-favorite-id="${favorite.id}" ${reason ? "disabled" : ""}>Use circuit</button>
              <button class="library-action delete" type="button" data-action="delete-favorite-circuit" data-favorite-id="${favorite.id}">Remove</button>
            </article>`;
          })
          .join("")
      : '<div class="empty-state">No favorites are saved for this circuit position yet.</div>';
  }

  function openFavoriteCircuits(dayId, circuitIndex) {
    ui.favoriteTarget = { dayId, circuitIndex };
    const day = displayDay(DAY_CONFIG.find((item) => item.id === dayId));
    document.getElementById("favorite-title").textContent = `${day.name} Circuit ${circuitIndex + 1} favorites`;
    renderFavoriteResults();
    document.getElementById("favorite-dialog").showModal();
  }

  function applyFavoriteCircuit(favoriteId) {
    const target = ui.favoriteTarget;
    const favorite = state.favoriteCircuits.find((item) => item.id === favoriteId);
    if (!target || !favorite || favoriteUnavailableReason(favorite, target)) return;
    const circuit = state.week.days[target.dayId].circuits[target.circuitIndex];
    const previous = JSON.parse(JSON.stringify(circuit));
    const previousIds = circuitExerciseIds(circuit);
    const nextIds = [...favorite.assignments.map((assignment) => assignment.exerciseId), favorite.bridge.exerciseId];
    circuit.first = JSON.parse(JSON.stringify(favorite.assignments[0]));
    circuit.second = JSON.parse(JSON.stringify(favorite.assignments[1]));
    circuit.extras = JSON.parse(JSON.stringify(favorite.assignments.slice(2)));
    circuit.bridge = JSON.parse(JSON.stringify(favorite.bridge));
    circuit.preferredExerciseCount = favorite.assignments.length;
    resetCircuitCompletion(circuit);
    const issues = validateWeek(state.week);
    if (issues.length) {
      state.week.days[target.dayId].circuits[target.circuitIndex] = previous;
      showToast(`That favorite cannot be used here: ${issues[0]}`, "error");
      return;
    }
    previousIds.filter((id) => !nextIds.includes(id)).forEach((id) => {
      stateFor(id).skippedCount += 1;
    });
    nextIds.filter((id) => !previousIds.includes(id)).forEach((id) => {
      stateFor(id).chosenCount += 1;
    });
    persist();
    document.getElementById("favorite-dialog").close();
    ui.favoriteTarget = null;
    render();
    showToast("Favorite circuit substituted.");
  }

  function deleteFavoriteCircuit(favoriteId) {
    state.favoriteCircuits = state.favoriteCircuits.filter((favorite) => favorite.id !== favoriteId);
    persist();
    if (document.getElementById("favorite-dialog").open) renderFavoriteResults();
    render();
    showToast("Favorite circuit removed.");
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
          issues.push(`${day.name} circuit ${circuit.number} must track its total-body activator.`);
        }
        ids.push(...assignments.map((assignment) => assignment.exerciseId), circuit.bridge.exerciseId);
        const mainExercises = assignments.map((assignment) => exerciseById.get(assignment.exerciseId));
        const bridge = exerciseById.get(circuit.bridge.exerciseId);
        if (mainExercises.some((exercise) => !exercise) || !bridge) {
          issues.push(`${day.name} references an unknown exercise.`);
        }
        if (bridge && !bridge.total_body_activator) {
          issues.push(`${day.name} circuit ${circuit.number} must use a checked total-body activator.`);
        }
        if (mainExercises.filter(requiresBothSides).length > 1) {
          issues.push(`${day.name} circuit ${circuit.number} combines multiple both-sides exercises.`);
        }
        for (let index = 1; index < mainExercises.length; index += 1) {
          if (mainExercises[index - 1] && mainExercises[index] && !canCombine(mainExercises[index - 1], mainExercises[index])) {
            issues.push(`${day.name} circuit ${circuit.number} combines two both-sides exercises.`);
          }
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
    if (monday.filter((circuit) => mainAssignments(circuit).some((assignment) => assignment.slotLabel === "Push")).length !== 3) {
      issues.push("Monday must contain three push movements.");
    }
    if (monday.filter((circuit) => mainAssignments(circuit).some((assignment) => assignment.slotLabel === "Pull")).length !== 3) {
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
      (total, day) =>
        total +
        (state.daySettings[day.id].enabled
          ? state.week.days[day.id].circuits.filter(isCircuitComplete).length
          : 0),
      0,
    );
  }

  function displayDay(day) {
    const settings = state.daySettings[day.id];
    return { ...day, focus: settings.focus, guidance: settings.description };
  }

  function enabledDays() {
    return DAY_CONFIG.filter((day) => state.daySettings[day.id].enabled);
  }

  function libraryTotalCount() {
    return exercises.filter((exercise) => !isDeleted(exercise.id)).length;
  }

  function renderTabs() {
    const tabs = enabledDays().map((baseDay) => {
      const day = displayDay(baseDay);
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
        <span><strong>Exercise library</strong><small>${libraryTotalCount()} total exercises</small></span>
        <span class="tab-status">${ICONS.arrow}</span>
      </button>
      <button class="day-tab library-tab ${ui.currentView === "settings" ? "active" : ""}" type="button" data-view="settings" aria-current="${ui.currentView === "settings" ? "page" : "false"}">
        <span class="day-short">&#9881;</span>
        <span><strong>Settings</strong><small>Days, targets, and descriptions</small></span>
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
    const itemClass = `${context.position === "bridge" ? "exercise-item bridge-item" : "exercise-item"}${isHidden(exercise.id) ? " is-hidden" : ""}`;
    const slotLabel = context.position === "bridge" ? ACTIVATOR_LABEL : assignment.slotLabel;

    return `
      <div class="${itemClass}">
        <div class="exercise-topline">
          <span class="slot-label">${escapeHtml(slotLabel)}</span>
          <span class="exercise-tools">
            ${
              context.position === "bridge"
                ? `<label class="bridge-check" title="Mark the total-body activator complete">
                    <input type="checkbox" data-action="complete-bridge" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" ${context.bridgeCompleted ? "checked" : ""} />
                    <span>Done</span>
                  </label>`
                : ""
            }
            ${
              context.position !== "bridge"
                ? `<button class="mini-button" type="button" data-action="move-exercise" data-direction="-1" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" data-position="${context.position}" title="Move exercise up" aria-label="Move ${escapeHtml(exercise.name)} up" ${context.orderIndex === 0 ? "disabled" : ""}>↑</button>
                   <button class="mini-button" type="button" data-action="move-exercise" data-direction="1" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" data-position="${context.position}" title="Move exercise down" aria-label="Move ${escapeHtml(exercise.name)} down" ${context.orderIndex === context.exerciseCount - 1 ? "disabled" : ""}>↓</button>`
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
              data-action="random-replace"
              data-day="${context.dayId}"
              data-circuit="${context.circuitIndex}"
              data-position="${context.position}"
              title="Choose a random eligible replacement"
              aria-label="Randomly replace ${escapeHtml(exercise.name)}"
              ${assignment.locked ? "disabled" : ""}
            >${ICONS.refresh}</button>
            <button
              class="mini-button"
              type="button"
              data-action="replace"
              data-day="${context.dayId}"
              data-circuit="${context.circuitIndex}"
              data-position="${context.position}"
              title="Choose a replacement from the library"
              aria-label="Choose a replacement for ${escapeHtml(exercise.name)}"
              ${assignment.locked ? "disabled" : ""}
            >${ICONS.book}</button>
            <button
              class="mini-button"
              type="button"
              data-action="edit-workout-exercise"
              data-exercise-id="${exercise.id}"
              title="Edit exercise details"
              aria-label="Edit ${escapeHtml(exercise.name)}"
            >${ICONS.pencil}</button>
            <button
              class="mini-button ${isHidden(exercise.id) ? "active danger" : ""}"
              type="button"
              data-action="toggle-hide-workout"
              data-exercise-id="${exercise.id}"
              title="${isHidden(exercise.id) ? "Restore to future recommendations" : "Hide from future recommendations"}"
              aria-label="${isHidden(exercise.id) ? `Restore ${escapeHtml(exercise.name)}` : `Hide ${escapeHtml(exercise.name)} from recommendations`}"
              ${fixed ? "disabled" : ""}
            >${ICONS.eyeOff}</button>
            ${
              context.position !== "bridge"
                ? `<button class="mini-button danger" type="button" data-action="delete-circuit-exercise" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" data-position="${context.position}" title="Remove exercise from this circuit" aria-label="Remove ${escapeHtml(exercise.name)} from this circuit" ${context.exerciseCount <= 2 || assignment.locked ? "disabled" : ""}>×</button>`
                : ""
            }
          </span>
        </div>
        <h3 class="exercise-name">${escapeHtml(exercise.name)}</h3>
        <div class="exercise-meta">
          ${
            exercise.instruction_url
              ? `<a href="${escapeHtml(exercise.instruction_url)}" target="_blank" rel="noreferrer">View demo ${ICONS.external}</a>`
              : `<span>Edit this exercise to add its instructions</span>`
          }
          ${requiresBothSides(exercise) ? '<span class="both-sides-label">• Both sides</span>' : ""}
          ${caution ? `<span title="${escapeHtml(exercise.notes)}">• ${escapeHtml(caution)}</span>` : ""}
        </div>
        <div class="exercise-support-row">
          <div class="equipment-needed"><span>Equipment</span><strong>${escapeHtml(exercise.equipment_label)}</strong></div>
          <span class="recommendation-score" title="50% effectiveness, 25% setup ease, and 25% technique ease">Score ${exerciseRecommendationScore(exercise)}</span>
          <div class="preference-controls" aria-label="Recommendation preference for ${escapeHtml(exercise.name)}">
            <button class="feedback-button ${settings.preference === 1 ? "active" : ""}" type="button" data-action="set-preference" data-exercise-id="${exercise.id}" data-value="1" title="Recommend more often" aria-label="Recommend ${escapeHtml(exercise.name)} more often">${ICONS.thumbUp}</button>
            <button class="feedback-button ${settings.preference === -1 ? "active negative" : ""}" type="button" data-action="set-preference" data-exercise-id="${exercise.id}" data-value="-1" title="Recommend less often" aria-label="Recommend ${escapeHtml(exercise.name)} less often">${ICONS.thumbDown}</button>
          </div>
        </div>
        <div class="exercise-fields">
          <label class="compact-field measure-field">
            <select data-setting="measureType" data-exercise-id="${exercise.id}" aria-label="Measure repetitions or seconds for ${escapeHtml(exercise.name)}">
              <option value="reps" ${settings.measureType === "reps" ? "selected" : ""}>Reps</option>
              <option value="seconds" ${settings.measureType === "seconds" ? "selected" : ""}>Seconds</option>
            </select>
            <input data-setting="reps" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.reps)}" aria-label="Repetitions for ${escapeHtml(exercise.name)}" />
          </label>
          <label class="compact-field">
            <span>Load</span>
            <input data-setting="weight" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.weight)}" placeholder="—" inputmode="decimal" aria-label="Weight for ${escapeHtml(exercise.name)}" />
            <small>lb</small>
          </label>
        </div>
        <label class="exercise-note"><span>Notes</span><input data-setting="notes" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.notes)}" maxlength="1000" placeholder="Add a cue or note" aria-label="Notes for ${escapeHtml(exercise.name)}" /></label>
      </div>`;
  }

  function syncCircuitStickyOffsets() {
    const cards = document.querySelectorAll?.(".circuit-card") || [];
    cards.forEach((card) => {
      const pendingActivator = card.querySelector(".activator-wrap.is-pending");
      const height = pendingActivator ? Math.ceil(pendingActivator.getBoundingClientRect().height) + 10 : 0;
      card.style.setProperty("--activator-sticky-height", `${height}px`);
    });
  }

  function scheduleCircuitStickyOffsets() {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(syncCircuitStickyOffsets);
    }
  }

  function renderCircuit(dayId, circuit, circuitIndex) {
    const assignments = mainAssignments(circuit);
    const exerciseItems = assignments
      .map((assignment, index) => {
        const position = index === 0 ? "first" : index === 1 ? "second" : `extra-${index - 2}`;
        const item = renderExerciseItem(assignment, {
          dayId,
          circuitIndex,
          position,
          orderIndex: index,
          exerciseCount: assignments.length,
        });
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
    const activatorMarkup = `<div class="bridge-wrap activator-wrap ${circuit.bridgeCompleted ? "is-complete" : "is-pending"}">
      ${renderExerciseItem(circuit.bridge, {
        dayId,
        circuitIndex,
        position: "bridge",
        bridgeCompleted: circuit.bridgeCompleted,
      })}
    </div>`;
    const roundChecksMarkup = `<div class="round-checks" aria-label="Completed rounds for circuit ${circuit.number}">
      ${[0, 1, 2]
        .map(
          (round) => `<label class="round-check">
            <input type="checkbox" data-action="complete-round" data-day="${dayId}" data-circuit="${circuitIndex}" data-round="${round}" ${circuit.roundsCompleted[round] ? "checked" : ""} />
            <span>Round ${round + 1}</span>
          </label>`,
        )
        .join("")}
    </div>`;
    return `
      <article class="circuit-card ${complete ? "is-complete" : ""}">
        <header class="circuit-header">
          <div class="circuit-number">
            <span class="number-badge">${circuit.number}</span>
            <span class="circuit-title"><span>Circuit ${circuit.number}</span><strong>${escapeHtml(circuit.category)}</strong></span>
          </div>
          <div class="circuit-scaling">
            <button class="favorite-button ${isFavoriteCircuit(dayId, circuitIndex, circuit) ? "active" : ""}" type="button" data-action="toggle-favorite-circuit" data-day="${dayId}" data-circuit="${circuitIndex}" title="${isFavoriteCircuit(dayId, circuitIndex, circuit) ? "Remove this circuit from favorites" : "Save this circuit as a favorite"}" aria-label="${isFavoriteCircuit(dayId, circuitIndex, circuit) ? "Remove circuit from favorites" : "Favorite this circuit"}">${ICONS.star}</button>
            <button class="favorite-button" type="button" data-action="open-favorite-circuits" data-day="${dayId}" data-circuit="${circuitIndex}" title="Substitute a saved favorite circuit" aria-label="Substitute a favorite circuit" ${favoritesForSlot(dayId, circuitIndex).length ? "" : "disabled"}>${ICONS.favorites}</button>
            <span class="rounds-badge">${difficultyFor(circuit)} · ${assignments.length} exercises</span>
            <span class="scale-buttons">
              <button type="button" data-action="remove-round-exercise" data-day="${dayId}" data-circuit="${circuitIndex}" aria-label="Remove the last round exercise" title="Remove the last round exercise" ${canRemove ? "" : "disabled"}>−</button>
              <button type="button" data-action="add-round-exercise" data-day="${dayId}" data-circuit="${circuitIndex}" aria-label="Add a round exercise" title="Add a compatible round exercise" ${assignments.length >= 4 ? "disabled" : ""}>+</button>
            </span>
          </div>
        </header>
        <div class="circuit-body">
          ${activatorMarkup}
          ${roundChecksMarkup}
          <div class="exercise-cycle">${exerciseItems}</div>
        </div>
      </article>`;
  }

  function renderWorkout(dayId) {
    const config = displayDay(DAY_CONFIG.find((day) => day.id === dayId));
    const day = state.week.days[dayId];
    const completed = day.circuits.filter(isCircuitComplete).length;
    const beforeCircuitsComplete = Object.values(day.preChecklist).every(Boolean);
    const finisherComplete = day.coreCompleted && day.cardioCompleted;

    document.getElementById("workout-view").innerHTML = `
      <div class="content-frame workout-content ${beforeCircuitsComplete ? "" : "has-pending-warmup"}">
        <header class="view-header">
          <div>
            <span class="eyebrow">${completed} of 3 circuits complete</span>
            <h1>${config.name} <span>— ${escapeHtml(config.focus)}</span></h1>
            <p class="view-subtitle">Complete each circuit for three rounds. Focused, standard, and challenge circuits contain two to four exercises; the total-body activator ties the session together with an integrated movement.</p>
          </div>
          <div class="session-chip">${ICONS.clock}<span><span>Target time</span><strong>About 45 minutes</strong></span></div>
        </header>
        <div class="day-guidance">${ICONS.info}<span>${escapeHtml(config.guidance)}</span></div>
        <div class="routine-row pre-routine ${beforeCircuitsComplete ? "is-complete" : ""}" aria-label="Before-circuit checklist">
          <strong>Before circuits</strong>
          <label><input type="checkbox" data-action="daily-check" data-day="${dayId}" data-item="stretch" ${day.preChecklist.stretch ? "checked" : ""} /> Stretch</label>
          <label><input type="checkbox" data-action="daily-check" data-day="${dayId}" data-item="pushups" ${day.preChecklist.pushups ? "checked" : ""} /> 20 push-ups</label>
          <label><input type="checkbox" data-action="daily-check" data-day="${dayId}" data-item="pullups" ${day.preChecklist.pullups ? "checked" : ""} /> 5 pull-ups</label>
        </div>
        <div class="circuit-grid">
          ${day.circuits.map((circuit, index) => renderCircuit(dayId, circuit, index)).join("")}
        </div>
        <div class="routine-row core-routine ${finisherComplete ? "is-complete" : ""}">
          <strong>Finisher</strong>
          <label><input type="checkbox" data-action="core-check" data-day="${dayId}" ${day.coreCompleted ? "checked" : ""} /> Core complete</label>
          <label><input type="checkbox" data-action="cardio-check" data-day="${dayId}" ${day.cardioCompleted ? "checked" : ""} /> 20 minutes cardio</label>
        </div>
      </div>`;
    scheduleCircuitStickyOffsets();
  }

  function categoryOptions() {
    return [...new Set(exercises.map((exercise) => exercise.primary_body_part))].sort();
  }

  function equipmentOptions() {
    return [...new Set(exercises.flatMap((exercise) => exercise.equipment_varieties))].sort((first, second) =>
      first.localeCompare(second),
    );
  }

  function filteredLibrary() {
    const search = ui.librarySearch.trim().toLowerCase();
    const filtered = exercises.filter((exercise) => {
      if (isDeleted(exercise.id)) return false;
      if (isHidden(exercise.id) && !ui.showHidden) return false;
      const matchesCategory = ui.libraryCategory === "all" || exercise.primary_body_part === ui.libraryCategory;
      const matchesEquipment =
        ui.libraryEquipment === "all" || exercise.equipment_varieties.includes(ui.libraryEquipment);
      const haystack = `${exercise.name} ${exercise.primary_body_part} ${exercise.equipment_label} ${exercise.equipment_varieties.join(" ")}`.toLowerCase();
      return matchesCategory && matchesEquipment && (!search || haystack.includes(search));
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
      if (ui.librarySort === "score") {
        return exerciseRecommendationScore(second) - exerciseRecommendationScore(first) || first.name.localeCompare(second.name);
      }
      if (ui.librarySort === "category") {
        return first.primary_body_part.localeCompare(second.primary_body_part) || first.name.localeCompare(second.name);
      }
      if (ui.librarySort === "equipment") {
        const firstEquipment = first.equipment_varieties[0] || first.equipment_label;
        const secondEquipment = second.equipment_varieties[0] || second.equipment_label;
        return firstEquipment.localeCompare(secondEquipment) || first.name.localeCompare(second.name);
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
          <div class="equipment-varieties" aria-label="Equipment varieties">
            ${exercise.equipment_varieties.map((equipment) => `<span>${escapeHtml(equipment)}</span>`).join("")}
          </div>
          <div class="library-tags">
            <span class="tag">${escapeHtml(exercise.movement_role.replace("_", " "))}</span>
            <span class="tag">${escapeHtml(exercise.force_type.replace("_", " "))}</span>
            <span class="tag score">Score ${exerciseRecommendationScore(exercise)}</span>
            ${requiresBothSides(exercise) ? '<span class="tag both-sides">Both sides</span>' : ""}
            ${caution ? `<span class="tag caution">${escapeHtml(caution)}</span>` : ""}
            ${exercise.total_body_activator ? '<span class="tag activator">Total-body activator</span>' : ""}
          </div>
        </div>
        <div class="library-counts" aria-label="Exercise usage">
          <span><strong>${stats.chosenCount}</strong>chosen</span>
          <span><strong>${stats.skippedCount}</strong>skipped</span>
        </div>
        <div class="library-fields">
          <select data-setting="measureType" data-exercise-id="${exercise.id}" aria-label="Measure type for ${escapeHtml(exercise.name)}"><option value="reps" ${stats.measureType === "reps" ? "selected" : ""}>Reps</option><option value="seconds" ${stats.measureType === "seconds" ? "selected" : ""}>Seconds</option></select>
          <input data-setting="reps" data-exercise-id="${exercise.id}" value="${escapeHtml(stats.reps)}" aria-label="Default repetitions for ${escapeHtml(exercise.name)}" title="Repetitions" />
          <input data-setting="weight" data-exercise-id="${exercise.id}" value="${escapeHtml(stats.weight)}" placeholder="Load lb" inputmode="decimal" aria-label="Default load for ${escapeHtml(exercise.name)}" title="Load in pounds" />
          ${
            exercise.instruction_url
              ? `<a class="demo-button" href="${escapeHtml(exercise.instruction_url)}" target="_blank" rel="noreferrer" aria-label="View a demonstration of ${escapeHtml(exercise.name)}" title="View demo">${ICONS.external}</a>`
              : `<span></span>`
          }
          <button class="library-action" type="button" data-action="edit-library" data-exercise-id="${exercise.id}">Edit</button>
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
            <span class="eyebrow">Workout catalog</span>
            <h1>Exercise <span>library</span></h1>
            <p class="view-subtitle">Browse every exercise, filter or sort by equipment, and edit each movement's compatible equipment varieties.</p>
          </div>
          <button class="button button-primary" id="add-exercise-button" type="button" data-action="open-add-exercise">+ Add exercise</button>
        </header>
        <div class="library-toolbar">
          <label class="search-field">${ICONS.search}<span class="sr-only">Search exercise library</span><input id="library-search" type="search" value="${escapeHtml(ui.librarySearch)}" placeholder="Search name, category, or equipment" /></label>
          <label class="select-field"><span>Category</span><select id="library-category">
            <option value="all">All</option>
            ${categoryOptions().map((category) => `<option value="${escapeHtml(category)}" ${ui.libraryCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
          </select></label>
          <label class="select-field"><span>Equipment</span><select id="library-equipment">
            <option value="all">All equipment</option>
            ${equipmentOptions().map((equipment) => `<option value="${escapeHtml(equipment)}" ${ui.libraryEquipment === equipment ? "selected" : ""}>${escapeHtml(equipment)}</option>`).join("")}
          </select></label>
          <label class="select-field"><span>Sort</span><select id="library-sort">
            <option value="popular" ${ui.librarySort === "popular" ? "selected" : ""}>Most popular</option>
            <option value="skipped" ${ui.librarySort === "skipped" ? "selected" : ""}>Most skipped</option>
            <option value="score" ${ui.librarySort === "score" ? "selected" : ""}>Recommendation score</option>
            <option value="name" ${ui.librarySort === "name" ? "selected" : ""}>Name A–Z</option>
            <option value="category" ${ui.librarySort === "category" ? "selected" : ""}>Category</option>
            <option value="equipment" ${ui.librarySort === "equipment" ? "selected" : ""}>Equipment</option>
          </select></label>
        </div>
        <div class="library-stats">
          <span class="stat-pill result-summary"><strong>${items.length}</strong> of <strong>${libraryTotalCount()}</strong> exercises showing</span>
          <span class="stat-pill"><strong>${totalChosen}</strong> total selections</span>
          <span class="stat-pill"><strong>${totalSkipped}</strong> replacements</span>
          <label class="stat-pill show-hidden"><input id="show-hidden" type="checkbox" ${ui.showHidden ? "checked" : ""} /> Show ${state.hiddenExerciseIds.length} hidden</label>
        </div>
        <div class="library-list">
          ${items.length ? items.map(renderLibraryCard).join("") : '<div class="empty-state">No exercises match those filters.</div>'}
        </div>
      </div>`;
  }

  function renderSettings() {
    document.getElementById("settings-view").innerHTML = `
      <div class="content-frame">
        <header class="view-header">
          <div>
            <span class="eyebrow">Personalize the split</span>
            <h1>Workout <span>settings</span></h1>
            <p class="view-subtitle">Choose the days shown in your plan and edit each day's target and coaching description. Exercise eligibility continues to use that day's underlying safety rules.</p>
          </div>
        </header>
        <div class="settings-grid">
          ${DAY_CONFIG.map((day) => {
            const settings = state.daySettings[day.id];
            return `<article class="settings-card ${settings.enabled ? "" : "is-disabled"}">
              <header>
                <div><span class="day-short">${day.short}</span><strong>${day.name}</strong></div>
                <label class="day-enabled"><input type="checkbox" data-day-enabled="${day.id}" ${settings.enabled ? "checked" : ""} /> Include this day</label>
              </header>
              <label class="form-field"><span>Training target</span><input data-day-setting="focus" data-day="${day.id}" maxlength="100" value="${escapeHtml(settings.focus)}" /></label>
              <label class="form-field"><span>Description</span><textarea data-day-setting="description" data-day="${day.id}" maxlength="600" rows="4">${escapeHtml(settings.description)}</textarea></label>
            </article>`;
          }).join("")}
        </div>
      </div>`;
  }

  function render() {
    const complete = completedCircuits();
    const circuitTotal = enabledDays().length * 3;
    document.getElementById("week-number").textContent = `Week ${state.weekNumber}`;
    document.getElementById("week-date").textContent = formatDate(state.weekStartedAt);
    document.getElementById("week-progress-label").textContent = `${complete} of ${circuitTotal} circuits complete`;
    document.getElementById("week-progress-bar").style.width = `${circuitTotal ? (complete / circuitTotal) * 100 : 0}%`;
    renderTabs();

    const workoutView = document.getElementById("workout-view");
    const libraryView = document.getElementById("library-view");
    const settingsView = document.getElementById("settings-view");
    const showingLibrary = ui.currentView === "library";
    const showingSettings = ui.currentView === "settings";
    workoutView.hidden = showingLibrary || showingSettings;
    libraryView.hidden = !showingLibrary;
    settingsView.hidden = !showingSettings;
    if (showingLibrary) renderLibrary();
    else if (showingSettings) renderSettings();
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
    if (context.position === "extra-new") return definition.extra;
    const assignment = assignmentFor(context);
    return definition[assignment?.slotKey || (context.position?.startsWith("extra") ? "extra" : context.position)];
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

  function otherCircuitExercises(context) {
    if (context.position === "bridge") return [];
    const circuit = state.week.days[context.dayId].circuits[context.circuitIndex];
    const current = assignmentFor(context);
    return mainAssignments(circuit)
      .filter((assignment) => !current || assignment !== current)
      .map((assignment) => exerciseById.get(assignment.exerciseId))
      .filter(Boolean);
  }

  function setupScoreForOption(exercise, context) {
    const adjacent = adjacentExercises(context);
    return adjacent.length ? Math.max(...adjacent.map((partner) => transitionCost(exercise, partner))) : 0;
  }

  function positionIndex(position) {
    if (position === "first") return 0;
    if (position === "second") return 1;
    if (position?.startsWith("extra-")) return Number(position.split("-")[1]) + 2;
    return -1;
  }

  function writeMainAssignments(circuit, assignments) {
    circuit.first = assignments[0];
    circuit.second = assignments[1];
    circuit.extras = assignments.slice(2);
    circuit.preferredExerciseCount = assignments.length;
  }

  function markManualSetupTransitions(assignments) {
    for (let index = 1; index < assignments.length; index += 1) {
      const previous = exerciseById.get(assignments[index - 1].exerciseId);
      const current = exerciseById.get(assignments[index].exerciseId);
      if (transitionCost(previous, current) > 2) assignments[index].manualOverride = true;
    }
  }

  function reorderCircuitExercise(context, direction) {
    const circuit = state.week.days[context.dayId].circuits[context.circuitIndex];
    const assignments = mainAssignments(circuit);
    const index = positionIndex(context.position);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= assignments.length) return;
    [assignments[index], assignments[nextIndex]] = [assignments[nextIndex], assignments[index]];
    const reorderedExercises = assignments.map((assignment) => exerciseById.get(assignment.exerciseId));
    if (reorderedExercises.some((exercise, itemIndex) => itemIndex > 0 && !canCombine(reorderedExercises[itemIndex - 1], exercise))) {
      showToast("Two exercises that require both sides cannot be placed together.", "error");
      return;
    }
    markManualSetupTransitions(assignments);
    writeMainAssignments(circuit, assignments);
    resetCircuitCompletion(circuit);
    persist();
    render();
  }

  function deleteCircuitExercise(context) {
    const circuit = state.week.days[context.dayId].circuits[context.circuitIndex];
    const assignments = mainAssignments(circuit);
    const index = positionIndex(context.position);
    if (assignments.length <= 2 || index < 0 || assignments[index].locked) return;
    const [removed] = assignments.splice(index, 1);
    if (["first", "second"].includes(removed.slotKey)) {
      const promoted = assignments.find((assignment) => assignment.slotKey === "extra");
      if (promoted) {
        promoted.slotKey = removed.slotKey;
        promoted.slotLabel = removed.slotLabel;
        promoted.manualOverride = true;
      }
    }
    const remainingExercises = assignments.map((assignment) => exerciseById.get(assignment.exerciseId));
    if (remainingExercises.some((exercise, itemIndex) => itemIndex > 0 && !canCombine(remainingExercises[itemIndex - 1], exercise))) {
      showToast("Removing that exercise would combine two both-sides movements.", "error");
      return;
    }
    markManualSetupTransitions(assignments);
    writeMainAssignments(circuit, assignments);
    stateFor(removed.exerciseId).skippedCount += 1;
    resetCircuitCompletion(circuit);
    persist();
    render();
    showToast(`${exerciseById.get(removed.exerciseId).name} removed from this circuit.`);
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function editDistance(first, second) {
    const previous = Array.from({ length: second.length + 1 }, (_, index) => index);
    const current = new Array(second.length + 1);

    for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
      current[0] = firstIndex;
      for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
        current[secondIndex] = Math.min(
          current[secondIndex - 1] + 1,
          previous[secondIndex] + 1,
          previous[secondIndex - 1] + (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1),
        );
      }
      for (let index = 0; index < current.length; index += 1) previous[index] = current[index];
    }

    return previous[second.length];
  }

  function fuzzyTokenScore(queryToken, candidateToken) {
    if (queryToken === candidateToken) return 0;
    if (candidateToken.startsWith(queryToken)) return 0.08 + (candidateToken.length - queryToken.length) * 0.002;
    if (candidateToken.includes(queryToken)) return 0.18 + candidateToken.indexOf(queryToken) * 0.01;
    if (queryToken.length < 3) return null;

    const allowedDistance = queryToken.length <= 4 ? 1 : Math.max(1, Math.floor(queryToken.length * 0.3));
    const distance = editDistance(queryToken, candidateToken);
    if (distance <= allowedDistance) return 0.32 + distance / Math.max(queryToken.length, candidateToken.length);

    let queryIndex = 0;
    for (const character of candidateToken) {
      if (character === queryToken[queryIndex]) queryIndex += 1;
      if (queryIndex === queryToken.length) {
        const gapRatio = (candidateToken.length - queryToken.length) / candidateToken.length;
        return gapRatio <= 0.55 ? 0.7 + gapRatio : null;
      }
    }
    return null;
  }

  function fuzzyExerciseScore(exercise, rawQuery) {
    const query = normalizeSearchText(rawQuery);
    if (!query) return 0;

    const queryTokens = query.split(" ");
    const fields = [
      [exercise.name, 0],
      [exercise.primary_body_part, 0.18],
      [exercise.category, 0.24],
      [exercise.movement_pattern, 0.28],
      [exercise.equipment_label, 0.32],
      [exercise.equipment_varieties.join(" "), 0.3],
    ];
    const candidates = fields.flatMap(([value, fieldPenalty]) =>
      normalizeSearchText(value)
        .split(" ")
        .filter(Boolean)
        .map((token) => ({ token, fieldPenalty })),
    );
    let score = normalizeSearchText(exercise.name).includes(query) ? -0.25 : 0;

    for (const queryToken of queryTokens) {
      let best = Number.POSITIVE_INFINITY;
      for (const candidate of candidates) {
        const tokenScore = fuzzyTokenScore(queryToken, candidate.token);
        if (tokenScore !== null) best = Math.min(best, tokenScore + candidate.fieldPenalty);
      }
      if (!Number.isFinite(best)) return null;
      score += best;
    }

    return score;
  }

  function replacementOptions() {
    if (!ui.replacement) return [];
    const slot = slotFor(ui.replacement);
    const assignment = assignmentFor(ui.replacement);
    const used = new Set(allAssignments().map((item) => item.exerciseId));
    if (assignment) used.delete(assignment.exerciseId);
    const search = ui.replaceSearch.trim();

    return exercises
      .map((exercise) => ({ exercise, searchScore: fuzzyExerciseScore(exercise, search) }))
      .filter(({ exercise, searchScore }) => {
        if (
          used.has(exercise.id) ||
          isHidden(exercise.id) ||
          isDeleted(exercise.id) ||
          exercise.id === assignment?.exerciseId ||
          (!ui.showAllReplacements && !matchesSlot(exercise, slot))
        ) {
          return false;
        }
        if (searchScore === null) return false;
        if (ui.replacement.position === "bridge" && !exercise.total_body_activator) return false;
        if (!adjacentExercises(ui.replacement).every((partner) => canCombine(exercise, partner))) return false;
        if (requiresBothSides(exercise) && otherCircuitExercises(ui.replacement).some(requiresBothSides)) return false;
        return ui.showAllReplacements || setupScoreForOption(exercise, ui.replacement) <= 2;
      })
      .sort((first, second) => {
        const firstCost = setupScoreForOption(first.exercise, ui.replacement);
        const secondCost = setupScoreForOption(second.exercise, ui.replacement);
        return (
          first.searchScore - second.searchScore ||
          firstCost - secondCost ||
          exerciseRecommendationScore(second.exercise) - exerciseRecommendationScore(first.exercise) ||
          stateFor(second.exercise.id).preference - stateFor(first.exercise.id).preference ||
          stateFor(second.exercise.id).chosenCount - stateFor(first.exercise.id).chosenCount ||
          first.exercise.name.localeCompare(second.exercise.name)
        );
      })
      .map(({ exercise }) => ({
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
              <article class="replace-option">
                <div class="replace-option-copy"><strong>${escapeHtml(exercise.name)}</strong><small>${escapeHtml(exercise.primary_body_part)} · ${escapeHtml(exercise.equipment_label)}${requiresBothSides(exercise) ? " · both sides" : ""} · chosen ${stateFor(exercise.id).chosenCount} times${eligible ? "" : " · outside this slot's target"}</small></div>
                <div class="replace-option-actions">
                  <span class="recommendation-score">Score ${exerciseRecommendationScore(exercise)}</span>
                  <span class="cost-badge cost-${cost}">${ui.replacement.position === "bridge" && eligible ? "Eligible" : `Setup ${cost}/5`}</span>
                  <button class="replace-option-use" type="button" data-action="choose-replacement" data-exercise-id="${exercise.id}">Use</button>
                </div>
                <button class="replace-option-hide" type="button" data-action="hide-replacement" data-exercise-id="${exercise.id}" title="Hide from future recommendations" aria-label="Hide ${escapeHtml(exercise.name)} from recommendations">${ICONS.eyeOff}<span>Hide</span></button>
              </article>`,
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
    const slotLabel = context.position === "bridge" ? ACTIVATOR_LABEL : assignment.slotLabel;
    document.getElementById("replace-description").textContent = `Only exercises that fit this ${slotLabel.toLowerCase()} slot and the day's target are shown.`;
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
    const recommended = replacementOptions()[0]?.exercise;
    if (!recommended) {
      ui.replacement = null;
      showToast("No unused compatible exercise is available for this circuit.", "error");
      return;
    }
    replaceExercise(recommended.id);
  }

  function randomReplace(context) {
    const assignment = assignmentFor(context);
    if (!assignment || assignment.locked) return;
    ui.replacement = { ...context, mode: "replace" };
    ui.replaceSearch = "";
    ui.showAllReplacements = false;
    const options = replacementOptions();
    if (!options.length) {
      ui.replacement = null;
      showToast("No unused eligible replacement is available for this slot.", "error");
      return;
    }
    const weightedOptions = options.map((option) => ({
      option,
      weight:
        stateFor(option.exercise.id).preference === 1
          ? 4
          : stateFor(option.exercise.id).preference === -1
            ? 0.25
            : 1,
    }));
    let draw = Math.random() * weightedOptions.reduce((sum, item) => sum + item.weight, 0);
    const selected =
      weightedOptions.find((item) => {
        draw -= item.weight;
        return draw <= 0;
      })?.option.exercise || weightedOptions[weightedOptions.length - 1].option.exercise;
    replaceExercise(selected.id);
  }

  function resetCircuitCompletion(circuit) {
    circuit.roundsCompleted = [false, false, false];
    circuit.bridgeCompleted = false;
  }

  function replaceExercise(exerciseId) {
    if (!ui.replacement) return;
    const assignment = assignmentFor(ui.replacement);
    const next = exerciseById.get(exerciseId);
    if (
      !next ||
      (ui.replacement.position === "bridge" && !next.total_body_activator) ||
      (!ui.showAllReplacements && !matchesSlot(next, slotFor(ui.replacement)))
    ) return;

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
      if (document.getElementById("replace-dialog").open) document.getElementById("replace-dialog").close();
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
    if (document.getElementById("replace-dialog").open) document.getElementById("replace-dialog").close();
    ui.replacement = null;
    render();
    showToast(`${next.name} added. ${previous.name} counted as skipped.`);
  }

  function removeRoundExercise(dayId, circuitIndex) {
    const circuit = state.week.days[dayId].circuits[circuitIndex];
    const assignment = circuit.extras[circuit.extras.length - 1];
    if (!assignment || assignment.locked) return;
    deleteCircuitExercise({
      dayId,
      circuitIndex,
      position: `extra-${circuit.extras.length - 1}`,
    });
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
      ui.currentView = enabledDays()[0]?.id || "settings";
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
        recommendation_preference: stateFor(exercise.id).preference,
        current_reps: stateFor(exercise.id).reps,
        current_measure: stateFor(exercise.id).measureType,
        current_weight: stateFor(exercise.id).weight,
        current_notes: stateFor(exercise.id).notes,
        user_locked: exercise.always_locked || lockedIds.has(exercise.id),
        hidden: isHidden(exercise.id),
        deleted: isDeleted(exercise.id),
      })),
    };
  }

  async function saveJson() {
    try {
      if (!fileHandle) {
        if (!("showSaveFilePicker" in window)) {
          showToast(
            "Direct file saving requires a current Chrome or Edge browser. Browser-local autosave is still active.",
            "error",
          );
          return;
        }
        fileHandle = await window.showSaveFilePicker({
          suggestedName: `basement-45-workouts.json`,
          types: [{ description: "Workout JSON", accept: { "application/json": [".json"] } }],
        });
        await rememberFileHandle(fileHandle);
      }
      const saved = await writeStateToFile(fileHandle, true, true);
      if (!saved) showToast("Permission to write the workout file was not granted.", "error");
    } catch (error) {
      if (error.name !== "AbortError") showToast(`The workout file could not be saved: ${error.message}`, "error");
    }
  }

  function portableExerciseRecord(exercise) {
    return {
      id: exercise.id,
      name: exercise.name,
      category: exercise.primary_body_part || "Other",
      equipment: exercise.equipment_label || "User-defined",
      equipmentVarieties: exercise.equipment_varieties || [],
      instructionUrl: exercise.instruction_url || null,
      sourceRow: exercise.source_row ?? null,
      custom: true,
      movementPattern: exercise.movement_pattern || "other",
      movementRole: exercise.movement_role || "isolation",
      forceType: exercise.force_type || "other",
      defaultReps: exercise.default_reps || "10",
      shoulderCaution: Boolean(exercise.shoulder_caution),
      backCaution: Boolean(exercise.back_caution),
      totalBodyActivator: Boolean(exercise.total_body_activator),
      bothSides: Boolean(exercise.unilateral),
      difficultyScore: exercise.difficulty_score,
      setupDifficulty: exercise.setup_difficulty,
      effectivenessScore: exercise.effectiveness_score,
      notes: exercise.notes || null,
    };
  }

  function stateWithPortableExercises(parsed) {
    const candidate = JSON.parse(JSON.stringify(parsed.appState));
    candidate.customExercises = Array.isArray(candidate.customExercises) ? candidate.customExercises : [];
    rebuildExerciseCatalog(candidate.customExercises, candidate.exerciseEdits || {});
    const recovered = Array.isArray(parsed.exerciseLibrary)
      ? parsed.exerciseLibrary.filter(
          (exercise) => exercise?.id && exercise?.name && !exerciseById.has(exercise.id),
        )
      : [];
    candidate.customExercises.push(...recovered.map(portableExerciseRecord));
    return { candidate, recoveredCount: recovered.length };
  }

  async function loadJson(file, handle = null) {
    if (!file) return;
    const previousCustomExercises = state.customExercises.slice();
    const previousExerciseEdits = { ...state.exerciseEdits };
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed.appState) throw new Error("This is not a Basement 45 save file.");
      const { candidate, recoveredCount } = stateWithPortableExercises(parsed);
      state = normalizeState(candidate);
      ui.currentView = enabledDays()[0]?.id || "settings";
      if (handle) {
        fileHandle = handle;
        await rememberFileHandle(handle);
        setFileStatus(`Autosaving · ${handle.name}`, true);
      }
      persist();
      render();
      showToast(
        `Loaded Week ${state.weekNumber} from ${file.name}.${recoveredCount ? ` Recovered ${recoveredCount} portable library exercise${recoveredCount === 1 ? "" : "s"}.` : ""}`,
      );
    } catch (error) {
      rebuildExerciseCatalog(previousCustomExercises, previousExerciseEdits);
      showToast(error.message || "The JSON file could not be loaded.", "error");
    } finally {
      document.getElementById("load-input").value = "";
    }
  }

  async function openJsonFile() {
    if (!("showOpenFilePicker" in window)) {
      document.getElementById("load-input").click();
      return;
    }
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: "Workout JSON", accept: { "application/json": [".json"] } }],
      });
      await loadJson(await handle.getFile(), handle);
    } catch (error) {
      if (error.name !== "AbortError") showToast(`The workout file could not be opened: ${error.message}`, "error");
    }
  }

  function openExerciseDialog() {
    const form = document.getElementById("exercise-form");
    ui.editingExerciseId = null;
    form.reset();
    const categories = categoryOptions();
    document.getElementById("custom-category").innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join("");
    document.getElementById("exercise-dialog-title").textContent = "Add an exercise";
    document.getElementById("exercise-dialog-description").textContent =
      "Its category and movement fields determine where it can safely appear.";
    document.getElementById("exercise-form-submit").textContent = "Add to library";
    document.getElementById("exercise-dialog").showModal();
    setTimeout(() => form.elements.name.focus(), 0);
  }

  function openEditExerciseDialog(exerciseId) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise) return;
    openExerciseDialog();
    ui.editingExerciseId = exerciseId;
    const form = document.getElementById("exercise-form");
    const setValue = (name, value) => {
      form.elements[name].value = value ?? "";
    };
    setValue("name", exercise.name);
    setValue("category", exercise.primary_body_part);
    setValue("equipment", exercise.equipment_label);
    setValue("equipmentVarieties", exercise.equipment_varieties.join("\n"));
    setValue("movementPattern", exercise.movement_pattern);
    setValue("movementRole", exercise.movement_role);
    setValue("forceType", exercise.force_type);
    setValue("defaultReps", exercise.default_reps);
    setValue("difficultyScore", exercise.difficulty_score);
    setValue("setupDifficulty", exercise.setup_difficulty);
    setValue("effectivenessScore", exercise.effectiveness_score);
    setValue("instructionUrl", exercise.instruction_url);
    setValue("notes", exercise.notes);
    form.elements.shoulderCaution.checked = exercise.shoulder_caution;
    form.elements.backCaution.checked = exercise.back_caution;
    form.elements.totalBodyActivator.checked = exercise.total_body_activator;
    form.elements.bothSides.checked = exercise.unilateral;
    document.getElementById("exercise-dialog-title").textContent = `Edit ${exercise.name}`;
    document.getElementById("exercise-dialog-description").textContent =
      "Changes apply throughout the library and current workout while preserving history.";
    document.getElementById("exercise-form-submit").textContent = "Save changes";
  }

  function saveExerciseForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const exerciseId = idFor(name);
    if (!ui.editingExerciseId && (!exerciseId || exerciseById.has(exerciseId))) {
      showToast("An exercise with that name already exists.", "error");
      return;
    }

    const record = {
      name,
      category: String(data.get("category") || "Other"),
      equipment: String(data.get("equipment") || "User-defined").trim(),
      equipmentVarieties: String(data.get("equipmentVarieties") || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
      instructionUrl: String(data.get("instructionUrl") || "").trim() || null,
      sourceRow: null,
      custom: true,
      movementPattern: String(data.get("movementPattern") || "other"),
      movementRole: String(data.get("movementRole") || "isolation"),
      forceType: String(data.get("forceType") || "other"),
      defaultReps: String(data.get("defaultReps") || "10").trim() || "10",
      difficultyScore: clampRating(data.get("difficultyScore"), 2),
      setupDifficulty: clampRating(data.get("setupDifficulty"), 2),
      effectivenessScore: clampRating(data.get("effectivenessScore"), 3),
      shoulderCaution: data.get("shoulderCaution") === "on",
      backCaution: data.get("backCaution") === "on",
      totalBodyActivator: data.get("totalBodyActivator") === "on",
      bothSides: data.get("bothSides") === "on",
      notes: String(data.get("notes") || "").trim() || null,
    };

    if (ui.editingExerciseId) {
      const editingId = ui.editingExerciseId;
      const previousEdit = state.exerciseEdits[editingId];
      state.exerciseEdits[editingId] = record;
      rebuildExerciseCatalog(state.customExercises, state.exerciseEdits);
      for (const day of DAY_CONFIG) {
        for (const circuit of state.week.days[day.id].circuits) {
          markManualSetupTransitions(mainAssignments(circuit));
        }
      }
      const issues = validateWeek(state.week);
      if (issues.length) {
        if (previousEdit) state.exerciseEdits[editingId] = previousEdit;
        else delete state.exerciseEdits[editingId];
        rebuildExerciseCatalog(state.customExercises, state.exerciseEdits);
        showToast(`That edit conflicts with the current plan: ${issues[0]}`, "error");
        return;
      }
    } else {
      state.customExercises.push(record);
      rebuildExerciseCatalog(state.customExercises, state.exerciseEdits);
      stateFor(exerciseId);
    }
    persist();
    renderTabs();
    document.getElementById("exercise-dialog").close();
    renderLibrary();
    showToast(ui.editingExerciseId ? `${name} updated.` : `${name} added to the exercise library.`);
    ui.editingExerciseId = null;
  }

  function toggleHiddenExercise(exerciseId, options = {}) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise || exercise.always_locked || isDeleted(exerciseId)) return;
    const shouldHide = options.hideOnly || !isHidden(exerciseId);
    if (!shouldHide) {
      state.hiddenExerciseIds = state.hiddenExerciseIds.filter((id) => id !== exerciseId);
      showToast(`${exercise.name} restored to recommendations.`);
    } else {
      if (!isHidden(exerciseId)) state.hiddenExerciseIds.push(exerciseId);
      showToast(`${exercise.name} hidden from future recommendations.`);
    }
    persist();
    render();
    if (document.getElementById("replace-dialog").open) renderReplacementResults();
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
    renderTabs();
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
    if (actionButton.dataset.action === "random-replace") {
      randomReplace(parseContext(actionButton));
    }
    if (actionButton.dataset.action === "move-exercise") {
      reorderCircuitExercise(parseContext(actionButton), Number(actionButton.dataset.direction));
    }
    if (actionButton.dataset.action === "delete-circuit-exercise") {
      deleteCircuitExercise(parseContext(actionButton));
    }
    if (actionButton.dataset.action === "add-round-exercise") {
      openAddRoundExercise(actionButton.dataset.day, Number(actionButton.dataset.circuit));
    }
    if (actionButton.dataset.action === "remove-round-exercise") {
      removeRoundExercise(actionButton.dataset.day, Number(actionButton.dataset.circuit));
    }
    if (actionButton.dataset.action === "toggle-favorite-circuit") {
      toggleFavoriteCircuit(actionButton.dataset.day, Number(actionButton.dataset.circuit));
    }
    if (actionButton.dataset.action === "open-favorite-circuits") {
      openFavoriteCircuits(actionButton.dataset.day, Number(actionButton.dataset.circuit));
    }
    if (actionButton.dataset.action === "apply-favorite-circuit") {
      applyFavoriteCircuit(actionButton.dataset.favoriteId);
    }
    if (actionButton.dataset.action === "delete-favorite-circuit") {
      deleteFavoriteCircuit(actionButton.dataset.favoriteId);
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
    if (actionButton.dataset.action === "set-preference") {
      const exercise = exerciseById.get(actionButton.dataset.exerciseId);
      if (exercise) {
        const exerciseState = stateFor(exercise.id);
        const requestedPreference = Math.max(-1, Math.min(1, Number(actionButton.dataset.value) || 0));
        exerciseState.preference = exerciseState.preference === requestedPreference ? 0 : requestedPreference;
        persist();
        render();
        showToast(
          exerciseState.preference === 1
            ? `${exercise.name} will be recommended more often.`
            : exerciseState.preference === -1
              ? `${exercise.name} will be recommended less often.`
              : `${exercise.name} recommendation preference cleared.`,
        );
      }
    }
    if (actionButton.dataset.action === "toggle-hide-workout") {
      toggleHiddenExercise(actionButton.dataset.exerciseId);
    }
    if (actionButton.dataset.action === "hide-replacement") {
      toggleHiddenExercise(actionButton.dataset.exerciseId, { hideOnly: true });
    }
    if (actionButton.dataset.action === "open-add-exercise") {
      openExerciseDialog();
    }
    if (actionButton.dataset.action === "edit-workout-exercise") {
      openEditExerciseDialog(actionButton.dataset.exerciseId);
    }
    if (actionButton.dataset.action === "close-exercise-dialog") {
      ui.editingExerciseId = null;
      document.getElementById("exercise-dialog").close();
    }
    if (actionButton.dataset.action === "edit-library") {
      openEditExerciseDialog(actionButton.dataset.exerciseId);
    }
    if (actionButton.dataset.action === "toggle-hide-library") {
      toggleHiddenExercise(actionButton.dataset.exerciseId);
    }
    if (actionButton.dataset.action === "delete-library") {
      deleteLibraryExercise(actionButton.dataset.exerciseId);
    }
  }

  function handleChange(event) {
    if (event.target.dataset?.setting === "measureType" && event.target.dataset.exerciseId) {
      stateFor(event.target.dataset.exerciseId).measureType = event.target.value;
      persist();
      return;
    }
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

    const daily = event.target.closest('[data-action="daily-check"]');
    if (daily) {
      state.week.days[daily.dataset.day].preChecklist[daily.dataset.item] = daily.checked;
      persist();
      render();
      return;
    }

    const core = event.target.closest('[data-action="core-check"]');
    if (core) {
      state.week.days[core.dataset.day].coreCompleted = core.checked;
      persist();
      render();
      return;
    }

    const cardio = event.target.closest('[data-action="cardio-check"]');
    if (cardio) {
      state.week.days[cardio.dataset.day].cardioCompleted = cardio.checked;
      persist();
      render();
      return;
    }

    if (event.target.dataset?.dayEnabled) {
      state.daySettings[event.target.dataset.dayEnabled].enabled = event.target.checked;
      persist();
      render();
      return;
    }

    if (event.target.id === "library-category") {
      ui.libraryCategory = event.target.value;
      renderLibrary();
    }
    if (event.target.id === "library-equipment") {
      ui.libraryEquipment = event.target.value;
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
        ? ui.replacement?.position === "bridge"
          ? "Showing every unused exercise checked as a total-body activator."
          : "Showing every unused library exercise; target and setup limits are intentionally relaxed."
        : "Only eligible, easy 0–2 options are shown.";
      renderReplacementResults();
    }
  }

  function handleInput(event) {
    const setting = event.target.dataset.setting;
    const exerciseId = event.target.dataset.exerciseId;
    if (setting && exerciseId && ["reps", "weight", "notes", "measureType"].includes(setting)) {
      stateFor(exerciseId)[setting] = event.target.value.slice(0, setting === "notes" ? 1000 : 40);
      persist();
      return;
    }

    if (event.target.dataset.daySetting) {
      const key = event.target.dataset.daySetting;
      state.daySettings[event.target.dataset.day][key] = event.target.value.slice(0, key === "description" ? 600 : 100);
      persist();
      renderTabs();
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
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveJson();
      }
    });
    document.getElementById("save-button").addEventListener("click", saveJson);
    document.getElementById("load-button").addEventListener("click", openJsonFile);
    document.getElementById("load-input").addEventListener("change", (event) => loadJson(event.target.files[0]));
    document.getElementById("new-week-button").addEventListener("click", startNewWeek);
    document.getElementById("exercise-form").addEventListener("submit", saveExerciseForm);
    document.getElementById("replace-dialog").addEventListener("close", () => {
      ui.replacement = null;
      ui.replaceSearch = "";
      ui.showAllReplacements = false;
    });
    document.getElementById("favorite-dialog").addEventListener("close", () => {
      ui.favoriteTarget = null;
    });
    window.addEventListener?.("resize", scheduleCircuitStickyOffsets);
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
    if (DAY_CONFIG.some((day) => day.id === ui.currentView) && !state.daySettings[ui.currentView].enabled) {
      ui.currentView = enabledDays()[0]?.id || "settings";
    }
    bindEvents();
    render();
    restoreFileHandle();

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
