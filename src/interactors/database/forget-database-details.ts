import type { Gateways } from "../../gateways/gateways";
import { unchanged, type InteractorResult } from "../interactor";

// As a user
// When I press Forget saved details
// Then this browser no longer remembers my database's address, host, name
//   or username; I stay connected until I disconnect or reload
export function forgetDatabaseDetails(gateways: Gateways): InteractorResult {
  gateways.databaseDetails.forget();
  return unchanged({
    toast: "This browser no longer remembers your database details.",
  });
}
