import { BODY_PART_OPTIONS } from "../data/training";
import { equipmentFilterKey } from "./equipment";
import { includesAny, slugify } from "./text";


export function inferEquipment(equipmentText) {
  const equipment = [];
  const value = equipmentText.toLowerCase();

  if (equipmentFilterKey(equipmentText) === "functional_trainer")
    equipment.push("FT2");
  if (value.includes("dumbbell")) equipment.push("dumbbells");
  if (value.includes("barbell")) equipment.push("barbell");
  if (includesAny(value, ["bench", "box"])) equipment.push("bench");
  if (value.includes("squat rack")) equipment.push("squat rack");
  if (value.includes("smith machine") || value.includes("smitch machine"))
    equipment.push("smith machine");
  if (value.includes("physio ball")) equipment.push("physio ball");
  if (value.includes("body weight")) equipment.push("body weight");
  if (value.includes("wall")) equipment.push("wall");
  if (value.includes("plate")) equipment.push("plates");
  if (value.includes("kettlebell")) equipment.push("kettlebell");
  if (value.includes("band")) equipment.push("bands");
  if (value.includes("back extension"))
    equipment.push("back extension machine");
  if (value.includes("pull-up bar") || value.includes("pull up bar"))
    equipment.push("pull-up bar");
  if (value.includes("ankle strap")) equipment.push("ankle straps");
  if (value.includes("curl bar")) equipment.push("curl bar");
  if (value.includes("straight bar")) equipment.push("straight bar");
  if (includesAny(value, ["low row", "row handle", "chinning handle"]))
    equipment.push("low row handle");
  if (
    includesAny(value, ["d-handle", "d handle", "one handle", "two handles"])
  )
    equipment.push("D-handles");
  if (value.includes("rope")) equipment.push("triceps rope");

  return equipment.length ? [...new Set(equipment)] : ["user-defined"];
}


export function inferEquipmentVarieties(record) {
  const explicit = Array.isArray(record.equipmentVarieties)
    ? record.equipmentVarieties
    : Array.isArray(record.equipment_varieties)
      ? record.equipment_varieties
      : [];
  const value = String(record.equipment || "").toLowerCase();
  const varieties = explicit
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((item) =>
      equipmentFilterKey(item) === "functional_trainer"
        ? "Functional trainer"
        : item,
    );
  const add = (label, patterns) => {
    if (includesAny(value, patterns)) varieties.push(label);
  };

  if (equipmentFilterKey(record.equipment) === "functional_trainer") {
    varieties.push("Functional trainer");
  }
  add("D-handles", [
    "d-handle",
    "d handle",
    "one handle",
    "two handles",
    "strap handle",
  ]);
  add("Curl bar", ["curl bar", "curl-bar"]);
  add("Straight bar", ["straight bar"]);
  add("Low row handle", ["low row", "row handle", "chinning handle"]);
  add("Triceps rope", ["triceps rope", "pushdown rope", "rope"]);
  add("Ankle straps", ["ankle strap", "ankle cuff"]);
  add("Resistance bands", ["resistance band", "loop band", "mini band"]);
  add("Kettlebell", ["kettlebell"]);
  add("Back extension machine", [
    "back extension machine",
    "45-degree back extension",
    "45 degree back extension",
  ]);
  add("Pull-up bar", ["pull-up bar", "pull up bar"]);
  add("Bench", ["bench", "box"]);
  add("Dumbbells", ["dumbbell"]);
  add("Barbell", ["barbell"]);
  add("Squat rack", ["squat rack"]);
  add("Smith machine", ["smith machine", "smitch machine"]);
  add("Physio ball", ["physio ball", "stability ball"]);
  add("Weight plates", ["plate"]);
  add("Body weight", ["body weight", "bodyweight"]);

  if (!varieties.length && record.equipment)
    varieties.push(String(record.equipment).trim());
  return [...new Set<string>(varieties)].sort((first, second) =>
    first.localeCompare(second),
  );
}


