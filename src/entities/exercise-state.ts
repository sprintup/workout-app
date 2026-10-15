

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
