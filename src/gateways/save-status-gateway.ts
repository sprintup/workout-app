import { STORAGE_KEY } from "../config/constants";
import type { SaveStatusGateway } from "./gateways";

/**
 * Remembers in localStorage whether there are changes the workout file
 * doesn't have yet. When nothing is recorded (a first visit, or data from
 * before this setting existed) the changes count as unsaved.
 */
export class LocalStorageSaveStatusGateway implements SaveStatusGateway {
  private unsaved: boolean;

  constructor(private readonly key: string = `${STORAGE_KEY}-unsaved`) {
    this.unsaved = this.read() !== "false";
  }

  hasUnsavedChanges(): boolean {
    return this.unsaved;
  }

  markUnsaved(): void {
    this.write(true);
  }

  markSaved(): void {
    this.write(false);
  }

  private read(): string | null {
    try {
      return localStorage.getItem(this.key);
    } catch {
      return null;
    }
  }

  private write(unsaved: boolean): void {
    this.unsaved = unsaved;
    try {
      localStorage.setItem(this.key, String(unsaved));
    } catch (error) {
      console.warn("Local browser storage is unavailable.", error);
    }
  }
}
