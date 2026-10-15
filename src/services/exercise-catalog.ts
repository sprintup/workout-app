import { gateways } from "../gateways/registry";
import { BODY_PART_OPTIONS } from "../data/training";
import { normalizeEquipmentCatalog } from "../entities/equipment";
import { clampRating, exerciseEffectivenessScore } from "../entities/exercise";



export function exerciseEquipmentCatalog() {
  return normalizeEquipmentCatalog(
    gateways.exercises.all().flatMap((exercise) => exercise.equipment_varieties),
  );
}


export function updateExerciseEffectiveness(
  exerciseId,
  value,
  clearFeedback = false,
) {
  const exercise = gateways.exercises.find(exerciseId);
  if (!exercise) return null;
  const effectivenessScore = clampRating(
    value,
    exerciseEffectivenessScore(exercise),
  );
  gateways.exercises.edits()[exerciseId] = {
    ...(gateways.exercises.edits()[exerciseId] || {}),
    effectivenessScore,
  };
  if (clearFeedback) {
    const settings = gateways.exercises.stats(exerciseId);
    settings.preference = 0;
    settings.effectivenessFeedbackBase = null;
  }
  gateways.exercises.rebuildCatalog(gateways.exercises.customRecords(), gateways.exercises.edits());
  return effectivenessScore;
}


export function libraryTotalCount() {
  return gateways.exercises.all().filter((exercise) => !gateways.exercises.isDeleted(exercise.id)).length;
}


export function categoryOptions() {
  return [
    ...new Set(gateways.exercises.all().map((exercise) => exercise.primary_body_part)),
  ].sort();
}


export function equipmentOptions() {
  return normalizeEquipmentCatalog([
    ...(gateways.preferences.equipmentCatalog() || []),
    ...exerciseEquipmentCatalog(),
  ]);
}


export function bodyPartOptions() {
  return [
    ...BODY_PART_OPTIONS,
    ...[...new Set(gateways.exercises.all().flatMap((exercise) => exercise.body_parts))]
      .filter((part) => !BODY_PART_OPTIONS.includes(part))
      .sort((first, second) => first.localeCompare(second)),
  ];
}
