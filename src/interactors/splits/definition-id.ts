import type { Gateways } from "../../gateways/gateways";

/** A new id for a custom split or cycle that no existing definition uses. */
export function newDefinitionId(
  gateways: Gateways,
  prefix: string,
  existing: Array<{ id: string }>,
): string {
  const used = new Set(existing.map((value) => value.id));
  let id: string;
  do {
    id = `${prefix}-${gateways.clock.nowMs()}-${gateways.random.token(5)}`;
  } while (used.has(id));
  return id;
}
