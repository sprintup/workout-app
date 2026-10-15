import { gateways } from "../gateways/registry";
import { ACTIVATOR_LABEL, DEFAULT_CIRCUIT_REP_BUDGET, DEFAULT_WORKOUT_DURATION_MS } from "../config/constants";
import { DAY_CONFIG, SPLIT_PRESETS } from "../data/training";
import { mainAssignments } from "../entities/circuits";
import { assignmentWithoutSetupScore, createDefaultCycles, cycleTargetLabel, isRestCycle, normalizeCustomCycleDefinitions, normalizeCustomSplits } from "../entities/cycles";
import { normalizeEquipmentCatalog } from "../entities/equipment";
import { clampRating, exerciseEffectivenessScore, idFor, normalizeBodyParts } from "../entities/exercise";
import { cleanRepValue, defaultMeasureType } from "../entities/exercise-state";
import { normalizeCircuitRepBudget, normalizePerSideReps } from "../entities/reps";
import { isCoreCooldownLabel, normalizeCooldownExercises, normalizeWarmupExercises, warmupChecklist } from "../entities/routines";
import { defaultDesignationLabel, isRemovedArmsUpperTarget, normalizeWorkoutTarget } from "../entities/targets";
import { normalizeTimerDuration } from "../entities/timer";
import { normalizeCycleOverrides } from "./cycle-schedule";
import { exerciseEquipmentCatalog } from "./exercise-catalog";
import { matchesSlot, qualifiesAsOptionalActivator } from "./generation";
import { assignCircuitRepBudget, assignmentRepBasis } from "./reps";
import { createState } from "./state-factory";
import { circuitDefinitionsForTarget, withBodyPartFilter } from "./targeting";
import { validateWeek } from "./validation";
import type { Cycle } from "../types";


export function normalizeCycles(values): Cycle[] {
  const source = Array.isArray(values)
    ? values
        .filter((cycle) => !isRemovedArmsUpperTarget(cycle?.target))
        .slice(0, 16)
    : [];
  const seen = new Set();
  const cycles: Cycle[] = source
    .map((cycle, index) => {
      const requestedId = String(cycle?.id || `cycle-${index + 1}`);
      const id = seen.has(requestedId)
        ? `cycle-${index + 1}-${Date.now()}`
        : requestedId;
      seen.add(id);
      if (isRestCycle(cycle)) {
        return {
          id,
          kind: "rest" as const,
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
        kind: "training" as const,
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
                  gateways.exercises.has(lock.assignment?.exerciseId),
              )
              .map((lock) => ({
                circuitIndex: Number(lock.circuitIndex),
                position: lock.position,
                assignment: {
                  ...assignmentWithoutSetupScore(lock.assignment),
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


export function normalizeState(candidate) {
  gateways.exercises.rebuildCatalog(
    candidate.customExercises || [],
    candidate.exerciseEdits || {},
  );
  const normalized = createState();
  normalized.weekNumber =
    Number(candidate.weekNumber) || Number(candidate.week?.number) || 1;
  normalized.weekStartedAt =
    candidate.weekStartedAt ||
    candidate.week?.startedAt ||
    gateways.clock.nowIso();
  normalized.circuitRepBudget = normalizeCircuitRepBudget(
    candidate.circuitRepBudget,
  );
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
            .map((assignment) => {
              const normalizedAssignment = {
                ...assignmentWithoutSetupScore(assignment),
                reps: String(
                  normalizePerSideReps(
                    assignment.reps,
                    gateways.exercises.find(assignment.exerciseId)?.default_reps,
                  ),
                ),
                repBasis: assignmentRepBasis(assignment),
              };
              return normalizedAssignment;
            });
          const exerciseNames = assignments
            .map(
              (assignment) => gateways.exercises.find(assignment.exerciseId)?.name,
            )
            .filter(Boolean);
          const migrated = {
            ...favorite,
            assignments,
            exerciseNames,
            signature: assignments
              .map(
                (assignment) =>
                  `${assignment.exerciseId}:${assignment.reps}:${assignment.repBasis}`,
              )
              .join("|"),
          };
          delete migrated.totalScore;
          delete migrated.bridge;
          return migrated;
        })
        .slice(-30)
    : [];
  normalized.hiddenExerciseIds = Array.isArray(candidate.hiddenExerciseIds)
    ? candidate.hiddenExerciseIds.filter(
        (id) => gateways.exercises.has(id) && !gateways.exercises.find(id).always_locked,
      )
    : [];
  normalized.deletedExerciseIds = Array.isArray(candidate.deletedExerciseIds)
    ? candidate.deletedExerciseIds.filter(
        (id) => gateways.exercises.has(id) && !gateways.exercises.find(id).always_locked,
      )
    : [];
  normalized.history = Array.isArray(candidate.history)
    ? candidate.history.slice(-12)
    : [];

  if (
    candidate.exerciseState &&
    typeof candidate.exerciseState === "object"
  ) {
    for (const exercise of gateways.exercises.all()) {
      const loaded = candidate.exerciseState[exercise.id];
      if (!loaded) continue;
      const loadedPreference = Math.max(
        -1,
        Math.min(1, Number(loaded.preference) || 0),
      );
      const loadedFeedbackBase = Number(loaded.effectivenessFeedbackBase);
      const hasExplicitFeedbackBase =
        loaded.effectivenessFeedbackBase !== null &&
        loaded.effectivenessFeedbackBase !== undefined &&
        Number.isFinite(loadedFeedbackBase);
      const hasEffectivenessOverride = Object.hasOwn(
        candidate.exerciseEdits?.[exercise.id] || {},
        "effectivenessScore",
      );
      const preference =
        loadedPreference &&
        (hasExplicitFeedbackBase || hasEffectivenessOverride)
          ? loadedPreference
          : 0;
      normalized.exerciseState[exercise.id] = {
        chosenCount: Math.max(0, Number(loaded.chosenCount) || 0),
        skippedCount: Math.max(0, Number(loaded.skippedCount) || 0),
        preference,
        effectivenessFeedbackBase: preference
          ? hasExplicitFeedbackBase
            ? clampRating(loadedFeedbackBase, 3)
            : clampRating(
                exerciseEffectivenessScore(exercise) - preference,
                3,
              )
          : null,
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
      const loadedAssignments = mainAssignments(circuit);
      const needsRepPrescription = loadedAssignments.some(
        (assignment) => assignment.reps === undefined,
      );
      loadedAssignments.forEach((assignment) => {
        delete assignment.setupScore;
        assignment.repBasis = assignmentRepBasis(assignment);
        if (!needsRepPrescription) {
          assignment.reps = String(
            normalizePerSideReps(
              assignment.reps,
              DEFAULT_CIRCUIT_REP_BUDGET / 3,
            ),
          );
        }
      });
      if (needsRepPrescription)
        assignCircuitRepBudget(circuit, normalized.circuitRepBudget);
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
          const exercise = gateways.exercises.find(assignment.exerciseId);
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


export function migrateTotalBodyActivators(week, excludedIds = new Set()) {
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
      const exercise = gateways.exercises.find(assignment?.exerciseId);
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
    let replacement = gateways.exercises.all()
      .filter(
        (exercise) =>
          qualifiesAsOptionalActivator(exercise, targetId) &&
          !used.has(exercise.id) &&
          !excludedIds.has(exercise.id),
      )
      .sort((first, second) => first.name.localeCompare(second.name))[0];
    if (!replacement) {
      replacement = gateways.exercises.all()
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
