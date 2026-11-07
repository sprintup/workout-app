import {
  cleanDatabaseField,
  DATABASE_CONNECTED_STATUS,
  isSendablePassword,
  normalizeDatabaseUrl,
} from "../../entities/database";
import type { Gateways } from "../../gateways/gateways";
import { failed, unchanged, type InteractorResult } from "../interactor";

// As a user
// When I enter the address of my data.php, my database's host and name, and
//   sign in (or let my browser fill them in)
// Then Load and Save work with my database until I disconnect or reload;
//   nothing is loaded or saved until I press them. This browser remembers the
//   address, host, name and username for next time (until I choose Forget
//   saved details); the password is never stored, and none of it goes into
//   my JSON file or onto the server
export async function connectDatabase(
  gateways: Gateways,
  input: {
    url: string;
    host: string;
    database: string;
    user: string;
    password: string;
  },
): Promise<InteractorResult> {
  const url = normalizeDatabaseUrl(input.url);
  if (!url) return failed("Enter the full https:// address of your data.php.");
  const host = cleanDatabaseField(input.host);
  const database = cleanDatabaseField(input.database);
  if (!host || !database)
    return failed("Enter your database host and name.");
  const user = cleanDatabaseField(input.user);
  // Never trimmed or cleaned: a password is used exactly as entered.
  const password = String(input.password || "");
  if (!user || !password)
    return failed("Enter your database username and password.");
  if (!isSendablePassword(password))
    return failed(
      "Your password contains a character that can't be sent (such as a line break or an invisible character from pasting). Type it in, or copy it again.",
    );
  try {
    await gateways.database.connect({ url, host, database, user, password });
    gateways.databaseDetails.remember({ url, host, database, user });
    return unchanged({
      refresh: ["database-dialog"],
      fileStatus: DATABASE_CONNECTED_STATUS,
      toast: "Connected. Press Load to get your latest data.",
    });
  } catch (error) {
    return failed((error as Error).message);
  }
}
