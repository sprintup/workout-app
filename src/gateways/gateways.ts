// Gateway interfaces: the only way interactors, services and views reach data.
//
// Domain gateways (week, cycles, routines, exercises, favorites, preferences)
// read and write slices of the in-memory AppState document. Infrastructure
// gateways reach the outside world: browser storage, the JSON workout file,
// the user's database, the clock and randomness.
//
// Domain gateways hand out live records: changing a returned object changes
// the stored data. Use the replace/set methods to swap a whole value.
import type {
  AppState,
  CardioDay,
  CardioSettings,
  Cycle,
  CycleDefinition,
  CooldownExercise,
  DayId,
  Exercise,
  ExerciseEdit,
  ExerciseRating,
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
  /** Finished weeks in a row before the current one. */
  streak(): number;
  setStreak(weeks: number): void;
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
  /** This week's thumbs ratings, keyed by occurrence (see ratingKey). */
  ratings(): Record<string, ExerciseRating>;
  replaceRatings(ratings: Record<string, ExerciseRating>): void;
}

export interface CardioGateway {
  settings(): CardioSettings;
  replaceSettings(settings: CardioSettings): void;
  /** A calendar day's cardio this week; created on first use. */
  day(dayId: DayId): CardioDay;
  week(): Partial<Record<DayId, CardioDay>>;
  clearWeek(): void;
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

/** Where to reach the data service and how to sign in; held in memory only. */
export interface DatabaseLogin {
  /** The address of data.php. */
  url: string;
  /** The MySQL server's hostname. */
  host: string;
  /** The database's name on that server. */
  database: string;
  user: string;
  password: string;
}

/** Where the database is, without the password: safe to remember. */
export interface DatabaseDetails {
  url: string;
  host: string;
  database: string;
  user: string;
}

/** The database details this browser remembers for the sign-in form. */
export interface DatabaseDetailsGateway {
  recall(): DatabaseDetails | null;
  /** Keeps url, host, database and user only; never a password. */
  remember(details: DatabaseDetails): void;
  forget(): void;
}

/** The save file kept in the database. */
export interface StoredData {
  revision: number;
  updatedAt: string;
  contents: string;
}

export type DatabaseWriteOutcome =
  | { status: "saved"; updatedAt: string }
  /** The stored data was no longer at the revision being replaced. */
  | { status: "conflict"; updatedAt: string | null };

/**
 * The one copy of the user's data in their own database. A write only
 * replaces the revision it names, so data another device saved is never
 * overwritten by accident.
 */
export interface DatabaseGateway {
  isConnected(): boolean;
  /** Checks the login and keeps it for this session. */
  connect(login: DatabaseLogin): Promise<void>;
  disconnect(): void;
  /** What is stored now; null when nothing has been saved yet. */
  read(): Promise<StoredData | null>;
  /** The revision this browser last loaded or saved this session, or null. */
  syncedRevision(): number | null;
  /** When the data this browser last loaded or saved was saved. */
  syncedAt(): string | null;
  /** Records that the data on screen now matches this stored data. */
  markLoaded(data: StoredData): void;
  /** Replaces the stored data if it is still at baseRevision (0 when empty). */
  write(contents: string, baseRevision: number): Promise<DatabaseWriteOutcome>;
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
  cardio: CardioGateway;
  exercises: ExerciseGateway;
  favorites: FavoritesGateway;
  preferences: PreferencesGateway;
  browserStorage: BrowserStorageGateway;
  saveStatus: SaveStatusGateway;
  workoutFile: WorkoutFileGateway;
  database: DatabaseGateway;
  databaseDetails: DatabaseDetailsGateway;
  clock: ClockGateway;
  random: RandomGateway;
}
