import { normalizeCardioDay } from "../entities/cardio";
import type { CardioDay, CardioSettings, DayId } from "../types";
import type { AppStateGateway, CardioGateway } from "./gateways";

/** The weekly cardio goal and split, and this week's cardio days. */
export class DocumentCardioGateway implements CardioGateway {
  constructor(private readonly appState: AppStateGateway) {}

  settings(): CardioSettings {
    return this.appState.current()?.cardio;
  }

  replaceSettings(settings: CardioSettings): void {
    this.appState.current().cardio = settings;
  }

  day(dayId: DayId): CardioDay {
    const week = this.appState.current().cardioWeek;
    week[dayId] ||= normalizeCardioDay(null);
    return week[dayId];
  }

  week(): Partial<Record<DayId, CardioDay>> {
    return this.appState.current()?.cardioWeek;
  }

  clearWeek(): void {
    this.appState.current().cardioWeek = {};
  }
}
