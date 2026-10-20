import { useCallback, useRef } from "react";

/**
 * Ignores a response whose request has been superseded.
 *
 * Every data page here fetches per league (or per date) and writes the result
 * into one state slot. Without this, a slow response for the league you just
 * left lands last and wipes the screen — which is exactly what happened on the
 * round page once fetching a whole season's rounds made the first call slower
 * than the league switch that followed it.
 */
export function useLatestRequest<K>(initial: K) {
  const latest = useRef<K>(initial);
  const claim = useCallback((k: K) => { latest.current = k; }, []);
  const isCurrent = useCallback((k: K) => latest.current === k, []);
  return { claim, isCurrent };
}
