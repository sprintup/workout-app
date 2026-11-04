import { gateways } from "../gateways/registry";
import { DAY_CONFIG } from "../data/training";
import { cardioWeekStatus, type CardioDayStatus } from "../entities/cardio";
import { localDateKey } from "../entities/dates";
import { dayDateKey } from "./routine-schedule";
import type { DayId } from "../types";


/** Each calendar day's cardio this week, in calendar order. */
export function cardioWeek(): Array<CardioDayStatus & { dayId: DayId }> {
  const week = gateways.cardio.week() || {};
  const today = localDateKey(gateways.clock.now());
  const started = new Date(gateways.week.startedAt());
  const weekStart = Number.isNaN(started.getTime()) ? "" : localDateKey(started);
  return cardioWeekStatus(
    gateways.cardio.settings(),
    DAY_CONFIG.map((day) => ({
      cardio: week[day.id],
      past: dayDateKey(day.id) < today,
      beforeWeek: dayDateKey(day.id) < weekStart,
    })),
  ).map((status, index) => ({ ...status, dayId: DAY_CONFIG[index].id }));
}


export function cardioStatusForDay(dayId: DayId) {
  return cardioWeek().find((status) => status.dayId === dayId);
}
