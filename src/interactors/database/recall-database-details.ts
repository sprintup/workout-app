import type { DatabaseDetails, Gateways } from "../../gateways/gateways";
import { unchanged, type InteractorResult } from "../interactor";

// As a user
// When I open the database window
// Then the address, host, database name and username I last connected with
//   in this browser are filled in, so I only need my password
export function recallDatabaseDetails(
  gateways: Gateways,
): InteractorResult<DatabaseDetails | null> {
  return unchanged({ value: gateways.databaseDetails.recall() });
}
