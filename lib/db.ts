// IndexedDB for LARGE assets only (uploaded logo overrides + uploaded template
// image) — never in localStorage. All calls are client-side and fail soft
// (private mode, SSR, blocked storage) so the app still renders without them.
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "botola-poster";
const STORE = "assets";
const LOGO_PREFIX = "logo:";
const TEMPLATE_KEY = "template";

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
  try {
    (await db())?.put(STORE, dataUrl, LOGO_PREFIX + teamId);
  } catch {
    /* ignore */
  }
}

export async function clearLogoOverride(teamId: string): Promise<void> {
  try {
    (await db())?.delete(STORE, LOGO_PREFIX + teamId);
  } catch {
    /* ignore */
  }
}

export async function getLogoOverrides(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    const d = await db();
    if (!d) return out;
    const keys = await d.getAllKeys(STORE);
    for (const k of keys) {
      if (typeof k === "string" && k.startsWith(LOGO_PREFIX)) {
        out[k.slice(LOGO_PREFIX.length)] = (await d.get(STORE, k)) as string;
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

export async function setTemplate(dataUrl: string): Promise<void> {
  try {
    (await db())?.put(STORE, dataUrl, TEMPLATE_KEY);
  } catch {
    /* ignore */
  }
}

export async function getTemplate(): Promise<string | null> {
  try {
    return ((await db())?.get(STORE, TEMPLATE_KEY) as Promise<string>) ?? null;
  } catch {
    return null;
  }
}

export async function clearTemplate(): Promise<void> {
  try {
    (await db())?.delete(STORE, TEMPLATE_KEY);
  } catch {
    /* ignore */
  }
}
