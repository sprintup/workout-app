import { gateways } from "../gateways/registry";
import { APP_VERSION, DEFAULT_CIRCUIT_REP_BUDGET } from "../config/constants";
import { createDefaultCycles } from "../entities/cycles";
import { createDefaultCooldownExercises, createDefaultWarmupExercises } from "../entities/routines";
import { exerciseEquipmentCatalog } from "./exercise-catalog";
import { initialExerciseState } from "./exercise-state";
import type { AppState } from "../types";


export function createState(): AppState {
  const cycles = createDefaultCycles();
  return {
    version: APP_VERSION,
    weekNumber: 1,
    weekStartedAt: gateways.clock.nowIso(),
    circuitRepBudget: DEFAULT_CIRCUIT_REP_BUDGET,
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
