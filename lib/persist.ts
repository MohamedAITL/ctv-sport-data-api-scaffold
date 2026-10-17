// Small settings only in localStorage (plain text): layout config + Arabic-name
// overrides keyed by teamId. Large binary (logos/template) goes to IndexedDB.
// All reads/writes fail soft.
import type { LayoutConfig } from "@/config/defaultLayout";

const LAYOUT_KEY = "botola.layout";
const NAMES_KEY = "botola.names";

function load<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export const loadLayout = (fallback: LayoutConfig) => load(LAYOUT_KEY, fallback);
export const saveLayout = (layout: LayoutConfig) => save(LAYOUT_KEY, layout);

export const loadNameOverrides = (): Record<string, string> =>
  load<Record<string, string>>(NAMES_KEY, {});
export const saveNameOverrides = (names: Record<string, string>) => save(NAMES_KEY, names);
