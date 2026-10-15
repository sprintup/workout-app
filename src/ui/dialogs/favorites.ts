import { cycleDisplayName } from "../../entities/cycles";
import { cycleForDay } from "../../services/cycle-schedule";
import { favoriteUnavailableReason, favoritesForSlot } from "../../services/favorites";
import { escapeHtml } from "../html";
import { ui } from "../ui-state";
import { dialogById } from "../dom";


export function renderFavoriteResults() {
  const target = ui.favoriteTarget;
  if (!target) return;
  const favorites = favoritesForSlot(target.dayId, target.circuitIndex);
  document.getElementById("favorite-results").innerHTML = favorites.length
    ? favorites
        .map((favorite) => {
          const reason = favoriteUnavailableReason(favorite, target);
          return `<article class="favorite-option">
            <div><strong>${escapeHtml(favorite.name)}</strong><small>${favorite.exerciseNames.map(escapeHtml).join(" · ")}</small>${reason ? `<span class="favorite-warning">${escapeHtml(reason)}</span>` : ""}</div>
            <button class="library-action" type="button" data-action="apply-favorite-circuit" data-favorite-id="${favorite.id}" ${reason ? "disabled" : ""}>Use circuit</button>
            <button class="library-action delete" type="button" data-action="delete-favorite-circuit" data-favorite-id="${favorite.id}">Remove</button>
          </article>`;
        })
        .join("")
    : '<div class="empty-state">No favorites are saved for this circuit position yet.</div>';
}


export function openFavoriteCircuits(dayId, circuitIndex) {
  ui.favoriteTarget = { dayId, circuitIndex };
  const day = cycleForDay(dayId);
  document.getElementById("favorite-title").textContent =
    `${cycleDisplayName(day)} Circuit ${circuitIndex + 1} favorites`;
  renderFavoriteResults();
  dialogById("favorite-dialog").showModal();
}
