import { normalizeCustomCycleDefinitions } from "../../entities/cycles";
import { normalizeBodyParts } from "../../entities/exercise";
import type { Gateways } from "../../gateways/gateways";
import { changed, failed, type InteractorResult } from "../interactor";
import { newDefinitionId } from "./definition-id";

/** The reusable cycle being edited in the cycle library. */
export interface CycleDefinitionDraft {
  /** The custom cycle being edited, or null when saving a new one. */
  customId: string | null;
  /** The cycle this draft started from, if any. */
  sourceId: string | null;
  name: string;
  target: string;
  bodyParts: string[];
  description: string;
}

// As a user
// When I save a reusable cycle in the cycle library
// Then it can be used as a day in any custom split
export function saveCycleDefinition(
  gateways: Gateways,
  input: { draft: CycleDefinitionDraft },
): InteractorResult<{ cycleDefinitionId: string }> {
  const { draft } = input;
  const name = String(draft.name || "")
    .trim()
    .slice(0, 80);
  const bodyParts = normalizeBodyParts(draft.bodyParts);
  if (!name) return failed("Give the cycle a name before saving.");
  if (!bodyParts.length)
    return failed("Select at least one muscle for this cycle.");
  const definitions = gateways.cycles.customDefinitions();
  const id =
    draft.customId || newDefinitionId(gateways, "custom-cycle", definitions);
  const normalized = normalizeCustomCycleDefinitions([
    {
      id,
      name,
      target: draft.target,
      bodyParts,
      description: draft.description,
    },
  ])[0];
  const existingIndex = definitions.findIndex((cycle) => cycle.id === id);
  if (existingIndex >= 0) definitions[existingIndex] = normalized;
  else definitions.push(normalized);
  return changed({
    refresh: ["split-dialog"],
    toast: `${normalized.name} saved to the cycle library.`,
    value: { cycleDefinitionId: normalized.id },
  });
}
