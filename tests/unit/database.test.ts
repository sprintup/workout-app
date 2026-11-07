import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeDatabaseUrl } from "../../src/entities/database";
import { HttpDatabaseGateway } from "../../src/gateways/database-gateway";
import { connectDatabase } from "../../src/interactors/database/connect-database";
import { disconnectDatabase } from "../../src/interactors/database/disconnect-database";
import { forgetDatabaseDetails } from "../../src/interactors/database/forget-database-details";
import { recallDatabaseDetails } from "../../src/interactors/database/recall-database-details";
import { loadFromDatabase } from "../../src/interactors/database/load-from-database";
import { saveToDatabase } from "../../src/interactors/database/save-to-database";
import { exportWorkoutFile } from "../../src/interactors/files/export-workout-file";
import { loadWorkoutFile } from "../../src/interactors/files/load-workout-file";
import { saveFileText } from "../../src/services/workout-file-format";
import { createTestGateways, pickedFile } from "./fakes";

const URL_VALUE = "https://example.com/data.php";
const PASSWORD = "a-very-secret-database-password";
const LOGIN = {
  url: URL_VALUE,
  host: "mysql.example.com",
  database: "example_app",
  user: "workout_app",
  password: PASSWORD,
};

function stubFetch(handler: (url: string, init: RequestInit) => unknown) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) =>
    handler(String(url), init)) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

function weekIn(contents: string) {
  return JSON.parse(contents).appState.weekNumber;
}

/** A database that already holds this app's data at the given week. */
async function connectedWithStoredWeek(week: number) {
  const gateways = createTestGateways();
  const local = gateways.week.number();
  gateways.week.setNumber(week);
  gateways.database.savedElsewhere(saveFileText());
  gateways.week.setNumber(local);
  await connectDatabase(gateways, LOGIN);
  return gateways;
}

test("the login only ever goes over HTTPS", () => {
  assert.equal(normalizeDatabaseUrl(` ${URL_VALUE} `), URL_VALUE);
  assert.equal(normalizeDatabaseUrl(`\u200B${URL_VALUE}\u00A0`), URL_VALUE);
  assert.equal(normalizeDatabaseUrl(`​${URL_VALUE} `), URL_VALUE);
  assert.equal(normalizeDatabaseUrl(`​${URL_VALUE} `), URL_VALUE);
  assert.equal(normalizeDatabaseUrl("http://example.com/data.php"), null);
  assert.equal(normalizeDatabaseUrl("https://user:pw@example.com/data.php"), null);
  assert.equal(normalizeDatabaseUrl("example.com/data.php"), null);
  assert.equal(normalizeDatabaseUrl(""), null);
  assert.ok(normalizeDatabaseUrl("http://localhost:8000/data.php"));
});

test("the login stays out of the JSON file, browser storage and the stored data", async () => {
  const gateways = createTestGateways();
  await connectDatabase(gateways, LOGIN);

  gateways.browserStorage.save(gateways.appState.current());
  await saveToDatabase(gateways);
  await exportWorkoutFile(gateways);

  for (const text of [
    gateways.workoutFile.written!,
    gateways.browserStorage.stored!,
    gateways.database.stored!.contents,
  ]) {
    assert.equal(text.includes(PASSWORD), false);
    assert.equal(text.includes(URL_VALUE), false);
  }
});

