// What an API route may tell the browser about a failure. The app never names
// its data sources on screen, and upstream errors do ("365scores 502 for …",
// "kooora: no __NEXT_DATA__"), so the full message goes to the server log and
// the client gets it with every source name masked.
const SOURCE_NAMES = /\b(?:webws\.)?365\s?scores(?:\.com)?\b|\bscores365\b|\bhesport\b|\bhespress\b|\bel ?botola\b|\bkooora\b|\bbein(?: ?sports?)?\b|\bsky ?news(?: ?arabia)?\b|\bel ?sport\b|\bgoal(?:\.com)?\b|\bgoal_api_key\b/gi;

export const maskSources = (text: string): string => text.replace(SOURCE_NAMES, "المصدر");

export function publicError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  console.error(message);
  return maskSources(message);
}
