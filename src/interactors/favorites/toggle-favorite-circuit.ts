import { circuitExerciseIds, mainAssignments } from "../../entities/circuits";
import { cycleDisplayName } from "../../entities/cycles";
import type { Gateways } from "../../gateways/gateways";
import { cycleForDay } from "../../services/cycle-schedule";
import { favoriteSignature, favoritesForSlot } from "../../services/favorites";
import type { DayId } from "../../types";
import { changed, unchanged, type InteractorResult } from "../interactor";

export interface FavoriteSlot {
  dayId: DayId;
  circuitIndex: number;
}

function existingFavorite(gateways: Gateways, input: FavoriteSlot) {
  const circuit = gateways.week.day(input.dayId)?.circuits?.[input.circuitIndex];
  if (!circuit) return { circuit: null, existing: null };
  const signature = favoriteSignature(circuit);
  const existing = favoritesForSlot(input.dayId, input.circuitIndex).find(
    (favorite) => favorite.signature === signature,
  );
  return { circuit, existing };
}

function suggestedFavoriteName(gateways: Gateways, input: FavoriteSlot): string {
  const circuit = gateways.week.day(input.dayId).circuits[input.circuitIndex];
  const exerciseNames = circuitExerciseIds(circuit)
    .map((exerciseId) => gateways.exercises.find(exerciseId)?.name)
    .filter(Boolean);
  return `${cycleDisplayName(cycleForDay(input.dayId))} Circuit ${circuit.number} — ${exerciseNames.slice(0, 2).join(" + ")}`;
}

/**
 * The name to suggest when this circuit would be saved as a new favorite,
 * or null when toggling would remove an existing favorite instead.
 */
export function favoriteNameSuggestion(
  gateways: Gateways,
  input: FavoriteSlot,
): string | null {
  const { circuit, existing } = existingFavorite(gateways, input);
  if (!circuit || existing) return null;
  return suggestedFavoriteName(gateways, input);
}

// As a user
// When I star a circuit (or un-star a favorite)
// Then the circuit is saved under the name I give it, so I can reuse it in
//   the same cycle and position later (or it is removed from favorites)
export function toggleFavoriteCircuit(
  gateways: Gateways,
  input: FavoriteSlot & { name?: string },
): InteractorResult {
  const { circuit, existing } = existingFavorite(gateways, input);
  if (!circuit) return unchanged();
  if (existing) {
    gateways.favorites.replaceAll(
      gateways.favorites.all().filter((favorite) => favorite.id !== existing.id),
    );
    return changed({
      refresh: ["all"],
      toast: "Circuit removed from favorites.",
    });
  }
  const exerciseNames = circuitExerciseIds(circuit)
    .map((exerciseId) => gateways.exercises.find(exerciseId)?.name)
    .filter(Boolean);
  const suggestedName = suggestedFavoriteName(gateways, input);
  gateways.favorites.all().push({
    id: `favorite-${gateways.clock.nowMs()}-${gateways.random.token(6)}`,
    cycleId: cycleForDay(input.dayId).id,
    circuitIndex: input.circuitIndex,
    category: circuit.category,
    name: String(input.name ?? "").trim().slice(0, 100) || suggestedName,
    exerciseNames,
    signature: favoriteSignature(circuit),
    assignments: JSON.parse(JSON.stringify(mainAssignments(circuit))),
    savedAt: gateways.clock.nowIso(),
  });
  gateways.favorites.replaceAll(gateways.favorites.all().slice(-30));
  return changed({ refresh: ["all"], toast: "Circuit saved as a favorite." });
}
