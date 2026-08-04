(function () {
  "use strict";

  const records = [];
  const add = (category, equipment, equipmentVarieties, names, defaults = {}) => {
    for (const entry of names) {
      const exercise = typeof entry === "string" ? { name: entry } : entry;
      records.push({
        category,
        equipment,
        equipmentVarieties,
        instructionUrl: null,
        sourceRow: null,
        custom: true,
        catalogExpansion: true,
        ...defaults,
        ...exercise,
      });
    }
  };

  add("Biceps", "Functional trainer + curl bar", ["Functional trainer", "Curl bar"], [
    "FT2 curl-bar curl",
    "Cable reverse curl with curl bar",
    "Cable drag curl with curl bar",
    "Cable preacher curl with curl bar",
    "Lying cable curl with curl bar",
    "Cable spider curl with curl bar",
  ]);
  add("Triceps", "Functional trainer + curl bar + bench", ["Functional trainer", "Curl bar", "Bench"], [
    "Cable skull crusher with curl bar",
    "Incline cable skull crusher with curl bar",
  ]);
  add("Shoulders and Rotator Cuff", "Functional trainer + curl bar", ["Functional trainer", "Curl bar"], [
    "Cable upright row with curl bar",
    "Cable front raise with curl bar",
  ]);
  add("Back and Lats", "Functional trainer + curl bar", ["Functional trainer", "Curl bar"], [
    "Bent-over cable row with curl bar",
    "Cable high row with curl bar",
  ]);

  add("Biceps", "Functional trainer + straight bar", ["Functional trainer", "Straight bar"], [
    "Cable curl with straight bar",
    "Cable reverse curl with straight bar",
    "Cable drag curl with straight bar",
    "Lying cable curl with straight bar",
  ]);
  add("Triceps", "Functional trainer + straight bar", ["Functional trainer", "Straight bar"], [
    "Straight-bar triceps pushdown",
    "Reverse-grip straight-bar pushdown",
  ]);
  add("Shoulders and Rotator Cuff", "Functional trainer + straight bar", ["Functional trainer", "Straight bar"], [
    "Cable upright row with straight bar",
    "Cable front raise with straight bar",
  ]);
  add("Back and Lats", "Functional trainer + straight bar", ["Functional trainer", "Straight bar"], [
    "Straight-arm cable pulldown",
    "Bent-over cable row with straight bar",
    "Standing cable row with straight bar",
  ]);
  add("Quadriceps", "Functional trainer + straight bar", ["Functional trainer", "Straight bar"], [
    "Cable front squat with straight bar",
    "Cable reverse lunge with straight bar",
  ]);
  add("Hamstrings", "Functional trainer + straight bar", ["Functional trainer", "Straight bar"], [
    "Cable Romanian deadlift with straight bar",
    "Cable stiff-leg deadlift with straight bar",
    "Cable good morning with straight bar",
  ], { backCaution: true });

  add("Back and Lats", "Functional trainer + low row handle", ["Functional trainer", "Low row handle"], [
    "Close-grip seated cable row",
    "Close-grip standing cable row",
    "Close-grip cable high row",
    "Close-grip kneeling lat pulldown",
    "Close-grip cable pulldown",
  ]);
  add("Shoulders and Rotator Cuff", "Functional trainer + low row handle", ["Functional trainer", "Low row handle"], [
    "Low-row-handle cable upright row",
  ]);
  add("Glutes and Hips", "Functional trainer + low row handle", ["Functional trainer", "Low row handle"], [
    "Low-row-handle cable pull-through",
  ]);
  add("Hamstrings", "Functional trainer + low row handle", ["Functional trainer", "Low row handle"], [
    "Low-row-handle cable Romanian deadlift",
  ], { backCaution: true });

  add("Chest", "Functional trainer + D-handles", ["Functional trainer", "D-handles"], [
    "Standing cable chest press",
    "Split-stance cable chest press",
    "Single-arm cable chest press",
    "Alternating cable chest press",
    "Standing cable chest fly",
    "Single-arm cable fly",
    "Low-to-high cable fly",
    "High-to-low cable fly",
    "Cable squeeze press",
  ]);
  add("Back and Lats", "Functional trainer + D-handles", ["Functional trainer", "D-handles"], [
    "Single-arm cable row",
    "Split-stance cable row",
    "Half-kneeling single-arm cable row",
    "Single-arm kneeling lat pulldown",
    "Single-arm straight-arm pulldown",
    "High cable row",
    "Cable pullover with D-handles",
  ]);
  add("Shoulders and Rotator Cuff", "Functional trainer + D-handles", ["Functional trainer", "D-handles"], [
    "Single-arm cable lateral raise",
    "Lean-away cable lateral raise",
    "Cable front raise",
    "Single-arm cable rear-delt fly",
    "Cable Y raise",
    "Cable external rotation",
    "Cable internal rotation",
    "Cable scaption raise",
  ]);
  add("Biceps", "Functional trainer + D-handle", ["Functional trainer", "D-handles"], [
    "Single-arm cable curl",
    "Bayesian cable curl",
    "Single-arm high cable curl",
    "Cross-body cable curl",
  ]);
  add("Triceps", "Functional trainer + D-handle", ["Functional trainer", "D-handles"], [
    "Single-arm cable pushdown",
    "Cross-body cable triceps extension",
    "Single-arm overhead cable triceps extension",
  ]);
  add("Core", "Functional trainer + D-handle", ["Functional trainer", "D-handles"], [
    "Pallof press",
    "Half-kneeling Pallof press",
    "Pallof press isometric hold",
    "Cable wood chop, high to low",
    "Cable lift, low to high",
  ]);

  add("Triceps", "Functional trainer + triceps rope", ["Functional trainer", "Triceps rope"], [
    "Rope triceps pushdown",
    "Rope overhead triceps extension",
    "Single-arm rope pushdown",
    "Rope triceps kickback",
  ]);
  add("Biceps", "Functional trainer + triceps rope", ["Functional trainer", "Triceps rope"], [
    "Rope hammer curl",
    "Rope cable curl",
    "High rope curl",
  ]);
  add("Back and Lats", "Functional trainer + triceps rope", ["Functional trainer", "Triceps rope"], [
    "Rope straight-arm pulldown",
    "Rope high row",
  ]);
  add("Shoulders and Rotator Cuff", "Functional trainer + triceps rope", ["Functional trainer", "Triceps rope"], [
    "Face pull",
    "Face pull with external rotation",
    "Rope cable upright row",
  ]);
  add("Core", "Functional trainer + triceps rope", ["Functional trainer", "Triceps rope"], [
    "Kneeling cable crunch",
    "Standing rope cable crunch",
  ]);
  add("Glutes and Hips", "Functional trainer + triceps rope", ["Functional trainer", "Triceps rope"], [
    "Cable pull-through",
  ]);

  add("Glutes and Hips", "Functional trainer + ankle strap", ["Functional trainer", "Ankle straps"], [
    "Cable glute kickback",
    "Cable hip abduction",
    "Cable hip adduction",
    "Cable standing hip flexion",
    "Cable donkey kick",
    "Cable fire hydrant",
    "Cable diagonal hip extension",
  ]);
  add("Hamstrings", "Functional trainer + ankle strap", ["Functional trainer", "Ankle straps"], [
    "Standing cable leg curl",
    "Lying cable leg curl",
    "Kneeling cable leg curl",
  ]);
  add("Quadriceps", "Functional trainer + ankle strap", ["Functional trainer", "Ankle straps"], [
    "Standing cable leg extension",
    "Seated cable leg extension",
  ]);
  add("Core", "Functional trainer + ankle strap", ["Functional trainer", "Ankle straps"], [
    "Cable resisted knee drive",
    "Cable mountain climber",
  ]);

  add("Chest", "Resistance bands", ["Resistance bands"], [
    "Resistance-band chest press",
    "Resistance-band chest fly",
    "Resistance-band incline press",
    "Resistance-band resisted push-up",
  ]);
  add("Back and Lats", "Resistance bands", ["Resistance bands"], [
    "Resistance-band seated row",
    "Resistance-band bent-over row",
    "Resistance-band lat pulldown",
    "Resistance-band straight-arm pulldown",
    "Resistance-band pull-apart",
  ]);
  add("Shoulders and Rotator Cuff", "Resistance bands", ["Resistance bands"], [
    "Resistance-band face pull",
    "Resistance-band external rotation",
    "Resistance-band internal rotation",
    "Resistance-band lateral raise",
    "Resistance-band front raise",
    "Resistance-band reverse fly",
    "Resistance-band shoulder press",
    "Resistance-band wall slide",
  ]);
  add("Biceps", "Resistance bands", ["Resistance bands"], [
    "Resistance-band biceps curl",
    "Resistance-band hammer curl",
    "Resistance-band reverse curl",
  ]);
  add("Triceps", "Resistance bands", ["Resistance bands"], [
    "Resistance-band triceps pushdown",
    "Resistance-band overhead triceps extension",
    "Resistance-band triceps kickback",
  ]);
  add("Quadriceps", "Resistance bands", ["Resistance bands"], [
    "Resistance-band squat",
    "Resistance-band split squat",
    "Resistance-band reverse lunge",
    "Resistance-band leg extension",
  ]);
  add("Hamstrings", "Resistance bands", ["Resistance bands"], [
    "Resistance-band Romanian deadlift",
    "Resistance-band good morning",
    "Resistance-band leg curl",
  ]);
  add("Glutes and Hips", "Resistance bands", ["Resistance bands"], [
    "Resistance-band glute bridge",
    "Resistance-band hip thrust",
    "Mini-band lateral walk",
    "Mini-band monster walk",
    "Mini-band clamshell",
    "Resistance-band glute kickback",
    "Resistance-band hip abduction",
    "Resistance-band hip adduction",
  ]);
  add("Core", "Resistance bands", ["Resistance bands"], [
    "Resistance-band Pallof press",
    "Resistance-band Pallof hold",
    "Resistance-band anti-rotation step-out",
    "Resistance-band wood chop",
    "Resistance-band dead-bug pulldown",
  ]);

  add("Quadriceps", "Kettlebell", ["Kettlebell"], [
    "Kettlebell goblet squat",
    "Kettlebell front-rack squat",
    "Double-kettlebell front squat",
    "Kettlebell reverse lunge",
    "Kettlebell forward lunge",
    "Kettlebell lateral lunge",
    "Kettlebell step-up",
  ]);
  add("Hamstrings", "Kettlebell", ["Kettlebell"], [
    "Kettlebell Romanian deadlift",
    "Single-leg kettlebell Romanian deadlift",
    "Kettlebell stiff-leg deadlift",
  ], { backCaution: true });
  add("Glutes and Hips", "Kettlebell", ["Kettlebell"], [
    "Kettlebell sumo deadlift",
    "Kettlebell swing",
    "Kettlebell dead-stop swing",
    "Kettlebell glute bridge",
    "Kettlebell hip thrust",
  ]);
  add("Chest", "Kettlebell + bench", ["Kettlebell", "Bench"], [
    "Kettlebell floor press",
    "Single-arm kettlebell floor press",
    "Kettlebell bench press",
    "Alternating kettlebell bench press",
  ]);
  add("Back and Lats", "Kettlebell", ["Kettlebell"], [
    "Single-arm kettlebell row",
    "Kettlebell gorilla row",
    "Kettlebell renegade row",
    "Kettlebell high pull",
  ]);
  add("Shoulders and Rotator Cuff", "Kettlebell + bench", ["Kettlebell", "Bench"], [
    "Seated single-arm kettlebell press",
    "Seated kettlebell bottom-up press",
    "Kettlebell halo",
  ]);
  add("Full Body and Golf Support", "Kettlebell", ["Kettlebell"], [
    "Kettlebell clean",
    "Single-arm kettlebell clean",
    "Kettlebell clean to squat",
    "Kettlebell figure eight",
    "Kettlebell around-the-world pass",
    { name: "Kettlebell Turkish get-up", totalBodyActivator: false, catalogExpansion: false },
    "Kettlebell suitcase carry",
    "Kettlebell farmer carry",
    "Kettlebell front-rack carry",
    "Kettlebell suitcase march",
  ]);
  add("Core", "Kettlebell", ["Kettlebell"], [
    "Kettlebell plank pull-through",
    "Kettlebell Russian twist",
    "Kettlebell dead bug hold",
  ]);
  add("Biceps", "Kettlebell", ["Kettlebell"], [
    "Kettlebell biceps curl",
    "Kettlebell hammer curl",
  ]);
  add("Triceps", "Kettlebell + bench", ["Kettlebell", "Bench"], [
    "Kettlebell skull crusher",
    "Seated kettlebell overhead triceps extension",
  ]);

  add("Back and Lats", "Back extension machine", ["Back extension machine"], [
    "Back extension machine",
    "Weighted back extension machine",
    "Back extension isometric hold",
  ], { backCaution: true });
  add("Glutes and Hips", "Back extension machine", ["Back extension machine"], [
    "Glute-biased back extension",
    "Rounded-back hip extension",
  ], { backCaution: true });
  add("Core", "Back extension machine", ["Back extension machine"], [
    "Back extension machine side bend",
  ], { backCaution: true });

  add("Back and Lats", "Pull-up bar", ["Pull-up bar", "Body weight"], [
    "Pull-up",
    "Chin-up",
    "Neutral-grip pull-up",
    "Band-assisted pull-up",
    "Eccentric pull-up",
    "Flexed-arm hang",
    "Scapular pull-up",
    "Dead hang",
  ]);
  add("Core", "Pull-up bar", ["Pull-up bar", "Body weight"], [
    "Hanging knee raise",
    "Hanging straight-leg raise",
    "Hanging oblique knee raise",
    "Hanging L-sit hold",
    "Toes-to-bar",
  ]);

  add("Quadriceps", "Body weight + bench", ["Bench", "Body weight"], [
    "Bench step-up",
    "Bench lateral step-up",
    "Bench-supported split squat",
    "Single-leg bench squat",
  ]);
  add("Glutes and Hips", "Body weight + bench", ["Bench", "Body weight"], [
    "Bench hip thrust",
    "Feet-elevated glute bridge",
    "Bench reverse hyperextension",
  ]);
  add("Core", "Body weight + bench", ["Bench", "Body weight"], [
    "Bench Copenhagen plank",
    "Bench-supported mountain climber",
  ]);

  window.EQUIPMENT_EXERCISE_SOURCE = records;
})();
