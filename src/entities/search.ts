

export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}


export function editDistance(first, second) {
  const previous = Array.from(
    { length: second.length + 1 },
    (_, index) => index,
  );
  const current = new Array(second.length + 1);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    current[0] = firstIndex;
    for (
      let secondIndex = 1;
      secondIndex <= second.length;
      secondIndex += 1
    ) {
      current[secondIndex] = Math.min(
        current[secondIndex - 1] + 1,
        previous[secondIndex] + 1,
        previous[secondIndex - 1] +
          (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1),
      );
    }
    for (let index = 0; index < current.length; index += 1)
      previous[index] = current[index];
  }

  return previous[second.length];
}


export function fuzzyTokenScore(queryToken, candidateToken) {
  if (queryToken === candidateToken) return 0;
  if (candidateToken.startsWith(queryToken))
    return 0.08 + (candidateToken.length - queryToken.length) * 0.002;
  if (candidateToken.includes(queryToken))
    return 0.18 + candidateToken.indexOf(queryToken) * 0.01;
  if (queryToken.length < 3) return null;

  const allowedDistance =
    queryToken.length <= 4
      ? 1
      : Math.max(1, Math.floor(queryToken.length * 0.3));
  const distance = editDistance(queryToken, candidateToken);
  if (distance <= allowedDistance)
    return (
      0.32 + distance / Math.max(queryToken.length, candidateToken.length)
    );

  let queryIndex = 0;
  for (const character of candidateToken) {
    if (character === queryToken[queryIndex]) queryIndex += 1;
    if (queryIndex === queryToken.length) {
      const gapRatio =
        (candidateToken.length - queryToken.length) / candidateToken.length;
      return gapRatio <= 0.55 ? 0.7 + gapRatio : null;
    }
  }
  return null;
}


export function fuzzyExerciseScore(exercise, rawQuery) {
  const query = normalizeSearchText(rawQuery);
  if (!query) return 0;

  const queryTokens = query.split(" ");
  const fields = [
    [exercise.name, 0],
    [exercise.aliases.join(" "), 0.04],
    [exercise.primary_body_part, 0.18],
    [exercise.body_parts.join(" "), 0.16],
    [exercise.category, 0.24],
    [exercise.movement_pattern, 0.28],
    [exercise.equipment_label, 0.32],
    [exercise.equipment_varieties.join(" "), 0.3],
  ];
  const candidates = fields.flatMap(([value, fieldPenalty]) =>
    normalizeSearchText(value)
      .split(" ")
      .filter(Boolean)
      .map((token) => ({ token, fieldPenalty })),
  );
  const aliasContainsQuery = exercise.aliases.some((alias) =>
    normalizeSearchText(alias).includes(query),
  );
  let score = normalizeSearchText(exercise.name).includes(query)
    ? -0.25
    : aliasContainsQuery
      ? -0.2
      : 0;

  for (const queryToken of queryTokens) {
    let best = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      const tokenScore = fuzzyTokenScore(queryToken, candidate.token);
      if (tokenScore !== null)
        best = Math.min(best, tokenScore + candidate.fieldPenalty);
    }
    if (!Number.isFinite(best)) return null;
    score += best;
  }

  return score;
}
