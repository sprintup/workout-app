import type { DayId, Week, WeekHistoryEntry, WorkoutDay } from "../types";
import type { AppStateGateway, WeekGateway } from "./gateways";

/** The current week, its numbering and rotation pointers, and past weeks. */
export class DocumentWeekGateway implements WeekGateway {
  constructor(private readonly appState: AppStateGateway) {}

  private get state() {
    return this.appState.current();
  }

  current(): Week {
    return this.state?.week as Week;
  }

  replace(week: Week): void {
    this.state.week = week;
  }

  day(dayId: DayId | string): WorkoutDay {
    return this.state?.week?.days?.[dayId as DayId] as WorkoutDay;
  }

  number(): number {
    return this.state?.weekNumber;
  }

  setNumber(weekNumber: number): void {
    this.state.weekNumber = weekNumber;
  }

  startedAt(): string {
    return this.state?.weekStartedAt;
  }

  setStartedAt(isoDate: string): void {
    this.state.weekStartedAt = isoDate;
  }

  startCycleId(): string {
    return this.state?.weekStartCycleId;
  }

  setStartCycleId(cycleId: string): void {
    this.state.weekStartCycleId = cycleId;
  }

  nextCycleId(): string {
    return this.state?.nextCycleId;
  }

  setNextCycleId(cycleId: string): void {
    this.state.nextCycleId = cycleId;
  }

  history(): WeekHistoryEntry[] {
    return this.state?.history;
  }

  replaceHistory(entries: WeekHistoryEntry[]): void {
    this.state.history = entries;
  }
}
