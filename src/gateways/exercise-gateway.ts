import { BASE_EXERCISES } from "../data/exercise-library";
import { applyExerciseEdit, enrichExercise } from "../entities/exercise";
import { cleanRepValue, defaultMeasureType } from "../entities/exercise-state";
import type {
  Exercise,
  ExerciseEdit,
  ExerciseRecord,
  ExerciseStats,
} from "../types";
import type { AppStateGateway, ExerciseGateway } from "./gateways";

/**
 * The exercise library: built-in exercises plus the user's custom ones with
 * their edits applied, and the per-exercise stats and visibility lists saved
 * in the document.
 */
export class DocumentExerciseGateway implements ExerciseGateway {
  private exercises: Exercise[] = [...BASE_EXERCISES];
  private exerciseById = new Map(
    BASE_EXERCISES.map((exercise) => [exercise.id, exercise]),
  );

  constructor(private readonly appState: AppStateGateway) {}

  private get state() {
    return this.appState.current();
  }

  all(): Exercise[] {
    return this.exercises;
  }

  find(exerciseId: string | null | undefined): Exercise | undefined {
    return this.exerciseById.get(exerciseId as string);
  }

  has(exerciseId: string | null | undefined): boolean {
    return this.exerciseById.has(exerciseId as string);
  }

  rebuildCatalog(
    customRecords: ExerciseRecord[] = [],
    edits: Record<string, ExerciseEdit> = {},
  ): void {
    const seen = new Set(BASE_EXERCISES.map((exercise) => exercise.id));
    const userExercises: Exercise[] = [];
    for (const record of customRecords) {
      const exercise = enrichExercise({ ...record, custom: true });
      if (!exercise.id || seen.has(exercise.id)) continue;
      seen.add(exercise.id);
      userExercises.push(exercise);
    }
    this.exercises = [...BASE_EXERCISES, ...userExercises].map((exercise) =>
      applyExerciseEdit(exercise, edits[exercise.id]),
    );
    this.exerciseById = new Map(
      this.exercises.map((exercise) => [exercise.id, exercise]),
    );
  }

  customRecords(): ExerciseRecord[] {
    return this.state?.customExercises;
  }

  edits(): Record<string, ExerciseEdit> {
    return this.state?.exerciseEdits;
  }

  stats(exerciseId: string): ExerciseStats {
    if (!this.state.exerciseState[exerciseId]) {
      const exercise = this.exerciseById.get(exerciseId);
      this.state.exerciseState[exerciseId] = {
        chosenCount: 0,
        skippedCount: 0,
        preference: 0,
        effectivenessFeedbackBase: null,
        loadProgressCount: 0,
        reps: cleanRepValue(exercise?.default_reps || "10"),
        measureType: defaultMeasureType(exercise),
        weight: "",
        loadBasis: "total",
        notes: "",
      };
    }
    return this.state.exerciseState[exerciseId];
  }

  isHidden(exerciseId: string): boolean {
    return this.state?.hiddenExerciseIds?.includes(exerciseId) || false;
  }

  isDeleted(exerciseId: string): boolean {
    return this.state?.deletedExerciseIds?.includes(exerciseId) || false;
  }

  hiddenIds(): string[] {
    return this.state?.hiddenExerciseIds;
  }

  replaceHiddenIds(exerciseIds: string[]): void {
    this.state.hiddenExerciseIds = exerciseIds;
  }

  deletedIds(): string[] {
    return this.state?.deletedExerciseIds;
  }
}
