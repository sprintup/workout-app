// The exercise form's values, shared by the add and edit stories.
import {
  equipmentLabelFromVarieties,
  normalizeEquipmentCatalog,
} from "../../entities/equipment";
import {
  clampRating,
  normalizeBodyParts,
  normalizeExerciseAliases,
} from "../../entities/exercise";
import { cleanRepValue } from "../../entities/exercise-state";
import type { Gateways } from "../../gateways/gateways";
import type { ExerciseRecord, ExerciseStats } from "../../types";

/** Raw values as the user entered them in the exercise dialog. */
export interface ExerciseFormValues {
  name: string;
  aliases: string | null;
  category: string;
  equipmentVarieties: string[];
  bodyParts: string[] | string;
  instructionUrl: string;
  movementPattern: string;
  movementRole: string;
  forceType: string;
  defaultReps: string;
  measureType: string;
  defaultLoad: string;
  loadBasis: string;
  effectivenessScore: string | null;
  shoulderCaution: boolean;
  backCaution: boolean;
  totalBodyActivator: boolean;
  bothSides: boolean;
  notes: string;
}

/** The outcome the dialog needs: the saved id, or an error to show in the form. */
export interface ExerciseFormOutcome {
  exerciseId?: string;
  formError?: string;
}

export interface NormalizedExerciseForm {
  name: string;
  record: ExerciseRecord & { effectivenessScore: number };
  equipmentVarieties: string[];
  defaultReps: string;
  measureType: ExerciseStats["measureType"];
  defaultLoad: string;
  loadBasis: ExerciseStats["loadBasis"];
}

export function normalizeExerciseForm(
  values: ExerciseFormValues,
): NormalizedExerciseForm {
  const name = String(values.name || "").trim();
  const defaultReps = String(values.defaultReps || "10").trim() || "10";
  const measureType: ExerciseStats["measureType"] =
    values.measureType === "reps" || values.measureType === "seconds"
      ? values.measureType
      : /sec|second/i.test(defaultReps)
        ? "seconds"
        : "reps";
  const defaultLoad = String(values.defaultLoad || "")
    .trim()
    .slice(0, 40);
  const loadBasis: ExerciseStats["loadBasis"] =
    values.loadBasis === "total" || values.loadBasis === "each"
      ? values.loadBasis
      : "total";
  const selectedEquipment = normalizeEquipmentCatalog(values.equipmentVarieties);
  const equipmentVarieties = selectedEquipment.length
    ? selectedEquipment
    : ["Body weight"];
  const record = {
    name,
    aliases: normalizeExerciseAliases(values.aliases, name),
    category: String(values.category || "Other"),
    equipment: equipmentLabelFromVarieties(equipmentVarieties),
    equipmentVarieties,
    bodyParts: normalizeBodyParts(values.bodyParts),
    instructionUrl: String(values.instructionUrl || "").trim() || null,
    sourceRow: null,
    custom: true,
    movementPattern: String(values.movementPattern || "other"),
    movementRole: String(values.movementRole || "isolation"),
    forceType: String(values.forceType || "other"),
    defaultReps,
    effectivenessScore: clampRating(values.effectivenessScore, 3),
    shoulderCaution: values.shoulderCaution,
    backCaution: values.backCaution,
    totalBodyActivator: values.totalBodyActivator,
    bothSides: values.bothSides,
    notes: String(values.notes || "").trim() || null,
  };
  return {
    name,
    record,
    equipmentVarieties,
    defaultReps,
    measureType,
    defaultLoad,
    loadBasis,
  };
}

/**
 * Saves the form's default reps and load as the exercise's log values and
 * adds its equipment to the master list.
 */
export function saveExerciseDefaults(
  gateways: Gateways,
  exerciseId: string,
  form: NormalizedExerciseForm,
): ExerciseStats {
  gateways.preferences.replaceEquipmentCatalog(
    normalizeEquipmentCatalog([
      ...gateways.preferences.equipmentCatalog(),
      ...form.equipmentVarieties,
      ...(gateways.exercises.find(exerciseId)?.equipment_varieties || []),
    ]),
  );
  const stats = gateways.exercises.stats(exerciseId);
  if (stats.weight !== form.defaultLoad) stats.loadProgressCount = 0;
  stats.reps = cleanRepValue(form.defaultReps).slice(0, 40);
  stats.measureType = form.measureType;
  stats.weight = form.defaultLoad;
  stats.loadBasis = form.loadBasis;
  return stats;
}
