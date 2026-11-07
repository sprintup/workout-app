import { STORAGE_KEY } from "../config/constants";
import type { DatabaseDetails, DatabaseDetailsGateway } from "./gateways";

/**
 * Remembers where the database is (address, host, name, username) in this
 * browser's localStorage so the sign-in form can be filled in. Never the
 * password: that stays with the browser's password manager.
 */
export class LocalStorageDatabaseDetailsGateway implements DatabaseDetailsGateway {
  constructor(private readonly key: string = `${STORAGE_KEY}-database`) {}

  recall(): DatabaseDetails | null {
    try {
      const stored = JSON.parse(localStorage.getItem(this.key) || "null");
      if (!stored || typeof stored !== "object") return null;
      return {
        url: String(stored.url || ""),
        host: String(stored.host || ""),
        database: String(stored.database || ""),
        user: String(stored.user || ""),
      };
    } catch {
      return null;
    }
  }

  remember(details: DatabaseDetails): void {
    const { url, host, database, user } = details;
    try {
      localStorage.setItem(this.key, JSON.stringify({ url, host, database, user }));
    } catch (error) {
      console.warn("Local browser storage is unavailable.", error);
    }
  }

  forget(): void {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.warn("Local browser storage is unavailable.", error);
    }
  }
}
