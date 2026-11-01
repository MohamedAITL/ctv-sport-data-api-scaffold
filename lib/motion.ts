type Update = () => void | Promise<void>;
type ViewTransition = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };
type WithTransitions = Document & { startViewTransition?: (update: Update) => ViewTransition };

/** Studio only, and never for someone who asked for less motion. */
export function canTransition(): boolean {
  const root = document.documentElement;
  return root.dataset.design === "studio"
    && typeof (document as WithTransitions).startViewTransition === "function"
    && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Runs `update` inside a view transition, styled in studio.css by `kind`; where
 * there is none to run, it simply runs `update`. `at` is where a theme change
 * opens from: the button that was pressed.
 */
export function transition(kind: "route" | "theme" | "match", update: Update, at?: { x: number; y: number }): void {
  if (!canTransition()) { void update(); return; }
  const root = document.documentElement;
  if (at) { root.style.setProperty("--vx", `${at.x}px`); root.style.setProperty("--vy", `${at.y}px`); }
  root.dataset.vt = kind;
  const vt = (document as WithTransitions).startViewTransition!(update);
  // A newer transition, or a page slower than the browser's 4s limit, cancels this one: the page itself still changes.
  vt.ready.catch(() => {});
  vt.updateCallbackDone.catch(() => {});
  vt.finished.catch(() => {}).finally(() => { if (root.dataset.vt === kind) delete root.dataset.vt; });
}
