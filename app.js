(function () {
  "use strict";

  const APP_VERSION = 18;
  const STORAGE_KEY = "basement45-state-v2";
  const ACTIVATOR_LABEL = "Total Body activator";
  const DEFAULT_WORKOUT_DURATION_MS = 45 * 60 * 1000;
  const MIN_WORKOUT_DURATION_MS = 15 * 60 * 1000;
  const MAX_WORKOUT_DURATION_MS = 120 * 60 * 1000;
  const TIMER_ADJUSTMENT_MS = 5 * 60 * 1000;

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

  const WORKOUT_TARGETS = [
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
  const WORKOUT_TARGET_BY_ID = new Map(
    WORKOUT_TARGETS.map((target) => [target.id, target]),
  );
  const BODY_PART_OPTIONS = [
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
    "Core",
    "Full body",
  ];
  const TARGET_BODY_PARTS = {
    legs: ["Quadriceps", "Hamstrings", "Glutes", "Hips", "Calves"],
    shoulders_rotator: ["Shoulders", "Rotator cuff"],
    push: ["Chest", "Shoulders", "Triceps"],
    pull: ["Back", "Lats", "Biceps", "Forearms", "Grip", "Traps"],
    total_body: [...BODY_PART_OPTIONS],
    total_body_no_equipment: [...BODY_PART_OPTIONS],
    custom: [...BODY_PART_OPTIONS],
  };
  const TRAINING_DESIGNATIONS = [
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

  function normalizedDesignationKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  const TRAINING_DESIGNATION_BY_KEY = new Map(
    TRAINING_DESIGNATIONS.flatMap((designation) =>
      [designation.id, designation.label, ...(designation.aliases || [])].map(
        (key) => [normalizedDesignationKey(key), designation],
      ),
    ),
  );
  const SPLIT_PRESETS = [
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
  const DEFAULT_WARMUP_EXERCISES = [
    { id: "stretch", label: "Stretch" },
    { id: "pushups", label: "20 push-ups" },
    { id: "pullups", label: "5 pull-ups" },
  ];
  const DEFAULT_COOLDOWN_EXERCISES = [{ id: "core", label: "5 core" }];

  function createDefaultWarmupExercises() {
    return DEFAULT_WARMUP_EXERCISES.map((exercise) => ({ ...exercise }));
  }

  function createDefaultCooldownExercises() {
    return DEFAULT_COOLDOWN_EXERCISES.map((exercise) => ({ ...exercise }));
  }

  function normalizeRoutineExercises(values, defaults, prefix, noun) {
    const source = Array.isArray(values) ? values : defaults;
    const seen = new Set();
    return source.slice(0, 24).map((exercise, index) => {
      const requestedId = String(exercise?.id || `${prefix}-${index + 1}`);
      let id = requestedId;
      let suffix = 2;
      while (seen.has(id)) {
        id = `${requestedId}-${suffix}`;
        suffix += 1;
      }
      seen.add(id);
      return {
        id,
        label:
          String(exercise?.label || "")
            .trim()
            .slice(0, 100) || `${noun} ${index + 1}`,
      };
    });
  }

  function normalizeWarmupExercises(values) {
    return normalizeRoutineExercises(
      values,
      createDefaultWarmupExercises(),
      "warmup",
      "Warm-up exercise",
    );
  }

  function isCoreCooldownLabel(value) {
    const label = String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    return label === "core complete" || label === "5 core";
  }

  function normalizeCooldownExercises(values) {
    const normalized = normalizeRoutineExercises(
      values,
      createDefaultCooldownExercises(),
      "cooldown",
      "Cool-down exercise",
    );
    const firstCoreIndex = normalized.findIndex((exercise) =>
      isCoreCooldownLabel(exercise.label),
    );
    if (firstCoreIndex < 0) return normalized;
    const canonicalCore =
      normalized.find(
        (exercise) =>
          exercise.id === "core" && isCoreCooldownLabel(exercise.label),
      ) || normalized[firstCoreIndex];
    return normalized.flatMap((exercise, index) => {
      if (index === firstCoreIndex)
        return [{ ...canonicalCore, label: "5 core" }];
      return isCoreCooldownLabel(exercise.label) ? [] : [exercise];
    });
  }

  function warmupChecklist(warmups, current = {}) {
    return Object.fromEntries(
      warmups.map((exercise) => [exercise.id, Boolean(current?.[exercise.id])]),
    );
  }

  function emptyWarmupChecklist() {
    return warmupChecklist(
      state?.warmupExercises || createDefaultWarmupExercises(),
    );
  }

  function emptyCooldownChecklist() {
    return warmupChecklist(
      state?.cooldownExercises || createDefaultCooldownExercises(),
    );
  }

  function normalizeWorkoutTarget(value, fallback = "total_body") {
    const normalized = String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const aliases = {
      legs: ["legs"],
      shoulders_rotator: [
        "shoulder rotator cuff",
        "shoulders rotator cuff",
        "shoulder and rotator cuff",
        "shoulders and rotator cuff",
      ],
      push: ["push"],
      pull: ["pull"],
      total_body: [
        "total body",
        "optional workout",
        "optional recovery",
        "full body",
      ],
      total_body_no_equipment: [
        "total body no equipment",
        "full body no equipment",
        "total body bodyweight",
        "bodyweight total body",
      ],
      custom: ["custom"],
    };
    if (WORKOUT_TARGET_BY_ID.has(String(value))) return String(value);
    return (
      Object.entries(aliases).find(([, names]) =>
        names.includes(normalized),
      )?.[0] || fallback
    );
  }

  function workoutTarget(targetId) {
    return (
      WORKOUT_TARGET_BY_ID.get(normalizeWorkoutTarget(targetId)) ||
      WORKOUT_TARGET_BY_ID.get("total_body")
    );
  }

  function trainingDesignation(value) {
    return (
      TRAINING_DESIGNATION_BY_KEY.get(String(value || "")) ||
      TRAINING_DESIGNATION_BY_KEY.get(normalizedDesignationKey(value)) ||
      null
    );
  }

  function defaultDesignationLabel(targetId) {
    return workoutTarget(normalizeWorkoutTarget(targetId)).label;
  }

  function isRemovedArmsUpperTarget(value) {
    const normalized = String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    return [
      "arms upper",
      "arms and upper",
      "arms upper body",
      "arms and upper body",
      "upper strength practice",
    ].includes(normalized);
  }

  const DAY_CONFIG = [
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

  function createDefaultCycles() {
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

  function isRestCycle(cycle) {
    return cycle?.kind === "rest" || cycle?.rest === true;
  }

  function normalizeCycles(values) {
    const source = Array.isArray(values)
      ? values
          .filter((cycle) => !isRemovedArmsUpperTarget(cycle?.target))
          .slice(0, 16)
      : [];
    const seen = new Set();
    const cycles = source
      .map((cycle, index) => {
        const requestedId = String(cycle?.id || `cycle-${index + 1}`);
        const id = seen.has(requestedId)
          ? `cycle-${index + 1}-${Date.now()}`
          : requestedId;
        seen.add(id);
        if (isRestCycle(cycle)) {
          return {
            id,
            kind: "rest",
            name: String(cycle?.name || "")
              .trim()
              .slice(0, 80),
            target: null,
            bodyParts: [],
            description: String(
              cycle?.description ||
                "A scheduled recovery day that advances the rotation.",
            ).slice(0, 600),
            circuitExerciseCounts: [null, null, null],
            lockedAssignments: [],
          };
        }
        const target = normalizeWorkoutTarget(cycle?.target);
        return {
          id,
          kind: "training",
          name: String(cycle?.name || "")
            .trim()
            .slice(0, 80),
          target,
          designation:
            String(cycle?.designation || defaultDesignationLabel(target))
              .trim()
              .slice(0, 80) || defaultDesignationLabel(target),
          bodyParts: normalizeBodyParts(cycle?.bodyParts),
          description: String(cycle?.description || "").slice(0, 600),
          circuitExerciseCounts: [0, 1, 2].map((circuitIndex) => {
            const value = Number(cycle?.circuitExerciseCounts?.[circuitIndex]);
            return Number.isFinite(value)
              ? Math.max(2, Math.min(4, Math.round(value)))
              : null;
          }),
          lockedAssignments: Array.isArray(cycle?.lockedAssignments)
            ? cycle.lockedAssignments
                .filter(
                  (lock) =>
                    Number.isInteger(Number(lock?.circuitIndex)) &&
                    Number(lock.circuitIndex) >= 0 &&
                    Number(lock.circuitIndex) <= 2 &&
                    /^(first|second|extra-[01]|optionalActivator)$/.test(
                      lock.position,
                    ) &&
                    exerciseById.has(lock.assignment?.exerciseId),
                )
                .map((lock) => ({
                  circuitIndex: Number(lock.circuitIndex),
                  position: lock.position,
                  assignment: {
                    ...lock.assignment,
                    locked: true,
                    cycleLock: true,
                  },
                }))
            : [],
        };
      })
      .filter((cycle) => cycle.id);
    if (!cycles.length) return createDefaultCycles();
    if (!cycles.some((cycle) => !isRestCycle(cycle))) {
      const fallback = createDefaultCycles()[0];
      if (cycles.length < 16) cycles.push(fallback);
      else cycles[cycles.length - 1] = fallback;
    }
    return cycles;
  }

  function builtInCycleDefinitions() {
    return TRAINING_DESIGNATIONS.map((designation) => ({
      id: designation.id,
      name: designation.label,
      target: designation.target,
      bodyParts: [...designation.bodyParts],
      description: `${designation.label} training focused on the selected target muscles.`,
      template: true,
    }));
  }

  function normalizeCustomCycleDefinitions(values) {
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

  function normalizeCustomSplits(values, customCycles = []) {
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
      alwaysLocked: false,
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

  function equipmentFilterKey(value) {
    const normalized = String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if (
      /(^|\s)ft2?(\s|$)/.test(normalized) ||
      normalized.includes("functional trainer") ||
      normalized.includes("cable")
    ) {
      return "functional_trainer";
    }
    const aliases = {
      "adjustable dumbbell": "dumbbells",
      "adjustable dumbbells": "dumbbells",
      dumbbell: "dumbbells",
      dumbbells: "dumbbells",
      band: "resistance_bands",
      bands: "resistance_bands",
      "resistance band": "resistance_bands",
      "resistance bands": "resistance_bands",
      bodyweight: "body_weight",
      "body weight": "body_weight",
      plate: "weight_plates",
      plates: "weight_plates",
      "weight plate": "weight_plates",
      "weight plates": "weight_plates",
      "d handle": "d_handles",
      "d handles": "d_handles",
      "ankle strap": "ankle_straps",
      "ankle straps": "ankle_straps",
      "pull up bar": "pull_up_bar",
      "pull-up bar": "pull_up_bar",
    };
    if (aliases[normalized]) return aliases[normalized];
    return normalized;
  }

  function equipmentOptionLabel(value) {
    const key = equipmentFilterKey(value);
    const labels = {
      functional_trainer: "FT",
      dumbbells: "Dumbbells",
      resistance_bands: "Resistance bands",
      body_weight: "Body weight",
      weight_plates: "Weight plates",
      d_handles: "D-handles",
      ankle_straps: "Ankle straps",
      pull_up_bar: "Pull-up bar",
    };
    return (
      labels[key] ||
      String(value || "")
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  function normalizeEquipmentCatalog(values) {
    const catalog = [];
    const seen = new Set();
    for (const value of Array.isArray(values) ? values : []) {
      const label = equipmentOptionLabel(value).slice(0, 80);
      const key = equipmentFilterKey(label);
      if (!label || !key || seen.has(key)) continue;
      seen.add(key);
      catalog.push(label);
    }
    return catalog.sort((first, second) => first.localeCompare(second));
  }

  function exerciseEquipmentCatalog() {
    return normalizeEquipmentCatalog(
      exercises.flatMap((exercise) => exercise.equipment_varieties),
    );
  }

  function matchesEquipmentSelection(exercise, selectedEquipment) {
    if (selectedEquipment === "all") return true;
    const selectedKey = equipmentFilterKey(selectedEquipment);
    return [
      ...exercise.equipment_varieties,
      ...exercise.equipment,
      exercise.equipment_label,
    ].some((item) => equipmentFilterKey(item) === selectedKey);
  }

  function inferEquipment(equipmentText) {
    const equipment = [];
    const value = equipmentText.toLowerCase();

    if (equipmentFilterKey(equipmentText) === "functional_trainer")
      equipment.push("FT2");
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

  function inferEquipmentVarieties(record) {
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
    add("Physio ball", ["physio ball", "stability ball"]);
    add("Weight plates", ["plate"]);
    add("Body weight", ["body weight", "bodyweight"]);

    if (!varieties.length && record.equipment)
      varieties.push(String(record.equipment).trim());
    return [...new Set(varieties)].sort((first, second) =>
      first.localeCompare(second),
    );
  }

  function inferMovementPattern(record) {
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

  function inferMovementRole(record) {
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

  function inferForceType(record, movementPattern) {
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

  function inferBenchPosition(record) {
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

  function inferPulleyHeight(record) {
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

  function clampRating(value, fallback) {
    const rating = Number(value);
    return Number.isFinite(rating)
      ? Math.max(1, Math.min(5, Math.round(rating)))
      : fallback;
  }

  function inferEffectiveness(record, movementRole) {
    if (record.totalBodyActivator || movementRole === "total_body") return 5;
    if (movementRole === "compound") return 4;
    if (movementRole === "bridge") return 3;
    return 3;
  }

  function normalizeBodyParts(values) {
    const items = Array.isArray(values)
      ? values
      : String(values || "").split(/[\r\n,;]+/);
    const canonical = new Map(
      BODY_PART_OPTIONS.map((part) => [part.toLowerCase(), part]),
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

  function inferBodyParts(record, movementPattern, forceType) {
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
      Core: ["Core"],
      "Full Body and Golf Support": ["Full body", "Core"],
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
      add("Quadriceps", "Glutes", "Hips", "Core");
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
      add("Hamstrings", "Glutes", "Hips", "Core");
    if (movementPattern === "carry") add("Full body", "Core", "Grip", "Traps");
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
      add("Core");
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

  function exerciseEffectivenessScore(exercise) {
    return clampRating(exercise?.effectiveness_score, 3);
  }

  function demoSearchUrl(name) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`;
  }

  function enrichExercise(record) {
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

  const equipmentSource = Array.isArray(window.EQUIPMENT_EXERCISE_SOURCE)
    ? window.EQUIPMENT_EXERCISE_SOURCE
    : [];
  const equipmentSourceById = new Map(
    equipmentSource.map((record) => [slugify(record.name), record]),
  );
  const originalRecords = [...window.EXERCISE_SOURCE, ...CUSTOM_EXERCISES].map(
    (record) => {
      const expansion = equipmentSourceById.get(slugify(record.name));
      if (!expansion) return record;
      return {
        ...record,
        equipmentVarieties: [
          ...inferEquipmentVarieties(record),
          ...inferEquipmentVarieties(expansion),
        ],
      };
    },
  );
  const originalIds = new Set(
    originalRecords.map((record) => slugify(record.name)),
  );
  const expandedRecords = equipmentSource.filter(
    (record) => !originalIds.has(slugify(record.name)),
  );
  const BASE_EXERCISES = [...originalRecords, ...expandedRecords].map(
    enrichExercise,
  );
  let exercises = [...BASE_EXERCISES];
  let exerciseById = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  );
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
    exerciseById = new Map(
      exercises.map((exercise) => [exercise.id, exercise]),
    );
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

  const flexibleExerciseNames = exercises
    .filter((exercise) => !exercise.always_locked)
    .map((exercise) => exercise.name);
  const namesMatching = (predicate) =>
    exercises
      .filter((exercise) => !exercise.always_locked && predicate(exercise))
      .map((exercise) => exercise.name);
  const pushNames = namesMatching((exercise) => exercise.force_type === "push");
  const pullNames = namesMatching((exercise) => exercise.force_type === "pull");
  const squatNames = namesMatching(
    (exercise) => exercise.force_type === "squat",
  );
  const hingeNames = namesMatching(
    (exercise) => exercise.force_type === "hinge",
  );
  const recoveryNames = namesMatching(
    (exercise) =>
      exercise.movement_role === "bridge" ||
      [
        "Core",
        "Calves and Lower Legs",
        "Forearms, Grip and Traps",
        "Shoulders and Rotator Cuff",
      ].includes(exercise.primary_body_part),
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

  const totalBodyRoundNames = namesMatching(
    (exercise) =>
      exercise.total_body_activator ||
      exercise.movement_role === "total_body" ||
      (exercise.movement_role === "compound" &&
        exercise.force_type !== "other"),
  );
  const totalBodyNamePools = Array.from({ length: 6 }, (_, pool) =>
    totalBodyRoundNames.filter((_, index) => index % 6 === pool),
  );
  const totalBodyNoEquipmentNames = totalBodyRoundNames.filter(
    (name) => defaultSetupScore(exerciseById.get(idFor(name))) === 5,
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

  function targetIdForDay(dayId) {
    const dayData = state?.week?.days?.[dayId];
    const cycle = cycleForId(dayData?.cycleId);
    const fallback =
      DAY_CONFIG.find((day) => day.id === dayId)?.defaultTarget || "total_body";
    return normalizeWorkoutTarget(cycle?.target || dayData?.target, fallback);
  }

  function targetBodyPartsForDay(dayId) {
    const cycle = cycleForDay(dayId);
    const selected = normalizeBodyParts(
      cycle?.bodyParts || state?.week?.days?.[dayId]?.bodyParts,
    );
    if (selected.length) return selected;
    return [...(TARGET_BODY_PARTS[targetIdForDay(dayId)] || BODY_PART_OPTIONS)];
  }

  function targetBodyPartsForCycle(cycle) {
    if (isRestCycle(cycle)) return [];
    const selected = normalizeBodyParts(cycle?.bodyParts);
    if (selected.length) return selected;
    const targetId = normalizeWorkoutTarget(cycle?.target);
    return [...(TARGET_BODY_PARTS[targetId] || BODY_PART_OPTIONS)];
  }

  function bodyPartCoverage() {
    return bodyPartOptions().map((bodyPart) => ({
      bodyPart,
      count: state.cycles.filter((cycle) =>
        targetBodyPartsForCycle(cycle).includes(bodyPart),
      ).length,
    }));
  }

  function matchesDayTargetMuscles(exercise, dayId) {
    const targetParts = targetBodyPartsForDay(dayId);
    return exercise.body_parts.some((part) => targetParts.includes(part));
  }

  function circuitDefinitionsForTarget(targetId, used = new Set()) {
    const target = workoutTarget(targetId);
    const definitions = SLOTS[target.templateKey];
    const placeholderId = idFor("Shoulder Exercise Placeholder");
    if (target.id === "shoulders_rotator" && used.has(placeholderId)) {
      return definitions.map((definition, index) =>
        index === 2
          ? {
              ...definition,
              first: {
                label: "Shoulder movement",
                names: namesMatching(
                  (exercise) =>
                    exercise.primary_body_part ===
                      "Shoulders and Rotator Cuff" && !exercise.always_locked,
                ),
              },
            }
          : definition,
      );
    }
    return definitions;
  }

  function withBodyPartFilter(definitions, bodyParts = []) {
    const selected = normalizeBodyParts(bodyParts);
    if (!selected.length) return definitions;
    return definitions.map((definition) => ({
      ...definition,
      first: { ...definition.first, bodyPartFilter: selected },
      second: { ...definition.second, bodyPartFilter: selected },
      extra: { ...definition.extra, bodyPartFilter: selected },
    }));
  }

  function circuitDefinitionsForDay(dayId, used = null) {
    let qualificationUsed = used;
    if (!qualificationUsed) {
      qualificationUsed = new Set();
      const dayData = state?.week?.days?.[dayId];
      if (
        targetIdForDay(dayId) === "shoulders_rotator" &&
        dayData?.circuits?.[2]?.first?.exerciseId !==
          idFor("Shoulder Exercise Placeholder")
      ) {
        qualificationUsed.add(idFor("Shoulder Exercise Placeholder"));
      }
    }
    return withBodyPartFilter(
      circuitDefinitionsForTarget(targetIdForDay(dayId), qualificationUsed),
      cycleForDay(dayId)?.bodyParts,
    );
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
    replaceBodyPart: "all",
    replaceEquipment: "all",
    returnToReplacementAfterExerciseAdd: false,
    editingExerciseId: null,
    favoriteTarget: null,
    expandedActivators: new Set(),
    showBodyPartCoverage: false,
    selectedSplitId: null,
    splitWeekStartDay: "monday",
    editingSplitId: null,
    splitDraft: null,
    showCycleManager: false,
    editingCycleId: null,
    cycleDraft: null,
  };

  let state;
  let toastTimer;
  let fileHandle = null;
  let fileSaveTimer = null;
  let timerInterval = null;

  function allSplitDefinitions() {
    return [
      ...SPLIT_PRESETS.map((split) => ({ ...split, template: true })),
      ...(state?.customSplits || []).map((split) => ({
        ...split,
        template: false,
      })),
    ];
  }

  function splitForId(splitId) {
    return allSplitDefinitions().find((split) => split.id === splitId) || null;
  }

  function allReusableCycles() {
    return [
      ...builtInCycleDefinitions(),
      ...(state?.customCycles || []).map((cycle) => ({
        ...cycle,
        template: false,
      })),
    ];
  }

  function reusableCycleForId(cycleId) {
    return allReusableCycles().find((cycle) => cycle.id === cycleId) || null;
  }

  function cycleForId(cycleId) {
    return state?.cycles?.find((cycle) => cycle.id === cycleId) || null;
  }

  function cyclePosition(cycleId) {
    const index = state?.cycles?.findIndex((cycle) => cycle.id === cycleId);
    return index >= 0 ? index : 0;
  }

  function cycleDisplayName(cycle, index = cyclePosition(cycle?.id)) {
    return (
      String(cycle?.name || "").trim() ||
      (isRestCycle(cycle) ? "Rest day" : `Cycle ${index + 1}`)
    );
  }

  function cycleTargetLabel(cycle) {
    return isRestCycle(cycle)
      ? "Rest day"
      : String(cycle?.designation || "").trim() ||
          defaultDesignationLabel(cycle?.target);
  }

  function cycleForDay(dayId) {
    return cycleForId(state?.week?.days?.[dayId]?.cycleId);
  }

  function normalizedCycleId(cycleId, fallbackIndex = 0) {
    if (cycleForId(cycleId)) return cycleId;
    return state.cycles[Math.max(0, fallbackIndex) % state.cycles.length].id;
  }

  function normalizeCycleOverrides(values, cycles = state?.cycles || []) {
    if (!values || typeof values !== "object") return {};
    const cycleById = new Map(cycles.map((cycle) => [cycle.id, cycle]));
    return Object.fromEntries(
      DAY_CONFIG.map((day) => [day.id, String(values[day.id] || "")]).filter(
        ([, cycleId]) => cycleById.has(cycleId),
      ),
    );
  }

  function scheduleCycles(startCycleId, restDayIds = [], cycleOverrides = {}) {
    const rest = new Set(restDayIds);
    const overrides = normalizeCycleOverrides(cycleOverrides);
    let cursor = cyclePosition(normalizedCycleId(startCycleId));
    const days = {};
    for (const day of DAY_CONFIG) {
      const overrideCycle = cycleForId(overrides[day.id]);
      if (overrideCycle) cursor = cyclePosition(overrideCycle.id);
      const pending = state.cycles[cursor % state.cycles.length];
      if (rest.has(day.id)) {
        days[day.id] = {
          rest: true,
          restSource: "calendar",
          cycle: null,
          pendingCycle: pending,
        };
      } else if (isRestCycle(pending)) {
        days[day.id] = {
          rest: true,
          restSource: "rotation",
          cycle: pending,
          pendingCycle: null,
        };
        cursor = (cursor + 1) % state.cycles.length;
      } else {
        days[day.id] = {
          rest: false,
          restSource: null,
          cycle: pending,
          pendingCycle: null,
        };
        cursor = (cursor + 1) % state.cycles.length;
      }
    }
    return {
      days,
      nextCycleId: state.cycles[cursor % state.cycles.length].id,
    };
  }

  function workoutDayHasProgress(day) {
    if (!day || day.rest) return false;
    return (
      Object.values(day.preChecklist || {}).some(Boolean) ||
      Object.values(day.cooldownChecklist || {}).some(Boolean) ||
      timerElapsed(day) > 0 ||
      (day.circuits || []).some(
        (circuit) =>
          circuit.roundsCompleted?.some(Boolean) ||
          circuit.optionalActivatorCompleted,
      )
    );
  }

  function defaultMeasureType(exercise) {
    return /sec|second/i.test(exercise?.default_reps || "")
      ? "seconds"
      : "reps";
  }

  function cleanRepValue(value) {
    return String(value || "")
      .replace(/\s*(sec|seconds)\s*/gi, "")
      .trim();
  }

  function initialExerciseState() {
    return Object.fromEntries(
      exercises.map((exercise) => [
        exercise.id,
        {
          chosenCount: 0,
          skippedCount: 0,
          preference: 0,
          loadProgressCount: 0,
          reps: cleanRepValue(exercise.default_reps),
          measureType: defaultMeasureType(exercise),
          weight: "",
          loadBasis: "total",
          notes: "",
        },
      ]),
    );
  }

  function createState() {
    const cycles = createDefaultCycles();
    return {
      version: APP_VERSION,
      weekNumber: 1,
      weekStartedAt: new Date().toISOString(),
      exerciseState: initialExerciseState(),
      customExercises: [],
      exerciseEdits: {},
      equipmentCatalog: exerciseEquipmentCatalog(),
      warmupExercises: createDefaultWarmupExercises(),
      cooldownExercises: createDefaultCooldownExercises(),
      cycles,
      customCycles: [],
      customSplits: [],
      activeSplitId: null,
      splitWeekStartDay: "monday",
      weekStartCycleId: cycles[0].id,
      nextCycleId: cycles[0].id,
      favoriteCircuits: [],
      hiddenExerciseIds: [],
      deletedExerciseIds: [],
      history: [],
      week: null,
    };
  }

  function matchesSlot(exercise, slot) {
    if (slot.noEquipmentOnly && defaultSetupScore(exercise) !== 5) return false;
    if (
      slot.bodyPartFilter?.length &&
      !exercise.body_parts.some((part) => slot.bodyPartFilter.includes(part))
    )
      return false;
    if (slot.label === ACTIVATOR_LABEL) {
      return (
        exercise.total_body_activator &&
        slot.names.some((name) => idFor(name) === exercise.id)
      );
    }
    if (slot.names.some((name) => idFor(name) === exercise.id)) return true;
    if (
      (!exercise.custom && !exercise.catalog_expansion) ||
      exercise.always_locked
    )
      return false;

    const references = slot.names
      .map((name) => exerciseById.get(idFor(name)))
      .filter(Boolean);
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
        loadProgressCount: 0,
        reps: cleanRepValue(exercise?.default_reps || "10"),
        measureType: defaultMeasureType(exercise),
        weight: "",
        loadBasis: "total",
        notes: "",
      };
    }
    return state.exerciseState[exerciseId];
  }

  function updateCircuitLoadProgress(circuit, direction) {
    for (const assignment of mainAssignments(circuit)) {
      const stats = stateFor(assignment.exerciseId);
      stats.loadProgressCount = Math.max(
        0,
        Math.min(4, stats.loadProgressCount + direction),
      );
    }
  }

  function increaseExerciseLoad(exerciseId) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise) return;
    const stats = stateFor(exerciseId);
    const currentLoad = String(stats.weight || "").trim();
    const numericLoad = Number(currentLoad);
    const suggestion =
      currentLoad && Number.isFinite(numericLoad)
        ? String(numericLoad + 5)
        : currentLoad;
    const requested = window.prompt(
      `Enter a higher load for ${exercise.name}:`,
      suggestion,
    );
    if (requested === null) return;
    const nextLoad = String(requested).trim().slice(0, 40);
    if (!nextLoad || nextLoad === currentLoad) {
      showToast(
        "Enter a different load to begin a new four-workout progression.",
        "error",
      );
      return;
    }
    stats.weight = nextLoad;
    stats.loadProgressCount = 0;
    persist();
    render();
    showToast(`${exercise.name} load updated. Progress checks reset.`);
  }

  function transitionCost(first, second) {
    if (!first || !second) return 5;

    const firstEquipment = new Set(first.equipment);
    const secondEquipment = new Set(second.equipment);
    const shares = (name) =>
      firstEquipment.has(name) && secondEquipment.has(name);
    const firstBodyweight =
      firstEquipment.has("body weight") ||
      first.equipment[0] === "user-defined";
    const secondBodyweight =
      secondEquipment.has("body weight") ||
      second.equipment[0] === "user-defined";

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
      if (
        first.attachment &&
        second.attachment &&
        first.attachment !== second.attachment
      )
        cost += 1;
      if (
        first.pulley_height !== "variable" &&
        second.pulley_height !== "variable" &&
        first.pulley_height !== second.pulley_height
      ) {
        cost += 1;
      }
    }

    if (shares("dumbbells") && first.bench_position !== second.bench_position)
      cost += 1;
    return Math.min(5, cost);
  }

  function requiresBothSides(exercise) {
    return Boolean(
      exercise?.unilateral ||
      /both sides|per side|\/ side/i.test(
        `${exercise?.name || ""} ${exercise?.default_reps || ""}`,
      ),
    );
  }

  function canCombine(first, second) {
    return !(requiresBothSides(first) && requiresBothSides(second));
  }

  function recentIds() {
    return new Set(
      state.history.slice(-3).flatMap((week) => week.exerciseIds || []),
    );
  }

  function exerciseScore(exercise, slot, recent) {
    const stats = stateFor(exercise.id);
    const listedIndex = slot.names.findIndex(
      (name) => idFor(name) === exercise.id,
    );
    const preferredIndex = listedIndex >= 0 ? listedIndex : slot.names.length;
    let score =
      Math.random() * 16 +
      preferredIndex * 0.8 +
      stats.chosenCount * 0.35 -
      stats.preference * 14;
    if (recent.has(exercise.id)) score += 28;
    if (slot.defaultName && exercise.id === idFor(slot.defaultName))
      score -= 18;
    if (exercise.technical_difficulty === "advanced") score += 8;
    score += (5 - exerciseEffectivenessScore(exercise)) * 4;
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

  function preservedAssignment(
    oldCircuit,
    position,
    slot,
    used,
    previousOverride = null,
  ) {
    const previous =
      previousOverride ||
      (oldCircuit && ["first", "second"].includes(position)
        ? mainAssignments(oldCircuit).find(
            (assignment) => assignment.slotKey === position,
          ) || oldCircuit[position]
        : oldCircuit?.[position]);
    if (
      previous?.locked &&
      !isDeleted(previous.exerciseId) &&
      !isHidden(previous.exerciseId) &&
      exerciseById.has(previous.exerciseId) &&
      matchesSlot(exerciseById.get(previous.exerciseId), slot)
    ) {
      if (!used.has(previous.exerciseId) || previous.cycleLock)
        return { ...previous };
    }

    if (slot.alwaysLocked) {
      const fixedId = idFor(slot.defaultName || slot.names[0]);
      return {
        exerciseId: fixedId,
        slotLabel: slot.label,
        locked: true,
        fixed: true,
        cycleLock: true,
      };
    }

    return null;
  }

  function choosePair(firstSlot, secondSlot, used, oldCircuit) {
    const recent = recentIds();
    const preservedFirst = preservedAssignment(
      oldCircuit,
      "first",
      firstSlot,
      used,
    );
    if (preservedFirst) used.add(preservedFirst.exerciseId);
    const preservedSecond = preservedAssignment(
      oldCircuit,
      "second",
      secondSlot,
      used,
    );
    if (preservedSecond) used.add(preservedSecond.exerciseId);

    let firstCandidates = preservedFirst
      ? [exerciseById.get(preservedFirst.exerciseId)]
      : candidatesFor(firstSlot, used);
    let secondCandidates = preservedSecond
      ? [exerciseById.get(preservedSecond.exerciseId)]
      : candidatesFor(secondSlot, used);

    const firstScores = new Map(
      firstCandidates.map((exercise) => [
        exercise.id,
        exerciseScore(exercise, firstSlot, recent),
      ]),
    );
    const secondScores = new Map(
      secondCandidates.map((exercise) => [
        exercise.id,
        exerciseScore(exercise, secondSlot, recent),
      ]),
    );
    if (!preservedFirst) {
      firstCandidates = firstCandidates
        .sort(
          (first, second) =>
            firstScores.get(first.id) - firstScores.get(second.id),
        )
        .slice(0, 40);
    }
    if (!preservedSecond) {
      secondCandidates = secondCandidates
        .sort(
          (first, second) =>
            secondScores.get(first.id) - secondScores.get(second.id),
        )
        .slice(0, 40);
    }

    if (preservedFirst) used.delete(preservedFirst.exerciseId);
    if (preservedSecond) used.delete(preservedSecond.exerciseId);

    const pairOptions = [];
    for (const first of firstCandidates) {
      if (used.has(first.id)) continue;
      for (const second of secondCandidates) {
        if (
          used.has(second.id) ||
          first.id === second.id ||
          !canCombine(first, second)
        )
          continue;
        const cost = transitionCost(first, second);
        pairOptions.push({
          first,
          second,
          cost,
          score:
            cost * 24 + firstScores.get(first.id) + secondScores.get(second.id),
        });
      }
    }

    const preferredOptions = pairOptions.filter((option) => option.cost <= 2);
    const best = (
      preferredOptions.length ? preferredOptions : pairOptions
    ).sort((a, b) => a.score - b.score)[0];
    if (!best) {
      throw new Error(
        `No valid exercise pair remains for ${firstSlot.label} + ${secondSlot.label}.`,
      );
    }

    const makeAssignment = (exercise, slot, preserved) => ({
      exerciseId: exercise.id,
      slotLabel: slot.label,
      locked: Boolean(preserved?.locked || slot.alwaysLocked),
      fixed: Boolean(slot.alwaysLocked),
      manualOverride: Boolean(preserved?.manualOverride),
      cycleLock: Boolean(preserved?.cycleLock || slot.alwaysLocked),
      slotKey: preserved?.slotKey || null,
      setupScore: defaultSetupScore(exercise),
    });

    return {
      first: makeAssignment(best.first, firstSlot, preservedFirst),
      second: makeAssignment(best.second, secondSlot, preservedSecond),
      transitionCost: best.cost,
    };
  }

  function chooseExtra(
    slot,
    used,
    previousExercise,
    circuitExercises,
    oldAssignment = null,
  ) {
    const recent = recentIds();
    const preserved = preservedAssignment(
      null,
      null,
      slot,
      used,
      oldAssignment,
    );
    const candidates = preserved
      ? [exerciseById.get(preserved.exerciseId)]
      : candidatesFor(slot, used);
    const valid = candidates
      .filter(
        (exercise) =>
          exercise &&
          canCombine(previousExercise, exercise) &&
          !(
            requiresBothSides(exercise) &&
            circuitExercises.some(requiresBothSides)
          ) &&
          (preserved?.manualOverride ||
            transitionCost(previousExercise, exercise) <= 2),
      )
      .sort(
        (first, second) =>
          transitionCost(previousExercise, first) * 24 +
          exerciseScore(first, slot, recent) -
          (transitionCost(previousExercise, second) * 24 +
            exerciseScore(second, slot, recent)),
      );
    const selected = valid[0];
    if (!selected)
      throw new Error(`No compatible exercise remains for ${slot.label}.`);

    return {
      exerciseId: selected.id,
      slotLabel: slot.label,
      locked: Boolean(preserved?.locked),
      fixed: false,
      manualOverride: Boolean(preserved?.manualOverride),
      cycleLock: Boolean(preserved?.cycleLock),
      slotKey: "extra",
      setupScore: defaultSetupScore(selected),
    };
  }

  function isNoEquipmentTarget(targetId) {
    return normalizeWorkoutTarget(targetId) === "total_body_no_equipment";
  }

  function qualifiesAsOptionalActivator(exercise, targetId) {
    return Boolean(
      exercise?.total_body_activator &&
      (!isNoEquipmentTarget(targetId) || defaultSetupScore(exercise) === 5),
    );
  }

  function optionalActivatorSlot(targetId = "total_body") {
    return {
      label: ACTIVATOR_LABEL,
      noEquipmentOnly: isNoEquipmentTarget(targetId),
      names: exercises
        .filter((exercise) => qualifiesAsOptionalActivator(exercise, targetId))
        .map((exercise) => exercise.name),
    };
  }

  function chooseOptionalActivator(
    used,
    oldCircuit,
    targetId = "total_body",
    mainExerciseIds = used,
  ) {
    const slot = optionalActivatorSlot(targetId);
    const previousCircuit = oldCircuit?.optionalActivator
      ? oldCircuit
      : oldCircuit?.bridge
        ? { ...oldCircuit, optionalActivator: oldCircuit.bridge }
        : oldCircuit;
    const preserved = preservedAssignment(
      previousCircuit,
      "optionalActivator",
      slot,
      used,
    );
    if (preserved) return preserved;

    let candidates = candidatesFor(slot, used);
    if (!candidates.length) {
      candidates = exercises.filter(
        (exercise) =>
          qualifiesAsOptionalActivator(exercise, targetId) &&
          !mainExerciseIds.has(exercise.id) &&
          !isHidden(exercise.id) &&
          !isDeleted(exercise.id),
      );
    }
    if (state) {
      const recent = recentIds();
      candidates.sort(
        (a, b) =>
          exerciseScore(a, slot, recent) - exerciseScore(b, slot, recent),
      );
    } else {
      candidates.sort((a, b) => a.name.localeCompare(b.name));
    }
    const selected = candidates[0];
    if (!selected) throw new Error(`No unused total-body activator remains.`);

    return {
      exerciseId: selected.id,
      slotLabel: slot.label,
      locked: Boolean(slot.alwaysLocked),
      fixed: Boolean(slot.alwaysLocked),
      slotKey: "optionalActivator",
    };
  }

  function cycleTemplateDay(cycle) {
    const locks = Array.isArray(cycle?.lockedAssignments)
      ? cycle.lockedAssignments
      : [];
    return {
      circuits: [0, 1, 2].map((circuitIndex) => {
        const inCircuit = locks.filter(
          (lock) => Number(lock.circuitIndex) === circuitIndex,
        );
        const at = (position) => {
          const lock = inCircuit.find((item) => item.position === position);
          return lock
            ? {
                ...JSON.parse(JSON.stringify(lock.assignment)),
                cycleLock: true,
              }
            : null;
        };
        return {
          first: at("first"),
          second: at("second"),
          extras: [at("extra-0"), at("extra-1")],
          optionalActivator: at("optionalActivator"),
          preferredExerciseCount:
            Number(cycle?.circuitExerciseCounts?.[circuitIndex]) || null,
        };
      }),
    };
  }

  function syncCycleTemplateFromDay(dayId) {
    const dayData = state.week?.days?.[dayId];
    const cycle = cycleForId(dayData?.cycleId);
    if (!cycle || dayData.rest) return;
    cycle.circuitExerciseCounts = dayData.circuits.map(
      (circuit) => mainAssignments(circuit).length,
    );
    cycle.lockedAssignments = [];
    dayData.circuits.forEach((circuit, circuitIndex) => {
      const remember = (assignment, position) => {
        if (!assignment?.locked || assignment.fixed) return;
        assignment.cycleLock = true;
        cycle.lockedAssignments.push({
          circuitIndex,
          position,
          assignment: JSON.parse(JSON.stringify(assignment)),
        });
      };
      remember(circuit.first, "first");
      remember(circuit.second, "second");
      circuit.extras.forEach((assignment, extraIndex) =>
        remember(assignment, `extra-${extraIndex}`),
      );
      remember(circuit.optionalActivator, "optionalActivator");
    });
  }

  function refreshFutureCycleOccurrences(sourceDayId) {
    const sourceIndex = DAY_CONFIG.findIndex((day) => day.id === sourceDayId);
    const cycleId = state.week.days[sourceDayId]?.cycleId;
    const forceDayIds = DAY_CONFIG.slice(sourceIndex + 1)
      .filter(
        (day) =>
          state.week.days[day.id]?.cycleId === cycleId &&
          !workoutDayHasProgress(state.week.days[day.id]),
      )
      .map((day) => day.id);
    if (!forceDayIds.length) return;
    generateWeek(state.week, {
      restDayIds: state.week.restDayIds,
      preserveMatching: true,
      forceDayIds,
      trackChanges: true,
    });
  }

  function generateDayCircuits(
    day,
    targetId,
    used,
    oldDay = null,
    bodyParts = [],
  ) {
    return withBodyPartFilter(
      circuitDefinitionsForTarget(targetId, used),
      bodyParts,
    ).map((definition, index) => {
      const oldCircuit = oldDay?.circuits?.[index];
      const pair = choosePair(
        definition.first,
        definition.second,
        used,
        oldCircuit,
      );
      pair.first.slotKey ||= "first";
      pair.second.slotKey ||= "second";
      used.add(pair.first.exerciseId);
      used.add(pair.second.exerciseId);
      const oldExtras = Array.isArray(oldCircuit?.extras)
        ? oldCircuit.extras
        : [];
      const lockedExtraCount = oldExtras.filter(
        (assignment) => assignment?.locked,
      ).length;
      const desiredCount = Math.min(
        4,
        Math.max(
          2,
          Number(oldCircuit?.preferredExerciseCount) || definition.defaultCount,
          2 + lockedExtraCount,
        ),
      );
      const extras = [];
      let previousExercise = exerciseById.get(pair.second.exerciseId);
      const circuitExercises = [
        exerciseById.get(pair.first.exerciseId),
        previousExercise,
      ];
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
      return {
        number: index + 1,
        category: definition.category,
        first: pair.first,
        second: pair.second,
        extras,
        rounds: 3,
        preferredExerciseCount: desiredCount,
        roundsCompleted: [false, false, false],
        optionalActivatorCompleted: false,
        completionCredited: false,
      };
    });
  }

  function restWorkoutDay(day, pendingCycle) {
    return {
      day: day.name,
      rest: true,
      restSource: "calendar",
      cycleId: null,
      pendingCycleId: pendingCycle.id,
      target: null,
      focus: "Rest day",
      bodyParts: [],
      description: `${cycleDisplayName(pendingCycle)} waits until the next training day.`,
      circuits: [],
      preChecklist: emptyWarmupChecklist(),
      cooldownChecklist: emptyCooldownChecklist(),
      timer: {
        durationMs: DEFAULT_WORKOUT_DURATION_MS,
        elapsedMs: 0,
        startedAt: null,
      },
    };
  }

  function rotationRestWorkoutDay(day, cycle) {
    return {
      day: day.name,
      rest: true,
      restSource: "rotation",
      cycleId: cycle.id,
      pendingCycleId: null,
      target: null,
      focus: "Scheduled rest",
      bodyParts: [],
      description:
        cycle.description ||
        "A scheduled recovery day that advances the rotation.",
      circuits: [],
      preChecklist: emptyWarmupChecklist(),
      cooldownChecklist: emptyCooldownChecklist(),
      timer: {
        durationMs: DEFAULT_WORKOUT_DURATION_MS,
        elapsedMs: 0,
        startedAt: null,
      },
    };
  }

  function generatedWorkoutDay(day, cycle, used, usedForCycle = new Set()) {
    const targetId = normalizeWorkoutTarget(cycle.target);
    const template = cycleTemplateDay(cycle);
    const usedSnapshot = new Set(used);
    const restoreGlobalUsed = () => {
      used.clear();
      for (const exerciseId of usedSnapshot) used.add(exerciseId);
    };
    const generateWith = (selectionUsed) =>
      generateDayCircuits(
        day,
        targetId,
        selectionUsed,
        template,
        cycle.bodyParts,
      );
    let circuits;
    try {
      circuits = generateWith(
        isNoEquipmentTarget(targetId) ? new Set(usedForCycle) : used,
      );
    } catch (firstError) {
      restoreGlobalUsed();
      try {
        circuits = generateWith(new Set(usedForCycle));
      } catch (secondError) {
        restoreGlobalUsed();
        circuits = generateWith(new Set());
      }
    }
    circuits.forEach((circuit) =>
      mainAssignments(circuit).forEach((assignment) => {
        if (
          !assignment.cycleLock &&
          (usedSnapshot.has(assignment.exerciseId) ||
            usedForCycle.has(assignment.exerciseId))
        ) {
          assignment.rotationRepeat = true;
        }
        [used, usedForCycle].forEach((collection) =>
          collection.add(assignment.exerciseId),
        );
      }),
    );
    const mainExerciseIds = new Set(
      circuits.flatMap((circuit) =>
        mainAssignments(circuit).map((assignment) => assignment.exerciseId),
      ),
    );
    circuits.forEach((circuit, index) => {
      const optionalActivator = chooseOptionalActivator(
        used,
        template.circuits[index],
        targetId,
        mainExerciseIds,
      );
      circuit.optionalActivator = optionalActivator;
      used.add(optionalActivator.exerciseId);
      usedForCycle.add(optionalActivator.exerciseId);
    });
    return {
      day: day.name,
      rest: false,
      restSource: null,
      cycleId: cycle.id,
      pendingCycleId: null,
      target: targetId,
      focus: cycleTargetLabel(cycle),
      bodyParts: [...cycle.bodyParts],
      description: cycle.description,
      circuits,
      preChecklist: emptyWarmupChecklist(),
      cooldownChecklist: emptyCooldownChecklist(),
      timer: {
        durationMs: DEFAULT_WORKOUT_DURATION_MS,
        elapsedMs: 0,
        startedAt: null,
      },
    };
  }

  function mainExerciseIdSet(week) {
    return new Set(
      DAY_CONFIG.flatMap((day) =>
        (week?.days?.[day.id]?.circuits || []).flatMap((circuit) =>
          mainAssignments(circuit).map((assignment) => assignment.exerciseId),
        ),
      ),
    );
  }

  function generateWeek(previousWeek = null, options = {}) {
    const restDayIds = Array.isArray(options.restDayIds)
      ? options.restDayIds
      : Array.isArray(previousWeek?.restDayIds)
        ? previousWeek.restDayIds
        : [];
    const cycleOverrides = normalizeCycleOverrides(
      options.cycleOverrides || previousWeek?.cycleOverrides,
    );
    const schedule = scheduleCycles(
      state.weekStartCycleId,
      restDayIds,
      cycleOverrides,
    );
    const preserveMatching = Boolean(options.preserveMatching);
    const forceCycleIds = new Set(options.forceCycleIds || []);
    const forceDayIds = new Set(options.forceDayIds || []);
    const days = {};
    const preservedDays = {};
    const used = new Set();
    const usedByCycle = new Map(
      state.cycles.map((cycle) => [cycle.id, new Set()]),
    );

    for (const day of DAY_CONFIG) {
      const scheduled = schedule.days[day.id];
      const previousDay = previousWeek?.days?.[day.id];
      const canPreserve =
        preserveMatching &&
        previousDay &&
        Boolean(previousDay.rest) === scheduled.rest &&
        (scheduled.rest
          ? scheduled.restSource === "rotation"
            ? previousDay.restSource === "rotation" &&
              previousDay.cycleId === scheduled.cycle.id
            : previousDay.restSource !== "rotation" &&
              previousDay.pendingCycleId === scheduled.pendingCycle.id
          : previousDay.cycleId === scheduled.cycle.id) &&
        !forceCycleIds.has(scheduled.cycle?.id || scheduled.pendingCycle?.id) &&
        !forceDayIds.has(day.id);
      if (!canPreserve) continue;
      preservedDays[day.id] = JSON.parse(JSON.stringify(previousDay));
      for (const circuit of preservedDays[day.id].circuits || []) {
        for (const assignment of [
          ...mainAssignments(circuit),
          circuit.optionalActivator,
        ].filter(Boolean)) {
          used.add(assignment.exerciseId);
          usedByCycle.get(previousDay.cycleId)?.add(assignment.exerciseId);
        }
      }
    }

    for (const day of DAY_CONFIG) {
      if (preservedDays[day.id]) {
        days[day.id] = preservedDays[day.id];
        continue;
      }
      const scheduled = schedule.days[day.id];
      if (scheduled.restSource === "calendar") {
        days[day.id] = restWorkoutDay(day, scheduled.pendingCycle);
      } else if (scheduled.restSource === "rotation") {
        days[day.id] = rotationRestWorkoutDay(day, scheduled.cycle);
      } else {
        days[day.id] = generatedWorkoutDay(
          day,
          scheduled.cycle,
          used,
          usedByCycle.get(scheduled.cycle.id),
        );
      }
    }

    const oldIds = mainExerciseIdSet(previousWeek);
    const nextWeek = {
      number: state.weekNumber,
      startedAt: state.weekStartedAt,
      startCycleId: state.weekStartCycleId,
      nextCycleId: schedule.nextCycleId,
      restDayIds: [
        ...new Set(
          restDayIds.filter((dayId) =>
            DAY_CONFIG.some((day) => day.id === dayId),
          ),
        ),
      ],
      cycleOverrides,
      days,
    };
    const nextIds = mainExerciseIdSet(nextWeek);
    if (options.trackChanges) {
      for (const id of oldIds) {
        if (!nextIds.has(id)) stateFor(id).skippedCount += 1;
      }
      for (const id of nextIds) {
        if (!oldIds.has(id)) stateFor(id).chosenCount += 1;
      }
    } else {
      for (const id of nextIds) stateFor(id).chosenCount += 1;
    }
    state.week = nextWeek;
    state.nextCycleId = schedule.nextCycleId;
    ui.expandedActivators.clear();
  }

  function createMissingWorkoutDay(
    day,
    week,
    excludedIds = new Set(),
    targetId = day.defaultTarget,
    bodyParts = [],
  ) {
    const used = new Set();
    for (const dayData of Object.values(week.days || {})) {
      for (const circuit of dayData?.circuits || []) {
        for (const assignment of [
          circuit.first,
          circuit.second,
          ...(circuit.extras || []),
        ]) {
          if (assignment?.exerciseId) used.add(assignment.exerciseId);
        }
      }
    }
    const selectionUsed = isNoEquipmentTarget(targetId) ? new Set() : used;

    const candidatesForMissingSlot = (slot) =>
      exercises
        .filter(
          (exercise) =>
            !selectionUsed.has(exercise.id) &&
            !excludedIds.has(exercise.id) &&
            matchesSlot(exercise, slot),
        )
        .sort((first, second) => {
          const firstIndex = slot.names.findIndex(
            (name) => idFor(name) === first.id,
          );
          const secondIndex = slot.names.findIndex(
            (name) => idFor(name) === second.id,
          );
          return (
            (firstIndex < 0 ? slot.names.length : firstIndex) -
              (secondIndex < 0 ? slot.names.length : secondIndex) ||
            first.name.localeCompare(second.name)
          );
        });

    const circuits = withBodyPartFilter(
      circuitDefinitionsForTarget(targetId, used),
      bodyParts,
    ).map((definition, index) => {
      const pairs = [];
      for (const first of candidatesForMissingSlot(definition.first)) {
        for (const second of candidatesForMissingSlot(definition.second)) {
          if (first.id === second.id || !canCombine(first, second)) continue;
          pairs.push({ first, second, cost: transitionCost(first, second) });
        }
      }
      pairs.sort(
        (first, second) =>
          first.cost - second.cost ||
          first.first.name.localeCompare(second.first.name),
      );
      const pair = pairs[0];
      if (!pair)
        throw new Error(
          `No exercise pair remains while adding ${day.name} circuit ${index + 1}.`,
        );
      selectionUsed.add(pair.first.id);
      selectionUsed.add(pair.second.id);

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
          setupScore: defaultSetupScore(pair.first),
        },
        second: {
          exerciseId: pair.second.id,
          slotLabel: definition.second.label,
          locked: false,
          fixed: false,
          manualOverride,
          slotKey: "second",
          setupScore: defaultSetupScore(pair.second),
        },
        extras: [],
        rounds: 3,
        preferredExerciseCount: 2,
        roundsCompleted: [false, false, false],
        optionalActivatorCompleted: false,
        completionCredited: false,
      };
    });

    if (selectionUsed !== used) {
      circuits.forEach((circuit) => {
        mainAssignments(circuit).forEach((assignment) =>
          used.add(assignment.exerciseId),
        );
      });
    }
    const mainExerciseIds = new Set(used);
    for (const circuit of circuits) {
      const optionalActivator = chooseOptionalActivator(
        used,
        null,
        targetId,
        mainExerciseIds,
      );
      circuit.optionalActivator = optionalActivator;
      used.add(optionalActivator.exerciseId);
    }

    return {
      day: day.name,
      target: normalizeWorkoutTarget(targetId, day.defaultTarget),
      focus: workoutTarget(targetId).label,
      bodyParts: [...normalizeBodyParts(bodyParts)],
      circuits,
      preChecklist: emptyWarmupChecklist(),
      cooldownChecklist: emptyCooldownChecklist(),
      timer: {
        durationMs: DEFAULT_WORKOUT_DURATION_MS,
        elapsedMs: 0,
        startedAt: null,
      },
    };
  }

  function archiveCurrentWeek() {
    if (!state.week) return;
    const exerciseIds = DAY_CONFIG.flatMap((day) =>
      state.week.days[day.id].circuits.flatMap((circuit) => [
        circuit.first.exerciseId,
        circuit.second.exerciseId,
        ...(circuit.extras || []).map((assignment) => assignment.exerciseId),
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

  function fileDisplayPath(fileOrHandle) {
    return String(
      fileOrHandle?.path ||
        fileOrHandle?.webkitRelativePath ||
        fileOrHandle?.name ||
        "basement-45-workouts.json",
    );
  }

  function setFileStatus(message, connected = false) {
    const status = document.getElementById("file-status");
    status.textContent = message;
    status.classList.toggle("connected", connected);
    status.title = connected
      ? `${message}. Changes automatically save to this connected JSON file. Browsers may hide its parent folders.`
      : `${message}. Browser-local autosave is active; browsers may hide a selected file's parent folders.`;
  }

  function openFileHandleDatabase() {
    if (!("indexedDB" in window)) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("basement45-files", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("handles");
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
        const request = database
          .transaction("handles", "readonly")
          .objectStore("handles")
          .get("workout-json");
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      if (
        handle &&
        (await handle.queryPermission({ mode: "readwrite" })) === "granted"
      ) {
        fileHandle = handle;
        setFileStatus(`Autosaving · ${fileDisplayPath(handle)}`, true);
      }
    } catch (error) {
      console.warn("The previous workout file could not be restored.", error);
    }
  }

  async function canWriteToHandle(handle, requestPermission) {
    if (!handle) return false;
    if ((await handle.queryPermission({ mode: "readwrite" })) === "granted")
      return true;
    return (
      requestPermission &&
      (await handle.requestPermission({ mode: "readwrite" })) === "granted"
    );
  }

  async function writeStateToFile(
    handle,
    announce = false,
    requestPermission = false,
  ) {
    if (!(await canWriteToHandle(handle, requestPermission))) return false;
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(exportPayload(), null, 2));
    await writable.close();
    setFileStatus(`Saved · ${fileDisplayPath(handle)}`, true);
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
        setFileStatus(
          `Autosave paused · ${fileDisplayPath(fileHandle)}`,
          false,
        );
        console.warn("File autosave failed.", error);
      }
    }, 700);
  }

  function loadLocalState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed.version !== APP_VERSION || !parsed.week?.days) return null;
      rebuildExerciseCatalog(
        parsed.customExercises || [],
        parsed.exerciseEdits || {},
      );
      return normalizeState(parsed);
    } catch (error) {
      console.warn("The saved browser state could not be read.", error);
      return null;
    }
  }

  function applyPendingStateMigrations() {
    let changed = false;
    if (state?.needsCycleRegeneration) {
      delete state.needsCycleRegeneration;
      generateWeek(null, {
        restDayIds: Array.isArray(state.week?.restDayIds)
          ? state.week.restDayIds
          : [],
      });
      changed = true;
    }
    if (state?.needsCooldownNormalization) {
      delete state.needsCooldownNormalization;
      changed = true;
    }
    return changed;
  }

  function normalizeState(candidate) {
    rebuildExerciseCatalog(
      candidate.customExercises || [],
      candidate.exerciseEdits || {},
    );
    const normalized = createState();
    normalized.weekNumber =
      Number(candidate.weekNumber) || Number(candidate.week?.number) || 1;
    normalized.weekStartedAt =
      candidate.weekStartedAt ||
      candidate.week?.startedAt ||
      new Date().toISOString();
    normalized.customExercises = Array.isArray(candidate.customExercises)
      ? candidate.customExercises
      : [];
    normalized.exerciseEdits =
      candidate.exerciseEdits && typeof candidate.exerciseEdits === "object"
        ? candidate.exerciseEdits
        : {};
    normalized.warmupExercises = normalizeWarmupExercises(
      candidate.warmupExercises,
    );
    const hasLegacyCoreCompletion = DAY_CONFIG.some((day) =>
      Object.hasOwn(candidate.week?.days?.[day.id] || {}, "coreCompleted"),
    );
    const cooldownSource = Array.isArray(candidate.cooldownExercises)
      ? [...candidate.cooldownExercises]
      : null;
    if (
      hasLegacyCoreCompletion &&
      cooldownSource &&
      !cooldownSource.some((exercise) => exercise?.id === "core")
    ) {
      cooldownSource.unshift({ id: "core", label: "5 core" });
    }
    const sourceCoreCooldownIds = (cooldownSource || [])
      .map((exercise, index) => ({
        id: String(exercise?.id || `cooldown-${index + 1}`),
        label: exercise?.label,
      }))
      .filter((exercise) => isCoreCooldownLabel(exercise.label))
      .map((exercise) => exercise.id);
    normalized.cooldownExercises = normalizeCooldownExercises(cooldownSource);
    const candidateCooldownSignature = Array.isArray(
      candidate.cooldownExercises,
    )
      ? candidate.cooldownExercises.map((exercise) => ({
          id: String(exercise?.id || ""),
          label: String(exercise?.label || "").trim(),
        }))
      : null;
    const normalizedCooldownSignature = normalized.cooldownExercises.map(
      (exercise) => ({ id: exercise.id, label: exercise.label }),
    );
    normalized.needsCooldownNormalization =
      hasLegacyCoreCompletion ||
      JSON.stringify(candidateCooldownSignature) !==
        JSON.stringify(normalizedCooldownSignature);
    const normalizedCoreCooldown = normalized.cooldownExercises.find(
      (exercise) => isCoreCooldownLabel(exercise.label),
    );
    normalized.cycles = normalizeCycles(candidate.cycles);
    normalized.customCycles = normalizeCustomCycleDefinitions(
      candidate.customCycles,
    );
    normalized.customSplits = normalizeCustomSplits(
      candidate.customSplits,
      normalized.customCycles,
    );
    normalized.activeSplitId = [
      ...SPLIT_PRESETS,
      ...normalized.customSplits,
    ].some((preset) => preset.id === candidate.activeSplitId)
      ? candidate.activeSplitId
      : null;
    normalized.splitWeekStartDay = DAY_CONFIG.some(
      (day) => day.id === candidate.splitWeekStartDay,
    )
      ? candidate.splitWeekStartDay
      : "monday";
    normalized.needsCycleRegeneration =
      Array.isArray(candidate.cycles) &&
      candidate.cycles.some((cycle) => isRemovedArmsUpperTarget(cycle?.target));
    const cycleIds = new Set(normalized.cycles.map((cycle) => cycle.id));
    const loadedWeekStartCycleId =
      candidate.weekStartCycleId || candidate.week?.startCycleId;
    normalized.weekStartCycleId = cycleIds.has(loadedWeekStartCycleId)
      ? loadedWeekStartCycleId
      : normalized.cycles[0].id;
    const loadedNextCycleId =
      candidate.nextCycleId || candidate.week?.nextCycleId;
    normalized.nextCycleId = cycleIds.has(loadedNextCycleId)
      ? loadedNextCycleId
      : normalized.weekStartCycleId;
    normalized.equipmentCatalog = normalizeEquipmentCatalog([
      ...(Array.isArray(candidate.equipmentCatalog)
        ? candidate.equipmentCatalog
        : []),
      ...exerciseEquipmentCatalog(),
    ]);
    normalized.favoriteCircuits = Array.isArray(candidate.favoriteCircuits)
      ? candidate.favoriteCircuits
          .filter(
            (favorite) =>
              favorite &&
              typeof favorite.id === "string" &&
              cycleIds.has(favorite.cycleId) &&
              Number.isInteger(Number(favorite.circuitIndex)) &&
              Array.isArray(favorite.assignments) &&
              favorite.assignments.length >= 2 &&
              favorite.assignments.length <= 4,
          )
          .map((favorite) => {
            const assignments = favorite.assignments
              .slice(0, 4)
              .map((assignment) => ({
                ...assignment,
                setupScore:
                  normalizeSetupScore(assignment.setupScore) ??
                  defaultSetupScore(exerciseById.get(assignment.exerciseId)),
              }));
            const exerciseNames = assignments
              .map(
                (assignment) => exerciseById.get(assignment.exerciseId)?.name,
              )
              .filter(Boolean);
            const migrated = {
              ...favorite,
              assignments,
              exerciseNames,
              totalScore: assignments.reduce(
                (total, assignment) =>
                  total + assignmentExerciseScore(assignment),
                0,
              ),
              signature: assignments
                .map(
                  (assignment) =>
                    `${assignment.exerciseId}:${normalizeSetupScore(assignment.setupScore) ?? ""}`,
                )
                .join("|"),
            };
            delete migrated.bridge;
            return migrated;
          })
          .slice(-30)
      : [];
    normalized.hiddenExerciseIds = Array.isArray(candidate.hiddenExerciseIds)
      ? candidate.hiddenExerciseIds.filter(
          (id) => exerciseById.has(id) && !exerciseById.get(id).always_locked,
        )
      : [];
    normalized.deletedExerciseIds = Array.isArray(candidate.deletedExerciseIds)
      ? candidate.deletedExerciseIds.filter(
          (id) => exerciseById.has(id) && !exerciseById.get(id).always_locked,
        )
      : [];
    normalized.history = Array.isArray(candidate.history)
      ? candidate.history.slice(-12)
      : [];

    if (
      candidate.exerciseState &&
      typeof candidate.exerciseState === "object"
    ) {
      for (const exercise of exercises) {
        const loaded = candidate.exerciseState[exercise.id];
        if (!loaded) continue;
        normalized.exerciseState[exercise.id] = {
          chosenCount: Math.max(0, Number(loaded.chosenCount) || 0),
          skippedCount: Math.max(0, Number(loaded.skippedCount) || 0),
          preference: Math.max(-1, Math.min(1, Number(loaded.preference) || 0)),
          loadProgressCount: Math.max(
            0,
            Math.min(4, Math.floor(Number(loaded.loadProgressCount) || 0)),
          ),
          reps: cleanRepValue(loaded.reps ?? exercise.default_reps).slice(
            0,
            40,
          ),
          measureType: ["reps", "seconds"].includes(loaded.measureType)
            ? loaded.measureType
            : defaultMeasureType(exercise),
          weight: String(loaded.weight ?? "").slice(0, 40),
          loadBasis: ["total", "each"].includes(loaded.loadBasis)
            ? loaded.loadBasis
            : "total",
          notes: String(loaded.notes ?? "").slice(0, 1000),
        };
      }
    }

    normalized.week = JSON.parse(JSON.stringify(candidate.week));
    const excludedIds = new Set([
      ...normalized.hiddenExerciseIds,
      ...normalized.deletedExerciseIds,
    ]);
    if (DAY_CONFIG.some((day) => !normalized.week.days[day.id]))
      throw new Error("The cycle save is missing one or more calendar days.");
    const restDayIds = Array.isArray(normalized.week.restDayIds)
      ? normalized.week.restDayIds.filter((dayId) =>
          DAY_CONFIG.some((day) => day.id === dayId),
        )
      : [];
    normalized.week.restDayIds = restDayIds;
    normalized.week.cycleOverrides = normalizeCycleOverrides(
      normalized.week.cycleOverrides,
      normalized.cycles,
    );
    normalized.week.startCycleId = normalized.weekStartCycleId;
    normalized.week.nextCycleId = normalized.nextCycleId;
    const restDays = new Set(restDayIds);
    let cycleCursor = normalized.cycles.findIndex(
      (cycle) => cycle.id === normalized.weekStartCycleId,
    );
    for (const day of DAY_CONFIG) {
      const dayData = normalized.week.days[day.id];
      const overrideCycleId = normalized.week.cycleOverrides[day.id];
      if (overrideCycleId) {
        cycleCursor = normalized.cycles.findIndex(
          (cycle) => cycle.id === overrideCycleId,
        );
      }
      const pendingCycle = normalized.cycles[cycleCursor];
      if (restDays.has(day.id)) {
        dayData.rest = true;
        dayData.restSource = "calendar";
        dayData.cycleId = null;
        dayData.pendingCycleId = pendingCycle.id;
        dayData.target = null;
        dayData.focus = "Rest day";
        dayData.bodyParts = [];
        dayData.circuits = [];
        dayData.preChecklist = warmupChecklist(normalized.warmupExercises);
        dayData.cooldownChecklist = warmupChecklist(
          normalized.cooldownExercises,
        );
        delete dayData.coreCompleted;
        dayData.timer = {
          durationMs: DEFAULT_WORKOUT_DURATION_MS,
          elapsedMs: 0,
          startedAt: null,
        };
        continue;
      }
      if (isRestCycle(pendingCycle)) {
        cycleCursor = (cycleCursor + 1) % normalized.cycles.length;
        dayData.rest = true;
        dayData.restSource = "rotation";
        dayData.cycleId = pendingCycle.id;
        dayData.pendingCycleId = null;
        dayData.target = null;
        dayData.focus = "Scheduled rest";
        dayData.bodyParts = [];
        dayData.description =
          pendingCycle.description ||
          "A scheduled recovery day that advances the rotation.";
        dayData.circuits = [];
        dayData.preChecklist = warmupChecklist(normalized.warmupExercises);
        dayData.cooldownChecklist = warmupChecklist(
          normalized.cooldownExercises,
        );
        delete dayData.coreCompleted;
        delete dayData.cardioCompleted;
        dayData.timer = {
          durationMs: DEFAULT_WORKOUT_DURATION_MS,
          elapsedMs: 0,
          startedAt: null,
        };
        continue;
      }
      const cycle = pendingCycle;
      cycleCursor = (cycleCursor + 1) % normalized.cycles.length;
      dayData.rest = false;
      dayData.restSource = null;
      dayData.cycleId = cycle.id;
      dayData.pendingCycleId = null;
      dayData.target = cycle.target;
      dayData.focus = cycleTargetLabel(cycle);
      dayData.bodyParts = [...cycle.bodyParts];
      dayData.description = cycle.description;
      dayData.preChecklist = warmupChecklist(
        normalized.warmupExercises,
        dayData.preChecklist,
      );
      const loadedCooldownChecklist = {
        ...(dayData.cooldownChecklist || {}),
      };
      const coreWasCompleted =
        Boolean(dayData.coreCompleted) ||
        sourceCoreCooldownIds.some((id) =>
          Boolean(loadedCooldownChecklist[id]),
        );
      if (normalizedCoreCooldown && coreWasCompleted) {
        loadedCooldownChecklist[normalizedCoreCooldown.id] = true;
      }
      dayData.cooldownChecklist = warmupChecklist(
        normalized.cooldownExercises,
        loadedCooldownChecklist,
      );
      delete dayData.coreCompleted;
      delete dayData.cardioCompleted;
      const durationMs = normalizeTimerDuration(dayData.timer?.durationMs);
      dayData.timer = {
        durationMs,
        elapsedMs: Math.max(
          0,
          Math.min(durationMs, Number(dayData.timer?.elapsedMs) || 0),
        ),
        startedAt:
          dayData.timer?.startedAt &&
          Number.isFinite(new Date(dayData.timer.startedAt).getTime())
            ? dayData.timer.startedAt
            : null,
      };
      for (const circuit of dayData.circuits) {
        const loadedOptionalActivator =
          circuit.optionalActivator || circuit.bridge || null;
        circuit.extras = Array.isArray(circuit.extras)
          ? circuit.extras.slice(0, 2)
          : [];
        circuit.first.slotKey ||= "first";
        circuit.second.slotKey ||= "second";
        circuit.extras.forEach((assignment) => {
          assignment.slotKey ||= "extra";
        });
        mainAssignments(circuit).forEach((assignment) => {
          assignment.setupScore =
            normalizeSetupScore(assignment.setupScore) ??
            defaultSetupScore(exerciseById.get(assignment.exerciseId));
        });
        circuit.preferredExerciseCount = Math.min(
          4,
          Math.max(
            2,
            Number(circuit.preferredExerciseCount) || 2 + circuit.extras.length,
          ),
        );
        const wasComplete = Boolean(circuit.completed);
        circuit.roundsCompleted = Array.isArray(circuit.roundsCompleted)
          ? [0, 1, 2].map((index) => Boolean(circuit.roundsCompleted[index]))
          : [wasComplete, wasComplete, wasComplete];
        circuit.optionalActivatorCompleted = Boolean(
          circuit.optionalActivatorCompleted,
        );
        circuit.optionalActivator = loadedOptionalActivator;
        circuit.completionCredited =
          typeof circuit.completionCredited === "boolean"
            ? circuit.completionCredited
            : circuit.roundsCompleted.every(Boolean);
        delete circuit.completed;
        delete circuit.bridge;
        delete circuit.bridgeCompleted;
      }
      if ((Number(candidate.version) || 1) < 14) {
        const legacyQualificationUsed = new Set();
        if (
          dayData.target === "shoulders_rotator" &&
          dayData.circuits[2]?.first?.exerciseId !==
            idFor("Shoulder Exercise Placeholder")
        ) {
          legacyQualificationUsed.add(idFor("Shoulder Exercise Placeholder"));
        }
        const targetDefinitions = withBodyPartFilter(
          circuitDefinitionsForTarget(dayData.target, legacyQualificationUsed),
          dayData.bodyParts,
        );
        dayData.circuits.forEach((circuit, circuitIndex) => {
          const definition = targetDefinitions[circuitIndex];
          mainAssignments(circuit).forEach((assignment, assignmentIndex) => {
            const fallbackKey =
              assignmentIndex === 0
                ? "first"
                : assignmentIndex === 1
                  ? "second"
                  : "extra";
            const slot =
              definition[assignment.slotKey || fallbackKey] || definition.extra;
            const exercise = exerciseById.get(assignment.exerciseId);
            if (exercise && !matchesSlot(exercise, slot))
              assignment.manualOverride = true;
          });
        });
      }
    }
    normalized.nextCycleId = normalized.cycles[cycleCursor].id;
    normalized.week.nextCycleId = normalized.nextCycleId;
    migrateTotalBodyActivators(normalized.week, excludedIds);
    if (!normalized.needsCycleRegeneration) {
      const issues = validateWeek(normalized.week);
      if (issues.length)
        throw new Error(`The saved week is invalid: ${issues[0]}`);
    }
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
        ...(circuit.optionalActivator
          ? [
              {
                ...circuit.optionalActivator,
                dayId: day.id,
                circuitIndex,
                position: "optionalActivator",
              },
            ]
          : []),
      ]),
    );
  }

  function migrateTotalBodyActivators(week, excludedIds = new Set()) {
    const invalid = [];
    const mainIds = new Set();
    for (const day of DAY_CONFIG) {
      for (const circuit of week.days[day.id].circuits) {
        for (const assignment of mainAssignments(circuit))
          mainIds.add(assignment.exerciseId);
      }
    }

    const used = new Set(mainIds);
    for (const day of DAY_CONFIG) {
      const targetId = normalizeWorkoutTarget(
        week.days[day.id].target,
        day.defaultTarget,
      );
      for (const circuit of week.days[day.id].circuits) {
        const assignment = circuit.optionalActivator;
        const exercise = exerciseById.get(assignment?.exerciseId);
        if (
          assignment &&
          qualifiesAsOptionalActivator(exercise, targetId) &&
          !excludedIds.has(exercise.id) &&
          !used.has(exercise.id)
        ) {
          circuit.optionalActivator = {
            ...assignment,
            slotLabel: ACTIVATOR_LABEL,
            fixed: Boolean(assignment.fixed),
            locked: Boolean(assignment.locked),
            slotKey: "optionalActivator",
          };
          used.add(exercise.id);
        } else {
          circuit.optionalActivator = null;
          invalid.push({ circuit, targetId });
        }
      }
    }

    for (const { circuit, targetId } of invalid) {
      let replacement = exercises
        .filter(
          (exercise) =>
            qualifiesAsOptionalActivator(exercise, targetId) &&
            !used.has(exercise.id) &&
            !excludedIds.has(exercise.id),
        )
        .sort((first, second) => first.name.localeCompare(second.name))[0];
      if (!replacement) {
        replacement = exercises
          .filter(
            (exercise) =>
              qualifiesAsOptionalActivator(exercise, targetId) &&
              !mainIds.has(exercise.id) &&
              !excludedIds.has(exercise.id),
          )
          .sort((first, second) => first.name.localeCompare(second.name))[0];
      }
      if (!replacement) break;
      circuit.optionalActivator = {
        exerciseId: replacement.id,
        slotLabel: ACTIVATOR_LABEL,
        locked: false,
        fixed: false,
        slotKey: "optionalActivator",
      };
      circuit.optionalActivatorCompleted = false;
      used.add(replacement.id);
    }
  }

  function mainAssignments(circuit) {
    return [circuit.first, circuit.second, ...(circuit.extras || [])].filter(
      Boolean,
    );
  }

  function normalizeSetupScore(value) {
    if (value === null || value === undefined || value === "") return null;
    const score = Number(value);
    return Number.isFinite(score)
      ? Math.max(0, Math.min(5, Math.round(score)))
      : null;
  }

  function defaultSetupScore(exercise) {
    if (!exercise) return 4;
    const equipmentLabel = String(exercise.equipment_label || "").toLowerCase();
    const varieties = Array.isArray(exercise.equipment_varieties)
      ? exercise.equipment_varieties
      : [];
    const onlyBodyWeight =
      varieties.length > 0 &&
      varieties.every((item) => item.toLowerCase() === "body weight");
    const bodyWeightOption =
      equipmentLabel.includes("body weight or") ||
      equipmentLabel.includes("bodyweight or");
    const explicitlyEquipmentFree = includesAny(equipmentLabel, [
      "no equipment",
      "none required",
    ]);
    return onlyBodyWeight || bodyWeightOption || explicitlyEquipmentFree
      ? 5
      : 4;
  }

  function assignmentExerciseScore(assignment) {
    const exercise = exerciseById.get(assignment.exerciseId);
    return (
      exerciseEffectivenessScore(exercise) +
      (normalizeSetupScore(assignment.setupScore) ?? 0)
    );
  }

  function circuitTotalScore(circuit) {
    return mainAssignments(circuit).reduce(
      (total, assignment) => total + assignmentExerciseScore(assignment),
      0,
    );
  }

  function clearCircuitSetupScores(circuit) {
    mainAssignments(circuit).forEach((assignment) => {
      assignment.setupScore = defaultSetupScore(
        exerciseById.get(assignment.exerciseId),
      );
    });
  }

  function isCircuitComplete(circuit) {
    return (
      Array.isArray(circuit.roundsCompleted) &&
      circuit.roundsCompleted.length === 3 &&
      circuit.roundsCompleted.every(Boolean)
    );
  }

  function difficultyFor(circuit) {
    const count = mainAssignments(circuit).length;
    if (count === 2) return "Focused";
    if (count === 3) return "Standard";
    return "Challenge";
  }

  function circuitExerciseIds(circuit) {
    return mainAssignments(circuit).map((assignment) => assignment.exerciseId);
  }

  function favoriteSignature(circuit) {
    return mainAssignments(circuit)
      .map(
        (assignment) =>
          `${assignment.exerciseId}:${normalizeSetupScore(assignment.setupScore) ?? ""}`,
      )
      .join("|");
  }

  function favoritesForSlot(dayId, circuitIndex) {
    const cycleId = state.week.days[dayId]?.cycleId;
    return state.favoriteCircuits.filter(
      (favorite) =>
        favorite.cycleId === cycleId &&
        Number(favorite.circuitIndex) === Number(circuitIndex),
    );
  }

  function isFavoriteCircuit(dayId, circuitIndex, circuit) {
    const signature = favoriteSignature(circuit);
    return favoritesForSlot(dayId, circuitIndex).some(
      (favorite) => favorite.signature === signature,
    );
  }

  function toggleFavoriteCircuit(dayId, circuitIndex) {
    const circuit = state.week.days[dayId]?.circuits?.[circuitIndex];
    if (!circuit) return;
    const signature = favoriteSignature(circuit);
    const existing = favoritesForSlot(dayId, circuitIndex).find(
      (favorite) => favorite.signature === signature,
    );
    if (existing) {
      state.favoriteCircuits = state.favoriteCircuits.filter(
        (favorite) => favorite.id !== existing.id,
      );
      showToast("Circuit removed from favorites.");
    } else {
      const exerciseNames = circuitExerciseIds(circuit)
        .map((exerciseId) => exerciseById.get(exerciseId)?.name)
        .filter(Boolean);
      const cycle = cycleForDay(dayId);
      const dayName = cycleDisplayName(cycle);
      const suggestedName = `${dayName} Circuit ${circuit.number} — ${exerciseNames.slice(0, 2).join(" + ")}`;
      const requestedName = window.prompt(
        "Name this favorite circuit:",
        suggestedName,
      );
      if (requestedName === null) return;
      const favoriteName =
        String(requestedName).trim().slice(0, 100) || suggestedName;
      state.favoriteCircuits.push({
        id: `favorite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        cycleId: cycle.id,
        circuitIndex,
        category: circuit.category,
        name: favoriteName,
        exerciseNames,
        signature,
        assignments: JSON.parse(JSON.stringify(mainAssignments(circuit))),
        totalScore: circuitTotalScore(circuit),
        savedAt: new Date().toISOString(),
      });
      state.favoriteCircuits = state.favoriteCircuits.slice(-30);
      showToast("Circuit saved as a favorite.");
    }
    persist();
    render();
  }

  function favoriteUnavailableReason(favorite, target) {
    const assignments = favorite.assignments;
    const ids = assignments.map((assignment) => assignment.exerciseId);
    if (ids.some((id) => !exerciseById.has(id)))
      return "An exercise is no longer in the library";
    if (ids.some((id) => isHidden(id) || isDeleted(id)))
      return "Contains a hidden or deleted exercise";
    const usedElsewhere = new Set(
      allAssignments()
        .filter(
          (assignment) =>
            assignment.dayId !== target.dayId ||
            Number(assignment.circuitIndex) !== Number(target.circuitIndex),
        )
        .map((assignment) => assignment.exerciseId),
    );
    if (ids.some((id) => usedElsewhere.has(id)))
      return "One or more exercises are already used elsewhere this week";
    const exercisesInRound = favorite.assignments.map((assignment) =>
      exerciseById.get(assignment.exerciseId),
    );
    if (exercisesInRound.filter(requiresBothSides).length > 1)
      return "Contains multiple both-sides exercises";
    for (let index = 1; index < exercisesInRound.length; index += 1) {
      if (
        transitionCost(exercisesInRound[index - 1], exercisesInRound[index]) >
          2 &&
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
              <div><strong>${escapeHtml(favorite.name)}</strong><small>Total score ${favorite.assignments.reduce((total, assignment) => total + assignmentExerciseScore(assignment), 0)} · ${favorite.exerciseNames.map(escapeHtml).join(" · ")}</small>${reason ? `<span class="favorite-warning">${escapeHtml(reason)}</span>` : ""}</div>
              <button class="library-action" type="button" data-action="apply-favorite-circuit" data-favorite-id="${favorite.id}" ${reason ? "disabled" : ""}>Use circuit</button>
              <button class="library-action delete" type="button" data-action="delete-favorite-circuit" data-favorite-id="${favorite.id}">Remove</button>
            </article>`;
          })
          .join("")
      : '<div class="empty-state">No favorites are saved for this circuit position yet.</div>';
  }

  function openFavoriteCircuits(dayId, circuitIndex) {
    ui.favoriteTarget = { dayId, circuitIndex };
    const day = cycleForDay(dayId);
    document.getElementById("favorite-title").textContent =
      `${cycleDisplayName(day)} Circuit ${circuitIndex + 1} favorites`;
    renderFavoriteResults();
    document.getElementById("favorite-dialog").showModal();
  }

  function applyFavoriteCircuit(favoriteId) {
    const target = ui.favoriteTarget;
    const favorite = state.favoriteCircuits.find(
      (item) => item.id === favoriteId,
    );
    if (!target || !favorite || favoriteUnavailableReason(favorite, target))
      return;
    const circuit = state.week.days[target.dayId].circuits[target.circuitIndex];
    const previous = JSON.parse(JSON.stringify(circuit));
    const previousIds = circuitExerciseIds(circuit);
    const nextIds = favorite.assignments.map(
      (assignment) => assignment.exerciseId,
    );
    circuit.first = JSON.parse(JSON.stringify(favorite.assignments[0]));
    circuit.second = JSON.parse(JSON.stringify(favorite.assignments[1]));
    circuit.extras = JSON.parse(JSON.stringify(favorite.assignments.slice(2)));
    circuit.preferredExerciseCount = favorite.assignments.length;
    resetCircuitCompletion(circuit);
    const issues = validateWeek(state.week);
    if (issues.length) {
      state.week.days[target.dayId].circuits[target.circuitIndex] = previous;
      showToast(`That favorite cannot be used here: ${issues[0]}`, "error");
      return;
    }
    syncCycleTemplateFromDay(target.dayId);
    previousIds
      .filter((id) => !nextIds.includes(id))
      .forEach((id) => {
        stateFor(id).skippedCount += 1;
      });
    nextIds
      .filter((id) => !previousIds.includes(id))
      .forEach((id) => {
        stateFor(id).chosenCount += 1;
      });
    persist();
    document.getElementById("favorite-dialog").close();
    ui.favoriteTarget = null;
    render();
    showToast("Favorite circuit substituted.");
  }

  function deleteFavoriteCircuit(favoriteId) {
    state.favoriteCircuits = state.favoriteCircuits.filter(
      (favorite) => favorite.id !== favoriteId,
    );
    persist();
    if (document.getElementById("favorite-dialog").open)
      renderFavoriteResults();
    render();
    showToast("Favorite circuit removed.");
  }

  function validateWeek(week) {
    const issues = [];
    if (!week?.days) return ["Missing workout days."];
    const ids = [];
    const reusableIds = new Set();

    for (const day of DAY_CONFIG) {
      const dayData = week.days[day.id];
      if (dayData?.rest) {
        if (dayData.circuits?.length) {
          issues.push(`${day.name} is a rest day but still contains circuits.`);
        }
        continue;
      }
      if (!dayData || dayData.circuits?.length !== 3) {
        issues.push(`${day.name} must contain three circuits.`);
        continue;
      }

      for (const circuit of dayData.circuits) {
        if (
          !circuit.first ||
          !circuit.second ||
          !Array.isArray(circuit.extras)
        ) {
          issues.push(`${day.name} circuit ${circuit.number} is incomplete.`);
          continue;
        }
        const assignments = mainAssignments(circuit);
        if (assignments.length < 2 || assignments.length > 4) {
          issues.push(
            `${day.name} circuit ${circuit.number} must contain two to four round exercises.`,
          );
        }
        if (
          !Array.isArray(circuit.roundsCompleted) ||
          circuit.roundsCompleted.length !== 3
        ) {
          issues.push(
            `${day.name} circuit ${circuit.number} must track three rounds.`,
          );
        }
        if (typeof circuit.optionalActivatorCompleted !== "boolean") {
          issues.push(
            `${day.name} circuit ${circuit.number} must track its optional activator.`,
          );
        }
        const optionalActivatorExercise = exerciseById.get(
          circuit.optionalActivator?.exerciseId,
        );
        const circuitTargetId = normalizeWorkoutTarget(
          dayData.target,
          day.defaultTarget,
        );
        if (
          !qualifiesAsOptionalActivator(
            optionalActivatorExercise,
            circuitTargetId,
          )
        ) {
          issues.push(
            `${day.name} circuit ${circuit.number} must have one eligible optional total-body activator.`,
          );
        }
        if (typeof circuit.completionCredited !== "boolean") {
          issues.push(
            `${day.name} circuit ${circuit.number} must track its load-progression credit.`,
          );
        }
        ids.push(...assignments.map((assignment) => assignment.exerciseId));
        assignments
          .filter(
            (assignment) => assignment.cycleLock || assignment.rotationRepeat,
          )
          .forEach((assignment) => reusableIds.add(assignment.exerciseId));
        if (
          normalizeWorkoutTarget(dayData.target, day.defaultTarget) ===
          "total_body_no_equipment"
        ) {
          assignments.forEach((assignment) =>
            reusableIds.add(assignment.exerciseId),
          );
        }
        const mainExercises = assignments.map((assignment) =>
          exerciseById.get(assignment.exerciseId),
        );
        if (mainExercises.some((exercise) => !exercise)) {
          issues.push(`${day.name} references an unknown exercise.`);
        }
        const bothSidesAssignments = assignments.filter((assignment, index) =>
          requiresBothSides(mainExercises[index]),
        );
        if (
          bothSidesAssignments.length > 1 &&
          !bothSidesAssignments.some((assignment) => assignment.manualOverride)
        ) {
          issues.push(
            `${day.name} circuit ${circuit.number} combines multiple both-sides exercises.`,
          );
        }
        for (let index = 1; index < mainExercises.length; index += 1) {
          if (
            mainExercises[index - 1] &&
            mainExercises[index] &&
            !canCombine(mainExercises[index - 1], mainExercises[index]) &&
            !assignments[index - 1].manualOverride &&
            !assignments[index].manualOverride
          ) {
            issues.push(
              `${day.name} circuit ${circuit.number} combines two both-sides exercises.`,
            );
          }
          if (
            mainExercises[index - 1] &&
            mainExercises[index] &&
            transitionCost(mainExercises[index - 1], mainExercises[index]) >
              2 &&
            !assignments[index - 1].manualOverride &&
            !assignments[index].manualOverride
          ) {
            issues.push(
              `${day.name} circuit ${circuit.number} has a setup score above 2.`,
            );
          }
        }
        for (const exercise of mainExercises.filter(Boolean)) {
          if (exercise.overhead && !exercise.must_be_seated) {
            issues.push(`${exercise.name} violates the low-ceiling rule.`);
          }
          if (
            includesAny(exercise.name, [
              "smith machine",
              "leg extension machine",
              "leg curl machine",
            ])
          ) {
            issues.push(`${exercise.name} requires unavailable equipment.`);
          }
        }
      }

      const targetId = normalizeWorkoutTarget(
        dayData.target,
        day.defaultTarget,
      );
      const qualificationUsed = new Set();
      if (
        targetId === "shoulders_rotator" &&
        dayData.circuits[2]?.first?.exerciseId !==
          idFor("Shoulder Exercise Placeholder")
      ) {
        qualificationUsed.add(idFor("Shoulder Exercise Placeholder"));
      }
      const definitions = withBodyPartFilter(
        circuitDefinitionsForTarget(targetId, qualificationUsed),
        dayData.bodyParts,
      );
      dayData.circuits.forEach((circuit, circuitIndex) => {
        const definition = definitions[circuitIndex];
        const qualifiedAssignments = mainAssignments(circuit).map(
          (assignment, assignmentIndex) => {
            const fallbackKey =
              assignmentIndex === 0
                ? "first"
                : assignmentIndex === 1
                  ? "second"
                  : "extra";
            return [
              assignment,
              definition[assignment.slotKey || fallbackKey] || definition.extra,
            ];
          },
        );
        for (const [assignment, slot] of qualifiedAssignments) {
          const exercise = exerciseById.get(assignment.exerciseId);
          if (
            exercise &&
            !assignment.manualOverride &&
            !matchesSlot(exercise, slot)
          ) {
            issues.push(
              `${day.name} circuit ${circuit.number} contains ${exercise.name}, which is outside its ${workoutTarget(targetId).label} target.`,
            );
          }
        }
      });
    }

    const strictlyUniqueIds = ids.filter((id) => !reusableIds.has(id));
    if (strictlyUniqueIds.length !== new Set(strictlyUniqueIds).size) {
      issues.push("An exercise is repeated within the weekly plan.");
    }

    const shoulderTargetDays = DAY_CONFIG.filter(
      (day) =>
        !week.days[day.id]?.rest &&
        normalizeWorkoutTarget(week.days[day.id]?.target, day.defaultTarget) ===
          "shoulders_rotator",
    );
    if (
      shoulderTargetDays.length &&
      !shoulderTargetDays.some((day) =>
        week.days[day.id].circuits.some((circuit) =>
          mainAssignments(circuit).some(
            (assignment) =>
              assignment.exerciseId === idFor("Shoulder Exercise Placeholder"),
          ),
        ),
      )
    ) {
      issues.push(
        "A Shoulder & Rotator cuff day must preserve the shoulder exercise placeholder.",
      );
    }

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

  function workoutDayForTimer() {
    if (!DAY_CONFIG.some((day) => day.id === ui.currentView)) return null;
    const day = state.week.days[ui.currentView];
    return day?.rest ? null : day;
  }

  function normalizeTimerDuration(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return DEFAULT_WORKOUT_DURATION_MS;
    const rounded =
      Math.round(numeric / TIMER_ADJUSTMENT_MS) * TIMER_ADJUSTMENT_MS;
    return Math.max(
      MIN_WORKOUT_DURATION_MS,
      Math.min(MAX_WORKOUT_DURATION_MS, rounded),
    );
  }

  function timerDuration(day) {
    return normalizeTimerDuration(day?.timer?.durationMs);
  }

  function roundDeadlineMs(day, globalRound) {
    return (timerDuration(day) * (globalRound + 1)) / 9;
  }

  function timerElapsed(day) {
    if (!day?.timer) return 0;
    const runningFor = day.timer.startedAt
      ? Math.max(0, Date.now() - new Date(day.timer.startedAt).getTime())
      : 0;
    return Math.min(
      timerDuration(day),
      Math.max(0, day.timer.elapsedMs + runningFor),
    );
  }

  function allRoundsComplete(day) {
    return day.circuits.every((circuit) =>
      circuit.roundsCompleted.every(Boolean),
    );
  }

  function pauseWorkoutTimer(day, shouldPersist = true) {
    if (!day?.timer?.startedAt) return;
    day.timer.elapsedMs = timerElapsed(day);
    day.timer.startedAt = null;
    if (shouldPersist) persist();
  }

  function formatTimer(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function updateWorkoutTimer() {
    const timer = document.getElementById("workout-timer");
    const display = document.getElementById("timer-display");
    const toggle = document.getElementById("timer-toggle");
    const reset = document.getElementById("timer-reset");
    const subtract = document.getElementById("timer-minus");
    const add = document.getElementById("timer-plus");
    if (!timer || !display || !toggle || !reset || !subtract || !add) return;

    const day = workoutDayForTimer();
    timer.hidden = !day;
    if (!day) return;

    const duration = timerDuration(day);
    day.timer.durationMs = duration;
    let elapsed = timerElapsed(day);
    if (elapsed >= duration && day.timer.startedAt) {
      day.timer.elapsedMs = duration;
      day.timer.startedAt = null;
      elapsed = duration;
      persist();
    }
    const remaining = duration - elapsed;
    const warmupComplete = Object.values(day.preChecklist).every(Boolean);
    const workoutComplete = allRoundsComplete(day);
    const isRunning = Boolean(day.timer.startedAt);
    display.textContent = formatTimer(remaining);
    timer.setAttribute(
      "aria-label",
      `${duration / 60000}-minute workout timer`,
    );
    timer.classList.toggle("is-running", isRunning);
    timer.classList.toggle("is-expired", remaining <= 0 && !workoutComplete);
    toggle.textContent = isRunning ? "Pause" : elapsed > 0 ? "Resume" : "Start";
    toggle.disabled = !warmupComplete || workoutComplete || remaining <= 0;
    toggle.title = !warmupComplete
      ? "Complete the warm-up before starting the workout timer"
      : workoutComplete
        ? "All nine rounds are complete"
        : isRunning
          ? "Pause the workout timer"
          : elapsed > 0
            ? "Resume the workout timer"
            : "Start the workout timer";
    reset.disabled = elapsed <= 0;
    subtract.disabled =
      isRunning ||
      workoutComplete ||
      duration <= MIN_WORKOUT_DURATION_MS ||
      duration - TIMER_ADJUSTMENT_MS <= elapsed;
    add.disabled =
      isRunning || workoutComplete || duration >= MAX_WORKOUT_DURATION_MS;
    subtract.title = isRunning
      ? "Pause the timer before adjusting it"
      : "Remove five minutes";
    add.title = isRunning
      ? "Pause the timer before adjusting it"
      : "Add five minutes";

    const targetSummary = document.getElementById("timer-target-summary");
    const deadlineSummary = document.getElementById("timer-deadline-summary");
    if (targetSummary)
      targetSummary.textContent = `About ${duration / 60000} minutes`;
    if (deadlineSummary)
      deadlineSummary.textContent = `The nine round deadlines scale evenly across your ${duration / 60000}-minute workout after the warm-up.`;

    document
      .querySelectorAll?.(".round-check[data-global-round]")
      .forEach((label) => {
        const globalRound = Number(label.dataset.globalRound);
        const circuit = day.circuits[Math.floor(globalRound / 3)];
        const checked = circuit?.roundsCompleted[globalRound % 3];
        label.classList.toggle(
          "is-overdue",
          !checked && elapsed >= roundDeadlineMs(day, globalRound),
        );
      });
  }

  function toggleWorkoutTimer() {
    const day = workoutDayForTimer();
    if (
      !day ||
      !Object.values(day.preChecklist).every(Boolean) ||
      allRoundsComplete(day)
    )
      return;
    if (day.timer.startedAt) {
      pauseWorkoutTimer(day, false);
    } else if (timerElapsed(day) < timerDuration(day)) {
      day.timer.startedAt = new Date().toISOString();
    }
    persist();
    updateWorkoutTimer();
  }

  function resetWorkoutTimer() {
    const day = workoutDayForTimer();
    if (!day) return;
    day.timer = {
      durationMs: timerDuration(day),
      elapsedMs: 0,
      startedAt: null,
    };
    persist();
    updateWorkoutTimer();
  }

  function adjustWorkoutTimer(minutes) {
    const day = workoutDayForTimer();
    if (!day || day.timer.startedAt || allRoundsComplete(day)) return;
    const adjustment = Number(minutes) * 60 * 1000;
    if (!Number.isFinite(adjustment) || adjustment === 0) return;
    const currentDuration = timerDuration(day);
    const nextDuration = normalizeTimerDuration(currentDuration + adjustment);
    if (nextDuration === currentDuration || nextDuration <= timerElapsed(day))
      return;
    day.timer.durationMs = nextDuration;
    persist();
    updateWorkoutTimer();
  }

  function completedCircuits() {
    return DAY_CONFIG.reduce(
      (total, day) =>
        total +
        (!state.week.days[day.id].rest
          ? state.week.days[day.id].circuits.filter(isCircuitComplete).length
          : 0),
      0,
    );
  }

  function displayDay(day) {
    const dayData = state.week.days[day.id];
    const cycle = cycleForId(dayData.cycleId);
    const rotationRest = dayData.restSource === "rotation";
    const displayedCycle = rotationRest
      ? cycle
      : dayData.rest
        ? cycleForId(dayData.pendingCycleId)
        : cycle;
    return {
      ...day,
      focus: dayData.rest
        ? rotationRest
          ? "Scheduled rest"
          : "Rest day"
        : cycleTargetLabel(cycle),
      guidance: dayData.rest
        ? dayData.description
        : cycle.description || day.guidance,
      cycle: displayedCycle,
      cycleName: cycleDisplayName(displayedCycle),
      rotationRest,
    };
  }

  function enabledDays() {
    return DAY_CONFIG.filter((day) => !state.week.days[day.id].rest);
  }

  function libraryTotalCount() {
    return exercises.filter((exercise) => !isDeleted(exercise.id)).length;
  }

  function renderTabs() {
    const tabs = DAY_CONFIG.map((baseDay) => {
      const day = displayDay(baseDay);
      const dayData = state.week.days[day.id];
      const completeCount = dayData.rest
        ? 0
        : dayData.circuits.filter(isCircuitComplete).length;
      const active = ui.currentView === day.id;
      return `
        <button class="day-tab ${dayData.rest ? "is-rest" : ""} ${active ? "active" : ""}" type="button" data-view="${day.id}" aria-current="${active ? "page" : "false"}">
          <span class="day-short">${day.short}</span>
          <span><strong>${day.name}</strong><small>${dayData.rest ? (day.rotationRest ? `${escapeHtml(day.cycleName)} &middot; Scheduled rest` : `Rest &middot; ${escapeHtml(day.cycleName)} waits`) : `${escapeHtml(day.cycleName)} &middot; ${escapeHtml(day.focus)}`}</small></span>
          <span class="tab-status ${completeCount === 3 ? "complete" : ""}" aria-label="${dayData.rest ? "Rest day" : `${completeCount} of 3 circuits complete`}">${dayData.rest ? "&mdash;" : "&#10003;"}</span>
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
        <span><strong>Settings</strong><small>Cycles, targets, and descriptions</small></span>
        <span class="tab-status">${ICONS.arrow}</span>
      </button>`;
  }

  function cautionText(exercise) {
    if (exercise.shoulder_caution && exercise.back_caution)
      return "Shoulder + back aware";
    if (exercise.shoulder_caution) return "Shoulder aware";
    if (exercise.back_caution) return "Back aware";
    return "";
  }

  function renderExerciseItem(assignment, context) {
    const exercise = exerciseById.get(assignment.exerciseId);
    const settings = stateFor(exercise.id);
    const fixed = assignment.fixed || exercise.always_locked;
    const caution = cautionText(exercise);
    const isOptionalActivator = context.position === "optionalActivator";
    const itemClass = `${isOptionalActivator ? "exercise-item activator-item" : "exercise-item"}${isHidden(exercise.id) ? " is-hidden" : ""}`;
    const slotLabel = isOptionalActivator
      ? ACTIVATOR_LABEL
      : assignment.slotLabel;
    const loadProgressMarkup = `<div class="load-progression" aria-label="${settings.loadProgressCount} of 4 workouts completed at this load">
      <span class="load-progress-marks" aria-hidden="true">
        ${[0, 1, 2, 3]
          .map(
            (index) =>
              `<span class="load-progress-mark ${index < settings.loadProgressCount ? "is-complete" : ""}">${index < settings.loadProgressCount ? "✓" : ""}</span>`,
          )
          .join("")}
      </span>
      ${settings.loadProgressCount >= 4 ? `<button class="increase-load-button" type="button" data-action="increase-load" data-exercise-id="${exercise.id}">Increase load</button>` : ""}
    </div>`;
    const effectivenessFieldMarkup = `<label class="effectiveness-score effectiveness-score-field">
      <span>Effectiveness</span>
      <input type="number" min="1" max="5" step="1" value="${exerciseEffectivenessScore(exercise)}" data-exercise-setting="effectivenessScore" data-exercise-id="${exercise.id}" aria-label="Effectiveness score from 1 to 5 for ${escapeHtml(exercise.name)}" />
    </label>`;
    const scoreMarkup = isOptionalActivator
      ? `<div class="activator-score-row">${effectivenessFieldMarkup}<span>Independent of circuit score</span></div>`
      : `<div class="exercise-score-row">
          ${effectivenessFieldMarkup}
          <label class="setup-score-field">
            <span>Setup</span>
            <input type="number" min="0" max="5" step="1" value="${normalizeSetupScore(assignment.setupScore) ?? ""}" placeholder="0" data-assignment-setting="setupScore" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" data-position="${context.position}" aria-label="Manual setup ease score from 0 to 5 for ${escapeHtml(exercise.name)}" />
            <small>/ 5</small>
          </label>
          <span class="exercise-total-score">Exercise score <strong>${assignmentExerciseScore(assignment)}</strong></span>
        </div>`;

    return `
      <div class="${itemClass}">
        <div class="exercise-topline">
          <span class="slot-label">${escapeHtml(slotLabel)}</span>
          <span class="exercise-tools">
            ${
              isOptionalActivator
                ? `<label class="bridge-check" title="Mark the optional total-body activator complete">
                    <input type="checkbox" data-action="complete-optional-activator" data-day="${context.dayId}" data-circuit="${context.circuitIndex}" ${context.activatorCompleted ? "checked" : ""} />
                    <span>Done</span>
                  </label>`
                : ""
            }
            ${
              !isOptionalActivator
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
              !isOptionalActivator
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
          <div class="preference-controls" aria-label="Recommendation preference for ${escapeHtml(exercise.name)}">
            <button class="feedback-button ${settings.preference === 1 ? "active" : ""}" type="button" data-action="set-preference" data-exercise-id="${exercise.id}" data-value="1" title="Recommend more often" aria-label="Recommend ${escapeHtml(exercise.name)} more often">${ICONS.thumbUp}</button>
            <button class="feedback-button ${settings.preference === -1 ? "active negative" : ""}" type="button" data-action="set-preference" data-exercise-id="${exercise.id}" data-value="-1" title="Recommend less often" aria-label="Recommend ${escapeHtml(exercise.name)} less often">${ICONS.thumbDown}</button>
          </div>
        </div>
        ${scoreMarkup}
        <div class="exercise-fields">
          <label class="compact-field measure-field">
            <select data-setting="measureType" data-exercise-id="${exercise.id}" aria-label="Measure repetitions or seconds for ${escapeHtml(exercise.name)}">
              <option value="reps" ${settings.measureType === "reps" ? "selected" : ""}>Reps</option>
              <option value="seconds" ${settings.measureType === "seconds" ? "selected" : ""}>Seconds</option>
            </select>
            <input data-setting="reps" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.reps)}" aria-label="Repetitions for ${escapeHtml(exercise.name)}" />
          </label>
          <div class="load-control">
            <label class="compact-field load-field ${String(settings.weight).trim() ? "has-recommended-weight" : ""}">
              <span>Load</span>
              <input data-setting="weight" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.weight)}" placeholder="—" inputmode="decimal" aria-label="Weight for ${escapeHtml(exercise.name)}" />
              <small>lb</small>
              <select class="load-basis-select" data-setting="loadBasis" data-exercise-id="${exercise.id}" aria-label="Whether the load for ${escapeHtml(exercise.name)} is total or for each side">
                <option value="total" ${settings.loadBasis === "total" ? "selected" : ""}>total</option>
                <option value="each" ${settings.loadBasis === "each" ? "selected" : ""}>each</option>
              </select>
            </label>
            ${loadProgressMarkup}
          </div>
        </div>
        <label class="exercise-note"><span>Notes</span><input data-setting="notes" data-exercise-id="${exercise.id}" value="${escapeHtml(settings.notes)}" maxlength="1000" placeholder="Add a cue or note" aria-label="Notes for ${escapeHtml(exercise.name)}" /></label>
      </div>`;
  }

  function circuitTargetMuscles(dayId, circuit) {
    const workedMuscles = new Set(
      mainAssignments(circuit).flatMap(
        (assignment) =>
          exerciseById.get(assignment.exerciseId)?.body_parts || [],
      ),
    );
    return targetBodyPartsForDay(dayId).filter((part) =>
      workedMuscles.has(part),
    );
  }

  function renderCircuit(dayId, circuit, circuitIndex) {
    const assignments = mainAssignments(circuit);
    const circuitMuscles = circuitTargetMuscles(dayId, circuit);
    const elapsed = timerElapsed(state.week.days[dayId]);
    const exerciseItems = assignments
      .map((assignment, index) => {
        const position =
          index === 0 ? "first" : index === 1 ? "second" : `extra-${index - 2}`;
        return renderExerciseItem(assignment, {
          dayId,
          circuitIndex,
          position,
          orderIndex: index,
          exerciseCount: assignments.length,
        });
      })
      .join('<hr class="exercise-divider" aria-hidden="true" />');
    const lastExtra = circuit.extras[circuit.extras.length - 1];
    const canRemove = circuit.extras.length > 0 && !lastExtra?.locked;
    const complete = isCircuitComplete(circuit);
    const activatorKey = `${dayId}-${circuitIndex}`;
    const activatorExpanded = ui.expandedActivators.has(activatorKey);
    const activatorExercise = exerciseById.get(
      circuit.optionalActivator.exerciseId,
    );
    const optionalActivatorMarkup = `<section class="optional-activator-panel ${circuit.optionalActivatorCompleted ? "is-complete" : ""} ${activatorExpanded ? "is-expanded" : ""}">
      <button class="optional-activator-toggle" type="button" data-action="toggle-optional-activator-pane" data-day="${dayId}" data-circuit="${circuitIndex}" aria-expanded="${activatorExpanded}" aria-controls="optional-activator-${dayId}-${circuitIndex}">
        <span class="optional-activator-status" aria-hidden="true">${circuit.optionalActivatorCompleted ? "✓" : ""}</span>
        <span class="optional-activator-copy"><strong>Optional total-body activator</strong><small>${escapeHtml(activatorExercise.name)} · If time remains</small></span>
        <span class="optional-activator-chevron">${ICONS.arrow}</span>
      </button>
      ${
        activatorExpanded
          ? `<div id="optional-activator-${dayId}-${circuitIndex}" class="optional-activator-content">
              ${renderExerciseItem(circuit.optionalActivator, {
                dayId,
                circuitIndex,
                position: "optionalActivator",
                activatorCompleted: circuit.optionalActivatorCompleted,
              })}
            </div>`
          : ""
      }
    </section>`;
    const roundChecksMarkup = `<div class="round-checks" aria-label="Completed rounds for circuit ${circuit.number}">
      ${[0, 1, 2]
        .map(
          (
            round,
          ) => `<label class="round-check ${!circuit.roundsCompleted[round] && elapsed >= roundDeadlineMs(state.week.days[dayId], circuitIndex * 3 + round) ? "is-overdue" : ""}" data-global-round="${circuitIndex * 3 + round}">
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
            <span class="circuit-title"><span>Circuit ${circuit.number}</span><strong>${escapeHtml(circuit.category)}</strong><span class="circuit-muscle-list" aria-label="Muscles targeted in circuit ${circuit.number}">${circuitMuscles.map((part) => `<i data-circuit-muscle="${circuitIndex}:${escapeHtml(part)}">${escapeHtml(part)}</i>`).join("")}</span></span>
          </div>
          <div class="circuit-scaling">
            <button class="favorite-button ${isFavoriteCircuit(dayId, circuitIndex, circuit) ? "active" : ""}" type="button" data-action="toggle-favorite-circuit" data-day="${dayId}" data-circuit="${circuitIndex}" title="${isFavoriteCircuit(dayId, circuitIndex, circuit) ? "Remove this circuit from favorites" : "Save this circuit as a favorite"}" aria-label="${isFavoriteCircuit(dayId, circuitIndex, circuit) ? "Remove circuit from favorites" : "Favorite this circuit"}">${ICONS.star}</button>
            <button class="favorite-button" type="button" data-action="open-favorite-circuits" data-day="${dayId}" data-circuit="${circuitIndex}" title="Substitute a saved favorite circuit" aria-label="Substitute a favorite circuit" ${favoritesForSlot(dayId, circuitIndex).length ? "" : "disabled"}>${ICONS.favorites}</button>
            <span class="circuit-total-score">Total score ${circuitTotalScore(circuit)}</span>
            <span class="rounds-badge">${difficultyFor(circuit)} · ${assignments.length} exercises</span>
            <span class="scale-buttons">
              <button type="button" data-action="remove-round-exercise" data-day="${dayId}" data-circuit="${circuitIndex}" aria-label="Remove the last round exercise" title="Remove the last round exercise" ${canRemove ? "" : "disabled"}>−</button>
              <button type="button" data-action="add-round-exercise" data-day="${dayId}" data-circuit="${circuitIndex}" aria-label="Add a round exercise" title="Add a compatible round exercise" ${assignments.length >= 4 ? "disabled" : ""}>+</button>
            </span>
          </div>
        </header>
        <div class="circuit-body">
          ${optionalActivatorMarkup}
          ${roundChecksMarkup}
          <div class="exercise-cycle">${exerciseItems}</div>
        </div>
      </article>`;
  }

  function renderDayCycleSelector(dayId, selectedCycleId) {
    const rotationEntries = state.cycles.map((cycle, index) => ({
      cycle,
      index,
    }));
    return `<label class="day-cycle-selector">
      <span>Cycle</span>
      <select data-day-cycle-select="true" data-day="${dayId}" aria-label="Workout cycle for ${escapeHtml(state.week.days[dayId].day)}">
        ${rotationEntries
          .map(({ cycle, index }) => {
            const name = cycleDisplayName(cycle, index);
            const target = cycleTargetLabel(cycle);
            const label = isRestCycle(cycle)
              ? `${name} — Entry ${index + 1}`
              : name === target
                ? name
                : `${name} — ${target}`;
            return `<option value="${cycle.id}" ${cycle.id === selectedCycleId ? "selected" : ""}>${escapeHtml(label)}</option>`;
          })
          .join("")}
      </select>
    </label>`;
  }

  function renderWorkout(dayId) {
    const config = displayDay(DAY_CONFIG.find((day) => day.id === dayId));
    const day = state.week.days[dayId];
    if (day.rest) {
      const rotationRest = day.restSource === "rotation";
      const selectedCycleId = rotationRest ? day.cycleId : day.pendingCycleId;
      document.getElementById("workout-view").innerHTML = `
        <div class="content-frame rest-day-view">
          <header class="view-header">
            <div>
              <span class="eyebrow">${rotationRest ? "Rotation rest day" : "Cycle paused"}</span>
              <h1>${config.name} <span>&mdash; Rest day</span></h1>
              <p class="view-subtitle">${rotationRest ? `${escapeHtml(config.cycleName)} is part of the rotation, so the next entry advances to the following day.` : `${escapeHtml(config.cycleName)} remains next in the rotation and moves to the next available training day.`}</p>
            </div>
            <div class="workout-header-actions">
              ${renderDayCycleSelector(dayId, selectedCycleId)}
              ${rotationRest ? `<button class="button button-quiet" type="button" data-view="settings">Edit rotation</button>` : `<button class="button button-primary" type="button" data-action="toggle-rest-day" data-day="${dayId}">Train today instead</button>`}
            </div>
          </header>
          <section class="rest-day-panel">
            <span class="rest-day-mark" aria-hidden="true">&mdash;</span>
            <div><strong>${rotationRest ? "Scheduled recovery" : "Recover today"}</strong><p>${rotationRest ? "This rest entry was consumed and the rotation continues with the next entry." : "No cycle was consumed. Every later calendar day has shifted forward automatically."}</p></div>
          </section>
        </div>`;
      updateWorkoutTimer();
      return;
    }
    const completed = day.circuits.filter(isCircuitComplete).length;
    const beforeCircuitsComplete = Object.values(day.preChecklist).every(
      Boolean,
    );
    const cooldownComplete = Object.values(day.cooldownChecklist).every(
      Boolean,
    );
    const dayTargetMuscles = targetBodyPartsForDay(dayId);

    document.getElementById("workout-view").innerHTML = `
      <div class="content-frame workout-content ${!state.warmupExercises.length || beforeCircuitsComplete ? "" : "has-pending-warmup"}">
        <header class="view-header">
          <div>
            <span class="eyebrow">${escapeHtml(config.cycleName)} &middot; ${completed} of 3 circuits complete</span>
            <h1>${config.name} <span>— ${escapeHtml(config.focus)}</span></h1>
            <p id="timer-deadline-summary" class="view-subtitle">The nine round deadlines scale evenly across your ${timerDuration(day) / 60000}-minute workout after the warm-up.</p>
          </div>
          <div class="workout-header-actions">
            ${renderDayCycleSelector(dayId, day.cycleId)}
            <button class="button button-quiet" type="button" data-action="toggle-rest-day" data-day="${dayId}" title="Make ${config.name} a rest day and shift the cycle sequence forward">Rest today</button>
            <div class="session-chip">${ICONS.clock}<span><span>Target time</span><strong id="timer-target-summary">About ${timerDuration(day) / 60000} minutes</strong></span></div>
          </div>
        </header>
        <div class="day-guidance day-muscle-summary">${ICONS.info}<div><strong>Target muscles</strong><span class="day-muscle-list">${dayTargetMuscles.map((part) => `<i data-day-target-muscle="${escapeHtml(part)}">${escapeHtml(part)}</i>`).join("")}</span></div></div>
        ${
          state.warmupExercises.length
            ? `<div class="routine-row pre-routine ${beforeCircuitsComplete ? "is-complete" : ""}" aria-label="Warm-up checklist">
                <strong>Warm-up</strong>
                ${state.warmupExercises
                  .map(
                    (exercise) =>
                      `<label><input type="checkbox" data-action="daily-check" data-day="${dayId}" data-item="${escapeHtml(exercise.id)}" ${day.preChecklist[exercise.id] ? "checked" : ""} /> ${escapeHtml(exercise.label)}</label>`,
                  )
                  .join("")}
              </div>`
            : ""
        }
        <div class="circuit-grid">
          ${day.circuits.map((circuit, index) => renderCircuit(dayId, circuit, index)).join("")}
        </div>
        ${
          state.cooldownExercises.length
            ? `<div class="routine-row cooldown-routine ${cooldownComplete ? "is-complete" : ""}" aria-label="Cool-down checklist">
                <strong>Cool-down</strong>
                ${state.cooldownExercises
                  .map(
                    (exercise) =>
                      `<label><input type="checkbox" data-action="cooldown-check" data-day="${dayId}" data-item="${escapeHtml(exercise.id)}" ${day.cooldownChecklist[exercise.id] ? "checked" : ""} /> ${escapeHtml(exercise.label)}</label>`,
                  )
                  .join("")}
              </div>`
            : ""
        }
      </div>`;
    updateWorkoutTimer();
  }

  function categoryOptions() {
    return [
      ...new Set(exercises.map((exercise) => exercise.primary_body_part)),
    ].sort();
  }

  function equipmentOptions() {
    return normalizeEquipmentCatalog([
      ...(state?.equipmentCatalog || []),
      ...exerciseEquipmentCatalog(),
    ]);
  }

  function bodyPartOptions() {
    return [
      ...BODY_PART_OPTIONS,
      ...[...new Set(exercises.flatMap((exercise) => exercise.body_parts))]
        .filter((part) => !BODY_PART_OPTIONS.includes(part))
        .sort((first, second) => first.localeCompare(second)),
    ];
  }

  function filteredLibrary() {
    const search = ui.librarySearch.trim().toLowerCase();
    const filtered = exercises.filter((exercise) => {
      if (isDeleted(exercise.id)) return false;
      if (isHidden(exercise.id) && !ui.showHidden) return false;
      const matchesCategory =
        ui.libraryCategory === "all" ||
        exercise.primary_body_part === ui.libraryCategory;
      const matchesEquipment = matchesEquipmentSelection(
        exercise,
        ui.libraryEquipment,
      );
      const haystack =
        `${exercise.name} ${exercise.primary_body_part} ${exercise.equipment_label} ${exercise.equipment_varieties.join(" ")}`.toLowerCase();
      return (
        matchesCategory &&
        matchesEquipment &&
        (!search || haystack.includes(search))
      );
    });

    return filtered.sort((first, second) => {
      const firstStats = stateFor(first.id);
      const secondStats = stateFor(second.id);
      if (ui.librarySort === "popular") {
        return (
          secondStats.chosenCount - firstStats.chosenCount ||
          first.name.localeCompare(second.name)
        );
      }
      if (ui.librarySort === "skipped") {
        return (
          secondStats.skippedCount - firstStats.skippedCount ||
          first.name.localeCompare(second.name)
        );
      }
      if (ui.librarySort === "score") {
        return (
          exerciseEffectivenessScore(second) -
            exerciseEffectivenessScore(first) ||
          first.name.localeCompare(second.name)
        );
      }
      if (ui.librarySort === "category") {
        return (
          first.primary_body_part.localeCompare(second.primary_body_part) ||
          first.name.localeCompare(second.name)
        );
      }
      if (ui.librarySort === "equipment") {
        const firstEquipment =
          first.equipment_varieties[0] || first.equipment_label;
        const secondEquipment =
          second.equipment_varieties[0] || second.equipment_label;
        return (
          firstEquipment.localeCompare(secondEquipment) ||
          first.name.localeCompare(second.name)
        );
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
            <span class="tag score">Effectiveness ${exerciseEffectivenessScore(exercise)}</span>
            ${requiresBothSides(exercise) ? '<span class="tag both-sides">Both sides</span>' : ""}
            ${caution ? `<span class="tag caution">${escapeHtml(caution)}</span>` : ""}
            ${exercise.total_body_activator ? '<span class="tag activator">Total-body activator</span>' : ""}
          </div>
        </div>
        <div class="library-counts" aria-label="Exercise usage">
          <span><strong>${stats.chosenCount}</strong>chosen</span>
          <span><strong>${stats.skippedCount}</strong>skipped</span>
        </div>
        <div class="library-actions">
          ${
            exercise.instruction_url
              ? `<a class="demo-button" href="${escapeHtml(exercise.instruction_url)}" target="_blank" rel="noreferrer" aria-label="View a demonstration of ${escapeHtml(exercise.name)}" title="View demo">${ICONS.external}</a>`
              : ""
          }
          <button class="library-action" type="button" data-action="edit-library" data-exercise-id="${exercise.id}">Edit</button>
          <button class="library-action" type="button" data-action="toggle-hide-library" data-exercise-id="${exercise.id}" ${fixed ? "disabled" : ""}>${hidden ? "Restore" : "Hide"}</button>
          <button class="library-action delete" type="button" data-action="delete-library" data-exercise-id="${exercise.id}" ${fixed ? "disabled" : ""}>Delete</button>
        </div>
      </article>`;
  }

  function renderLibrary() {
    const items = filteredLibrary();
    const totalChosen = exercises.reduce(
      (total, exercise) => total + stateFor(exercise.id).chosenCount,
      0,
    );
    const totalSkipped = exercises.reduce(
      (total, exercise) => total + stateFor(exercise.id).skippedCount,
      0,
    );

    document.getElementById("library-view").innerHTML = `
      <div class="content-frame">
        <header class="view-header">
          <div>
            <span class="eyebrow">Workout catalog</span>
            <h1>Exercise <span>library</span></h1>
            <p class="view-subtitle">Browse every exercise, filter or sort by equipment, and edit each movement's compatible equipment varieties.</p>
          </div>
          <div class="library-header-actions">
            <button class="button button-quiet" id="add-equipment-button" type="button" data-action="open-equipment-dialog">Edit equipment</button>
            <button class="button button-primary" id="add-exercise-button" type="button" data-action="open-add-exercise">+ Add exercise</button>
          </div>
        </header>
        <div class="library-toolbar">
          <label class="search-field">${ICONS.search}<span class="sr-only">Search exercise library</span><input id="library-search" type="search" value="${escapeHtml(ui.librarySearch)}" placeholder="Search name, category, or equipment" /></label>
          <label class="select-field"><span>Category</span><select id="library-category">
            <option value="all">All</option>
            ${categoryOptions()
              .map(
                (category) =>
                  `<option value="${escapeHtml(category)}" ${ui.libraryCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>`,
              )
              .join("")}
          </select></label>
          <label class="select-field"><span>Equipment</span><select id="library-equipment">
            <option value="all">All equipment</option>
            ${equipmentOptions()
              .map(
                (equipment) =>
                  `<option value="${escapeHtml(equipment)}" ${ui.libraryEquipment === equipment ? "selected" : ""}>${escapeHtml(equipment)}</option>`,
              )
              .join("")}
          </select></label>
          <label class="select-field"><span>Sort</span><select id="library-sort">
            <option value="popular" ${ui.librarySort === "popular" ? "selected" : ""}>Most popular</option>
            <option value="skipped" ${ui.librarySort === "skipped" ? "selected" : ""}>Most skipped</option>
            <option value="score" ${ui.librarySort === "score" ? "selected" : ""}>Effectiveness</option>
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

  function renderRoutineSettingsPanel(kind, exercises) {
    const warmup = kind === "warmup";
    const title = warmup ? "Warm-up exercises" : "Cool-down exercises";
    const adjective = warmup ? "Warm-up" : "Cool-down";
    const description = warmup
      ? "Shown before the circuits on every training day."
      : "Shown after the circuits and excluded from workout time.";
    const emptyMessage = warmup
      ? "No warm-up exercises. Add one whenever you want a pre-circuit checklist."
      : "No cool-down exercises. Add one whenever you want a post-workout checklist.";
    return `<section class="routine-settings-panel ${kind}-settings-panel">
      <header>
        <div><strong>${title}</strong><span>${description}</span></div>
        <button class="button button-quiet" type="button" data-action="add-${kind}-exercise" ${exercises.length >= 24 ? "disabled" : ""}>+ Add ${kind === "warmup" ? "warm-up" : "cool-down"} exercise</button>
      </header>
      <div class="routine-settings-list">
        ${
          exercises.length
            ? exercises
                .map(
                  (exercise, index) =>
                    `<div class="routine-settings-row">
                      <span class="routine-order">${index + 1}</span>
                      <label class="form-field"><span>Exercise ${index + 1}</span><input data-${kind}-setting="label" data-${kind}-id="${escapeHtml(exercise.id)}" maxlength="100" value="${escapeHtml(exercise.label)}" aria-label="${adjective} exercise ${index + 1}" /></label>
                      <div class="routine-row-actions">
                        <button type="button" data-action="move-${kind}-exercise" data-${kind}-id="${escapeHtml(exercise.id)}" data-direction="-1" ${index === 0 ? "disabled" : ""} aria-label="Move ${escapeHtml(exercise.label)} earlier">&uarr;</button>
                        <button type="button" data-action="move-${kind}-exercise" data-${kind}-id="${escapeHtml(exercise.id)}" data-direction="1" ${index === exercises.length - 1 ? "disabled" : ""} aria-label="Move ${escapeHtml(exercise.label)} later">&darr;</button>
                        <button class="routine-delete" type="button" data-action="delete-${kind}-exercise" data-${kind}-id="${escapeHtml(exercise.id)}" aria-label="Delete ${escapeHtml(exercise.label)}">Delete</button>
                      </div>
                    </div>`,
                )
                .join("")
            : `<div class="routine-empty">${emptyMessage}</div>`
        }
      </div>
    </section>`;
  }

  function renderCycleSettingsCard(cycle, index) {
    const displayName = cycleDisplayName(cycle, index);
    const trainingCycleCount = state.cycles.filter(
      (item) => !isRestCycle(item),
    ).length;
    const removeDisabled = !isRestCycle(cycle) && trainingCycleCount <= 1;
    const header = `<header>
      <div><span class="cycle-number">${index + 1}</span><strong>${escapeHtml(displayName)}</strong></div>
      <div class="cycle-card-actions">
        <button type="button" data-action="move-cycle" data-cycle-id="${cycle.id}" data-direction="-1" ${index === 0 ? "disabled" : ""} aria-label="Move ${escapeHtml(displayName)} earlier">&uarr;</button>
        <button type="button" data-action="move-cycle" data-cycle-id="${cycle.id}" data-direction="1" ${index === state.cycles.length - 1 ? "disabled" : ""} aria-label="Move ${escapeHtml(displayName)} later">&darr;</button>
        <button class="delete" type="button" data-action="delete-cycle" data-cycle-id="${cycle.id}" ${removeDisabled ? "disabled" : ""}>Remove</button>
      </div>
    </header>`;

    if (isRestCycle(cycle)) {
      return `<article class="settings-card cycle-settings-card is-rest-cycle" data-cycle-card="${cycle.id}">
        ${header}
        <span class="cycle-kind-label">Rest day</span>
        <label class="form-field"><span>Rest day name <small>optional</small></span><input data-cycle-setting="name" data-cycle-id="${cycle.id}" maxlength="80" value="${escapeHtml(cycle.name)}" placeholder="Rest day" /></label>
        <p class="rest-cycle-copy">This entry consumes its place in the rotation. The separate <strong>Rest today</strong> control still pauses the rotation without consuming an entry.</p>
        <label class="form-field"><span>Description</span><textarea data-cycle-setting="description" data-cycle-id="${cycle.id}" maxlength="600" rows="4">${escapeHtml(cycle.description)}</textarea></label>
      </article>`;
    }

    return `<article class="settings-card cycle-settings-card" data-cycle-card="${cycle.id}">
      ${header}
      <label class="form-field"><span>Cycle name <small>optional</small></span><input data-cycle-setting="name" data-cycle-id="${cycle.id}" maxlength="80" value="${escapeHtml(cycle.name)}" placeholder="Cycle ${index + 1}" /></label>
      <label class="form-field"><span>Training target</span><input data-cycle-setting="designation" data-cycle-id="${cycle.id}" maxlength="80" value="${escapeHtml(cycleTargetLabel(cycle))}" placeholder="e.g. Upper body, Pull, or Chest" /></label>
      <details class="body-part-settings">
        <summary>${cycle.bodyParts.length ? `${cycle.bodyParts.length} target muscle${cycle.bodyParts.length === 1 ? "" : "s"}` : "All qualifying muscles"}</summary>
        <div class="body-part-options">
          ${bodyPartOptions()
            .map(
              (part) =>
                `<label><input type="checkbox" data-cycle-body-part="${escapeHtml(part)}" data-cycle-id="${cycle.id}" ${cycle.bodyParts.includes(part) ? "checked" : ""} /> ${escapeHtml(part)}</label>`,
            )
            .join("")}
          <small>Choose the muscles included in this designation. An exercise qualifies when it works at least one selected muscle.</small>
          <button class="button button-quiet body-part-apply" type="button" data-action="apply-cycle-body-parts" data-cycle-id="${cycle.id}">Apply target muscles</button>
        </div>
      </details>
      <label class="form-field"><span>Description</span><textarea data-cycle-setting="description" data-cycle-id="${cycle.id}" maxlength="600" rows="4">${escapeHtml(cycle.description)}</textarea></label>
    </article>`;
  }

  function splitEntryDetails(entryId) {
    if (entryId === "rest") return { label: "Rest", bodyParts: [] };
    const cycle = reusableCycleForId(entryId);
    return {
      label: cycle?.name || entryId,
      bodyParts: cycle?.bodyParts || [],
    };
  }

  function splitCycleOptions(selectedCycleId) {
    return [
      `<option value="rest" ${selectedCycleId === "rest" ? "selected" : ""}>Rest day</option>`,
      ...allReusableCycles().map(
        (cycle) =>
          `<option value="${escapeHtml(cycle.id)}" ${selectedCycleId === cycle.id ? "selected" : ""}>${escapeHtml(cycle.name)}${cycle.template ? " (template)" : ""}</option>`,
      ),
    ].join("");
  }

  function renderSplitEditor() {
    const editor = document.getElementById("split-editor");
    const draft = ui.splitDraft;
    if (!draft) {
      editor.innerHTML = "";
      return;
    }
    const source = splitForId(ui.editingSplitId);
    const createsCustom = source?.template !== false;
    editor.innerHTML = `<section class="split-editor-panel">
      <header>
        <div><span class="eyebrow">${createsCustom ? "New custom split" : "Custom split"}</span><h3>${createsCustom ? `Customize ${escapeHtml(source?.name || "split")}` : `Edit ${escapeHtml(source?.name || draft.name)}`}</h3><p>${createsCustom ? "The original template stays unchanged. Saving creates a named custom split." : "Changes update this reusable custom split; use Add split when you are ready to apply it."}</p></div>
        <button class="button button-quiet" type="button" data-action="cancel-split-edit">Close editor</button>
      </header>
      <label class="form-field split-name-field"><span>Custom split name</span><input data-split-draft-name="true" maxlength="80" value="${escapeHtml(draft.name)}" placeholder="Name this split" /></label>
      <div class="split-day-editor-list">
        ${draft.entries
          .map(
            (entry, index) => `<div class="split-day-editor-row">
              <strong>Day ${index + 1}</strong>
              <label><span>Cycle</span><select data-split-entry-index="${index}" aria-label="Cycle assigned to Day ${index + 1}">${splitCycleOptions(entry)}</select></label>
              <div class="split-day-actions">
                <button type="button" data-action="edit-cycle-definition" data-cycle-definition-id="${escapeHtml(entry)}" ${entry === "rest" ? "disabled" : ""}>Edit cycle</button>
                <button type="button" data-action="move-split-day" data-entry-index="${index}" data-direction="-1" ${index === 0 ? "disabled" : ""} aria-label="Move Day ${index + 1} earlier">&uarr;</button>
                <button type="button" data-action="move-split-day" data-entry-index="${index}" data-direction="1" ${index === draft.entries.length - 1 ? "disabled" : ""} aria-label="Move Day ${index + 1} later">&darr;</button>
                <button class="delete" type="button" data-action="remove-split-day" data-entry-index="${index}" ${draft.entries.length <= 1 ? "disabled" : ""}>Remove</button>
              </div>
            </div>`,
          )
          .join("")}
      </div>
      <footer>
        <button class="button button-quiet" type="button" data-action="add-split-day" ${draft.entries.length >= 16 ? "disabled" : ""}>+ Add day</button>
        <button class="button button-primary" type="button" data-action="save-custom-split">Save custom split</button>
      </footer>
    </section>`;
  }

  function renderCycleManager() {
    const manager = document.getElementById("split-cycle-manager");
    if (!ui.showCycleManager) {
      manager.innerHTML = "";
      return;
    }
    const draft = ui.cycleDraft;
    manager.innerHTML = `<section class="split-cycle-manager-panel">
      <header>
        <div><span class="eyebrow">Reusable cycle library</span><h3>Edit cycles</h3><p>Name each cycle and choose every muscle it may target. Splits can assign the same cycle to multiple Day positions.</p></div>
        <button class="button button-quiet" type="button" data-action="toggle-cycle-manager">Close cycles</button>
      </header>
      ${
        draft
          ? `<div class="cycle-definition-editor">
              <header><strong>${draft.customId ? "Edit custom cycle" : draft.sourceId ? "Create a custom cycle" : "Add cycle"}</strong><span>${draft.sourceId && !draft.customId ? "The template remains unchanged; saving creates a custom cycle." : "This cycle can be used in any custom split."}</span></header>
              <label class="form-field"><span>Cycle name</span><input data-cycle-draft-name="true" maxlength="80" value="${escapeHtml(draft.name)}" placeholder="e.g. Upper strength" /></label>
              <fieldset class="cycle-muscle-picker"><legend>Muscles worked</legend><div>${bodyPartOptions()
                .map(
                  (part) =>
                    `<label><input type="checkbox" data-cycle-draft-body-part="${escapeHtml(part)}" ${draft.bodyParts.includes(part) ? "checked" : ""} /> ${escapeHtml(part)}</label>`,
                )
                .join("")}</div></fieldset>
              <div class="cycle-definition-editor-actions"><button class="button button-quiet" type="button" data-action="cancel-cycle-edit">Cancel</button><button class="button button-primary" type="button" data-action="save-cycle-definition">Save cycle</button></div>
            </div>`
          : ""
      }
      <div class="cycle-definition-list">
        ${allReusableCycles()
          .map(
            (cycle) => `<article class="cycle-definition-card">
              <header><div><strong>${escapeHtml(cycle.name)}</strong><span>${cycle.template ? "Template cycle" : "Custom cycle"}</span></div><div><button class="button button-quiet" type="button" data-action="edit-cycle-definition" data-cycle-definition-id="${escapeHtml(cycle.id)}">Edit cycle</button>${cycle.template ? "" : `<button class="button button-danger" type="button" data-action="delete-cycle-definition" data-cycle-definition-id="${escapeHtml(cycle.id)}">Delete</button>`}</div></header>
              <div class="cycle-muscle-pills">${cycle.bodyParts.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}</div>
            </article>`,
          )
          .join("")}
      </div>
    </section>`;
  }

  function renderSplitOptions() {
    document.getElementById("split-options").innerHTML = allSplitDefinitions()
      .map((split) => {
        const isCurrent = state.activeSplitId === split.id;
        const isSelected = ui.selectedSplitId === split.id;
        return `<article class="split-option ${isCurrent ? "is-active" : ""} ${isSelected ? "is-selected" : ""}">
          <header><div><small>${split.template ? "Template" : "Custom split"}</small><strong>${escapeHtml(split.name)}</strong><span>${escapeHtml(split.description)}</span></div><div class="split-option-status">${isCurrent ? "<em>Current</em>" : ""}${isSelected ? '<em class="is-selection">Selected</em>' : ""}</div></header>
          <div class="split-sequence" aria-label="${escapeHtml(split.name)} rotation">
            ${split.entries
              .map((entry, index) => {
                const details = splitEntryDetails(entry);
                return `<span class="${entry === "rest" ? "is-rest" : ""}"><small>Day ${index + 1}</small>${escapeHtml(details.label)}</span>`;
              })
              .join("")}
          </div>
          <div class="split-option-actions">
            <button class="button ${isSelected ? "button-quiet" : "button-primary"}" type="button" data-action="select-split" data-split-id="${escapeHtml(split.id)}" aria-pressed="${isSelected}">${isSelected ? "Selected" : "Select split"}</button>
            <button class="button button-quiet" type="button" data-action="edit-split" data-split-id="${escapeHtml(split.id)}">Edit split</button>
          </div>
        </article>`;
      })
      .join("");
  }

  function renderSplitDialog() {
    renderCycleManager();
    renderSplitEditor();
    renderSplitOptions();
  }

  function openSplitDialog() {
    ui.selectedSplitId =
      state.activeSplitId && splitForId(state.activeSplitId)
        ? state.activeSplitId
        : SPLIT_PRESETS[0].id;
    ui.splitWeekStartDay = state.splitWeekStartDay || "monday";
    ui.editingSplitId = null;
    ui.splitDraft = null;
    ui.showCycleManager = false;
    ui.editingCycleId = null;
    ui.cycleDraft = null;
    renderSplitDialog();
    document.getElementById("split-week-start").value = ui.splitWeekStartDay;
    document.getElementById("split-dialog").showModal();
  }

  function renderSettings() {
    const coverage = bodyPartCoverage();
    const activeSplit = splitForId(state.activeSplitId);
    document.getElementById("settings-view").innerHTML = `
      <div class="content-frame">
        <header class="view-header">
          <div>
            <span class="eyebrow">Continuous training rotation</span>
            <h1>Workout <span>cycles</span></h1>
            <p class="view-subtitle">Choose a split, define its reusable cycles, and arrange a 1&ndash;16 day rotation independent of weekdays. Scheduled rest entries advance the rotation; calendar rest days defer the pending entry.</p>
          </div>
        </header>
        ${renderRoutineSettingsPanel("warmup", state.warmupExercises)}
        <hr class="settings-section-divider" aria-hidden="true" />
        <div class="cycle-section-heading">
          <div><span class="eyebrow">Rotation sequence</span><h2>Active split</h2></div>
          <div class="cycle-section-actions">
            <span class="current-split-status">Current split <strong>${activeSplit ? escapeHtml(activeSplit.name) : "Custom rotation"}</strong></span>
            <button class="button button-primary" type="button" data-action="open-split-dialog">+ Edit splits</button>
          </div>
        </div>
        <div class="cycle-sequence-summary">
          <strong>${activeSplit ? `${escapeHtml(activeSplit.name)} &middot; ` : ""}${state.cycles.length} rotation entr${state.cycles.length === 1 ? "y" : "ies"}</strong>
          <span>${state.cycles
            .map((cycle, index) => {
              const name = cycleDisplayName(cycle, index);
              const target = cycleTargetLabel(cycle);
              return escapeHtml(name === target ? name : `${name}: ${target}`);
            })
            .join(" &rarr; ")}</span>
          <button class="coverage-toggle" type="button" data-action="toggle-body-part-coverage" aria-expanded="${ui.showBodyPartCoverage}">Body-part coverage</button>
        </div>
        ${
          ui.showBodyPartCoverage
            ? `<section class="body-part-coverage-panel" aria-label="Body-part coverage throughout cycles">
                <header><strong>Body-part coverage</strong><span>Number of cycles that target each body part; warm-up and cool-down items are excluded</span></header>
                <div class="body-part-coverage-list">
                  ${coverage
                    .map(
                      ({ bodyPart, count }) =>
                        `<div class="body-part-coverage-item" data-body-part-coverage="${escapeHtml(bodyPart)}"><span>${escapeHtml(bodyPart)}</span><strong>${count}</strong></div>`,
                    )
                    .join("")}
                </div>
              </section>`
            : ""
        }
        <hr class="settings-section-divider" aria-hidden="true" />
        ${renderRoutineSettingsPanel("cooldown", state.cooldownExercises)}
      </div>`;
  }

  function render() {
    const complete = completedCircuits();
    const circuitTotal = enabledDays().length * 3;
    document.getElementById("week-number").textContent =
      `Week ${state.weekNumber}`;
    document.getElementById("week-date").textContent = formatDate(
      state.weekStartedAt,
    );
    document.getElementById("week-progress-label").textContent =
      `${complete} of ${circuitTotal} circuits complete`;
    document.getElementById("week-progress-bar").style.width =
      `${circuitTotal ? (complete / circuitTotal) * 100 : 0}%`;
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
    updateWorkoutTimer();
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
    if (context.position === "optionalActivator")
      return optionalActivatorSlot(targetIdForDay(context.dayId));
    const definition = circuitDefinitionsForDay(context.dayId)[
      context.circuitIndex
    ];
    if (context.position === "extra-new") return definition.extra;
    const assignment = assignmentFor(context);
    return definition[
      assignment?.slotKey ||
        (context.position?.startsWith("extra") ? "extra" : context.position)
    ];
  }

  function assignmentFor(context) {
    const circuit =
      state.week.days[context.dayId].circuits[context.circuitIndex];
    if (context.position?.startsWith("extra-")) {
      return circuit.extras[Number(context.position.split("-")[1])];
    }
    if (context.position === "extra-new") return null;
    return circuit[context.position];
  }

  function adjacentExercises(context) {
    if (context.position === "optionalActivator") return [];
    const circuit =
      state.week.days[context.dayId].circuits[context.circuitIndex];
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
    if (context.position === "optionalActivator") return [];
    const circuit =
      state.week.days[context.dayId].circuits[context.circuitIndex];
    const current = assignmentFor(context);
    return mainAssignments(circuit)
      .filter((assignment) => !current || assignment !== current)
      .map((assignment) => exerciseById.get(assignment.exerciseId))
      .filter(Boolean);
  }

  function automaticTransitionCost(exercise, context) {
    const adjacent = adjacentExercises(context);
    return adjacent.length
      ? Math.max(
          ...adjacent.map((partner) => transitionCost(exercise, partner)),
        )
      : 0;
  }

  function positionIndex(position) {
    if (position === "first") return 0;
    if (position === "second") return 1;
    if (position?.startsWith("extra-"))
      return Number(position.split("-")[1]) + 2;
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
      if (transitionCost(previous, current) > 2)
        assignments[index].manualOverride = true;
    }
  }

  function reorderCircuitExercise(context, direction) {
    const circuit =
      state.week.days[context.dayId].circuits[context.circuitIndex];
    const assignments = mainAssignments(circuit);
    const index = positionIndex(context.position);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= assignments.length) return;
    [assignments[index], assignments[nextIndex]] = [
      assignments[nextIndex],
      assignments[index],
    ];
    const reorderedExercises = assignments.map((assignment) =>
      exerciseById.get(assignment.exerciseId),
    );
    if (
      reorderedExercises.some(
        (exercise, itemIndex) =>
          itemIndex > 0 &&
          !canCombine(reorderedExercises[itemIndex - 1], exercise),
      )
    ) {
      showToast(
        "Two exercises that require both sides cannot be placed together.",
        "error",
      );
      return;
    }
    markManualSetupTransitions(assignments);
    writeMainAssignments(circuit, assignments);
    syncCycleTemplateFromDay(context.dayId);
    clearCircuitSetupScores(circuit);
    resetCircuitCompletion(circuit);
    persist();
    render();
  }

  function deleteCircuitExercise(context) {
    const circuit =
      state.week.days[context.dayId].circuits[context.circuitIndex];
    const assignments = mainAssignments(circuit);
    const index = positionIndex(context.position);
    if (assignments.length <= 2 || index < 0 || assignments[index].locked)
      return;
    const [removed] = assignments.splice(index, 1);
    if (["first", "second"].includes(removed.slotKey)) {
      const promoted = assignments.find(
        (assignment) => assignment.slotKey === "extra",
      );
      if (promoted) {
        promoted.slotKey = removed.slotKey;
        promoted.slotLabel = removed.slotLabel;
        promoted.manualOverride = true;
      }
    }
    const remainingExercises = assignments.map((assignment) =>
      exerciseById.get(assignment.exerciseId),
    );
    if (
      remainingExercises.some(
        (exercise, itemIndex) =>
          itemIndex > 0 &&
          !canCombine(remainingExercises[itemIndex - 1], exercise),
      )
    ) {
      showToast(
        "Removing that exercise would combine two both-sides movements.",
        "error",
      );
      return;
    }
    markManualSetupTransitions(assignments);
    writeMainAssignments(circuit, assignments);
    syncCycleTemplateFromDay(context.dayId);
    clearCircuitSetupScores(circuit);
    stateFor(removed.exerciseId).skippedCount += 1;
    resetCircuitCompletion(circuit);
    persist();
    render();
    showToast(
      `${exerciseById.get(removed.exerciseId).name} removed from this circuit.`,
    );
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
    const previous = Array.from(
      { length: second.length + 1 },
      (_, index) => index,
    );
    const current = new Array(second.length + 1);

    for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
      current[0] = firstIndex;
      for (
        let secondIndex = 1;
        secondIndex <= second.length;
        secondIndex += 1
      ) {
        current[secondIndex] = Math.min(
          current[secondIndex - 1] + 1,
          previous[secondIndex] + 1,
          previous[secondIndex - 1] +
            (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1),
        );
      }
      for (let index = 0; index < current.length; index += 1)
        previous[index] = current[index];
    }

    return previous[second.length];
  }

  function fuzzyTokenScore(queryToken, candidateToken) {
    if (queryToken === candidateToken) return 0;
    if (candidateToken.startsWith(queryToken))
      return 0.08 + (candidateToken.length - queryToken.length) * 0.002;
    if (candidateToken.includes(queryToken))
      return 0.18 + candidateToken.indexOf(queryToken) * 0.01;
    if (queryToken.length < 3) return null;

    const allowedDistance =
      queryToken.length <= 4
        ? 1
        : Math.max(1, Math.floor(queryToken.length * 0.3));
    const distance = editDistance(queryToken, candidateToken);
    if (distance <= allowedDistance)
      return (
        0.32 + distance / Math.max(queryToken.length, candidateToken.length)
      );

    let queryIndex = 0;
    for (const character of candidateToken) {
      if (character === queryToken[queryIndex]) queryIndex += 1;
      if (queryIndex === queryToken.length) {
        const gapRatio =
          (candidateToken.length - queryToken.length) / candidateToken.length;
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
      [exercise.body_parts.join(" "), 0.16],
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
        if (tokenScore !== null)
          best = Math.min(best, tokenScore + candidate.fieldPenalty);
      }
      if (!Number.isFinite(best)) return null;
      score += best;
    }

    return score;
  }

  function matchesAutomaticReplacementEligibility(exercise, context) {
    if (!exercise || !context) return false;
    if (
      context.position === "optionalActivator" &&
      !exercise.total_body_activator
    ) {
      return false;
    }
    if (
      isNoEquipmentTarget(targetIdForDay(context.dayId)) &&
      defaultSetupScore(exercise) !== 5
    ) {
      return false;
    }
    return matchesDayTargetMuscles(exercise, context.dayId);
  }

  function replacementOptions() {
    if (!ui.replacement) return [];
    const assignment = assignmentFor(ui.replacement);
    const used = new Set(allAssignments().map((item) => item.exerciseId));
    if (assignment) used.delete(assignment.exerciseId);
    const search = ui.replaceSearch.trim();

    return exercises
      .map((exercise) => ({
        exercise,
        searchScore: fuzzyExerciseScore(exercise, search),
      }))
      .filter(({ exercise, searchScore }) => {
        if (
          used.has(exercise.id) ||
          isHidden(exercise.id) ||
          isDeleted(exercise.id) ||
          exercise.id === assignment?.exerciseId ||
          (!ui.showAllReplacements &&
            !matchesAutomaticReplacementEligibility(exercise, ui.replacement))
        ) {
          return false;
        }
        if (searchScore === null) return false;
        if (
          ui.replaceBodyPart !== "all" &&
          !exercise.body_parts.includes(ui.replaceBodyPart)
        )
          return false;
        if (
          ui.replaceEquipment !== "all" &&
          !matchesEquipmentSelection(exercise, ui.replaceEquipment)
        )
          return false;
        return true;
      })
      .sort((first, second) => {
        const firstCost = automaticTransitionCost(
          first.exercise,
          ui.replacement,
        );
        const secondCost = automaticTransitionCost(
          second.exercise,
          ui.replacement,
        );
        return (
          first.searchScore - second.searchScore ||
          firstCost - secondCost ||
          exerciseEffectivenessScore(second.exercise) -
            exerciseEffectivenessScore(first.exercise) ||
          stateFor(second.exercise.id).preference -
            stateFor(first.exercise.id).preference ||
          stateFor(second.exercise.id).chosenCount -
            stateFor(first.exercise.id).chosenCount ||
          first.exercise.name.localeCompare(second.exercise.name)
        );
      })
      .map(({ exercise }) => ({
        exercise,
        eligible: matchesAutomaticReplacementEligibility(
          exercise,
          ui.replacement,
        ),
      }));
  }

  function renderReplacementResults() {
    const results = replacementOptions();
    document.getElementById("replace-count").textContent =
      `${results.length} option${results.length === 1 ? "" : "s"}`;
    document.getElementById("replace-results").innerHTML = results.length
      ? results
          .map(
            ({ exercise, eligible }) => `
              <article class="replace-option">
                <div class="replace-option-copy">
                  <strong>${escapeHtml(exercise.name)}</strong>
                  <small class="replace-option-details">
                    <span><em>Muscles</em> ${exercise.body_parts.map(escapeHtml).join(", ")}</span>
                    <span><em>Equipment</em> ${escapeHtml(exercise.equipment_label)}</span>
                    <span>${requiresBothSides(exercise) ? "Both sides · " : ""}Chosen ${stateFor(exercise.id).chosenCount} times${eligible ? "" : " · outside today's target muscles"}</span>
                  </small>
                </div>
                <div class="replace-option-actions">
                  <span class="recommendation-score">Effectiveness ${exerciseEffectivenessScore(exercise)}</span>
                  <button class="replace-option-use" type="button" data-action="choose-replacement" data-exercise-id="${exercise.id}">Use</button>
                </div>
                <button class="replace-option-hide" type="button" data-action="hide-replacement" data-exercise-id="${exercise.id}" title="Hide from future recommendations" aria-label="Hide ${escapeHtml(exercise.name)} from recommendations">${ICONS.eyeOff}<span>Hide</span></button>
              </article>`,
          )
          .join("")
      : '<div class="empty-state">No unused exercises match today\'s target muscles and the selected filters.</div>';
  }

  function openReplacement(context) {
    const assignment = assignmentFor(context);
    if (assignment.locked) return;
    const exercise = exerciseById.get(assignment.exerciseId);
    ui.replacement = context;
    ui.replaceSearch = "";
    ui.showAllReplacements = false;
    ui.replaceBodyPart = "all";
    ui.replaceEquipment = "all";
    document.getElementById("replace-title").textContent =
      `Replace ${exercise.name}`;
    const target = workoutTarget(targetIdForDay(context.dayId));
    const targetParts = targetBodyPartsForDay(context.dayId);
    document.getElementById("replace-description").textContent =
      `Showing unused exercises that target the muscles selected for this ${target.label} day.`;
    document.getElementById("replace-search").value = "";
    document.getElementById("show-all-replacements").checked = false;
    document.getElementById("replace-body-part").innerHTML =
      `<option value="all">All body parts</option>${bodyPartOptions()
        .map(
          (part) =>
            `<option value="${escapeHtml(part)}">${escapeHtml(part)}</option>`,
        )
        .join("")}`;
    document.getElementById("replace-equipment").innerHTML =
      `<option value="all">All equipment</option>${equipmentOptions()
        .map(
          (equipment) =>
            `<option value="${escapeHtml(equipment)}">${escapeHtml(equipment)}</option>`,
        )
        .join("")}`;
    document.getElementById("replacement-target-muscles").innerHTML =
      targetParts.map((part) => `<span>${escapeHtml(part)}</span>`).join("");
    renderReplacementResults();
    document.getElementById("replace-dialog").showModal();
    setTimeout(() => document.getElementById("replace-search").focus(), 0);
  }

  function openAddRoundExercise(dayId, circuitIndex) {
    const circuit = state.week.days[dayId].circuits[circuitIndex];
    if (mainAssignments(circuit).length >= 4) return;
    ui.replacement = {
      dayId,
      circuitIndex,
      position: "extra-new",
      mode: "add",
    };
    ui.replaceSearch = "";
    ui.showAllReplacements = false;
    const recommended = replacementOptions()[0]?.exercise;
    if (!recommended) {
      ui.replacement = null;
      showToast(
        "No unused exercise targeting today's muscles is available for this circuit.",
        "error",
      );
      return;
    }
    replaceExercise(recommended.id);
  }

  function weightedRandomExercise(options) {
    const weighted = options.map((exercise) => {
      const stats = stateFor(exercise.id);
      const preferenceWeight =
        stats.preference === 1 ? 4 : stats.preference === -1 ? 0.25 : 1;
      return {
        exercise,
        weight: preferenceWeight / Math.max(1, stats.chosenCount + 1),
      };
    });
    let draw =
      Math.random() * weighted.reduce((sum, item) => sum + item.weight, 0);
    return (
      weighted.find((item) => {
        draw -= item.weight;
        return draw <= 0;
      })?.exercise || weighted[weighted.length - 1]?.exercise
    );
  }

  function randomReplace(context) {
    const assignment = assignmentFor(context);
    if (!assignment || assignment.locked) return;
    ui.replacement = { ...context, mode: "replace" };
    ui.replaceSearch = "";
    ui.showAllReplacements = false;
    ui.replaceBodyPart = "all";
    ui.replaceEquipment = "all";
    const eligible = replacementOptions().map((option) => option.exercise);
    const unseenEligible = eligible.filter(
      (exercise) => stateFor(exercise.id).chosenCount === 0,
    );
    let candidates = unseenEligible;
    let outsideTarget = false;

    if (!candidates.length) {
      const current = exerciseById.get(assignment.exerciseId);
      const used = new Set(allAssignments().map((item) => item.exerciseId));
      used.delete(assignment.exerciseId);
      const possibleOutside = exercises.filter((exercise) => {
        if (
          used.has(exercise.id) ||
          exercise.id === assignment.exerciseId ||
          isHidden(exercise.id) ||
          isDeleted(exercise.id) ||
          matchesAutomaticReplacementEligibility(exercise, context)
        )
          return false;
        if (
          context.position === "optionalActivator" &&
          !exercise.total_body_activator
        )
          return false;
        if (
          isNoEquipmentTarget(targetIdForDay(context.dayId)) &&
          defaultSetupScore(exercise) !== 5
        )
          return false;
        if (
          !adjacentExercises(context).every((partner) =>
            canCombine(exercise, partner),
          )
        )
          return false;
        if (
          requiresBothSides(exercise) &&
          otherCircuitExercises(context).some(requiresBothSides)
        )
          return false;
        return true;
      });
      const sameBodyPart = possibleOutside.filter((exercise) =>
        exercise.body_parts.some((part) => current.body_parts.includes(part)),
      );
      candidates = sameBodyPart.length ? sameBodyPart : possibleOutside;
      outsideTarget = candidates.length > 0;
    }

    if (!candidates.length) candidates = eligible;
    if (!candidates.length) {
      ui.replacement = null;
      showToast(
        "No unused replacement is available for today's target muscles.",
        "error",
      );
      return;
    }
    const selected = weightedRandomExercise(candidates);
    if (outsideTarget) ui.showAllReplacements = true;
    replaceExercise(selected.id);
  }

  function resetCircuitCompletion(circuit) {
    circuit.roundsCompleted = [false, false, false];
    circuit.completionCredited = false;
  }

  function replaceExercise(exerciseId) {
    if (!ui.replacement) return;
    const assignment = assignmentFor(ui.replacement);
    const next = exerciseById.get(exerciseId);
    if (
      !next ||
      (ui.replacement.position === "optionalActivator" &&
        !next.total_body_activator) ||
      (!ui.showAllReplacements &&
        !matchesAutomaticReplacementEligibility(next, ui.replacement))
    )
      return;

    const circuit =
      state.week.days[ui.replacement.dayId].circuits[
        ui.replacement.circuitIndex
      ];
    if (ui.replacement.position === "optionalActivator") {
      const previous = exerciseById.get(assignment.exerciseId);
      stateFor(previous.id).skippedCount += 1;
      stateFor(next.id).chosenCount += 1;
      circuit.optionalActivator = {
        ...assignment,
        exerciseId: next.id,
        locked: false,
        fixed: false,
        slotLabel: ACTIVATOR_LABEL,
        slotKey: "optionalActivator",
      };
      circuit.optionalActivatorCompleted = false;
      persist();
      if (document.getElementById("replace-dialog").open)
        document.getElementById("replace-dialog").close();
      ui.replacement = null;
      render();
      showToast(`${next.name} selected as the optional activator.`);
      return;
    }
    const manualOverride =
      !matchesSlot(next, slotFor(ui.replacement)) ||
      automaticTransitionCost(next, ui.replacement) > 2 ||
      !adjacentExercises(ui.replacement).every((partner) =>
        canCombine(next, partner),
      ) ||
      (requiresBothSides(next) &&
        otherCircuitExercises(ui.replacement).some(requiresBothSides));
    if (ui.replacement.mode === "add") {
      circuit.extras.push({
        exerciseId: next.id,
        slotLabel: slotFor(ui.replacement).label,
        locked: false,
        fixed: false,
        manualOverride,
        slotKey: "extra",
        setupScore: defaultSetupScore(next),
      });
      circuit.preferredExerciseCount = mainAssignments(circuit).length;
      syncCycleTemplateFromDay(ui.replacement.dayId);
      clearCircuitSetupScores(circuit);
      stateFor(next.id).chosenCount += 1;
      resetCircuitCompletion(circuit);
      persist();
      if (document.getElementById("replace-dialog").open)
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
    clearCircuitSetupScores(circuit);
    resetCircuitCompletion(circuit);
    persist();
    if (document.getElementById("replace-dialog").open)
      document.getElementById("replace-dialog").close();
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
      "Start a new week? This archives the current calendar week, continues with the next cycle in the rotation, keeps cycle locks and saved loads, and clears every checkmark.",
    );
    if (!confirmed) return;

    const backup = JSON.parse(JSON.stringify(state));
    try {
      archiveCurrentWeek();
      state.weekNumber += 1;
      state.weekStartedAt = new Date().toISOString();
      state.weekStartCycleId = state.nextCycleId;
      generateWeek(null, { restDayIds: [] });
      const issues = validateWeek(state.week);
      if (issues.length) throw new Error(issues[0]);
      ui.currentView = enabledDays()[0]?.id || "settings";
      persist();
      render();
      showToast(
        `Week ${state.weekNumber} is ready with blank round checkmarks.`,
      );
    } catch (error) {
      state = normalizeState(backup);
      showToast(`A new week could not be generated: ${error.message}`, "error");
    }
  }

  function exportPayload() {
    const lockedIds = new Set(
      allAssignments()
        .filter((assignment) => assignment.locked)
        .map((assignment) => assignment.exerciseId),
    );
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
        load_progress_count: stateFor(exercise.id).loadProgressCount,
        current_reps: stateFor(exercise.id).reps,
        current_measure: stateFor(exercise.id).measureType,
        current_weight: stateFor(exercise.id).weight,
        current_load_basis: stateFor(exercise.id).loadBasis,
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
          types: [
            {
              description: "Workout JSON",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        await rememberFileHandle(fileHandle);
      }
      const saved = await writeStateToFile(fileHandle, true, true);
      if (!saved)
        showToast(
          "Permission to write the workout file was not granted.",
          "error",
        );
    } catch (error) {
      if (error.name !== "AbortError")
        showToast(
          `The workout file could not be saved: ${error.message}`,
          "error",
        );
    }
  }

  function portableExerciseRecord(exercise) {
    return {
      id: exercise.id,
      name: exercise.name,
      category: exercise.primary_body_part || "Other",
      equipment: exercise.equipment_label || "User-defined",
      equipmentVarieties: exercise.equipment_varieties || [],
      bodyParts: exercise.body_parts || [],
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
      effectivenessScore: exercise.effectiveness_score,
      notes: exercise.notes || null,
    };
  }

  function stateWithPortableExercises(parsed) {
    const candidate = JSON.parse(JSON.stringify(parsed.appState));
    candidate.customExercises = Array.isArray(candidate.customExercises)
      ? candidate.customExercises
      : [];
    rebuildExerciseCatalog(
      candidate.customExercises,
      candidate.exerciseEdits || {},
    );
    const recovered = Array.isArray(parsed.exerciseLibrary)
      ? parsed.exerciseLibrary.filter(
          (exercise) =>
            exercise?.id && exercise?.name && !exerciseById.has(exercise.id),
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
      if (!parsed.appState)
        throw new Error("This is not a Basement 45 save file.");
      if (parsed.appState.version !== APP_VERSION)
        throw new Error(
          "This cycle-based version requires a fresh v18 workout file.",
        );
      const { candidate, recoveredCount } = stateWithPortableExercises(parsed);
      state = normalizeState(candidate);
      const removedLegacyArmsCycle = Boolean(state.needsCycleRegeneration);
      const normalizedCoreCooldown = Boolean(state.needsCooldownNormalization);
      applyPendingStateMigrations();
      ui.currentView = enabledDays()[0]?.id || "settings";
      if (handle) {
        fileHandle = handle;
        await rememberFileHandle(handle);
        setFileStatus(`Autosaving · ${fileDisplayPath(handle)}`, true);
      } else {
        setFileStatus(`Opened · ${fileDisplayPath(file)}`, false);
      }
      persist();
      render();
      showToast(
        `Loaded Week ${state.weekNumber} from ${file.name}.${removedLegacyArmsCycle ? " Removed the retired Arms & upper cycle." : ""}${normalizedCoreCooldown ? " Consolidated the core cool-down into 5 core." : ""}${recoveredCount ? ` Recovered ${recoveredCount} portable library exercise${recoveredCount === 1 ? "" : "s"}.` : ""}`,
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
        types: [
          {
            description: "Workout JSON",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      await loadJson(await handle.getFile(), handle);
    } catch (error) {
      if (error.name !== "AbortError")
        showToast(
          `The workout file could not be opened: ${error.message}`,
          "error",
        );
    }
  }

  function renderEquipmentCatalogDialog() {
    const list = document.getElementById("equipment-catalog-list");
    if (!list) return;
    const catalog = equipmentOptions();
    list.innerHTML = `
      <div class="equipment-catalog-summary"><strong>${catalog.length}</strong> equipment types in your master list</div>
      <div class="equipment-catalog-pills">
        ${catalog
          .map((equipment) => {
            const useCount = exercises.filter((exercise) =>
              matchesEquipmentSelection(exercise, equipment),
            ).length;
            return `<span><strong>${escapeHtml(equipment)}</strong><small>${useCount} exercise${useCount === 1 ? "" : "s"}</small></span>`;
          })
          .join("")}
      </div>`;
  }

  function openEquipmentDialog() {
    const form = document.getElementById("equipment-form");
    form.reset();
    renderEquipmentCatalogDialog();
    document.getElementById("equipment-dialog").showModal();
    setTimeout(() => form.elements.equipmentName.focus(), 0);
  }

  function saveEquipmentForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const requestedName = String(data.get("equipmentName") || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    const name = equipmentOptionLabel(requestedName);
    const key = equipmentFilterKey(name);
    const existing = equipmentOptions().find(
      (equipment) => equipmentFilterKey(equipment) === key,
    );
    if (!name || !key) return;
    if (existing) {
      showToast(`${existing} is already in the equipment list.`, "error");
      form.elements.equipmentName.focus();
      return;
    }
    state.equipmentCatalog = normalizeEquipmentCatalog([
      ...state.equipmentCatalog,
      name,
    ]);
    persist();
    form.reset();
    renderEquipmentCatalogDialog();
    renderLibrary();
    showToast(`${name} added to the master equipment list.`);
    form.elements.equipmentName.focus();
  }

  function openExerciseDialog(options = {}) {
    const form = document.getElementById("exercise-form");
    ui.editingExerciseId = null;
    ui.returnToReplacementAfterExerciseAdd = Boolean(options.fromReplacement);
    form.reset();
    const categories = categoryOptions();
    document.getElementById("custom-category").innerHTML = categories
      .map(
        (category) =>
          `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
      )
      .join("");
    document.getElementById("exercise-body-part-options").innerHTML =
      bodyPartOptions()
        .map(
          (part) => `<label>
            <input type="checkbox" name="bodyParts" value="${escapeHtml(part)}" />
            <span>${escapeHtml(part)}</span>
          </label>`,
        )
        .join("");
    document.getElementById("exercise-equipment-options").innerHTML =
      equipmentOptions()
        .map(
          (equipment) => `<label>
            <input type="checkbox" name="equipmentVarieties" value="${escapeHtml(equipment)}" />
            <span>${escapeHtml(equipment)}</span>
          </label>`,
        )
        .join("");
    document.getElementById("exercise-dialog-title").textContent =
      "Add an exercise";
    document.getElementById("exercise-dialog-description").textContent =
      "Select every body part it trains; its primary category and movement fields determine where it can safely appear.";
    document.getElementById("exercise-form-submit").textContent =
      "Add to library";
    document.getElementById("exercise-dialog").showModal();
    setTimeout(() => form.elements.name.focus(), 0);
  }

  function openEditExerciseDialog(exerciseId) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise) return;
    openExerciseDialog();
    ui.editingExerciseId = exerciseId;
    const form = document.getElementById("exercise-form");
    const exerciseSettings = stateFor(exerciseId);
    const setValue = (name, value) => {
      form.elements[name].value = value ?? "";
    };
    setValue("name", exercise.name);
    setValue("category", exercise.primary_body_part);
    const bodyPartInputs = document
      .getElementById("exercise-body-part-options")
      .querySelectorAll?.('input[name="bodyParts"]');
    bodyPartInputs?.forEach((input) => {
      input.checked = exercise.body_parts.includes(input.value);
    });
    setValue("equipment", exercise.equipment_label);
    const equipmentInputs = document
      .getElementById("exercise-equipment-options")
      .querySelectorAll?.('input[name="equipmentVarieties"]');
    equipmentInputs?.forEach((input) => {
      input.checked = exercise.equipment_varieties.some(
        (equipment) =>
          equipmentFilterKey(equipment) === equipmentFilterKey(input.value),
      );
    });
    setValue("movementPattern", exercise.movement_pattern);
    setValue("movementRole", exercise.movement_role);
    setValue("forceType", exercise.force_type);
    setValue("measureType", exerciseSettings.measureType);
    setValue("defaultReps", exerciseSettings.reps);
    setValue("defaultLoad", exerciseSettings.weight);
    setValue("loadBasis", exerciseSettings.loadBasis);
    setValue("effectivenessScore", exercise.effectiveness_score);
    setValue("instructionUrl", exercise.instruction_url);
    setValue("notes", exercise.notes);
    form.elements.shoulderCaution.checked = exercise.shoulder_caution;
    form.elements.backCaution.checked = exercise.back_caution;
    form.elements.totalBodyActivator.checked = exercise.total_body_activator;
    form.elements.bothSides.checked = exercise.unilateral;
    document.getElementById("exercise-dialog-title").textContent =
      `Edit ${exercise.name}`;
    document.getElementById("exercise-dialog-description").textContent =
      "Changes apply throughout the library and current workout while preserving history.";
    document.getElementById("exercise-form-submit").textContent =
      "Save changes";
  }

  function saveExerciseForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const exerciseId = idFor(name);
    const defaultReps = String(data.get("defaultReps") || "10").trim() || "10";
    const measureType = ["reps", "seconds"].includes(
      String(data.get("measureType")),
    )
      ? String(data.get("measureType"))
      : /sec|second/i.test(defaultReps)
        ? "seconds"
        : "reps";
    const defaultLoad = String(data.get("defaultLoad") || "")
      .trim()
      .slice(0, 40);
    const loadBasis = ["total", "each"].includes(String(data.get("loadBasis")))
      ? String(data.get("loadBasis"))
      : "total";
    if (
      !ui.editingExerciseId &&
      (!exerciseId || exerciseById.has(exerciseId))
    ) {
      showToast("An exercise with that name already exists.", "error");
      return;
    }

    const equipmentVarieties = normalizeEquipmentCatalog(
      typeof data.getAll === "function"
        ? data.getAll("equipmentVarieties")
        : String(data.get("equipmentVarieties") || "")
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean),
    );
    const record = {
      name,
      category: String(data.get("category") || "Other"),
      equipment: String(data.get("equipment") || "User-defined").trim(),
      equipmentVarieties,
      bodyParts: normalizeBodyParts(
        typeof data.getAll === "function"
          ? data.getAll("bodyParts")
          : data.get("bodyParts"),
      ),
      instructionUrl: String(data.get("instructionUrl") || "").trim() || null,
      sourceRow: null,
      custom: true,
      movementPattern: String(data.get("movementPattern") || "other"),
      movementRole: String(data.get("movementRole") || "isolation"),
      forceType: String(data.get("forceType") || "other"),
      defaultReps,
      effectivenessScore: clampRating(data.get("effectivenessScore"), 3),
      shoulderCaution: data.get("shoulderCaution") === "on",
      backCaution: data.get("backCaution") === "on",
      totalBodyActivator: data.get("totalBodyActivator") === "on",
      bothSides: data.get("bothSides") === "on",
      notes: String(data.get("notes") || "").trim() || null,
    };

    const wasEditing = Boolean(ui.editingExerciseId);
    const replacementContext =
      !wasEditing && ui.returnToReplacementAfterExerciseAdd && ui.replacement
        ? { ...ui.replacement }
        : null;
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
        showToast(
          `That edit conflicts with the current plan: ${issues[0]}`,
          "error",
        );
        return;
      }
    } else {
      state.customExercises.push(record);
      rebuildExerciseCatalog(state.customExercises, state.exerciseEdits);
      stateFor(exerciseId);
    }
    const savedExerciseId = ui.editingExerciseId || exerciseId;
    state.equipmentCatalog = normalizeEquipmentCatalog([
      ...state.equipmentCatalog,
      ...equipmentVarieties,
      ...(exerciseById.get(savedExerciseId)?.equipment_varieties || []),
    ]);
    const savedSettings = stateFor(savedExerciseId);
    if (savedSettings.weight !== defaultLoad)
      savedSettings.loadProgressCount = 0;
    savedSettings.reps = cleanRepValue(defaultReps).slice(0, 40);
    savedSettings.measureType = measureType;
    savedSettings.weight = defaultLoad;
    savedSettings.loadBasis = loadBasis;
    persist();
    renderTabs();
    document.getElementById("exercise-dialog").close();
    render();
    showToast(
      wasEditing
        ? `${name} updated.`
        : `${name} added to the exercise library.`,
    );
    ui.editingExerciseId = null;
    ui.returnToReplacementAfterExerciseAdd = false;
    if (replacementContext) openReplacement(replacementContext);
  }

  function toggleHiddenExercise(exerciseId, options = {}) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise || exercise.always_locked || isDeleted(exerciseId)) return;
    const shouldHide = options.hideOnly || !isHidden(exerciseId);
    if (!shouldHide) {
      state.hiddenExerciseIds = state.hiddenExerciseIds.filter(
        (id) => id !== exerciseId,
      );
      showToast(`${exercise.name} restored to recommendations.`);
    } else {
      if (!isHidden(exerciseId)) state.hiddenExerciseIds.push(exerciseId);
      showToast(`${exercise.name} hidden from future recommendations.`);
    }
    persist();
    render();
    if (document.getElementById("replace-dialog").open)
      renderReplacementResults();
  }

  function deleteLibraryExercise(exerciseId) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise || exercise.always_locked || isDeleted(exerciseId)) return;
    const inCurrentWeek = allAssignments().some(
      (assignment) => assignment.exerciseId === exerciseId,
    );
    const message = inCurrentWeek
      ? `Delete ${exercise.name} from the library? It will remain in the current week until you replace it, but will not be recommended again.`
      : `Delete ${exercise.name} from the library and future recommendations?`;
    if (!window.confirm(message)) return;
    state.deletedExerciseIds.push(exerciseId);
    state.hiddenExerciseIds = state.hiddenExerciseIds.filter(
      (id) => id !== exerciseId,
    );
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

  function cycleDaysWithProgress(cycleId = null) {
    return DAY_CONFIG.filter((day) => {
      const dayData = state.week.days[day.id];
      return (
        (!cycleId || dayData.cycleId === cycleId) &&
        workoutDayHasProgress(dayData)
      );
    });
  }

  function rebuildCycleSchedule(options, successMessage) {
    const previousWeek = JSON.parse(JSON.stringify(state.week));
    try {
      generateWeek(previousWeek, {
        restDayIds: state.week.restDayIds,
        cycleOverrides: state.week.cycleOverrides,
        preserveMatching: options.preserveMatching !== false,
        forceCycleIds: options.forceCycleIds || [],
        forceDayIds: options.forceDayIds || [],
        trackChanges: true,
      });
      const issues = validateWeek(state.week);
      if (issues.length) throw new Error(issues[0]);
      persist();
      render();
      showToast(successMessage);
      return true;
    } catch (error) {
      showToast(
        `The cycle schedule could not be updated: ${error.message}`,
        "error",
      );
      return false;
    }
  }

  function toggleRestDay(dayId) {
    const dayIndex = DAY_CONFIG.findIndex((day) => day.id === dayId);
    if (dayIndex < 0) return;
    const affectedProgress = DAY_CONFIG.slice(dayIndex).some((day) =>
      workoutDayHasProgress(state.week.days[day.id]),
    );
    const isRest = state.week.restDayIds.includes(dayId);
    if (
      affectedProgress &&
      !window.confirm(
        `${isRest ? "Restoring" : "Resting"} ${state.week.days[dayId].day} shifts this day and every later cycle assignment. Affected workout progress will be cleared. Continue?`,
      )
    )
      return;
    const backup = JSON.parse(JSON.stringify(state));
    state.week.restDayIds = isRest
      ? state.week.restDayIds.filter((id) => id !== dayId)
      : [...state.week.restDayIds, dayId];
    if (
      !rebuildCycleSchedule(
        { preserveMatching: true },
        isRest
          ? `${state.week.days[dayId].day} is a training day again.`
          : `${DAY_CONFIG[dayIndex].name} is now a rest day. Later cycles shifted forward.`,
      )
    ) {
      state = normalizeState(backup);
    }
  }

  function selectDayCycle(dayId, cycleId) {
    const dayIndex = DAY_CONFIG.findIndex((day) => day.id === dayId);
    const selectedCycle = cycleForId(cycleId);
    const dayData = state.week.days[dayId];
    const scheduledCycleId =
      dayData?.restSource === "calendar"
        ? dayData.pendingCycleId
        : dayData?.cycleId;
    if (
      dayIndex < 0 ||
      !dayData ||
      !selectedCycle ||
      scheduledCycleId === selectedCycle.id
    )
      return;
    const affectedDays = DAY_CONFIG.slice(dayIndex);
    if (
      affectedDays.some((day) =>
        workoutDayHasProgress(state.week.days[day.id]),
      ) &&
      !window.confirm(
        `Changing ${dayData.day} to ${cycleDisplayName(selectedCycle)} skips to that point in the rotation and regenerates this day and every later day. Affected workout progress will be cleared. Continue?`,
      )
    ) {
      renderWorkout(dayId);
      return;
    }

    const backup = JSON.parse(JSON.stringify(state));
    state.week.restDayIds = state.week.restDayIds.filter((id) => id !== dayId);
    state.week.cycleOverrides ||= {};
    for (const day of affectedDays) {
      delete state.week.cycleOverrides[day.id];
    }
    state.week.cycleOverrides[dayId] = selectedCycle.id;
    if (
      !rebuildCycleSchedule(
        {
          preserveMatching: true,
          forceDayIds: affectedDays.map((day) => day.id),
        },
        `${dayData.day} now uses ${cycleDisplayName(selectedCycle)}. The rotation continues from there.`,
      )
    ) {
      state = normalizeState(backup);
      render();
    }
  }

  function confirmWholeScheduleChange(message) {
    return (
      !cycleDaysWithProgress().length ||
      window.confirm(
        `${message} Affected workout progress will be cleared. Continue?`,
      )
    );
  }

  function nextRoutineId(exercises, prefix) {
    const used = new Set(exercises.map((exercise) => exercise.id));
    let index = 1;
    while (used.has(`${prefix}-${index}`)) index += 1;
    return `${prefix}-${index}`;
  }

  function moveRoutineExercise(exercises, exerciseId, direction, label) {
    const index = exercises.findIndex((exercise) => exercise.id === exerciseId);
    const nextIndex = index + Number(direction);
    if (index < 0 || nextIndex < 0 || nextIndex >= exercises.length) return;
    [exercises[index], exercises[nextIndex]] = [
      exercises[nextIndex],
      exercises[index],
    ];
    persist();
    renderSettings();
    showToast(`${label} order updated.`);
  }

  function addWarmupExercise() {
    if (state.warmupExercises.length >= 24) return;
    const exercise = {
      id: nextRoutineId(state.warmupExercises, "warmup"),
      label: "New warm-up exercise",
    };
    state.warmupExercises.push(exercise);
    for (const day of DAY_CONFIG) {
      state.week.days[day.id].preChecklist ||= {};
      state.week.days[day.id].preChecklist[exercise.id] = false;
    }
    persist();
    renderSettings();
    showToast("Warm-up exercise added.");
  }

  function deleteWarmupExercise(warmupId) {
    const index = state.warmupExercises.findIndex(
      (exercise) => exercise.id === warmupId,
    );
    if (index < 0) return;
    const [removed] = state.warmupExercises.splice(index, 1);
    for (const day of DAY_CONFIG) {
      delete state.week.days[day.id].preChecklist?.[warmupId];
    }
    persist();
    renderSettings();
    showToast(`${removed.label} removed from the warm-up.`);
  }

  function addCooldownExercise() {
    if (state.cooldownExercises.length >= 24) return;
    const exercise = {
      id: nextRoutineId(state.cooldownExercises, "cooldown"),
      label: "New cool-down exercise",
    };
    state.cooldownExercises.push(exercise);
    for (const day of DAY_CONFIG) {
      state.week.days[day.id].cooldownChecklist ||= {};
      state.week.days[day.id].cooldownChecklist[exercise.id] = false;
    }
    persist();
    renderSettings();
    showToast("Cool-down exercise added.");
  }

  function deleteCooldownExercise(cooldownId) {
    const index = state.cooldownExercises.findIndex(
      (exercise) => exercise.id === cooldownId,
    );
    if (index < 0) return;
    const [removed] = state.cooldownExercises.splice(index, 1);
    for (const day of DAY_CONFIG) {
      delete state.week.days[day.id].cooldownChecklist?.[cooldownId];
    }
    persist();
    renderSettings();
    showToast(`${removed.label} removed from the cool-down.`);
  }

  function addCycle() {
    if (state.cycles.length >= 16) return;
    if (
      !confirmWholeScheduleChange(
        "Adding a cycle may shift this week's rotation.",
      )
    )
      return;
    const backup = JSON.parse(JSON.stringify(state));
    const id = `cycle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    state.activeSplitId = null;
    state.cycles.push({
      id,
      kind: "training",
      name: "",
      target: "total_body",
      designation: "Full body",
      bodyParts: [],
      description: "A flexible total-body training cycle.",
      circuitExerciseCounts: [null, null, null],
      lockedAssignments: [],
    });
    if (
      !rebuildCycleSchedule(
        { preserveMatching: true },
        `Cycle ${state.cycles.length} added to the rotation.`,
      )
    ) {
      state = normalizeState(backup);
      render();
    }
  }

  function addRestCycle() {
    if (state.cycles.length >= 16) return;
    if (
      !confirmWholeScheduleChange(
        "Adding a rest day may shift this week's rotation.",
      )
    )
      return;
    const backup = JSON.parse(JSON.stringify(state));
    const id = `rest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    state.activeSplitId = null;
    state.cycles.push({
      id,
      kind: "rest",
      name: "",
      target: null,
      bodyParts: [],
      description: "A scheduled recovery day that advances the rotation.",
      circuitExerciseCounts: [null, null, null],
      lockedAssignments: [],
    });
    if (
      !rebuildCycleSchedule(
        { preserveMatching: true },
        "Rest day added to the rotation.",
      )
    ) {
      state = normalizeState(backup);
      render();
    }
  }

  function moveCycle(cycleId, direction) {
    const index = state.cycles.findIndex((cycle) => cycle.id === cycleId);
    const nextIndex = index + Number(direction);
    if (index < 0 || nextIndex < 0 || nextIndex >= state.cycles.length) return;
    if (
      !confirmWholeScheduleChange(
        "Reordering cycles changes this week's rotation.",
      )
    )
      return;
    const backup = JSON.parse(JSON.stringify(state));
    state.activeSplitId = null;
    [state.cycles[index], state.cycles[nextIndex]] = [
      state.cycles[nextIndex],
      state.cycles[index],
    ];
    if (
      !rebuildCycleSchedule({ preserveMatching: true }, "Cycle order updated.")
    ) {
      state = normalizeState(backup);
      render();
    }
  }

  function deleteCycle(cycleId) {
    const index = state.cycles.findIndex((cycle) => cycle.id === cycleId);
    if (index < 0) return;
    const cycle = state.cycles[index];
    if (
      !isRestCycle(cycle) &&
      state.cycles.filter((item) => !isRestCycle(item)).length <= 1
    ) {
      showToast("Keep at least one training cycle in the rotation.", "error");
      return;
    }
    if (
      !confirmWholeScheduleChange(
        `Removing ${cycleDisplayName(cycle, index)} changes this week's rotation.`,
      )
    )
      return;
    const backup = JSON.parse(JSON.stringify(state));
    state.activeSplitId = null;
    const nextCycle = state.cycles[(index + 1) % state.cycles.length];
    state.cycles.splice(index, 1);
    if (state.weekStartCycleId === cycleId)
      state.weekStartCycleId = nextCycle.id;
    if (state.nextCycleId === cycleId) state.nextCycleId = nextCycle.id;
    state.favoriteCircuits = state.favoriteCircuits.filter(
      (favorite) => favorite.cycleId !== cycleId,
    );
    if (
      !rebuildCycleSchedule(
        { preserveMatching: true },
        `${cycleDisplayName(cycle, index)} removed.`,
      )
    ) {
      state = normalizeState(backup);
      render();
    }
  }

  function newDefinitionId(prefix, values) {
    const used = new Set(values.map((value) => value.id));
    let id;
    do {
      id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    } while (used.has(id));
    return id;
  }

  function openSplitEditor(splitId) {
    const split = splitForId(splitId);
    if (!split) return;
    ui.editingSplitId = split.id;
    ui.splitDraft = {
      customId: split.template ? null : split.id,
      name: split.template ? `${split.name} custom` : split.name,
      description: split.description,
      entries: [...split.entries],
    };
    renderSplitDialog();
  }

  function moveSplitDay(entryIndex, direction) {
    if (!ui.splitDraft) return;
    const index = Number(entryIndex);
    const nextIndex = index + Number(direction);
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      nextIndex < 0 ||
      nextIndex >= ui.splitDraft.entries.length
    )
      return;
    [ui.splitDraft.entries[index], ui.splitDraft.entries[nextIndex]] = [
      ui.splitDraft.entries[nextIndex],
      ui.splitDraft.entries[index],
    ];
    renderSplitEditor();
  }

  function addSplitDay() {
    if (!ui.splitDraft || ui.splitDraft.entries.length >= 16) return;
    ui.splitDraft.entries.push(allReusableCycles()[0]?.id || "rest");
    renderSplitEditor();
  }

  function removeSplitDay(entryIndex) {
    if (!ui.splitDraft || ui.splitDraft.entries.length <= 1) return;
    const index = Number(entryIndex);
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= ui.splitDraft.entries.length
    )
      return;
    ui.splitDraft.entries.splice(index, 1);
    renderSplitEditor();
  }

  function saveCustomSplit() {
    const draft = ui.splitDraft;
    if (!draft) return;
    const name = String(draft.name || "")
      .trim()
      .slice(0, 80);
    if (!name) {
      showToast("Give the custom split a name before saving.", "error");
      return;
    }
    if (!draft.entries.some((entry) => entry !== "rest")) {
      showToast("A split needs at least one training cycle.", "error");
      return;
    }
    const id =
      draft.customId || newDefinitionId("custom-split", state.customSplits);
    const normalized = normalizeCustomSplits(
      [
        {
          id,
          name,
          description:
            draft.description || "A custom training split based on a template.",
          entries: draft.entries,
        },
      ],
      state.customCycles,
    )[0];
    if (!normalized) {
      showToast("The custom split contains an unavailable cycle.", "error");
      return;
    }
    const existingIndex = state.customSplits.findIndex(
      (split) => split.id === id,
    );
    if (existingIndex >= 0) state.customSplits[existingIndex] = normalized;
    else state.customSplits.push(normalized);
    ui.selectedSplitId = normalized.id;
    ui.editingSplitId = null;
    ui.splitDraft = null;
    persist();
    renderSettings();
    renderSplitDialog();
    showToast(`${normalized.name} saved as a custom split.`);
  }

  function openCycleDefinitionEditor(cycleId = null) {
    const cycle = cycleId ? reusableCycleForId(cycleId) : null;
    if (cycleId && !cycle) return;
    ui.showCycleManager = true;
    ui.editingCycleId = cycle?.id || null;
    ui.cycleDraft = {
      customId: cycle && !cycle.template ? cycle.id : null,
      sourceId: cycle?.id || null,
      name: cycle
        ? cycle.template
          ? `${cycle.name} custom`
          : cycle.name
        : "New cycle",
      target: cycle?.target || "custom",
      bodyParts: cycle ? [...cycle.bodyParts] : [],
      description: cycle?.description || "A reusable custom training cycle.",
    };
    renderCycleManager();
  }

  function saveCycleDefinition() {
    const draft = ui.cycleDraft;
    if (!draft) return;
    const name = String(draft.name || "")
      .trim()
      .slice(0, 80);
    const bodyParts = normalizeBodyParts(draft.bodyParts);
    if (!name) {
      showToast("Give the cycle a name before saving.", "error");
      return;
    }
    if (!bodyParts.length) {
      showToast("Select at least one muscle for this cycle.", "error");
      return;
    }
    const id =
      draft.customId || newDefinitionId("custom-cycle", state.customCycles);
    const normalized = normalizeCustomCycleDefinitions([
      {
        id,
        name,
        target: draft.target,
        bodyParts,
        description: draft.description,
      },
    ])[0];
    const existingIndex = state.customCycles.findIndex(
      (cycle) => cycle.id === id,
    );
    if (existingIndex >= 0) state.customCycles[existingIndex] = normalized;
    else state.customCycles.push(normalized);
    if (ui.splitDraft && draft.sourceId && !draft.customId) {
      ui.splitDraft.entries = ui.splitDraft.entries.map((entry) =>
        entry === draft.sourceId ? normalized.id : entry,
      );
    }
    ui.editingCycleId = null;
    ui.cycleDraft = null;
    persist();
    renderSplitDialog();
    showToast(`${normalized.name} saved to the cycle library.`);
  }

  function deleteCycleDefinition(cycleId) {
    const cycle = state.customCycles.find((item) => item.id === cycleId);
    if (!cycle) return;
    const usedBy = state.customSplits.filter((split) =>
      split.entries.includes(cycleId),
    );
    if (usedBy.length) {
      showToast(
        `${cycle.name} is used by ${usedBy.map((split) => split.name).join(", ")}. Remove it from those splits first.`,
        "error",
      );
      return;
    }
    if (!window.confirm(`Delete ${cycle.name} from the cycle library?`)) return;
    state.customCycles = state.customCycles.filter(
      (item) => item.id !== cycleId,
    );
    persist();
    renderSplitDialog();
    showToast(`${cycle.name} deleted from the cycle library.`);
  }

  function cyclesForSplit(preset) {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return preset.entries.map((entry, index) => {
      if (entry === "rest") {
        return {
          id: `split-${preset.id}-rest-${index + 1}-${stamp}`,
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
        id: `split-${preset.id}-${entry}-${index + 1}-${stamp}`,
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

  function applySplit(splitId, beginDayId = "monday") {
    const preset = splitForId(splitId);
    const beginDay =
      DAY_CONFIG.find((day) => day.id === beginDayId) || DAY_CONFIG[0];
    if (!preset) return;
    if (
      !window.confirm(
        `Use the ${preset.name} split beginning on ${beginDay.name}? This replaces the current rotation, clears current workout progress and calendar rest overrides, and removes favorites tied to the old cycles.`,
      )
    )
      return;
    const backup = JSON.parse(JSON.stringify(state));
    try {
      state.cycles = cyclesForSplit(preset);
      state.activeSplitId = preset.id;
      state.splitWeekStartDay = beginDay.id;
      const beginDayIndex = DAY_CONFIG.findIndex(
        (day) => day.id === beginDay.id,
      );
      const mondayCycleIndex =
        (state.cycles.length - (beginDayIndex % state.cycles.length)) %
        state.cycles.length;
      state.weekStartCycleId = state.cycles[mondayCycleIndex].id;
      state.nextCycleId = state.weekStartCycleId;
      state.favoriteCircuits = [];
      generateWeek(null, { restDayIds: [], cycleOverrides: {} });
      const issues = validateWeek(state.week);
      if (issues.length) throw new Error(issues[0]);
      persist();
      document.getElementById("split-dialog").close();
      render();
      showToast(
        `${preset.name} is now your active rotation and begins on ${beginDay.name}.`,
      );
    } catch (error) {
      state = normalizeState(backup);
      render();
      showToast(`The split could not be applied: ${error.message}`, "error");
    }
  }

  function applyCycleBodyParts(button) {
    const cycle = cycleForId(button.dataset.cycleId);
    const card = button.closest(".settings-card");
    if (!cycle || isRestCycle(cycle) || !card) return;
    const bodyParts = normalizeBodyParts(
      [...card.querySelectorAll("[data-cycle-body-part]:checked")].map(
        (input) => input.dataset.cycleBodyPart,
      ),
    );
    if (bodyParts.join("|") === cycle.bodyParts.join("|")) {
      showToast("Those body-part settings are already applied.");
      return;
    }
    if (
      cycleDaysWithProgress(cycle.id).length &&
      !window.confirm(
        `Changing ${cycleDisplayName(cycle)}'s body parts regenerates its current workouts and clears their progress. Continue?`,
      )
    ) {
      renderSettings();
      return;
    }
    const backup = JSON.parse(JSON.stringify(state));
    state.activeSplitId = null;
    cycle.bodyParts = bodyParts;
    if (
      !rebuildCycleSchedule(
        { forceCycleIds: [cycle.id], preserveMatching: true },
        bodyParts.length
          ? `${cycleDisplayName(cycle)} now targets ${bodyParts.join(", ")}.`
          : `${cycleDisplayName(cycle)} now uses every qualifying body part.`,
      )
    ) {
      state = normalizeState(backup);
      render();
    }
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

    if (actionButton.dataset.action === "toggle-workout-timer") {
      toggleWorkoutTimer();
      return;
    }
    if (actionButton.dataset.action === "reset-workout-timer") {
      resetWorkoutTimer();
      return;
    }
    if (actionButton.dataset.action === "adjust-workout-timer") {
      adjustWorkoutTimer(actionButton.dataset.minutes);
      return;
    }
    if (actionButton.dataset.action === "toggle-optional-activator-pane") {
      const key = `${actionButton.dataset.day}-${Number(actionButton.dataset.circuit)}`;
      if (ui.expandedActivators.has(key)) ui.expandedActivators.delete(key);
      else ui.expandedActivators.add(key);
      render();
      return;
    }
    if (actionButton.dataset.action === "increase-load") {
      increaseExerciseLoad(actionButton.dataset.exerciseId);
      return;
    }
    if (actionButton.dataset.action === "toggle-rest-day") {
      toggleRestDay(actionButton.dataset.day);
      return;
    }
    if (actionButton.dataset.action === "toggle-body-part-coverage") {
      ui.showBodyPartCoverage = !ui.showBodyPartCoverage;
      renderSettings();
      return;
    }
    if (actionButton.dataset.action === "add-warmup-exercise") {
      addWarmupExercise();
      return;
    }
    if (actionButton.dataset.action === "move-warmup-exercise") {
      moveRoutineExercise(
        state.warmupExercises,
        actionButton.dataset.warmupId,
        actionButton.dataset.direction,
        "Warm-up",
      );
      return;
    }
    if (actionButton.dataset.action === "delete-warmup-exercise") {
      deleteWarmupExercise(actionButton.dataset.warmupId);
      return;
    }
    if (actionButton.dataset.action === "add-cooldown-exercise") {
      addCooldownExercise();
      return;
    }
    if (actionButton.dataset.action === "move-cooldown-exercise") {
      moveRoutineExercise(
        state.cooldownExercises,
        actionButton.dataset.cooldownId,
        actionButton.dataset.direction,
        "Cool-down",
      );
      return;
    }
    if (actionButton.dataset.action === "delete-cooldown-exercise") {
      deleteCooldownExercise(actionButton.dataset.cooldownId);
      return;
    }
    if (actionButton.dataset.action === "open-split-dialog") {
      openSplitDialog();
      return;
    }
    if (actionButton.dataset.action === "close-split-dialog") {
      document.getElementById("split-dialog").close();
      return;
    }
    if (actionButton.dataset.action === "select-split") {
      if (splitForId(actionButton.dataset.splitId)) {
        ui.selectedSplitId = actionButton.dataset.splitId;
        renderSplitOptions();
      }
      return;
    }
    if (actionButton.dataset.action === "edit-split") {
      openSplitEditor(actionButton.dataset.splitId);
      return;
    }
    if (actionButton.dataset.action === "cancel-split-edit") {
      ui.editingSplitId = null;
      ui.splitDraft = null;
      renderSplitEditor();
      return;
    }
    if (actionButton.dataset.action === "add-split-day") {
      addSplitDay();
      return;
    }
    if (actionButton.dataset.action === "move-split-day") {
      moveSplitDay(
        actionButton.dataset.entryIndex,
        actionButton.dataset.direction,
      );
      return;
    }
    if (actionButton.dataset.action === "remove-split-day") {
      removeSplitDay(actionButton.dataset.entryIndex);
      return;
    }
    if (actionButton.dataset.action === "save-custom-split") {
      saveCustomSplit();
      return;
    }
    if (actionButton.dataset.action === "toggle-cycle-manager") {
      ui.showCycleManager = !ui.showCycleManager;
      if (!ui.showCycleManager) {
        ui.editingCycleId = null;
        ui.cycleDraft = null;
      }
      renderCycleManager();
      return;
    }
    if (actionButton.dataset.action === "add-cycle-definition") {
      openCycleDefinitionEditor();
      return;
    }
    if (actionButton.dataset.action === "edit-cycle-definition") {
      openCycleDefinitionEditor(actionButton.dataset.cycleDefinitionId);
      return;
    }
    if (actionButton.dataset.action === "cancel-cycle-edit") {
      ui.editingCycleId = null;
      ui.cycleDraft = null;
      renderCycleManager();
      return;
    }
    if (actionButton.dataset.action === "save-cycle-definition") {
      saveCycleDefinition();
      return;
    }
    if (actionButton.dataset.action === "delete-cycle-definition") {
      deleteCycleDefinition(actionButton.dataset.cycleDefinitionId);
      return;
    }
    if (actionButton.dataset.action === "apply-selected-split") {
      applySplit(ui.selectedSplitId, ui.splitWeekStartDay);
      return;
    }
    if (actionButton.dataset.action === "add-cycle") {
      addCycle();
      return;
    }
    if (actionButton.dataset.action === "add-rest-cycle") {
      addRestCycle();
      return;
    }
    if (actionButton.dataset.action === "move-cycle") {
      moveCycle(
        actionButton.dataset.cycleId,
        Number(actionButton.dataset.direction),
      );
      return;
    }
    if (actionButton.dataset.action === "delete-cycle") {
      deleteCycle(actionButton.dataset.cycleId);
      return;
    }
    if (actionButton.dataset.action === "apply-cycle-body-parts") {
      applyCycleBodyParts(actionButton);
      return;
    }

    if (actionButton.dataset.action === "replace") {
      openReplacement(parseContext(actionButton));
    }
    if (actionButton.dataset.action === "random-replace") {
      randomReplace(parseContext(actionButton));
    }
    if (actionButton.dataset.action === "move-exercise") {
      reorderCircuitExercise(
        parseContext(actionButton),
        Number(actionButton.dataset.direction),
      );
    }
    if (actionButton.dataset.action === "delete-circuit-exercise") {
      deleteCircuitExercise(parseContext(actionButton));
    }
    if (actionButton.dataset.action === "add-round-exercise") {
      openAddRoundExercise(
        actionButton.dataset.day,
        Number(actionButton.dataset.circuit),
      );
    }
    if (actionButton.dataset.action === "remove-round-exercise") {
      removeRoundExercise(
        actionButton.dataset.day,
        Number(actionButton.dataset.circuit),
      );
    }
    if (actionButton.dataset.action === "toggle-favorite-circuit") {
      toggleFavoriteCircuit(
        actionButton.dataset.day,
        Number(actionButton.dataset.circuit),
      );
    }
    if (actionButton.dataset.action === "open-favorite-circuits") {
      openFavoriteCircuits(
        actionButton.dataset.day,
        Number(actionButton.dataset.circuit),
      );
    }
    if (actionButton.dataset.action === "apply-favorite-circuit") {
      applyFavoriteCircuit(actionButton.dataset.favoriteId);
    }
    if (actionButton.dataset.action === "delete-favorite-circuit") {
      deleteFavoriteCircuit(actionButton.dataset.favoriteId);
    }
    if (actionButton.dataset.action === "toggle-lock") {
      const context = parseContext(actionButton);
      const assignment = assignmentFor(context);
      if (!assignment.fixed) {
        assignment.locked = !assignment.locked;
        assignment.cycleLock = assignment.locked;
        syncCycleTemplateFromDay(context.dayId);
        refreshFutureCycleOccurrences(context.dayId);
        persist();
        render();
        showToast(
          assignment.locked
            ? "Exercise locked for future occurrences of this cycle."
            : "Exercise unlocked.",
        );
      }
    }
    if (actionButton.dataset.action === "choose-replacement") {
      replaceExercise(actionButton.dataset.exerciseId);
    }
    if (actionButton.dataset.action === "set-preference") {
      const exercise = exerciseById.get(actionButton.dataset.exerciseId);
      if (exercise) {
        const exerciseState = stateFor(exercise.id);
        const requestedPreference = Math.max(
          -1,
          Math.min(1, Number(actionButton.dataset.value) || 0),
        );
        exerciseState.preference =
          exerciseState.preference === requestedPreference
            ? 0
            : requestedPreference;
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
    if (actionButton.dataset.action === "add-exercise-from-replacement") {
      const replacementContext = ui.replacement ? { ...ui.replacement } : null;
      if (!replacementContext) return;
      ui.returnToReplacementAfterExerciseAdd = true;
      document.getElementById("replace-dialog").close();
      ui.replacement = replacementContext;
      openExerciseDialog({ fromReplacement: true });
    }
    if (actionButton.dataset.action === "open-add-exercise") {
      openExerciseDialog();
    }
    if (actionButton.dataset.action === "open-equipment-dialog") {
      openEquipmentDialog();
    }
    if (actionButton.dataset.action === "close-equipment-dialog") {
      document.getElementById("equipment-dialog").close();
    }
    if (actionButton.dataset.action === "edit-workout-exercise") {
      openEditExerciseDialog(actionButton.dataset.exerciseId);
    }
    if (actionButton.dataset.action === "close-exercise-dialog") {
      const replacementContext =
        ui.returnToReplacementAfterExerciseAdd && ui.replacement
          ? { ...ui.replacement }
          : null;
      ui.editingExerciseId = null;
      ui.returnToReplacementAfterExerciseAdd = false;
      document.getElementById("exercise-dialog").close();
      if (replacementContext) openReplacement(replacementContext);
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
    if (event.target.id === "split-week-start") {
      ui.splitWeekStartDay = DAY_CONFIG.some(
        (day) => day.id === event.target.value,
      )
        ? event.target.value
        : "monday";
      event.target.value = ui.splitWeekStartDay;
      renderSplitOptions();
      return;
    }
    if (event.target.dataset?.splitEntryIndex !== undefined && ui.splitDraft) {
      const index = Number(event.target.dataset.splitEntryIndex);
      const validEntry =
        event.target.value === "rest" ||
        Boolean(reusableCycleForId(event.target.value));
      if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < ui.splitDraft.entries.length &&
        validEntry
      ) {
        ui.splitDraft.entries[index] = event.target.value;
      }
      return;
    }
    if (event.target.dataset?.cycleDraftBodyPart && ui.cycleDraft) {
      const part = event.target.dataset.cycleDraftBodyPart;
      if (!BODY_PART_OPTIONS.includes(part)) return;
      ui.cycleDraft.bodyParts = event.target.checked
        ? [...new Set([...ui.cycleDraft.bodyParts, part])]
        : ui.cycleDraft.bodyParts.filter((item) => item !== part);
      return;
    }
    if (event.target.dataset?.dayCycleSelect && event.target.dataset.day) {
      selectDayCycle(event.target.dataset.day, event.target.value);
      return;
    }
    if (
      event.target.dataset?.cooldownSetting === "label" &&
      event.target.dataset.cooldownId
    ) {
      const index = state.cooldownExercises.findIndex(
        (exercise) => exercise.id === event.target.dataset.cooldownId,
      );
      if (index < 0) return;
      const label =
        String(event.target.value || "")
          .trim()
          .slice(0, 100) || `Cool-down exercise ${index + 1}`;
      state.cooldownExercises[index].label = label;
      event.target.value = label;
      persist();
      return;
    }
    if (
      event.target.dataset?.warmupSetting === "label" &&
      event.target.dataset.warmupId
    ) {
      const index = state.warmupExercises.findIndex(
        (exercise) => exercise.id === event.target.dataset.warmupId,
      );
      if (index < 0) return;
      const label =
        String(event.target.value || "")
          .trim()
          .slice(0, 100) || `Warm-up exercise ${index + 1}`;
      state.warmupExercises[index].label = label;
      event.target.value = label;
      persist();
      return;
    }
    if (
      event.target.dataset?.cycleSetting === "designation" &&
      event.target.dataset.cycleId
    ) {
      const cycle = cycleForId(event.target.dataset.cycleId);
      if (!cycle || isRestCycle(cycle)) return;
      const nextDesignation =
        String(event.target.value || "")
          .trim()
          .slice(0, 80) || cycleTargetLabel(cycle);
      const preset = trainingDesignation(nextDesignation);
      const nextTarget = preset?.target || "custom";
      const nextBodyParts = preset
        ? [...preset.bodyParts]
        : [...cycle.bodyParts];
      if (
        nextDesignation === cycleTargetLabel(cycle) &&
        nextTarget === cycle.target &&
        nextBodyParts.join("|") === cycle.bodyParts.join("|")
      ) {
        event.target.value = nextDesignation;
        return;
      }
      if (
        cycleDaysWithProgress(cycle.id).length &&
        !window.confirm(
          `Changing ${cycleDisplayName(cycle)}'s training target regenerates its current workouts and clears their progress. Continue?`,
        )
      ) {
        renderSettings();
        return;
      }
      const backup = JSON.parse(JSON.stringify(state));
      state.activeSplitId = null;
      cycle.designation = nextDesignation;
      cycle.target = nextTarget;
      cycle.bodyParts = nextBodyParts;
      if (
        !rebuildCycleSchedule(
          { forceCycleIds: [cycle.id], preserveMatching: true },
          `${cycleDisplayName(cycle)} now targets ${nextDesignation}.`,
        )
      ) {
        state = normalizeState(backup);
        render();
      }
      return;
    }
    if (
      event.target.dataset?.cycleSetting === "target" &&
      event.target.dataset.cycleId
    ) {
      const cycle = cycleForId(event.target.dataset.cycleId);
      if (!cycle || isRestCycle(cycle)) return;
      const nextTarget = normalizeWorkoutTarget(
        event.target.value,
        cycle.target,
      );
      if (nextTarget === cycle.target) return;
      if (
        cycleDaysWithProgress(cycle.id).length &&
        !window.confirm(
          `Changing ${cycleDisplayName(cycle)}'s target regenerates its current workouts and clears their progress. Continue?`,
        )
      ) {
        renderSettings();
        return;
      }
      const backup = JSON.parse(JSON.stringify(state));
      state.activeSplitId = null;
      cycle.target = nextTarget;
      cycle.designation = defaultDesignationLabel(nextTarget);
      if (
        !rebuildCycleSchedule(
          { forceCycleIds: [cycle.id], preserveMatching: true },
          `${cycleDisplayName(cycle)} is now a ${workoutTarget(nextTarget).label} cycle.`,
        )
      ) {
        state = normalizeState(backup);
        render();
      }
      return;
    }
    if (
      event.target.dataset?.exerciseSetting === "effectivenessScore" &&
      event.target.dataset.exerciseId
    ) {
      const exerciseId = event.target.dataset.exerciseId;
      const exercise = exerciseById.get(exerciseId);
      if (!exercise) return;
      const effectivenessScore = clampRating(
        event.target.value,
        exerciseEffectivenessScore(exercise),
      );
      state.exerciseEdits[exerciseId] = {
        ...(state.exerciseEdits[exerciseId] || {}),
        effectivenessScore,
      };
      rebuildExerciseCatalog(state.customExercises, state.exerciseEdits);
      persist();
      render();
      return;
    }
    if (event.target.dataset?.assignmentSetting === "setupScore") {
      const assignment = assignmentFor({
        dayId: event.target.dataset.day,
        circuitIndex: Number(event.target.dataset.circuit),
        position: event.target.dataset.position,
      });
      if (assignment) {
        assignment.setupScore = normalizeSetupScore(event.target.value);
        persist();
        render();
      }
      return;
    }
    if (
      ["measureType", "loadBasis"].includes(event.target.dataset?.setting) &&
      event.target.dataset.exerciseId
    ) {
      stateFor(event.target.dataset.exerciseId)[event.target.dataset.setting] =
        event.target.value;
      persist();
      return;
    }
    const round = event.target.closest('[data-action="complete-round"]');
    if (round) {
      const circuit =
        state.week.days[round.dataset.day].circuits[
          Number(round.dataset.circuit)
        ];
      const wasComplete = isCircuitComplete(circuit);
      circuit.roundsCompleted[Number(round.dataset.round)] = round.checked;
      const isComplete = isCircuitComplete(circuit);
      if (!wasComplete && isComplete && !circuit.completionCredited) {
        updateCircuitLoadProgress(circuit, 1);
        circuit.completionCredited = true;
      } else if (wasComplete && !isComplete && circuit.completionCredited) {
        updateCircuitLoadProgress(circuit, -1);
        circuit.completionCredited = false;
      }
      const day = state.week.days[round.dataset.day];
      if (allRoundsComplete(day)) pauseWorkoutTimer(day, false);
      persist();
      render();
      return;
    }

    const optionalActivator = event.target.closest(
      '[data-action="complete-optional-activator"]',
    );
    if (optionalActivator) {
      const circuit =
        state.week.days[optionalActivator.dataset.day].circuits[
          Number(optionalActivator.dataset.circuit)
        ];
      circuit.optionalActivatorCompleted = optionalActivator.checked;
      persist();
      render();
      return;
    }

    const daily = event.target.closest('[data-action="daily-check"]');
    if (daily) {
      const day = state.week.days[daily.dataset.day];
      const wasComplete = Object.values(day.preChecklist).every(Boolean);
      day.preChecklist[daily.dataset.item] = daily.checked;
      const isComplete = Object.values(day.preChecklist).every(Boolean);
      if (
        !wasComplete &&
        isComplete &&
        timerElapsed(day) === 0 &&
        !day.timer.startedAt
      ) {
        day.timer.startedAt = new Date().toISOString();
      }
      persist();
      render();
      return;
    }

    const cooldown = event.target.closest('[data-action="cooldown-check"]');
    if (cooldown) {
      state.week.days[cooldown.dataset.day].cooldownChecklist[
        cooldown.dataset.item
      ] = cooldown.checked;
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
      renderReplacementResults();
    }
    if (event.target.id === "replace-body-part") {
      ui.replaceBodyPart = event.target.value;
      renderReplacementResults();
    }
    if (event.target.id === "replace-equipment") {
      ui.replaceEquipment = event.target.value;
      renderReplacementResults();
    }
  }

  function handleInput(event) {
    if (event.target.dataset?.splitDraftName && ui.splitDraft) {
      ui.splitDraft.name = event.target.value.slice(0, 80);
      return;
    }
    if (event.target.dataset?.cycleDraftName && ui.cycleDraft) {
      ui.cycleDraft.name = event.target.value.slice(0, 80);
      return;
    }
    if (
      event.target.dataset?.cooldownSetting === "label" &&
      event.target.dataset.cooldownId
    ) {
      const exercise = state.cooldownExercises.find(
        (item) => item.id === event.target.dataset.cooldownId,
      );
      if (!exercise) return;
      exercise.label = event.target.value.slice(0, 100);
      persist();
      return;
    }
    if (
      event.target.dataset?.warmupSetting === "label" &&
      event.target.dataset.warmupId
    ) {
      const exercise = state.warmupExercises.find(
        (item) => item.id === event.target.dataset.warmupId,
      );
      if (!exercise) return;
      exercise.label = event.target.value.slice(0, 100);
      persist();
      return;
    }
    if (event.target.dataset?.cycleSetting && event.target.dataset.cycleId) {
      const cycle = cycleForId(event.target.dataset.cycleId);
      if (!cycle) return;
      const setting = event.target.dataset.cycleSetting;
      if (setting === "name") {
        cycle.name = event.target.value.slice(0, 80);
        persist();
        renderTabs();
      } else if (setting === "description") {
        cycle.description = event.target.value.slice(0, 600);
        for (const day of DAY_CONFIG) {
          if (state.week.days[day.id].cycleId === cycle.id) {
            state.week.days[day.id].description = cycle.description;
          }
        }
        persist();
      }
      return;
    }
    const setting = event.target.dataset.setting;
    const exerciseId = event.target.dataset.exerciseId;
    if (
      setting &&
      exerciseId &&
      ["measureType", "loadBasis"].includes(setting)
    ) {
      stateFor(exerciseId)[setting] = event.target.value;
      persist();
      return;
    }
    if (
      setting &&
      exerciseId &&
      ["reps", "weight", "notes"].includes(setting)
    ) {
      const stats = stateFor(exerciseId);
      const nextValue = event.target.value.slice(
        0,
        setting === "notes" ? 1000 : 40,
      );
      if (setting === "weight" && stats.weight !== nextValue)
        stats.loadProgressCount = 0;
      stats[setting] = nextValue;
      if (setting === "weight") {
        event.target
          .closest?.(".load-field")
          ?.classList.toggle(
            "has-recommended-weight",
            Boolean(event.target.value.trim()),
          );
        const progress = event.target
          .closest?.(".load-control")
          ?.querySelector?.(".load-progression");
        if (progress) {
          progress.setAttribute(
            "aria-label",
            "0 of 4 workouts completed at this load",
          );
          progress.querySelectorAll(".load-progress-mark").forEach((mark) => {
            mark.classList.remove("is-complete");
            mark.textContent = "";
          });
          progress.querySelector(".increase-load-button")?.remove();
        }
      }
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
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveJson();
      }
    });
    document.getElementById("save-button").addEventListener("click", saveJson);
    document
      .getElementById("load-button")
      .addEventListener("click", openJsonFile);
    document
      .getElementById("load-input")
      .addEventListener("change", (event) => loadJson(event.target.files[0]));
    document
      .getElementById("new-week-button")
      .addEventListener("click", startNewWeek);
    document
      .getElementById("exercise-form")
      .addEventListener("submit", saveExerciseForm);
    document
      .getElementById("equipment-form")
      .addEventListener("submit", saveEquipmentForm);
    document.getElementById("replace-dialog").addEventListener("close", () => {
      if (!ui.returnToReplacementAfterExerciseAdd) {
        ui.replacement = null;
        ui.replaceSearch = "";
        ui.showAllReplacements = false;
        ui.replaceBodyPart = "all";
        ui.replaceEquipment = "all";
      }
    });
    document.getElementById("favorite-dialog").addEventListener("close", () => {
      ui.favoriteTarget = null;
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
    } else if (applyPendingStateMigrations()) {
      persist();
    }

    const issues = validateWeek(state.week);
    if (issues.length) console.warn("Workout validation warnings:", issues);
    bindEvents();
    render();
    restoreFileHandle();
    timerInterval = window.setInterval?.(updateWorkoutTimer, 1000) || null;

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
