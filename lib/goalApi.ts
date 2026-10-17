// Server-side GOAL API client. The key is read from the environment here and
// never sent to the browser. Import only from API routes / server code.

const BASE = process.env.GOAL_API_BASE || "https://api.goal-api.com/v1";

export class GoalApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GoalApiError";
    this.status = status;
  }
}

export function hasApiKey(): boolean {
  return Boolean(process.env.GOAL_API_KEY);
}

/** GET `path` (e.g. "/leagues/x/standings") and return parsed JSON. */
export async function goalFetch<T = unknown>(path: string): Promise<T> {
  const key = process.env.GOAL_API_KEY;
  if (!key) throw new GoalApiError("GOAL_API_KEY is not set", 500);

  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
  } catch (e) {
    throw new GoalApiError(`network error reaching GOAL API: ${String(e)}`, 503);
  }

  if (res.status === 401 || res.status === 403)
    throw new GoalApiError("GOAL API rejected the key (expired or invalid)", res.status);
  if (res.status === 429)
    throw new GoalApiError("GOAL API rate limit reached — try again later", 429);
  if (!res.ok)
    throw new GoalApiError(`GOAL API returned HTTP ${res.status}`, res.status);

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GoalApiError("GOAL API returned a non-JSON response", 502);
  }
}
