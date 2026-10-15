import { gateways } from "../gateways/registry";
import { DAY_CONFIG, SPLIT_PRESETS } from "../data/training";
import { builtInCycleDefinitions, isRestCycle } from "../entities/cycles";


export function allSplitDefinitions() {
  return [
    ...SPLIT_PRESETS.map((split) => ({ ...split, template: true })),
    ...(gateways.cycles.customSplits() || []).map((split) => ({
      ...split,
      template: false,
    })),
  ];
}


export function splitForId(splitId) {
  return allSplitDefinitions().find((split) => split.id === splitId) || null;
}


export function allReusableCycles() {
  return [
    ...builtInCycleDefinitions(),
    ...(gateways.cycles.customDefinitions() || []).map((cycle) => ({
      ...cycle,
      template: false,
    })),
  ];
}


export function reusableCycleForId(cycleId) {
  return allReusableCycles().find((cycle) => cycle.id === cycleId) || null;
}


export function cycleForId(cycleId) {
  return gateways.cycles.all()?.find((cycle) => cycle.id === cycleId) || null;
}


export function cyclePosition(cycleId) {
  const index = gateways.cycles.all()?.findIndex((cycle) => cycle.id === cycleId);
  return index >= 0 ? index : 0;
}


export function cycleForDay(dayId) {
  return cycleForId(gateways.week.current()?.days?.[dayId]?.cycleId);
}


export function normalizedCycleId(cycleId, fallbackIndex = 0) {
  if (cycleForId(cycleId)) return cycleId;
  return gateways.cycles.all()[Math.max(0, fallbackIndex) % gateways.cycles.all().length].id;
}


export function normalizeCycleOverrides(values, cycles = gateways.cycles.all() || []) {
  if (!values || typeof values !== "object") return {};
  const cycleById = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  return Object.fromEntries(
    DAY_CONFIG.map((day) => [day.id, String(values[day.id] || "")]).filter(
      ([, cycleId]) => cycleById.has(cycleId),
    ),
  );
}


export function scheduleCycles(startCycleId, restDayIds = [], cycleOverrides = {}) {
  const rest = new Set(restDayIds);
  const overrides = normalizeCycleOverrides(cycleOverrides);
  let cursor = cyclePosition(normalizedCycleId(startCycleId));
  const days = {};
  for (const day of DAY_CONFIG) {
    const overrideCycle = cycleForId(overrides[day.id]);
    if (overrideCycle) cursor = cyclePosition(overrideCycle.id);
    const pending = gateways.cycles.all()[cursor % gateways.cycles.all().length];
    if (rest.has(day.id)) {
      days[day.id] = {
        rest: true,
        restSource: "calendar",
        cycle: null,
        pendingCycle: pending,
      };
    } else if (isRestCycle(pending)) {
      days[day.id] = {
        rest: true,
        restSource: "rotation",
        cycle: pending,
        pendingCycle: null,
      };
      cursor = (cursor + 1) % gateways.cycles.all().length;
    } else {
      days[day.id] = {
        rest: false,
        restSource: null,
        cycle: pending,
        pendingCycle: null,
      };
      cursor = (cursor + 1) % gateways.cycles.all().length;
    }
  }
  return {
    days,
    nextCycleId: gateways.cycles.all()[cursor % gateways.cycles.all().length].id,
  };
}