test("connecting needs a login, changes no data, and a failure stays disconnected", async () => {
  const gateways = createTestGateways();
  const insecure = await connectDatabase(gateways, { ...LOGIN, url: "http://example.com/data.php" });
  assert.equal(insecure.toast?.tone, "error");
  const pastedNewline = await connectDatabase(gateways, { ...LOGIN, password: PASSWORD + "\n" });
  assert.match(pastedNewline.toast!.message, /can't be sent/);
  const noHost = await connectDatabase(gateways, { ...LOGIN, host: " " });
  assert.equal(noHost.toast?.tone, "error");
  const noPassword = await connectDatabase(gateways, { ...LOGIN, password: "" });
  assert.equal(noPassword.toast?.tone, "error");

  gateways.database.failWith = "The database username or password was not accepted.";
  const refused = await connectDatabase(gateways, LOGIN);
  assert.equal(refused.toast?.message, "The database username or password was not accepted.");
  assert.equal(gateways.database.isConnected(), false);

  gateways.database.failWith = null;
  const connected = await connectDatabase(gateways, LOGIN);
  assert.equal(connected.changed, false);
  assert.equal(gateways.database.stored, null);
});

test("invisible characters pasted into the host, name or username are removed", async () => {
  const gateways = createTestGateways();
  const zeroWidth = String.fromCharCode(0x200b);
  const result = await connectDatabase(gateways, {
    ...LOGIN,
    host: zeroWidth + "mysql.example.com ",
    database: "example_app" + zeroWidth,
    user: String.fromCharCode(0xa0) + "workout_app",
  });
  assert.notEqual(result.toast?.tone, "error", result.toast?.message);
  assert.deepEqual(gateways.database.login, {
    url: URL_VALUE,
    host: "mysql.example.com",
    database: "example_app",
    user: "workout_app",
    password: PASSWORD,
  });
});

test("a successful connection remembers where the database is, never the password", async () => {
  const gateways = createTestGateways();
  gateways.database.failWith = "The database username or password was not accepted.";
  await connectDatabase(gateways, LOGIN);
  assert.equal(recallDatabaseDetails(gateways).value, null, "a failed sign-in is not remembered");

  gateways.database.failWith = null;
  await connectDatabase(gateways, LOGIN);
  assert.deepEqual(recallDatabaseDetails(gateways).value, {
    url: URL_VALUE,
    host: "mysql.example.com",
    database: "example_app",
    user: "workout_app",
  });
  assert.equal(gateways.databaseDetails.stored!.includes(PASSWORD), false);

  forgetDatabaseDetails(gateways);
  assert.equal(recallDatabaseDetails(gateways).value, null);
  assert.equal(gateways.database.isConnected(), true, "forgetting doesn't disconnect");
});

test("Load and Save need the database to be connected", async () => {
  const gateways = createTestGateways();
  assert.equal((await loadFromDatabase(gateways)).toast?.tone, "error");
  assert.equal((await saveToDatabase(gateways)).toast?.tone, "error");
});

test("Load asks before changing this browser's data, and Cancel changes nothing", async () => {
  const gateways = await connectedWithStoredWeek(9);
  gateways.week.setNumber(3);
  gateways.saveStatus.markUnsaved();

  const asked = await loadFromDatabase(gateways);
  assert.equal(asked.changed, false);
  assert.equal(asked.value?.confirm?.losesUnsavedChanges, true);
  assert.equal(gateways.week.number(), 3, "nothing changes until I confirm");

  const loaded = await loadFromDatabase(gateways, { confirmed: true });
  assert.equal(loaded.changed, true, loaded.toast?.message);
  assert.equal(gateways.week.number(), 9);
  assert.equal(loaded.inSyncWithFile, true);
});

test("Load doesn't ask when the database already matches", async () => {
  const gateways = createTestGateways();
  gateways.database.savedElsewhere(saveFileText());
  await connectDatabase(gateways, LOGIN);

  const result = await loadFromDatabase(gateways);

  assert.equal(result.value?.confirm, undefined);
  assert.match(result.toast!.message, /up to date/);
  assert.equal(gateways.database.syncedRevision(), 1);
});

test("Save to an empty database stores this browser's data without asking", async () => {
  const gateways = createTestGateways();
  await connectDatabase(gateways, LOGIN);
  gateways.week.setNumber(4);

  const result = await saveToDatabase(gateways);

  assert.equal(result.value?.confirm, undefined);
  assert.equal(result.inSyncWithFile, true);
  assert.equal(weekIn(gateways.database.stored!.contents), 4);
});

test("after Load, repeated saves replace the one copy without asking", async () => {
  const gateways = await connectedWithStoredWeek(9);
  await loadFromDatabase(gateways, { confirmed: true });

  for (const week of [10, 11, 12]) {
    gateways.week.setNumber(week);
    const result = await saveToDatabase(gateways);
    assert.equal(result.value?.confirm, undefined, result.toast?.message);
  }

  assert.equal(weekIn(gateways.database.stored!.contents), 12);
  assert.equal(gateways.workoutFile.written, null, "the file is untouched");
});

test("Save asks before replacing data this browser never loaded", async () => {
  const gateways = await connectedWithStoredWeek(9);
  gateways.week.setNumber(2);

  const asked = await saveToDatabase(gateways);
  assert.equal(asked.value?.confirm?.reason, "not-loaded");
  assert.equal(weekIn(gateways.database.stored!.contents), 9, "Cancel keeps it");

  await saveToDatabase(gateways, { confirmed: true });
  assert.equal(weekIn(gateways.database.stored!.contents), 2);
});

test("Save asks before replacing what another device saved after my Load", async () => {
  const gateways = await connectedWithStoredWeek(9);
  await loadFromDatabase(gateways, { confirmed: true });
  gateways.week.setNumber(30);
  gateways.database.savedElsewhere(saveFileText());
  gateways.week.setNumber(10);

  const asked = await saveToDatabase(gateways);
  assert.equal(asked.value?.confirm?.reason, "changed");
  assert.notEqual(asked.inSyncWithFile, true);
  assert.equal(weekIn(gateways.database.stored!.contents), 30);

  await saveToDatabase(gateways, { confirmed: true });
  assert.equal(weekIn(gateways.database.stored!.contents), 10);
});

test("Import a local file, then Save puts it in the database", async () => {
  const gateways = await connectedWithStoredWeek(9);
  await loadFromDatabase(gateways, { confirmed: true });
  gateways.week.setNumber(20);
  const file = saveFileText();
  gateways.week.setNumber(9);

  const imported = await loadWorkoutFile(gateways, { file: pickedFile("old.json", file) });
  assert.equal(gateways.week.number(), 20);
  assert.notEqual(imported.inSyncWithFile, true, "not in the database yet");
  assert.match(imported.toast!.message, /Press Save/);

  const saved = await saveToDatabase(gateways);
  assert.equal(saved.value?.confirm, undefined);
  assert.equal(weekIn(gateways.database.stored!.contents), 20);
});

test("a failed database save says so and keeps the work unsaved", async () => {
  const gateways = createTestGateways();
  await connectDatabase(gateways, LOGIN);
  gateways.database.failWith = "The database address could not be reached.";

  const result = await saveToDatabase(gateways);

  assert.equal(result.toast?.tone, "error");
  assert.notEqual(result.inSyncWithFile, true);
});

test("Export writes the JSON file whether or not the database is connected", async () => {
  const gateways = createTestGateways();
  await connectDatabase(gateways, LOGIN);
  await exportWorkoutFile(gateways);
  assert.ok(gateways.workoutFile.written);
  assert.equal(gateways.database.stored, null, "Export never touches the database");

  disconnectDatabase(gateways);
  assert.equal(gateways.database.isConnected(), false);
  assert.equal(gateways.database.syncedRevision(), null);
});

test("the gateway sends the login as headers, the data as base64, and the revision it replaces", async () => {
  const requests: Array<{ url: string; init: RequestInit }> = [];
  let revision = 4;
  const restore = stubFetch((url, init) => {
    requests.push({ url, init });
    if (init.method === "POST") {
      revision += 1;
      return jsonResponse(200, { revision, updatedAt: "2026-11-07T10:00:00Z" });
    }
    return jsonResponse(200, { revision, updatedAt: "2026-11-06T10:00:00Z", contents: "{}" });
  });
  try {
    const gateway = new HttpDatabaseGateway();
    await gateway.connect(LOGIN);
    assert.equal(gateway.syncedRevision(), null, "connecting alone syncs nothing");
    const stored = await gateway.read();
    assert.deepEqual(stored, { revision: 4, updatedAt: "2026-11-06T10:00:00Z", contents: "{}" });
    await gateway.write('{"note":"é 🥇"}', 4);
    assert.equal(gateway.syncedRevision(), 5);
    assert.equal(gateway.syncedAt(), "2026-11-07T10:00:00Z");
  } finally {
    restore();
  }
  assert.equal(requests.length, 3);
  const post = requests[2];
  const sent = String(post.init.body);
  assert.equal(sent.includes("{"), false);
  assert.equal(Buffer.from(sent, "base64").toString("utf8"), '{"note":"é 🥇"}');
  assert.equal((post.init.headers as Record<string, string>)["X-Base-Revision"], "4");
  for (const { url, init } of requests) {
    assert.equal(url.includes(PASSWORD), false);
    const headers = init.headers as Record<string, string>;
    assert.equal(headers["X-Db-Host"], "mysql.example.com");
    assert.equal(headers["X-Db-Name"], "example_app");
    assert.equal(headers["X-Db-User"], "workout_app");
    assert.equal(headers["X-Db-Password"], PASSWORD);
    assert.equal(init.credentials, "omit");
    assert.equal(init.redirect, "error");
  }
});

test("the gateway reports a conflict instead of an error, and an empty database as null", async () => {
  const restore = stubFetch((url, init) =>
    init.method === "POST"
      ? jsonResponse(409, { error: "changed", revision: 2, updatedAt: "2026-11-07T08:00:00Z" })
      : jsonResponse(200, { revision: 0, updatedAt: null, contents: null }),
  );
  try {
    const gateway = new HttpDatabaseGateway();
    await gateway.connect(LOGIN);
    assert.equal(await gateway.read(), null);
    assert.deepEqual(await gateway.write("{}", 0), {
      status: "conflict",
      updatedAt: "2026-11-07T08:00:00Z",
    });
    assert.equal(gateway.syncedRevision(), null);
  } finally {
    restore();
  }
});

test("the gateway only keeps a login that worked", async () => {
  const restore = stubFetch(() =>
    jsonResponse(401, { error: "The database username or password was not accepted." }),
  );
  const gateway = new HttpDatabaseGateway();
  try {
    await assert.rejects(gateway.connect(LOGIN), /not accepted/);
    assert.equal(gateway.isConnected(), false);
  } finally {
    restore();
  }
  await assert.rejects(gateway.read(), /not connected/);
});

test("the gateway explains an unreachable address or a page that isn't the service", async () => {
  const gateway = new HttpDatabaseGateway();
  let restore = stubFetch(() => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(gateway.connect(LOGIN), /could not be reached/);
  restore();
  restore = stubFetch(() => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError("Unexpected token <");
    },
  }));
  await assert.rejects(gateway.connect(LOGIN), /not the Basement 45 data service/);
  restore();
});
