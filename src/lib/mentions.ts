export function mentionRegexFrom(names: string[]): RegExp | null {
  const unique = [...new Set(names)].sort((a, b) => b.length - a.length);
  if (unique.length === 0) return null;
  const escaped = unique.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(?<![\\p{L}\\p{N}])@(?:${escaped.join("|")})(?![\\p{L}\\p{N}])`, "giu");
}

export function findMentionNames(body: string, names: string[]): string[] {
  const re = mentionRegexFrom(names);
  if (!re) return [];
  return (body.match(re) ?? []).map((m) => m.slice(1));
}