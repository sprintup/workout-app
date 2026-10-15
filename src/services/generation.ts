import { gateways } from "../gateways/registry";
import { ACTIVATOR_LABEL, DEFAULT_WORKOUT_DURATION_MS } from "../config/constants";
import { DAY_CONFIG } from "../data/training";
import { isEquipmentFreeExercise, mainAssignments } from "../entities/circuits";
import { cycleDisplayName, cycleTargetLabel } from "../entities/cycles";
import { exerciseEffectivenessScore, idFor } from "../entities/exercise";
import { normalizeWorkoutTarget } from "../entities/targets";
import { transitionCost } from "../entities/transitions";
import { cycleForId, normalizeCycleOverrides, scheduleCycles } from "./cycle-schedule";
import { assignCircuitRepBudget, exerciseSideMultiplier, requiresBothSides } from "./reps";
import { emptyCooldownChecklist, emptyWarmupChecklist } from "./routine-schedule";
import { circuitDefinitionsForTarget, withBodyPartFilter } from "./targeting";
import { workoutDayHasProgress } from "./week";
import type { CircuitSlot, DayId, Week, WorkoutDay } from "../types";


export function matchesSlot(exercise, slot) {
  if (slot.noEquipmentOnly && !isEquipmentFreeExercise(exercise))
    return false;
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
    .map((name) => gateways.exercises.find(idFor(name)))
    .filter(Boolean);
  return references.some(
    (reference) =>
      reference.primary_body_part === exercise.primary_body_part &&
      reference.force_type === exercise.force_type &&
      (reference.movement_pattern === exercise.movement_pattern ||
        reference.movement_role === exercise.movement_role),
  );
}


export function canCombine(first, second) {
  return !(requiresBothSides(first) && requiresBothSides(second));
}


export function recentIds() {
  return new Set(
    gateways.week.history().slice(-3).flatMap((week) => week.exerciseIds || []),
  );
}


export function exerciseScore(exercise, slot, recent) {
  const stats = gateways.exercises.stats(exercise.id);
  const listedIndex = slot.names.findIndex(
    (name) => idFor(name) === exercise.id,
  );
  const preferredIndex = listedIndex >= 0 ? listedIndex : slot.names.length;
  let score =
    gateways.random.next() * 16 + preferredIndex * 0.8 + stats.chosenCount * 0.35;
  if (recent.has(exercise.id)) score += 28;
  if (slot.defaultName && exercise.id === idFor(slot.defaultName))
    score -= 18;
  if (exercise.technical_difficulty === "advanced") score += 8;
  score += (5 - exerciseEffectivenessScore(exercise)) * 4;
  return score;
}


export function candidatesFor(slot, used) {
  return gateways.exercises.all().filter(
    (exercise) =>
      !used.has(exercise.id) &&
      !gateways.exercises.isHidden(exercise.id) &&
      !gateways.exercises.isDeleted(exercise.id) &&
      matchesSlot(exercise, slot),
  );
}


export function preservedAssignment(
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
    !gateways.exercises.isDeleted(previous.exerciseId) &&
    !gateways.exercises.isHidden(previous.exerciseId) &&
    gateways.exercises.has(previous.exerciseId) &&
    matchesSlot(gateways.exercises.find(previous.exerciseId), slot)
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


export function choosePair(firstSlot, secondSlot, used, oldCircuit) {
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
    ? [gateways.exercises.find(preservedFirst.exerciseId)]
    : candidatesFor(firstSlot, used);
  let secondCandidates = preservedSecond
    ? [gateways.exercises.find(preservedSecond.exerciseId)]
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
        (!canCombine(first, second) && !(preservedFirst && preservedSecond))
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
  });

  return {
    first: makeAssignment(best.first, firstSlot, preservedFirst),
    second: makeAssignment(best.second, secondSlot, preservedSecond),
    transitionCost: best.cost,
  };
}


export function chooseExtra(
  slot,
  used,
  previousExercise,
  circuitExercises,
  oldAssignment = null,
  remainingSideUnits = Number.POSITIVE_INFINITY,
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
    ? [gateways.exercises.find(preserved.exerciseId)]
    : candidatesFor(slot, used);
  const valid = candidates
    .filter(
      (exercise) =>
        exercise &&
        (preserved ||
          exerciseSideMultiplier(exercise) <= remainingSideUnits) &&
        (preserved || canCombine(previousExercise, exercise)) &&
        (preserved ||
          !(
            requiresBothSides(exercise) &&
            circuitExercises.some(requiresBothSides)
          )) &&
        (preserved || transitionCost(previousExercise, exercise) <= 2),
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
  };
}


export function isNoEquipmentTarget(targetId) {
  return normalizeWorkoutTarget(targetId) === "total_body_no_equipment";
}


export function qualifiesAsOptionalActivator(exercise, targetId) {
  return Boolean(
    exercise?.total_body_activator &&
    (!isNoEquipmentTarget(targetId) || isEquipmentFreeExercise(exercise)),
  );
}


export function optionalActivatorSlot(targetId = "total_body"): CircuitSlot {
  return {
    label: ACTIVATOR_LABEL,
    noEquipmentOnly: isNoEquipmentTarget(targetId),
    names: gateways.exercises.all()
      .filter((exercise) => qualifiesAsOptionalActivator(exercise, targetId))
      .map((exercise) => exercise.name),
  };
}


