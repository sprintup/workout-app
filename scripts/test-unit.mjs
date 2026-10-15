// Bundles the TypeScript unit tests (tests/unit) for Node and runs them.
import * as esbuild from "esbuild";
import { spawnSync } from "node:child_process";

const outfile = "node_modules/.cache/basement45-unit-tests.cjs";
await esbuild.build({
  entryPoints: ["tests/unit/index.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile,
  logLevel: "warning",
});
const run = spawnSync(process.execPath, ["--test", outfile], { stdio: "inherit" });
process.exit(run.status ?? 1);
