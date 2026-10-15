import { includesAny } from "./text";


export function mainAssignments(circuit) {
  return [circuit.first, circuit.second, ...(circuit.extras || [])].filter(
    Boolean,
  );
}


export function isEquipmentFreeExercise(exercise) {
  if (!exercise) return false;
  const equipmentLabel = String(exercise.equipment_label || "").toLowerCase();
  const varieties = Array.isArray(exercise.equipment_varieties)
    ? exercise.equipment_varieties
    : [];
  const onlyBodyWeight =
    varieties.length > 0 &&
    varieties.every((item) => item.toLowerCase() === "body weight");
  const bodyWeightOption =
    equipmentLabel.includes("body weight or") ||
    equipmentLabel.includes("bodyweight or");
  const explicitlyEquipmentFree = includesAny(equipmentLabel, [
    "no equipment",
    "none required",
  ]);
  return onlyBodyWeight || bodyWeightOption || explicitlyEquipmentFree;
}


export function isCircuitComplete(circuit) {
  return (
    Array.isArray(circuit.roundsCompleted) &&
    circuit.roundsCompleted.length === 3 &&
    circuit.roundsCompleted.every(Boolean)
  );
}


export function circuitExerciseIds(circuit) {
  return mainAssignments(circuit).map((assignment) => assignment.exerciseId);
}
