import { STORAGE_KEY } from "../config/constants";
import type { AppState } from "../types";
import type { BrowserStorageGateway } from "./gateways";

/** Keeps a copy of the document in localStorage. */
export class LocalStorageGateway implements BrowserStorageGateway {
  constructor(private readonly key: string = STORAGE_KEY) {}

  load(): unknown | null {
    const stored = localStorage.getItem(this.key);
    return stored ? JSON.parse(stored) : null;
  }

  save(state: AppState): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
    } catch (error) {
      console.warn("Local browser storage is unavailable.", error);
    }
  }
}
