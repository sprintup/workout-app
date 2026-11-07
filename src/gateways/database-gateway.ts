import type {
  DatabaseGateway,
  DatabaseLogin,
  DatabaseWriteOutcome,
  StoredData,
} from "./gateways";

/**
 * Web host firewalls (DreamHost's mod_security) reject JSON bodies with more
 * than about a thousand fields, and a save file has thousands. Sent as base64
 * the body is one opaque value, and data.php decodes it.
 */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  return btoa(binary);
}

/**
 * The one copy of the data in the user's database (server/data.php). The
 * address and login live only in this object, so they are forgotten on
 * reload and never reach the workout file or browser storage.
 */
export class HttpDatabaseGateway implements DatabaseGateway {
  private login: DatabaseLogin | null = null;
  private synced: { revision: number; updatedAt: string | null } | null = null;

  isConnected(): boolean {
    return this.login !== null;
  }

  async connect(login: DatabaseLogin): Promise<void> {
    await this.readWith(login);
    this.login = login;
    this.synced = null;
  }

  disconnect(): void {
    this.login = null;
    this.synced = null;
  }

  async read(): Promise<StoredData | null> {
    return this.readWith(this.current());
  }

  syncedRevision(): number | null {
    return this.synced?.revision ?? null;
  }

  syncedAt(): string | null {
    return this.synced?.updatedAt ?? null;
  }

  markLoaded(data: StoredData): void {
    this.synced = { revision: data.revision, updatedAt: data.updatedAt };
  }

  async write(contents: string, baseRevision: number): Promise<DatabaseWriteOutcome> {
    const { status, body } = await this.request(this.current(), {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "X-Base-Revision": String(baseRevision),
      },
      body: toBase64(contents),
    });
    if (status === 409) return { status: "conflict", updatedAt: body.updatedAt };
    this.synced = { revision: body.revision, updatedAt: body.updatedAt };
    return { status: "saved", updatedAt: body.updatedAt };
  }

  private current(): DatabaseLogin {
    if (!this.login) throw new Error("The database is not connected.");
    return this.login;
  }

  private async readWith(login: DatabaseLogin): Promise<StoredData | null> {
    const { body } = await this.request(login, { method: "GET" });
    if (typeof body?.revision !== "number")
      throw new Error("That address is not the Basement 45 data service.");
    return body.contents == null
      ? null
      : { revision: body.revision, updatedAt: body.updatedAt, contents: body.contents };
  }

  private async request(
    login: DatabaseLogin,
    init: RequestInit,
  ): Promise<{ status: number; body: any }> {
    let response: Response;
    try {
      response = await fetch(login.url, {
        ...init,
        headers: {
          ...init.headers,
          "X-Db-Host": login.host,
          "X-Db-Name": login.database,
          "X-Db-User": login.user,
          "X-Db-Password": login.password,
        },
        cache: "no-store",
        credentials: "omit",
        // A redirect must not carry the password somewhere else.
        redirect: "error",
        referrerPolicy: "no-referrer",
      });
    } catch (error) {
      // The browser's own reason helps tell a typo from a blocked request.
      const reason = (error as Error)?.message;
      throw new Error(
        `The database address could not be reached${reason ? ` (${reason})` : ""}.`,
      );
    }
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error("That address is not the Basement 45 data service.");
    }
    if (!response.ok && response.status !== 409)
      throw new Error(body?.error || "The database reported an error.");
    return { status: response.status, body };
  }
}
