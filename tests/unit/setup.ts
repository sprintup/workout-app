// Loads the classic exercise data scripts the way index.html does, so the
// built-in exercise library exists before any app module is evaluated.
// Must be the first import of the test bundle.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInThisContext } from "node:vm";

const root = join(__dirname, "..", "..");
const globals = globalThis as unknown as { window: typeof globalThis };
globals.window = globalThis;
for (const script of ["exercise-data.js", "equipment-exercises.js"]) {
  runInThisContext(readFileSync(join(root, script), "utf8"), {
    filename: script,
  });
}
