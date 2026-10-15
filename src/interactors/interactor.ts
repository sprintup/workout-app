// The contract between interactors (one per user story) and the UI.
//
// An interactor receives the gateways and a plain input object, changes data
// only through the gateways, and returns an InteractorResult describing what
// happened. It never touches the DOM: the UI controller presents the result
// (stores the browser copy, redraws, shows the toast).
//
// When a story needs the user to confirm or answer something first, the
// interactor file also exports a small query (for example a confirmation
// question) that the UI asks before calling the interactor.

/** Parts of the screen an interactor's change affects. */
export type RefreshTarget =
  | "all"
  | "settings"
  | "tabs"
  | "library"
  | "workout"
  | "timer"
  | "replacement-results"
  | "favorite-results"
  | "split-dialog"
  | "equipment-dialog";

export interface Toast {
  message: string;
  tone: "success" | "error";
}

/** The connected-file indicator next to the Save and Load buttons. */
export interface FileStatus {
  message: string;
  connected: boolean;
}

export interface InteractorResult<Value = undefined> {
  /** True when saved data changed. */
  changed: boolean;
  refresh: RefreshTarget[];
  toast?: Toast;
  /** A view to switch to: a day id, "library" or "settings". */
  view?: string;
  /** Anything else the UI needs afterwards, such as a newly created id. */
  value?: Value;
  fileStatus?: FileStatus;
  /** True when the data now matches the workout file (after a save or load). */
  inSyncWithFile?: boolean;
}

interface ResultOptions<Value> {
  refresh?: RefreshTarget[];
  toast?: string;
  view?: string;
  value?: Value;
  fileStatus?: FileStatus;
  /** True when the data now matches the workout file (after a save or load). */
  inSyncWithFile?: boolean;
}

/** Data changed. */
export function changed<Value = undefined>(
  options: ResultOptions<Value> = {},
): InteractorResult<Value> {
  return {
    changed: true,
    refresh: options.refresh || [],
    toast: options.toast ? { message: options.toast, tone: "success" } : undefined,
    view: options.view,
    value: options.value,
    fileStatus: options.fileStatus,
    inSyncWithFile: options.inSyncWithFile,
  };
}

/** Nothing changed (the request did not apply), optionally with a message. */
export function unchanged<Value = undefined>(
  options: ResultOptions<Value> = {},
): InteractorResult<Value> {
  return { ...changed(options), changed: false };
}

/** The request was refused or failed; nothing was saved. */
export function failed<Value = undefined>(
  message: string,
  options: Omit<ResultOptions<Value>, "toast"> = {},
): InteractorResult<Value> {
  return {
    ...unchanged(options),
    toast: { message, tone: "error" },
  };
}
