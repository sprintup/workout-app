/**
 * A pasted sign-in value without surrounding spaces or the invisible
 * characters (zero-width, no-break space) that copying from a password
 * manager or web page can carry. Browsers refuse to send those in a header.
 */
export function cleanDatabaseField(value): string {
  return String(value || "")
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00A0]/g, "")
    .trim();
}

/**
 * True when the password can travel in a request header: printable
 * characters only (no line breaks or other control characters, nothing
 * outside Latin-1).
 */
export function isSendablePassword(password: string): boolean {
  return /^[\x20-\x7E\xA0-\xFF]+$/.test(password);
}

/**
 * The cleaned-up address of data.php, or null when it can't be used: the
 * login must only ever travel over HTTPS (localhost is fine for testing).
 */
export function normalizeDatabaseUrl(value): string | null {
  try {
    const url = new URL(cleanDatabaseField(value));
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && local))
      return null;
    if (url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** The header status after a load or save matched the database. */
export const DATABASE_SYNCED_STATUS = {
  message: "Up to date with your database",
  connected: true,
};

/** The header status after signing in, before any load or save. */
export const DATABASE_CONNECTED_STATUS = {
  message: "Connected to your database",
  connected: true,
};
