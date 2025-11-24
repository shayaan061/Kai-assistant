import * as chrono from "chrono-node";

export function parseDate(text: string) {
  const result = chrono.parse(text)[0];
  if (!result) return null;

  const start = result.start?.date();
  const end = result.end?.date() || new Date(start.getTime() + 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}
