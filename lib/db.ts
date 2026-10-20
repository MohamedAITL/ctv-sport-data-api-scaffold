// IndexedDB for everything too big for localStorage: uploaded logo overrides,
// uploaded templates, and the last payload each page received. Client-side,
// fail-soft (private mode, SSR, blocked).
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "botola-poster";
const STORE = "assets";
const CACHE = "cache";
const LOGO_PREFIX = "logo:";

async function db(): Promise<IDBPDatabase | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    return await openDB(DB_NAME, 2, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
        if (!d.objectStoreNames.contains(CACHE)) d.createObjectStore(CACHE);
      },
    });
  } catch {
    return null;
  }
}

/**
 * The last answer a page got, kept across reloads so the screen is never empty
 * while the network is consulted. Whole payloads (hundreds of news items, a
 * table with inlined crests) go here rather than localStorage, which is small
 * and synchronous.
 */
export interface Cached<T> { at: string; data: T }

export async function readCache<T>(key: string): Promise<Cached<T> | null> {
  try {
    const d = await db();
    const hit = (await d?.get(CACHE, key)) as Cached<T> | undefined;
    return hit?.data === undefined ? null : hit;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  try { await (await db())?.put(CACHE, { at: new Date().toISOString(), data }, key); } catch { /* quota, private mode */ }
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