export function inferMovementPattern(record) {
  const value = record.name.toLowerCase();
  if (
    includesAny(value, [
      "deadlift",
      "romanian",
      "good morning",
      "pull-through",
    ])
  )
    return "hinge";
  if (includesAny(value, ["squat", "lunge", "step-up", "wall sit"]))
    return "squat";
  if (includesAny(value, ["carry", "march", "walk on toes"])) return "carry";
  if (includesAny(value, ["row", "pull-up", "pulldown", "chin-up"]))
    return "pull";
  if (includesAny(value, ["press", "push-up", "dip"])) return "push";
  if (
    includesAny(value, [
      "rotation",
      "wood chop",
      "golf swing",
      "pronation",
      "supination",
    ])
  )
    return "rotation";
  if (includesAny(value, ["plank", "hold", "dead hang"])) return "isometric";
  if (includesAny(value, ["curl", "raise", "fly", "extension", "pushdown"]))
    return "isolation";
  return "other";
}


export function inferMovementRole(record) {
  if (record.movementRole) return record.movementRole;
  if (record.custom && !record.catalogExpansion)
    return record.name.startsWith("PT Exercise") ? "bridge" : "isolation";
  if (record.category === "Full Body and Golf Support") return "total_body";
  if (
    ["Forearms, Grip and Traps", "Calves and Lower Legs", "Core"].includes(
      record.category,
    ) ||
    includesAny(record.name, [
      "wall sit",
      "airplane balance",
      "clamshell",
      "fire hydrant",
    ])
  ) {
    return "bridge";
  }
  if (
    ["Biceps", "Triceps", "Shoulders and Rotator Cuff"].includes(
      record.category,
    ) ||
    includesAny(record.name, [
      "fly",
      "pullover",
      "hamstring curl",
      "glute kickback",
      "hip abduction",
      "hip adduction",
    ])
  ) {
    return "isolation";
  }
  return "compound";
}


export function inferForceType(record, movementPattern) {
  const value = record.name.toLowerCase();
  const category = record.category;

  if (includesAny(value, ["pallof", "anti-rotation"])) return "anti_rotation";
  if (
    includesAny(value, [
      "wood chop",
      "cable lift",
      "rotational",
      "golf swing",
    ])
  )
    return "rotation";
  if (includesAny(value, ["carry", "suitcase march", "walk on toes"]))
    return "carry";
  if (
    movementPattern === "hinge" ||
    ["Hamstrings", "Glutes and Hips"].includes(category)
  )
    return "hinge";
  if (movementPattern === "squat" || category === "Quadriceps")
    return "squat";
  if (movementPattern === "isometric") return "isometric";
  if (["Chest", "Triceps"].includes(category)) return "push";
  if (["Back and Lats", "Biceps"].includes(category)) return "pull";
  if (category === "Shoulders and Rotator Cuff") {
    if (
      includesAny(value, [
        "press",
        "front raise",
        "lateral raise",
        "scaption",
      ])
    )
      return "push";
    if (includesAny(value, ["rear-delt", "reverse fly", "face pull"]))
      return "pull";
  }
  if (record.category === "Full Body and Golf Support") {
    if (
      includesAny(value, [
        "push-up",
        "burpee",
        "press and row",
        "bear crawl",
        "mountain climber",
      ])
    )
      return "push";
    if (includesAny(value, ["row", "clean", "curl"])) return "pull";
  }
  return "other";
}


export function inferBenchPosition(record) {
  const value = `${record.name} ${record.equipment}`.toLowerCase();
  if (value.includes("incline")) return "incline";
  if (
    includesAny(value, [
      "seated",
      "shoulder press",
      "arnold press",
      "overhead triceps",
    ])
  )
    return "seated_upright";
  if (
    includesAny(value, [
      "bench press",
      "skull crusher",
      "chest fly",
      "floor press",
    ])
  )
    return "flat";
  return "none";
}


export function inferPulleyHeight(record) {
  if (!includesAny(record.equipment, ["FT2", "cable"])) return "none";
  const value = record.name.toLowerCase();
  if (
    includesAny(value, ["high cable", "high-to-low", "pulldown", "pushdown"])
  )
    return "high";
  if (
    includesAny(value, [
      "low-to-high",
      "cable front raise",
      "cable curl",
      "cable lift",
    ])
  )
    return "low";
  if (
    includesAny(value, ["fly", "row", "rotation", "pallof", "lateral raise"])
  )
    return "middle";
  return "variable";
}


export function inferAttachment(record) {
  const value = record.equipment.toLowerCase();
  if (value.includes("rope")) return "rope";
  if (value.includes("curl bar")) return "curl bar";
  if (includesAny(value, ["straight bar", "lat bar"])) return "bar";
  if (value.includes("ankle strap")) return "ankle strap";
  if (includesAny(value, ["handle", "handles"])) return "handle";
  return null;
}


