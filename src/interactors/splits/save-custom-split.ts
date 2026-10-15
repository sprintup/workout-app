import { normalizeCustomSplits } from "../../entities/cycles";
import type { Gateways } from "../../gateways/gateways";
import { changed, failed, type InteractorResult } from "../interactor";
import { newDefinitionId } from "./definition-id";

/** The split being edited in the split dialog. */
export interface SplitDraft {
  /** The custom split being edited, or null when saving a new one. */
  customId: string | null;
  name: string;
  description: string;
  entries: string[];
}

// As a user
// When I save a split I built or adapted from a template
// Then it is kept as a custom split I can apply later
export function saveCustomSplit(
  gateways: Gateways,
  input: { draft: SplitDraft },
): InteractorResult<{ splitId: string }> {
  const { draft } = input;
  const name = String(draft.name || "")
    .trim()
    .slice(0, 80);
  if (!name) return failed("Give the custom split a name before saving.");
  if (!draft.entries.some((entry) => entry !== "rest"))
    return failed("A split needs at least one training cycle.");
  const splits = gateways.cycles.customSplits();
  const id = draft.customId || newDefinitionId(gateways, "custom-split", splits);
  const normalized = normalizeCustomSplits(
    [
      {
        id,
        name,
        description:
          draft.description || "A custom training split based on a template.",
        entries: draft.entries,
      },
    ],
    gateways.cycles.customDefinitions(),
  )[0];
  if (!normalized)
    return failed("The custom split contains an unavailable cycle.");
  const existingIndex = splits.findIndex((split) => split.id === id);
  if (existingIndex >= 0) splits[existingIndex] = normalized;
  else splits.push(normalized);
  return changed({
    refresh: ["settings", "split-dialog"],
    toast: `${normalized.name} saved as a custom split.`,
    value: { splitId: normalized.id },
  });
}
