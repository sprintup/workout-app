

export const CUSTOM_EXERCISES = [
  {
    name: "Shoulder Exercise Placeholder",
    category: "Shoulders and Rotator Cuff",
    equipment: "User-defined",
    instructionUrl: null,
    sourceRow: null,
    custom: true,
    alwaysLocked: true,
  },
  ...[1, 2, 3].map((number) => ({
    name: `PT Exercise ${number}`,
    category: "User-defined PT",
    equipment: "User-defined",
    instructionUrl: null,
    sourceRow: null,
    custom: true,
    alwaysLocked: false,
  })),
];
