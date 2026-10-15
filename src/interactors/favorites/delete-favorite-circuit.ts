import type { Gateways } from "../../gateways/gateways";
import { changed, type InteractorResult } from "../interactor";

// As a user
// When I remove a circuit from my favorites
// Then it is no longer offered for that circuit position
export function deleteFavoriteCircuit(
  gateways: Gateways,
  input: { favoriteId: string },
): InteractorResult {
  gateways.favorites.replaceAll(
    gateways.favorites
      .all()
      .filter((favorite) => favorite.id !== input.favoriteId),
  );
  return changed({
    refresh: ["favorite-results", "all"],
    toast: "Favorite circuit removed.",
  });
}
