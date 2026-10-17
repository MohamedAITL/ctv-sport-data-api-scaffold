// Small settings only in localStorage (plain text): layout config + Arabic-name
// overrides keyed by teamId. Large binary (logos/template) goes to IndexedDB.
// All reads/writes fail soft.
import type { LayoutConfig } from "@/config/defaultLayout";

const LAYOUT_KEY = "botola.layout";
const NAMES_KEY = "botola.names";

// Recursively merge a saved object onto the defaults, so nested fields added
// later are always present (avoids controlled->uncontrolled input bugs).
export function deepMerge<T>(base: T, override: unknown): T {
  if (override === null || typeof override !== "object" || Array.isArray(override)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const k of Object.keys(override as object)) {
    const bv = (base as Record<string, unknown>)?.[k];
    const ov = (override as Record<string, unknown>)[k];
    out[k] =
      bv && typeof bv === "object" && !Array.isArray(bv) && ov && typeof ov === "object" && !Array.isArray(ov)
        ? deepMerge(bv, ov)
        : ov;
  }
  return out as T;
}

export function loadLayout(fallback: LayoutConfig): LayoutConfig {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return raw ? deepMerge(fallback, JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}
export function saveLayout(layout: LayoutConfig) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch { /* ignore */ }
}

export function loadNameOverrides(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try { const raw = localStorage.getItem(NAMES_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
export function saveNameOverrides(names: Record<string, string>) {
  try { localStorage.setItem(NAMES_KEY, JSON.stringify(names)); } catch { /* ignore */ }
}
