

export function equipmentFilterKey(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (
    /(^|\s)ft2?(\s|$)/.test(normalized) ||
    normalized.includes("functional trainer") ||
    normalized.includes("cable")
  ) {
    return "functional_trainer";
  }
  const aliases = {
    "adjustable dumbbell": "dumbbells",
    "adjustable dumbbells": "dumbbells",
    dumbbell: "dumbbells",
    dumbbells: "dumbbells",
    band: "resistance_bands",
    bands: "resistance_bands",
    "resistance band": "resistance_bands",
    "resistance bands": "resistance_bands",
    bodyweight: "body_weight",
    "body weight": "body_weight",
    plate: "weight_plates",
    plates: "weight_plates",
    "weight plate": "weight_plates",
    "weight plates": "weight_plates",
    "d handle": "d_handles",
    "d handles": "d_handles",
    "ankle strap": "ankle_straps",
    "ankle straps": "ankle_straps",
    "pull up bar": "pull_up_bar",
    "pull-up bar": "pull_up_bar",
    smith: "smith_machine",
    "smith machine": "smith_machine",
    "smitch machine": "smith_machine",
  };
  if (aliases[normalized]) return aliases[normalized];
  return normalized;
}


export function equipmentOptionLabel(value) {
  const key = equipmentFilterKey(value);
  const labels = {
    functional_trainer: "FT",
    dumbbells: "Dumbbells",
    resistance_bands: "Resistance bands",
    body_weight: "Body weight",
    weight_plates: "Weight plates",
    d_handles: "D-handles",
    ankle_straps: "Ankle straps",
    pull_up_bar: "Pull-up bar",
    smith_machine: "Smith machine",
  };
  return (
    labels[key] ||
    String(value || "")
      .replace(/\s+/g, " ")
      .trim()
  );
}


export function normalizeEquipmentCatalog(values) {
  const catalog = [];
  const seen = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    const label = equipmentOptionLabel(value).slice(0, 80);
    const key = equipmentFilterKey(label);
    if (!label || !key || seen.has(key)) continue;
    seen.add(key);
    catalog.push(label);
  }
  return catalog.sort((first, second) => first.localeCompare(second));
}


export function equipmentLabelFromVarieties(values) {
  const varieties = normalizeEquipmentCatalog(values);
  return varieties.length ? varieties.join(" + ") : "Body weight";
}


export function requiredEquipmentKeys(exercise) {
  const varieties = Array.isArray(exercise?.equipment_varieties)
    ? exercise.equipment_varieties
    : [];
  return new Set(
    varieties
      .map(equipmentFilterKey)
      .filter((key) => key && key !== "body_weight"),
  );
}


export function matchesEquipmentSelection(exercise, selectedEquipment) {
  if (selectedEquipment === "all") return true;
  const selectedKey = equipmentFilterKey(selectedEquipment);
  return [
    ...exercise.equipment_varieties,
    ...exercise.equipment,
    exercise.equipment_label,
  ].some((item) => equipmentFilterKey(item) === selectedKey);
}
