import type { ClockGateway } from "./gateways";

export class SystemClockGateway implements ClockGateway {
  now(): Date {
    return new Date();
  }

  nowIso(): string {
    return new Date().toISOString();
  }

  nowMs(): number {
    return Date.now();
  }
}
