import type { FavoriteCircuit } from "../types";
import type { AppStateGateway, FavoritesGateway } from "./gateways";

/** Circuits the user saved as favorites. */
export class DocumentFavoritesGateway implements FavoritesGateway {
  constructor(private readonly appState: AppStateGateway) {}

  all(): FavoriteCircuit[] {
    return this.appState.current()?.favoriteCircuits;
  }

  replaceAll(favorites: FavoriteCircuit[]): void {
    this.appState.current().favoriteCircuits = favorites;
  }
}
