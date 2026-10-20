import { useCallback, useEffect, useRef, useState } from "react";
import { readCache, writeCache } from "./db";

/**
 * "Show what we already have, then look only for what is new."
 *
 * Every data page here used to start empty and wait for the network. This keeps
 * the last answer in IndexedDB, renders it on mount before any request goes
 * out, and only then asks the server — so a reload paints instantly and the
 * refresh happens behind what you are already reading.
 *
 * `merge` decides what a fresh answer does to the old one: pages that replace
 * their payload leave it out, the news feed passes a union so nothing it has
 * already loaded disappears.
 */
export function useCachedData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  merge?: (previous: T, incoming: T) => T
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);   // nothing on screen yet
  const [busy, setBusy] = useState(false);         // refreshing behind content
  const [error, setError] = useState<string | null>(null);
  const [at, setAt] = useState<string | null>(null);

  const latest = useRef<string | null>(key);
  latest.current = key;
  const held = useRef<T | null>(null);
  const mergeRef = useRef(merge);
  mergeRef.current = merge;
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const run = useCallback(async (k: string, hasContent: boolean) => {
    if (hasContent) setBusy(true); else setLoading(true);
    setError(null);
    try {
      const fresh = await fetchRef.current();
      if (latest.current !== k) return; // the page moved on
      const prev = held.current;
      const next = prev && mergeRef.current ? mergeRef.current(prev, fresh) : fresh;
      held.current = next;
      setData(next);
      setAt(new Date().toISOString());
      void writeCache(k, next);
    } catch (e) {
      if (latest.current === k) setError(String(e));
    } finally {
      if (latest.current === k) { setLoading(false); setBusy(false); }
    }
  }, []);

  useEffect(() => {
    if (!key) return;
    let live = true;
    held.current = null;
    setData(null);
    readCache<T>(key).then((hit) => {
      if (!live || latest.current !== key) return;
      if (hit) { held.current = hit.data; setData(hit.data); setAt(hit.at); }
      void run(key, Boolean(hit));
    });
    return () => { live = false; };
  }, [key, run]);

  const refresh = useCallback(() => { if (key) void run(key, held.current !== null); }, [key, run]);

  // For additions the page makes itself — "load more" — so they survive the
  // next refresh and the next reload like anything else.
  const update = useCallback((fn: (previous: T | null) => T) => {
    const next = fn(held.current);
    held.current = next;
    setData(next);
    if (key) void writeCache(key, next);
  }, [key]);

  return { data, loading, busy, error, at, refresh, update };
}
