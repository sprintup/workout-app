// Gateway interfaces: the only way interactors, services and views reach data.
//
// Domain gateways (week, cycles, routines, exercises, favorites, preferences)
// read and write slices of the in-memory AppState document. Infrastructure
// gateways reach the outside world: browser storage, the JSON workout file,
// the clock and randomness.
//
// Domain gateways hand out live records: changing a returned object changes
// the stored data. Use the replace/set methods to swap a whole value.
import type {
  AppState,
  Cycle,
  CycleDefinition,
  CooldownExercise,
  DayId,
  Exercise,
  ExerciseEdit,
  ExerciseRecord,
  ExerciseStats,
  FavoriteCircuit,
  RoutineExercise,
  SplitDefinition,
  Week,
  WeekHistoryEntry,
  WorkoutDay,
} from "../types";

/** The whole saved document. */
export interface AppStateGateway {
  hasState(): boolean;
  current(): AppState;
  replace(next: AppState | null): void;
  /** A deep copy, used to roll back a multi-step change that fails. */
  snapshot(): AppState;
  /** Normalizes a snapshot (or loaded document) and makes it current. */
  restore(snapshot: unknown): void;
}

export interface WeekGateway {
  current(): Week;
  replace(week: Week): void;
  day(dayId: DayId | string): WorkoutDay;
  number(): number;
  setNumber(weekNumber: number): void;
  startedAt(): string;
  setStartedAt(isoDate: string): void;
  startCycleId(): string;
  setStartCycleId(cycleId: string): void;
  nextCycleId(): string;
  setNextCycleId(cycleId: string): void;
  history(): WeekHistoryEntry[];
  replaceHistory(entries: WeekHistoryEntry[]): void;
}

export interface CycleGateway {
  all(): Cycle[];
  replaceAll(cycles: Cycle[]): void;
  find(cycleId: string | null | undefined): Cycle | null;
  customDefinitions(): CycleDefinition[];
  replaceCustomDefinitions(definitions: CycleDefinition[]): void;
  customSplits(): SplitDefinition[];
  replaceCustomSplits(splits: SplitDefinition[]): void;
  activeSplitId(): string | null;
  setActiveSplitId(splitId: string | null): void;
  splitWeekStartDay(): DayId;
  setSplitWeekStartDay(dayId: DayId): void;
}

export interface RoutineGateway {
  warmups(): RoutineExercise[];
  cooldowns(): CooldownExercise[];
}

export interface ExerciseGateway {
  /** The catalog: built-in exercises plus custom ones, with edits applied. */
  all(): Exercise[];
  find(exerciseId: string | null | undefined): Exercise | undefined;
  has(exerciseId: string | null | undefined): boolean;
  /** Rebuilds the catalog from the given (or saved) custom exercises and edits. */
  rebuildCatalog(
    customRecords?: ExerciseRecord[],
    edits?: Record<string, ExerciseEdit>,
  ): void;
  customRecords(): ExerciseRecord[];
  edits(): Record<string, ExerciseEdit>;
  /** Usage stats and log values for an exercise; created on first use. */
  stats(exerciseId: string): ExerciseStats;
  isHidden(exerciseId: string): boolean;
  isDeleted(exerciseId: string): boolean;
  hiddenIds(): string[];
  replaceHiddenIds(exerciseIds: string[]): void;
  deletedIds(): string[];
}

export interface FavoritesGateway {
  all(): FavoriteCircuit[];
  replaceAll(favorites: FavoriteCircuit[]): void;
}

export interface PreferencesGateway {
  circuitRepBudget(): number;
  setCircuitRepBudget(reps: number): void;
  equipmentCatalog(): string[];
  replaceEquipmentCatalog(equipment: string[]): void;
}

/** Browser-local copy of the document, so a refresh never loses work. */
export interface BrowserStorageGateway {
  /** The stored document, or null when there is none. */
  load(): unknown | null;
  save(state: AppState): void;
}

/**
 * Whether the data has changed since it was last saved to (or loaded from)
 * the workout file. Kept in browser storage so it survives a reload.
 */
export interface SaveStatusGateway {
  hasUnsavedChanges(): boolean;
  markUnsaved(): void;
  markSaved(): void;
}

/** A workout file the user chose, ready to read. */
export interface PickedWorkoutFile {
  name: string;
  /** The best path the browser reveals; browsers often hide parent folders. */
  displayPath: string;
  text(): Promise<string>;
  /** Present when the file can be written back to later. */
  handle?: unknown;
}

export type WorkoutFileWriteOutcome =
  | { status: "saved"; fileName: string; displayPath: string }
  | { status: "not-connected" }
  | { status: "unsupported" }
  | { status: "permission-denied" }
  | { status: "cancelled" };

/** The JSON workout file on disk (File System Access API where available). */
export interface WorkoutFileGateway {
  /** The connected file's display path, or null. */
  connectedPath(): string | null;
  /** Reconnects to the file chosen in an earlier session, if still permitted. */
  restoreConnection(): Promise<string | null>;
  /**
   * Writes contents to the connected file. With chooseIfMissing, asks the
   * user where to save when no file is connected yet.
   */
  write(
    contents: string,
    options?: { chooseIfMissing?: boolean; requestPermission?: boolean },
  ): Promise<WorkoutFileWriteOutcome>;
  /** False when the browser has no open-file picker (use a file input instead). */
  canPick(): boolean;
  /** Shows the open-file picker; null when the user cancels. */
  pick(): Promise<PickedWorkoutFile | null>;
  /** Wraps a file chosen through a plain file input. */
  fromFile(file: File): PickedWorkoutFile;
  /** Connects a successfully loaded file so later saves write back to it. */
  connect(file: PickedWorkoutFile): Promise<void>;
}

export interface ClockGateway {
  now(): Date;
  nowIso(): string;
  nowMs(): number;
}

export interface RandomGateway {
  /** A number in [0, 1). */
  next(): number;
  /** A short random base-36 token. */
  token(length: number): string;
}

export interface Gateways {
  appState: AppStateGateway;
  week: WeekGateway;
  cycles: CycleGateway;
  routines: RoutineGateway;
  exercises: ExerciseGateway;
  favorites: FavoritesGateway;
  preferences: PreferencesGateway;
  browserStorage: BrowserStorageGateway;
  saveStatus: SaveStatusGateway;
  workoutFile: WorkoutFileGateway;
  clock: ClockGateway;
  random: RandomGateway;
}
