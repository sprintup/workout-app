import type {
  PickedWorkoutFile,
  WorkoutFileGateway,
  WorkoutFileWriteOutcome,
} from "./gateways";

// Minimal typings for the File System Access API, which TypeScript's DOM
// library does not include.
interface WritableFile {
  write(contents: string): Promise<void>;
  close(): Promise<void>;
}
interface FileHandle {
  name: string;
  queryPermission(options: { mode: "readwrite" }): Promise<string>;
  requestPermission(options: { mode: "readwrite" }): Promise<string>;
  createWritable(): Promise<WritableFile>;
  getFile(): Promise<File>;
}
interface FilePickerOptions {
  suggestedName?: string;
  multiple?: boolean;
  types: Array<{ description: string; accept: Record<string, string[]> }>;
}
type FilePickerWindow = Window & {
  showSaveFilePicker?: (options: FilePickerOptions) => Promise<FileHandle>;
  showOpenFilePicker?: (options: FilePickerOptions) => Promise<FileHandle[]>;
};

export const DEFAULT_WORKOUT_FILE_NAME = "basement-45-workouts.json";
const FILE_TYPES = [
  { description: "Workout JSON", accept: { "application/json": [".json"] } },
];
const HANDLE_DATABASE = "basement45-files";
const HANDLE_STORE = "handles";
const HANDLE_KEY = "workout-json";

export function fileDisplayPath(
  fileOrHandle: {
    name?: string;
    path?: string;
    webkitRelativePath?: string;
  } | null,
): string {
  return String(
    fileOrHandle?.path ||
      fileOrHandle?.webkitRelativePath ||
      fileOrHandle?.name ||
      DEFAULT_WORKOUT_FILE_NAME,
  );
}

function isAbortError(error: unknown): boolean {
  return (error as { name?: string })?.name === "AbortError";
}

/**
 * Reads and writes the workout JSON file. The chosen file handle is kept in
 * IndexedDB so the same file can be written again after a reload.
 */
export class FileSystemWorkoutFileGateway implements WorkoutFileGateway {
  private handle: FileHandle | null = null;

  private get pickers(): FilePickerWindow {
    return window as FilePickerWindow;
  }

  connectedPath(): string | null {
    return this.handle ? fileDisplayPath(this.handle) : null;
  }

  async restoreConnection(): Promise<string | null> {
    try {
      const database = await this.openDatabase();
      if (!database) return null;
      const handle = await new Promise<FileHandle | null>(
        (resolve, reject) => {
          const request = database
            .transaction(HANDLE_STORE, "readonly")
            .objectStore(HANDLE_STORE)
            .get(HANDLE_KEY);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        },
      );
      if (
        handle &&
        (await handle.queryPermission({ mode: "readwrite" })) === "granted"
      ) {
        this.handle = handle;
        return fileDisplayPath(handle);
      }
    } catch (error) {
      console.warn("The previous workout file could not be restored.", error);
    }
    return null;
  }

  async write(
    contents: string,
    options: { chooseIfMissing?: boolean; requestPermission?: boolean } = {},
  ): Promise<WorkoutFileWriteOutcome> {
    if (!this.handle) {
      if (!options.chooseIfMissing) return { status: "not-connected" };
      const showSaveFilePicker = this.pickers.showSaveFilePicker;
      if (!showSaveFilePicker) return { status: "unsupported" };
      try {
        this.handle = await showSaveFilePicker({
          suggestedName: DEFAULT_WORKOUT_FILE_NAME,
          types: FILE_TYPES,
        });
      } catch (error) {
        if (isAbortError(error)) return { status: "cancelled" };
        throw error;
      }
      await this.rememberHandle(this.handle);
    }
    if (
      !(await this.canWrite(this.handle, Boolean(options.requestPermission)))
    )
      return { status: "permission-denied" };
    const writable = await this.handle.createWritable();
    await writable.write(contents);
    await writable.close();
    return {
      status: "saved",
      fileName: this.handle.name,
      displayPath: fileDisplayPath(this.handle),
    };
  }

  canPick(): boolean {
    return "showOpenFilePicker" in window;
  }

  async pick(): Promise<PickedWorkoutFile | null> {
    try {
      const [handle] = await this.pickers.showOpenFilePicker!({
        multiple: false,
        types: FILE_TYPES,
      });
      const file = await handle.getFile();
      return { ...this.fromFile(file), handle };
    } catch (error) {
      if (isAbortError(error)) return null;
      throw error;
    }
  }

  fromFile(file: File): PickedWorkoutFile {
    return {
      name: file.name,
      displayPath: fileDisplayPath(file as File & { path?: string }),
      text: () => file.text(),
    };
  }

  async connect(file: PickedWorkoutFile): Promise<void> {
    if (!file.handle) return;
    this.handle = file.handle as FileHandle;
    await this.rememberHandle(this.handle);
  }

  private async canWrite(
    handle: FileHandle,
    requestPermission: boolean,
  ): Promise<boolean> {
    if ((await handle.queryPermission({ mode: "readwrite" })) === "granted")
      return true;
    return (
      requestPermission &&
      (await handle.requestPermission({ mode: "readwrite" })) === "granted"
    );
  }

  private openDatabase(): Promise<IDBDatabase | null> {
    if (!("indexedDB" in window)) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(HANDLE_DATABASE, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore(HANDLE_STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async rememberHandle(handle: FileHandle): Promise<void> {
    try {
      const database = await this.openDatabase();
      if (!database) return;
      database
        .transaction(HANDLE_STORE, "readwrite")
        .objectStore(HANDLE_STORE)
        .put(handle, HANDLE_KEY);
    } catch (error) {
      console.warn("The selected file handle could not be remembered.", error);
    }
  }
}
