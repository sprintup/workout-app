// Test doubles for the infrastructure gateways, plus a helper that installs a
// complete gateway bundle around a fresh, deterministic document.
import { InMemoryAppStateGateway } from "../../src/gateways/app-state-gateway";
import { DocumentCycleGateway } from "../../src/gateways/cycle-gateway";
import { DocumentExerciseGateway } from "../../src/gateways/exercise-gateway";
import { DocumentFavoritesGateway } from "../../src/gateways/favorites-gateway";
import type {
  BrowserStorageGateway,
  ClockGateway,
  Gateways,
  PickedWorkoutFile,
  RandomGateway,
  SaveStatusGateway,
  WorkoutFileGateway,
  WorkoutFileWriteOutcome,
} from "../../src/gateways/gateways";
import { DocumentPreferencesGateway } from "../../src/gateways/preferences-gateway";
import { installGateways } from "../../src/gateways/registry";
import { DocumentRoutineGateway } from "../../src/gateways/routine-gateway";
import { DocumentWeekGateway } from "../../src/gateways/week-gateway";
import { openApp } from "../../src/interactors/app/open-app";
import { normalizeState } from "../../src/services/normalize-state";
import type { AppState } from "../../src/types";

/** A clock that reads a fixed time until a test moves it. */
export class FixedClock implements ClockGateway {
  constructor(private current: Date) {}

  set(isoDate: string): void {
    this.current = new Date(isoDate);
  }

  now(): Date {
    return new Date(this.current);
  }

  nowIso(): string {
    return this.current.toISOString();
  }

  nowMs(): number {
    return this.current.getTime();
  }
}

/** A seeded pseudo-random sequence (mulberry32), so generation repeats. */
export class SeededRandom implements RandomGateway {
  constructor(private seed: number) {}

  next(): number {
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let value = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  token(length: number): string {
    return Math.floor(this.next() * 36 ** length)
      .toString(36)
      .padStart(length, "0");
  }
}

export class MemoryBrowserStorage implements BrowserStorageGateway {
  stored: string | null = null;

  load(): unknown | null {
    return this.stored ? JSON.parse(this.stored) : null;
  }

  save(state: AppState): void {
    this.stored = JSON.stringify(state);
  }
}

export class MemorySaveStatus implements SaveStatusGateway {
  unsaved = true;

  hasUnsavedChanges(): boolean {
    return this.unsaved;
  }

  markUnsaved(): void {
    this.unsaved = true;
  }

  markSaved(): void {
    this.unsaved = false;
  }
}

/** Records writes; `nextOutcome` lets a test simulate the browser's answer. */
export class FakeWorkoutFile implements WorkoutFileGateway {
  written: string | null = null;
  connected: string | null = null;
  nextOutcome: WorkoutFileWriteOutcome["status"] = "saved";

  connectedPath(): string | null {
    return this.connected;
  }

  async restoreConnection(): Promise<string | null> {
    return this.connected;
  }

  async write(contents: string): Promise<WorkoutFileWriteOutcome> {
    if (this.nextOutcome !== "saved") return { status: this.nextOutcome } as WorkoutFileWriteOutcome;
    this.written = contents;
    this.connected ||= "workouts.json";
    return {
      status: "saved",
      fileName: this.connected,
      displayPath: this.connected,
    };
  }

  canPick(): boolean {
    return true;
  }

  async pick(): Promise<PickedWorkoutFile | null> {
    return null;
  }

  fromFile(file: File): PickedWorkoutFile {
    return { name: file.name, displayPath: file.name, text: () => file.text() };
  }

  async connect(file: PickedWorkoutFile): Promise<void> {
    this.connected = file.displayPath;
  }
}

/** A file the user "picked", holding the given text. */
export function pickedFile(name: string, contents: string): PickedWorkoutFile {
  return { name, displayPath: name, text: async () => contents };
}

export interface TestGateways extends Gateways {
  clock: FixedClock;
  random: SeededRandom;
  browserStorage: MemoryBrowserStorage;
  saveStatus: MemorySaveStatus;
  workoutFile: FakeWorkoutFile;
}

/**
 * Installs real document gateways with fake infrastructure, then opens the
 * app, which generates a first week. Monday 2026-10-12 is the default date.
 */
export function createTestGateways(
  options: { now?: string; seed?: number } = {},
): TestGateways {
  const appState = new InMemoryAppStateGateway(normalizeState);
  const gateways: TestGateways = {
    appState,
    week: new DocumentWeekGateway(appState),
    cycles: new DocumentCycleGateway(appState),
    routines: new DocumentRoutineGateway(appState),
    exercises: new DocumentExerciseGateway(appState),
    favorites: new DocumentFavoritesGateway(appState),
    preferences: new DocumentPreferencesGateway(appState),
    browserStorage: new MemoryBrowserStorage(),
    saveStatus: new MemorySaveStatus(),
    workoutFile: new FakeWorkoutFile(),
    clock: new FixedClock(new Date(options.now || "2026-10-12T09:00:00")),
    random: new SeededRandom(options.seed ?? 45),
  };
  installGateways(gateways);
  openApp(gateways);
  return gateways;
}
