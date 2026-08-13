export function safeAdminCallbackPath(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate?.startsWith("/") || candidate.startsWith("//")) {
    return undefined;
  }

  // URL parsers normalize backslashes as path separators. Check decoded forms
  // as well so encoded or repeatedly encoded separators cannot become an
  // external callback after another redirect round trip.
  let decoded = candidate;
  for (let depth = 0; depth < 4; depth += 1) {
    if (decoded.includes("\\") || decoded.startsWith("//")) return undefined;
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return candidate;
      decoded = next;
    } catch {
      return undefined;
    }
  }

  return undefined;
}
