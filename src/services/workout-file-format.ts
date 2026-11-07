// The JSON save-file format: what a save contains and how a loaded file is
// turned back into an AppState candidate.
import { APP_VERSION } from "../config/constants";
import { gateways } from "../gateways/registry";
import { applyPendingStateMigrations } from "./state-migrations";

export const SAVE_FILE_APP_NAME = "Basement 45";

/** The document written to the workout file. */
export function exportPayload() {
  return {
    app: SAVE_FILE_APP_NAME,
    schemaVersion: APP_VERSION,
    exportedAt: gateways.clock.nowIso(),
    appState: gateways.appState.current(),
  };
}

/** The save file's text, as written to the JSON file and the database. */
export function saveFileText(): string {
  return JSON.stringify(exportPayload(), null, 2);
}

/** True when a save file holds exactly the data on screen. */
export function matchesCurrentData(text: string): boolean {
  try {
    return (
      JSON.stringify(JSON.parse(text).appState) ===
      JSON.stringify(gateways.appState.current())
    );
  } catch {
    return false;
  }
}

/**
 * Replaces the document with a save file's contents. Throws a readable error
 * and leaves the exercise catalog as it was when the file can't be used.
 */
export function restoreSaveFile(text: string) {
  const previousCustomExercises = gateways.exercises.customRecords().slice();
  const previousExerciseEdits = { ...gateways.exercises.edits() };
  try {
    const { candidate, recoveredCount } = stateWithPortableExercises(
      parseSaveFile(text),
    );
    gateways.appState.restore(candidate);
    const state = gateways.appState.current();
    const removedLegacyArmsCycle = Boolean(state.needsCycleRegeneration);
    const normalizedCoreCooldown = Boolean(state.needsCooldownNormalization);
    applyPendingStateMigrations();
    return { recoveredCount, removedLegacyArmsCycle, normalizedCoreCooldown };
  } catch (error) {
    gateways.exercises.rebuildCatalog(
      previousCustomExercises,
      previousExerciseEdits,
    );
    throw error;
  }
}

/** Parses and checks a save file; throws a readable error when it can't be used. */
export function parseSaveFile(text) {
  const parsed = JSON.parse(text);
  if (!parsed.appState) throw new Error("This is not a Basement 45 save file.");
  if (Number(parsed.appState.version) > APP_VERSION)
    throw new Error(
      `This file was saved by a newer Basement 45 version (${parsed.appState.version}).`,
    );
  if (!parsed.appState.week?.days)
    throw new Error("This workout file does not contain a saved week.");
  return parsed;
}

/** A custom-exercise record rebuilt from an older file's embedded library. */
export function portableExerciseRecord(exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    category: exercise.primary_body_part || "Other",
    equipment: exercise.equipment_label || "User-defined",
    equipmentVarieties: exercise.equipment_varieties || [],
    aliases: exercise.aliases || [],
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

/**
 * The saved AppState with any exercises that only exist in the file's
 * embedded library (older portable saves) recovered as custom exercises.
 * Rebuilds the exercise catalog for the candidate as a side effect.
 */
export function stateWithPortableExercises(parsed) {
  const candidate = JSON.parse(JSON.stringify(parsed.appState));
  candidate.customExercises = Array.isArray(candidate.customExercises)
    ? candidate.customExercises
    : [];
  gateways.exercises.rebuildCatalog(
    candidate.customExercises,
    candidate.exerciseEdits || {},
  );
  const recovered = Array.isArray(parsed.exerciseLibrary)
    ? parsed.exerciseLibrary.filter(
        (exercise) =>
          exercise?.id &&
          exercise?.name &&
          !gateways.exercises.has(exercise.id),
      )
    : [];
  candidate.customExercises.push(...recovered.map(portableExerciseRecord));
  return { candidate, recoveredCount: recovered.length };
}