export function chooseOptionalActivator(
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
    candidates = gateways.exercises.all().filter(
      (exercise) =>
        qualifiesAsOptionalActivator(exercise, targetId) &&
        !mainExerciseIds.has(exercise.id) &&
        !gateways.exercises.isHidden(exercise.id) &&
        !gateways.exercises.isDeleted(exercise.id),
    );
  }
  if (gateways.appState.hasState()) {
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


export function cycleTemplateDay(cycle) {
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


export function syncCycleTemplateFromDay(dayId) {
  const dayData = gateways.week.current()?.days?.[dayId];
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


export function refreshFutureCycleOccurrences(sourceDayId) {
  const sourceIndex = DAY_CONFIG.findIndex((day) => day.id === sourceDayId);
  const cycleId = gateways.week.current().days[sourceDayId]?.cycleId;
  const forceDayIds = DAY_CONFIG.slice(sourceIndex + 1)
    .filter(
      (day) =>
        gateways.week.current().days[day.id]?.cycleId === cycleId &&
        !workoutDayHasProgress(gateways.week.current().days[day.id]),
    )
    .map((day) => day.id);
  if (!forceDayIds.length) return;
  generateWeek(gateways.week.current(), {
    restDayIds: gateways.week.current().restDayIds,
    preserveMatching: true,
    forceDayIds,
    trackChanges: true,
  });
}


export function generateDayCircuits(
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
    const pairSideUnits = [pair.first, pair.second].reduce(
      (total, assignment) =>
        total +
        exerciseSideMultiplier(gateways.exercises.find(assignment.exerciseId)),
      0,
    );
    const generatedCount = pairSideUnits < 3 ? 3 : 2;
    const desiredCount = Math.min(
      4,
      Math.max(2, generatedCount, 2 + lockedExtraCount),
    );
    const extras = [];
    let previousExercise = gateways.exercises.find(pair.second.exerciseId);
    const circuitExercises = [
      gateways.exercises.find(pair.first.exerciseId),
      previousExercise,
    ];
    for (let extraIndex = 0; extraIndex < desiredCount - 2; extraIndex += 1) {
      let extra;
      const currentSideUnits = circuitExercises.reduce(
        (total, exercise) => total + exerciseSideMultiplier(exercise),
        0,
      );
      try {
        extra = chooseExtra(
          definition.extra,
          used,
          previousExercise,
          circuitExercises,
          oldExtras[extraIndex],
          Math.max(1, 3 - currentSideUnits),
        );
      } catch (error) {
        throw new Error(`${day.name} circuit ${index + 1}: ${error.message}`);
      }
      extras.push(extra);
      used.add(extra.exerciseId);
      previousExercise = gateways.exercises.find(extra.exerciseId);
      circuitExercises.push(previousExercise);
    }
    const circuit = {
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
    assignCircuitRepBudget(circuit);
    return circuit;
  });
}


export function restWorkoutDay(day, pendingCycle): WorkoutDay {
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


export function rotationRestWorkoutDay(day, cycle): WorkoutDay {
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


export function generatedWorkoutDay(
  day,
  cycle,
  used,
  usedForCycle = new Set(),
): WorkoutDay {
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


export function mainExerciseIdSet(week) {
  return new Set(
    DAY_CONFIG.flatMap((day) =>
      (week?.days?.[day.id]?.circuits || []).flatMap((circuit) =>
        mainAssignments(circuit).map((assignment) => assignment.exerciseId),
      ),
    ),
  );
}


export interface GenerateWeekOptions {
  restDayIds?: string[];
  cycleOverrides?: Record<string, string>;
  /** Keep days whose scheduled cycle did not change. */
  preserveMatching?: boolean;
  forceCycleIds?: string[];
  forceDayIds?: string[];
  /** Count dropped exercises as skipped and new ones as chosen. */
  trackChanges?: boolean;
}


export function generateWeek(
  previousWeek: Week | null = null,
  options: GenerateWeekOptions = {},
) {
  const restDayIds = Array.isArray(options.restDayIds)
    ? options.restDayIds
    : Array.isArray(previousWeek?.restDayIds)
      ? previousWeek.restDayIds
      : [];
  const cycleOverrides = normalizeCycleOverrides(
    options.cycleOverrides || previousWeek?.cycleOverrides,
  );
  const schedule = scheduleCycles(
    gateways.week.startCycleId(),
    restDayIds,
    cycleOverrides,
  );
  const preserveMatching = Boolean(options.preserveMatching);
  const forceCycleIds = new Set(options.forceCycleIds || []);
  const forceDayIds = new Set(options.forceDayIds || []);
  const days = {} as Record<DayId, WorkoutDay>;
  const preservedDays = {} as Partial<Record<DayId, WorkoutDay>>;
  const used = new Set();
  const usedByCycle = new Map(
    gateways.cycles.all().map((cycle) => [cycle.id, new Set()]),
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
  const nextWeek: Week = {
    number: gateways.week.number(),
    startedAt: gateways.week.startedAt(),
    startCycleId: gateways.week.startCycleId(),
    nextCycleId: schedule.nextCycleId,
    restDayIds: [
      ...new Set<DayId>(
        (restDayIds as DayId[]).filter((dayId) =>
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
      if (!nextIds.has(id)) gateways.exercises.stats(id).skippedCount += 1;
    }
    for (const id of nextIds) {
      if (!oldIds.has(id)) gateways.exercises.stats(id).chosenCount += 1;
    }
  } else {
    for (const id of nextIds) gateways.exercises.stats(id).chosenCount += 1;
  }
  gateways.week.replace(nextWeek);
  gateways.week.setNextCycleId(schedule.nextCycleId);
}
