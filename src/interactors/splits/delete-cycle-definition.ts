import type { Gateways } from "../../gateways/gateways";
import { changed, failed, unchanged, type InteractorResult } from "../interactor";

function usage(gateways: Gateways, cycleDefinitionId: string) {
  const cycle = gateways.cycles
    .customDefinitions()
    .find((item) => item.id === cycleDefinitionId);
  if (!cycle) return null;
  const usedBy = gateways.cycles
    .customSplits()
    .filter((split) => split.entries.includes(cycleDefinitionId));
  return { cycle, usedBy };
}

/** The question to confirm first, or null when the cycle can't be deleted. */
export function deleteCycleDefinitionConfirmation(
  gateways: Gateways,
  input: { cycleDefinitionId: string },
): string | null {
  const target = usage(gateways, input.cycleDefinitionId);
  if (!target || target.usedBy.length) return null;
  return `Delete ${target.cycle.name} from the cycle library?`;
}

// As a user
// When I delete a reusable cycle from the cycle library
// Then it is removed, unless a custom split still uses it
export function deleteCycleDefinition(
  gateways: Gateways,
  input: { cycleDefinitionId: string },
): InteractorResult {
  const target = usage(gateways, input.cycleDefinitionId);
  if (!target) return unchanged();
  const { cycle, usedBy } = target;
  if (usedBy.length) {
    return failed(
      `${cycle.name} is used by ${usedBy.map((split) => split.name).join(", ")}. Remove it from those splits first.`,
    );
  }
  gateways.cycles.replaceCustomDefinitions(
    gateways.cycles
      .customDefinitions()
      .filter((item) => item.id !== input.cycleDefinitionId),
  );
  return changed({
    refresh: ["split-dialog"],
    toast: `${cycle.name} deleted from the cycle library.`,
  });
}
