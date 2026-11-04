import type { ExerciseRating } from "../types";



export function defaultMeasureType(exercise): "reps" | "seconds" {
  return /sec|second/i.test(exercise?.default_reps || "")
    ? "seconds"
    : "reps";
}


export function cleanRepValue(value) {
  return String(value || "")
    .replace(/\s*(sec|seconds)\s*/gi, "")
    .trim();
}


/** Keeps only well-formed thumbs ratings from a loaded document. */
export function normalizeExerciseRatings(value): Record<string, ExerciseRating> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, any>)
      .filter(
        ([key, rating]) =>
          key.split(":").length === 3 &&
          (rating?.direction === 1 || rating?.direction === -1),
      )
      .map(([key, rating]) => [
        key,
        {
          direction: rating.direction,
          applied: Math.max(-4, Math.min(4, Math.round(Number(rating.applied) || 0))),
        },
      ]),
  );
}