export function inferDefaultReps(record) {
  const value = record.name.toLowerCase();
  if (record.custom) return "10–15";
  if (includesAny(value, ["wall sit", "plank", "hold", "dead hang"]))
    return "30 sec";
  if (includesAny(value, ["carry", "march", "walk on toes"])) return "30 sec";
  if (
    record.category === "Shoulders and Rotator Cuff" &&
    !value.includes("press")
  )
    return "12–15";
  if (includesAny(value, ["clean", "deadlift", "turkish get-up", "burpee"]))
    return "6–8";
  if (
    includesAny(value, [
      "single-arm",
      "single-leg",
      "one-arm",
      "one adjustable",
    ])
  )
    return "10 / side";
  return "10";
}


export function clampRating(value, fallback) {
  const rating = Number(value);
  return Number.isFinite(rating)
    ? Math.max(1, Math.min(5, Math.round(rating)))
    : fallback;
}


export function inferEffectiveness(record, movementRole) {
  if (record.totalBodyActivator || movementRole === "total_body") return 5;
  if (movementRole === "compound") return 4;
  if (movementRole === "bridge") return 3;
  return 3;
}


export function normalizeBodyParts(values) {
  const items = Array.isArray(values)
    ? values
    : String(values || "").split(/[\r\n,;]+/);
  const canonical = new Map(
    BODY_PART_OPTIONS.map((part) => [part.toLowerCase(), part]),
  );
  ["abs", "abdominals", "abdominal", "core", "abs and core"].forEach(
    (alias) => canonical.set(alias, "Abs/core"),
  );
  return [
    ...new Set(
      items
        .map((part) => String(part).trim())
        .filter(Boolean)
        .map((part) => canonical.get(part.toLowerCase()) || part),
    ),
  ];
}


