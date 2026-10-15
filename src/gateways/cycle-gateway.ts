import type { Cycle, CycleDefinition, DayId, SplitDefinition } from "../types";
import type { AppStateGateway, CycleGateway } from "./gateways";

/** The cycle rotation plus the user's reusable cycle and split definitions. */
export class DocumentCycleGateway implements CycleGateway {
  constructor(private readonly appState: AppStateGateway) {}

  private get state() {
    return this.appState.current();
  }

  all(): Cycle[] {
    return this.state?.cycles;
  }

  replaceAll(cycles: Cycle[]): void {
    this.state.cycles = cycles;
  }

  find(cycleId: string | null | undefined): Cycle | null {
    return this.state?.cycles?.find((cycle) => cycle.id === cycleId) || null;
  }

  customDefinitions(): CycleDefinition[] {
    return this.state?.customCycles;
  }

  replaceCustomDefinitions(definitions: CycleDefinition[]): void {
    this.state.customCycles = definitions;
  }

  customSplits(): SplitDefinition[] {
    return this.state?.customSplits;
  }

  replaceCustomSplits(splits: SplitDefinition[]): void {
    this.state.customSplits = splits;
  }

  activeSplitId(): string | null {
    return this.state?.activeSplitId;
  }

  setActiveSplitId(splitId: string | null): void {
    this.state.activeSplitId = splitId;
  }

  splitWeekStartDay(): DayId {
    return this.state?.splitWeekStartDay;
  }

  setSplitWeekStartDay(dayId: DayId): void {
    this.state.splitWeekStartDay = dayId;
  }
}
