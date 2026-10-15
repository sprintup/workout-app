import {
  equipmentFilterKey,
  equipmentOptionLabel,
  normalizeEquipmentCatalog,
} from "../../entities/equipment";
import type { Gateways } from "../../gateways/gateways";
import { equipmentOptions } from "../../services/exercise-catalog";
import { changed, failed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I add a piece of equipment to the master equipment list
// Then it becomes available when adding or filtering exercises
export function addEquipment(
  gateways: Gateways,
  input: { name: string },
): InteractorResult {
  const requestedName = String(input.name || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const name = equipmentOptionLabel(requestedName);
  const key = equipmentFilterKey(name);
  if (!name || !key) return unchanged();
  const existing = equipmentOptions().find(
    (equipment) => equipmentFilterKey(equipment) === key,
  );
  if (existing) return failed(`${existing} is already in the equipment list.`);
  gateways.preferences.replaceEquipmentCatalog(
    normalizeEquipmentCatalog([
      ...gateways.preferences.equipmentCatalog(),
      name,
    ]),
  );
  return changed({
    refresh: ["equipment-dialog", "library"],
    toast: `${name} added to the master equipment list.`,
  });
}
