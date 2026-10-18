// Server-side persistence in data/settings.json: resolved league/season and the
// last-good standings (authoritative cache + stale flag). Single-user local app,
// so a JSON file is enough.
import { promises as fs } from "fs";
import path from "path";
import type { TeamRow } from "@/types/standings";

const FILE = path.join(process.cwd(), "data", "settings.json");

export interface LastStandings {
  rows: TeamRow[];
  season: string | null;
  warnings: string[];
  fetchedAt: string;
}

export interface AppSettings {
  leagueId?: string;
  leagueName?: string;
  countryName?: string;
  season?: string | null;
  resolvedAt?: string;
  // Last-good standings per 365scores competition id (stale fallback).
  lastByLeague?: Record<string, LastStandings>;
}

export async function readSettings(): Promise<AppSettings> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as AppSettings;
  } catch {
    return {};
  }
}

export async function writeSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await readSettings();
  const next = { ...current, ...patch };
  try {
    // Best-effort: on serverless (read-only FS) persistence is skipped, which is
    // fine — discovery re-resolves via the id hint and data is fetched fresh.
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(next, null, 2));
  } catch {
    /* read-only filesystem */
  }
  return next;
}
