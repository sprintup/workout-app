// Domain types shared by entities, gateways, services, interactors and views.
// They describe the saved JSON document (AppState) and the exercise catalog.

export type DayId =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DayConfig {
  id: DayId;
  short: string;
  name: string;
  focus: string;
  defaultTarget: string;
  guidance: string;
  defaultEnabled?: boolean;
}

/** A calendar date in local time, formatted YYYY-MM-DD. */
export type DateKey = string;

export type AssignmentPosition =
  | "first"
  | "second"
  | `extra-${number}`
  | "optionalActivator";

/** Where an exercise sits in the current week. */
export interface AssignmentContext {
  dayId: DayId;
  circuitIndex: number;
  position: AssignmentPosition;
}

// ---------------------------------------------------------------------------
// Exercise catalog
// ---------------------------------------------------------------------------

/** A raw exercise record from the data files or a user-created exercise. */
export interface ExerciseRecord {
  id?: string;
  name: string;
  category: string;
  equipment: string;
  instructionUrl?: string | null;
  sourceRow?: number | null;
  custom?: boolean;
  alwaysLocked?: boolean;
  catalogExpansion?: boolean;
  [field: string]: any;
}

/** An exercise after inference and user edits have been applied. */
export interface Exercise {
  id: string;
  name: string;
  aliases: string[];
  primary_body_part: string;
  body_parts: string[];
  secondary_body_parts: string[];
  movement_pattern: string;
  movement_role: string;
  force_type: string;
  equipment: string[];
  equipment_label: string;
  equipment_varieties: string[];
  setup_location: string;
  bench_position: string;
  pulley_height: string;
  attachment: string | null;
  unilateral: boolean;
  overhead: boolean;
  must_be_seated: boolean;
  shoulder_caution: boolean;
  back_caution: boolean;
  technical_difficulty: string;
  effectiveness_score: number;
  default_reps: string;
  instruction_url: string | null;
  user_locked: boolean;
  notes: string | null;
  source_row: number | null | undefined;
  custom: boolean;
  catalog_expansion: boolean;
  total_body_activator: boolean;
  always_locked: boolean;
}

/** Field overrides the user saved for a built-in or custom exercise. */
export interface ExerciseEdit {
  name?: string;
  aliases?: string[];
  category?: string;
  equipment?: string;
  instructionUrl?: string | null;
  movementPattern?: string;
  movementRole?: string;
  forceType?: string;
  defaultReps?: string;
  shoulderCaution?: boolean;
  backCaution?: boolean;
  notes?: string | null;
  equipmentVarieties?: string[];
  bodyParts?: string[];
  totalBodyActivator?: boolean;
  bothSides?: boolean;
  effectivenessScore?: number;
}

/** Per-exercise usage statistics and the user's saved log values. */
export interface ExerciseStats {
  chosenCount: number;
  skippedCount: number;
  preference: number;
  effectivenessFeedbackBase: number | null;
  loadProgressCount: number;
  reps: string;
  measureType: "reps" | "seconds";
  weight: string;
  loadBasis: "total" | "each";
  notes: string;
}

// ---------------------------------------------------------------------------
// Week, days, circuits
// ---------------------------------------------------------------------------

export interface Assignment {
  exerciseId: string;
  slotLabel: string;
  locked: boolean;
  fixed: boolean;
  manualOverride?: boolean;
  cycleLock?: boolean;
  rotationRepeat?: boolean;
  slotKey?: string | null;
  reps?: string;
  repBasis?: "per_side" | "total";
  setupScore?: number;
}

export interface Circuit {
  number: number;
  category: string;
  first: Assignment;
  second: Assignment;
  extras: Assignment[];
  optionalActivator?: Assignment | null;
  rounds: number;
  preferredExerciseCount: number;
  roundsCompleted: boolean[];
  optionalActivatorCompleted: boolean;
  completionCredited: boolean;
  /** Older saves only; normalization converts these on load. */
  bridge?: Assignment | null;
  bridgeCompleted?: boolean;
  completed?: boolean;
}

export interface WorkoutTimer {
  durationMs: number;
  elapsedMs: number;
  startedAt: string | null;
}

