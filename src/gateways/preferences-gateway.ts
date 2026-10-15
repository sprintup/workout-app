import type { AppStateGateway, PreferencesGateway } from "./gateways";

/** Workout-wide settings: the circuit rep budget and the master equipment list. */
export class DocumentPreferencesGateway implements PreferencesGateway {
  constructor(private readonly appState: AppStateGateway) {}

  circuitRepBudget(): number {
    return this.appState.current()?.circuitRepBudget;
  }

  setCircuitRepBudget(reps: number): void {
    this.appState.current().circuitRepBudget = reps;
  }

  equipmentCatalog(): string[] {
    return this.appState.current()?.equipmentCatalog;
  }

  replaceEquipmentCatalog(equipment: string[]): void {
    this.appState.current().equipmentCatalog = equipment;
  }
}