export function normalizeExerciseAliases(values, exerciseName = "") {
  const items = Array.isArray(values)
    ? values
    : String(values || "").split(/[\r\n;]+/);
  const exerciseKey = String(exerciseName)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  const seen = new Set();
  return items
    .map((alias) => String(alias).trim().replace(/\s+/g, " ").slice(0, 100))
    .filter((alias) => {
      const key = alias.toLowerCase();
      if (!key || key === exerciseKey || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}


export function inferBodyParts(record, movementPattern, forceType) {
  const explicit = normalizeBodyParts(record.bodyParts ?? record.body_parts);
  if (explicit.length) return explicit;

  const categoryParts = {
    Chest: ["Chest"],
    "Back and Lats": ["Back", "Lats"],
    Biceps: ["Biceps"],
    Triceps: ["Triceps"],
    "Shoulders and Rotator Cuff": ["Shoulders", "Rotator cuff"],
    "Forearms, Grip and Traps": ["Forearms", "Grip", "Traps"],
    Quadriceps: ["Quadriceps"],
    Hamstrings: ["Hamstrings"],
    "Glutes and Hips": ["Glutes", "Hips"],
    "Calves and Lower Legs": ["Calves"],
    Core: ["Abs/core"],
    "Full Body and Golf Support": ["Full body", "Abs/core"],
    "User-defined PT": ["Full body"],
  };
  const parts = [...(categoryParts[record.category] || [])];
  const value = String(record.name || "").toLowerCase();
  const add = (...items) => items.forEach((item) => parts.push(item));

  if (
    forceType === "push" ||
    includesAny(value, ["press", "push-up", "pushup", "dip"])
  )
    add("Chest", "Shoulders", "Triceps");
  if (
    forceType === "pull" ||
    includesAny(value, ["row", "pull-up", "pullup", "pulldown", "chin-up"])
  )
    add("Back", "Lats", "Biceps");
  if (
    value.includes("curl") &&
    !includesAny(value, ["leg curl", "hamstring curl"])
  )
    add("Biceps", "Forearms");
  if (includesAny(value, ["triceps", "pushdown", "skull crusher"]))
    add("Triceps");
  if (
    movementPattern === "squat" ||
    includesAny(value, ["squat", "lunge", "step-up", "step up", "wall sit"])
  )
    add("Quadriceps", "Glutes", "Hips", "Abs/core");
  if (
    movementPattern === "hinge" ||
    includesAny(value, [
      "deadlift",
      "romanian",
      "hip thrust",
      "glute bridge",
      "pull-through",
    ])
  )
    add("Hamstrings", "Glutes", "Hips", "Abs/core");
  if (movementPattern === "carry")
    add("Full body", "Abs/core", "Grip", "Traps");
  if (
    includesAny(value, [
      "plank",
      "pallof",
      "rotation",
      "wood chop",
      "crunch",
      "dead bug",
      "bird dog",
    ])
  )
    add("Abs/core");
  if (includesAny(value, ["calf", "toe raise", "tibialis"])) add("Calves");
  if (
    includesAny(value, [
      "shoulder",
      "lateral raise",
      "front raise",
      "face pull",
      "rear-delt",
      "reverse fly",
    ])
  )
    add("Shoulders");
  if (
    includesAny(value, ["rotator", "external rotation", "internal rotation"])
  )
    add("Rotator cuff");
  if (
    includesAny(value, [
      "shrug",
      "farmer",
      "suitcase",
      "dead hang",
      "grip",
      "wrist",
      "pronation",
      "supination",
    ])
  )
    add("Grip", "Forearms", "Traps");
  if (!parts.length) parts.push(record.category || "Full body");
  return normalizeBodyParts(parts);
}


export function exerciseEffectivenessScore(exercise) {
  return clampRating(exercise?.effectiveness_score, 3);
}


export function demoSearchUrl(name) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`;
}


export function enrichExercise(record) {
  const movementPattern =
    record.movementPattern || inferMovementPattern(record);
  const forceType =
    record.forceType || inferForceType(record, movementPattern);
  const movementRole = inferMovementRole(record);
  const value = record.name.toLowerCase();
  const overhead = includesAny(value, [
    "overhead",
    "shoulder press",
    "arnold press",
  ]);
  const shoulderCaution =
    record.shoulderCaution ??
    includesAny(value, [
      "press",
      "fly",
      "dip",
      "pullover",
      "turkish get-up",
      "front raise",
    ]);
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
  const technicalDifficulty =
    record.technicalDifficulty || inferredTechnicalDifficulty;
  const effectivenessScore = clampRating(
    record.effectivenessScore ?? record.effectiveness_score,
    inferEffectiveness(record, movementRole),
  );
  const bothSides =
    typeof record.bothSides === "boolean"
      ? record.bothSides
      : typeof record.unilateral === "boolean"
        ? record.unilateral
        : includesAny(value, [
            "single-arm",
            "single-leg",
            "one-arm",
            "unilateral",
            "split-stance",
          ]);
  const alwaysLocked = Boolean(record.alwaysLocked);
  const bodyParts = inferBodyParts(record, movementPattern, forceType);

  return {
    id: String(record.id || slugify(record.name)),
    name: record.name,
    aliases: normalizeExerciseAliases(
      record.aliases ?? record.exercise_aliases,
      record.name,
    ),
    primary_body_part: record.category,
    body_parts: bodyParts,
    secondary_body_parts: bodyParts.slice(1),
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
    technical_difficulty: technicalDifficulty,
    effectiveness_score: effectivenessScore,
    default_reps: record.defaultReps || inferDefaultReps(record),
    instruction_url:
      record.instructionUrl ||
      (!alwaysLocked ? demoSearchUrl(record.name) : null),
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
          includesAny(value, [
            "carry",
            "turkish get-up",
            "bear crawl",
            "mountain climber",
          ]),
    always_locked: alwaysLocked,
  };
}

export const idFor = (name) => slugify(name);


export function applyExerciseEdit(exercise, edit) {
  if (!edit) return exercise;
  const edited = enrichExercise({
    name: edit.name || exercise.name,
    aliases: edit.aliases ?? exercise.aliases,
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
    equipmentVarieties:
      edit.equipmentVarieties || exercise.equipment_varieties,
    bodyParts: edit.bodyParts || exercise.body_parts,
    totalBodyActivator:
      edit.totalBodyActivator ?? exercise.total_body_activator,
    bothSides: edit.bothSides ?? exercise.unilateral,
    effectivenessScore:
      edit.effectivenessScore ?? exercise.effectiveness_score,
    catalogExpansion: exercise.catalog_expansion,
  });
  edited.id = exercise.id;
  return edited;
}
