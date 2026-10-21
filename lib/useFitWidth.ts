import { useEffect, useRef, useState } from "react";

/**
 * The poster preview is a fixed 480px box, which on a phone is wider than the
 * screen and pushed the whole page sideways.
 *
 * Side by side with the controls, the preview's column is sized by the preview
 * itself, so measuring it would only measure the box (and stick at whatever it
 * last was): it gets `max`. Stacked on a narrow screen, the column is the page
 * width, so the box is capped at it.
 */
export function useFitWidth<T extends HTMLElement>(max: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(max);
  useEffect(() => {
    const pane = ref.current;
    const grid = pane?.parentElement;
    if (!pane || !grid || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const stacked = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length < 2;
      setWidth(stacked ? Math.max(1, Math.min(max, Math.floor(pane.clientWidth))) : max);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(grid);
    fit();
    return () => ro.disconnect();
  }, [max]);
  return [ref, width] as const;
}
