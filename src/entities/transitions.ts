import { requiredEquipmentKeys } from "./equipment";


export function transitionCost(first, second) {
  if (!first || !second) return 5;

  const firstEquipment = requiredEquipmentKeys(first);
  const secondEquipment = requiredEquipmentKeys(second);
  const shared = [...firstEquipment].filter((key) =>
    secondEquipment.has(key),
  );
  const sameSetup =
    firstEquipment.size === secondEquipment.size &&
    shared.length === firstEquipment.size;

  // Independent equipment can stay set up at the same time, so generation
  // favors a varied circuit over one that repeatedly reconfigures a machine.
  let cost = 0;
  if (!firstEquipment.size || !secondEquipment.size) cost = 0;
  else if (!shared.length) cost = 0;
  else if (sameSetup) cost = 1;
  else cost = 2;

  if (
    first.bench_position !== "none" &&
    second.bench_position !== "none" &&
    first.bench_position !== second.bench_position
  ) {
    cost += 1;
  }

  if (shared.includes("functional_trainer")) {
    if (
      first.attachment &&
      second.attachment &&
      first.attachment !== second.attachment
    )
      cost += 1;
    if (
      first.pulley_height !== "variable" &&
      second.pulley_height !== "variable" &&
      first.pulley_height !== second.pulley_height
    ) {
      cost += 1;
    }
  }

  if (
    shared.includes("dumbbells") &&
    first.bench_position !== second.bench_position
  )
    cost += 1;
  return Math.min(5, cost);
}
