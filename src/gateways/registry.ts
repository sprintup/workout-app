// The gateway instances the running app uses. main.ts installs them once at
// startup; tests can install fakes instead. Interactors receive the bundle as
// a parameter, and shared services read it from here.
import type { Gateways } from "./gateways";

export const gateways = {} as Gateways;

export function installGateways(bundle: Gateways): void {
  Object.assign(gateways, bundle);
}
