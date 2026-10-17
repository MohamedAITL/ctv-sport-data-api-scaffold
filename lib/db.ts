// IndexedDB for LARGE assets only (uploaded logo overrides + uploaded templates)
// — never in localStorage. Client-side, fail-soft (private mode, SSR, blocked).
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "botola-poster";
const STORE = "assets";
const LOGO_PREFIX = "logo:";

async function db(): Promise<IDBPDatabase | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    return await openDB(DB_NAME, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      },
    });
  } catch {
    return null;
  }
}

export async function setLogoOverride(teamId: string, dataUrl: string): Promise<void> {
  try { (await db())?.put(STORE, dataUrl, LOGO_PREFIX + teamId); } catch { /* ignore */ }
}
export async function clearLogoOverride(teamId: string): Promise<void> {
  try { (await db())?.delete(STORE, LOGO_PREFIX + teamId); } catch { /* ignore */ }
}
export async function getLogoOverrides(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    const d = await db();
    if (!d) return out;
    for (const k of await d.getAllKeys(STORE)) {
      if (typeof k === "string" && k.startsWith(LOGO_PREFIX)) {
        out[k.slice(LOGO_PREFIX.length)] = (await d.get(STORE, k)) as string;
      }
    }
  } catch { /* ignore */ }
  return out;
}

// Templates are keyed so each poster (standings, matchday) has its own.
const tkey = (key: string) => `template:${key}`;
export async function setTemplate(dataUrl: string, key = "standings"): Promise<void> {
  try { (await db())?.put(STORE, dataUrl, tkey(key)); } catch { /* ignore */ }
}
export async function getTemplate(key = "standings"): Promise<string | null> {
  try { return ((await db())?.get(STORE, tkey(key)) as Promise<string>) ?? null; } catch { return null; }
}
export async function clearTemplate(key = "standings"): Promise<void> {
  try { (await db())?.delete(STORE, tkey(key)); } catch { /* ignore */ }
}
