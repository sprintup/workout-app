// The Import and Export buttons: a JSON file on this computer.
import type { PickedWorkoutFile } from "../../gateways/gateways";
import { gateways } from "../../gateways/registry";
import { exportWorkoutFile } from "../../interactors/files/export-workout-file";
import { loadWorkoutFile } from "../../interactors/files/load-workout-file";
import { showToast } from "../feedback";
import { present } from "../presenter";

export async function exportJson(): Promise<void> {
  present(await exportWorkoutFile(gateways));
}

export async function loadPickedFile(file: PickedWorkoutFile): Promise<void> {
  try {
    present(await loadWorkoutFile(gateways, { file }));
  } finally {
    const input = document.getElementById("load-input") as HTMLInputElement | null;
    if (input) input.value = "";
  }
}

/** Import through the browser's file picker, or the hidden file input. */
export async function openJsonFile(): Promise<void> {
  if (!gateways.workoutFile.canPick()) {
    document.getElementById("load-input")?.click();
    return;
  }
  try {
    const file = await gateways.workoutFile.pick();
    if (file) await loadPickedFile(file);
  } catch (error) {
    showToast(
      `The workout file could not be opened: ${(error as Error).message}`,
      "error",
    );
  }
}

/** A file chosen through the hidden file input. */
export async function loadInputFile(file?: File): Promise<void> {
  if (file) await loadPickedFile(gateways.workoutFile.fromFile(file));
}
