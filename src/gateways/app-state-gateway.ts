import type { AppState } from "../types";
import type { AppStateGateway } from "./gateways";

/** Holds the AppState document in memory for the running page. */
export class InMemoryAppStateGateway implements AppStateGateway {
  private state: AppState | null = null;

  constructor(private readonly normalize: (candidate: unknown) => AppState) {}

  hasState(): boolean {
    return Boolean(this.state);
  }

  current(): AppState {
    return this.state as AppState;
  }

  replace(next: AppState | null): void {
    this.state = next;
  }

  snapshot(): AppState {
    return JSON.parse(JSON.stringify(this.state));
  }

  restore(snapshot: unknown): void {
    this.state = this.normalize(snapshot);
  }
}