export type Checklist = Record<string, boolean>;

export interface WorkoutDay {
  day: string;
  rest?: boolean;
  restSource?: "calendar" | "rotation" | null;
  cycleId?: string | null;
  pendingCycleId?: string | null;
  target: string | null;
  focus: string;
  bodyParts: string[];
  description?: string;
  circuits: Circuit[];
  preChecklist: Checklist;
  cooldownChecklist: Checklist;
  timer: WorkoutTimer;
  /** Older saves only; normalization converts these on load. */
  coreCompleted?: boolean;
  cardioCompleted?: boolean;
}

export interface Week {
  number: number;
  startedAt: string;
  startCycleId: string;
  nextCycleId: string;
  restDayIds: DayId[];
  cycleOverrides: Partial<Record<DayId, string>>;
  days: Record<DayId, WorkoutDay>;
}

export interface WeekHistoryEntry {
  weekNumber: number;
  startedAt: string;
  exerciseIds: string[];
}

// ---------------------------------------------------------------------------
// Cycles and splits
// ---------------------------------------------------------------------------

export interface CycleLock {
  circuitIndex: number;
  position: string;
  assignment: Assignment;
}

export interface Cycle {
  id: string;
  kind: "training" | "rest";
  name: string;
  target: string | null;
  designation?: string;
  bodyParts: string[];
  description: string;
  circuitExerciseCounts: Array<number | null>;
  lockedAssignments: CycleLock[];
  rest?: boolean;
}

/** A reusable cycle a split can be built from (built in or user defined). */
export interface CycleDefinition {
  id: string;
  name: string;
  target: string;
  bodyParts: string[];
  description: string;
  template?: boolean;
}

export interface SplitDefinition {
  id: string;
  name: string;
  description: string;
  entries: string[];
  template?: boolean;
}

// ---------------------------------------------------------------------------
// Routines and favorites
// ---------------------------------------------------------------------------

export interface RoutineExercise {
  id: string;
  label: string;
}

export interface CooldownExercise extends RoutineExercise {
  /** Show the exercise only when it has not been done in the previous intervalDays - 1 days. */
  intervalDays: number;
  completedDates: DateKey[];
}

export interface FavoriteCircuit {
  id: string;
  cycleId: string;
  circuitIndex: number;
  category: string;
  name: string;
  exerciseNames: string[];
  signature: string;
  assignments: Assignment[];
  savedAt: string;
}

// ---------------------------------------------------------------------------
// The saved document
// ---------------------------------------------------------------------------

export interface AppState {
  version: number;
  weekNumber: number;
  weekStartedAt: string;
  circuitRepBudget: number;
  exerciseState: Record<string, ExerciseStats>;
  customExercises: ExerciseRecord[];
  exerciseEdits: Record<string, ExerciseEdit>;
  equipmentCatalog: string[];
  warmupExercises: RoutineExercise[];
  cooldownExercises: CooldownExercise[];
  cycles: Cycle[];
  customCycles: CycleDefinition[];
  customSplits: SplitDefinition[];
  activeSplitId: string | null;
  splitWeekStartDay: DayId;
  weekStartCycleId: string;
  nextCycleId: string;
  favoriteCircuits: FavoriteCircuit[];
  hiddenExerciseIds: string[];
  deletedExerciseIds: string[];
  history: WeekHistoryEntry[];
  week: Week | null;
  /** Set by normalization when a load needs a follow-up step; never saved. */
  needsCycleRegeneration?: boolean;
  needsCooldownNormalization?: boolean;
}

// ---------------------------------------------------------------------------
// Circuit templates (the slot tables in data/slots.ts)
// ---------------------------------------------------------------------------

/** One position in a circuit template and the exercises that may fill it. */
export interface CircuitSlot {
  label: string;
  names: string[];
  defaultName?: string;
  noEquipmentOnly?: boolean;
  alwaysLocked?: boolean;
  bodyPartFilter?: string[];
}

export interface CircuitDefinition {
  category: string;
  first: CircuitSlot;
  second: CircuitSlot;
  bridge: CircuitSlot;
  extra?: CircuitSlot;
  defaultCount?: number;
}
