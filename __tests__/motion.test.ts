/** @jest-environment jsdom */
import { canTransition, transition } from "../lib/motion";

const root = document.documentElement;
const start = jest.fn((update: () => void) => { update(); return { ready: Promise.resolve(), finished: Promise.resolve(), updateCallbackDone: Promise.resolve() }; });
const motion = (reduced: boolean) => { window.matchMedia = jest.fn().mockReturnValue({ matches: reduced }) as never; };

beforeEach(() => {
  start.mockClear(); root.dataset.design = "studio"; delete root.dataset.vt; motion(false);
  (document as unknown as { startViewTransition?: unknown }).startViewTransition = start;
});

describe("transition", () => {
  it("runs inside a view transition in the Studio design, then clears its mark", async () => {
    const update = jest.fn();
    transition("route", update);
    expect(start).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(root.dataset.vt).toBe("route");
    await new Promise((r) => setTimeout(r));
    expect(root.dataset.vt).toBeUndefined();
  });

  it("marks a match change, so only the match pane wipes", () => {
    transition("match", jest.fn());
    expect(root.dataset.vt).toBe("match");
  });

  it.each([
    ["the classic design", () => { root.dataset.design = "classic"; }],
    ["reduced motion", () => motion(true)],
    ["a browser without view transitions", () => { delete (document as unknown as { startViewTransition?: unknown }).startViewTransition; }],
  ])("still makes the change, unanimated, under %s", (_, setUp) => {
    setUp();
    const update = jest.fn();
    expect(canTransition()).toBe(false);
    transition("theme", update);
    expect(update).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(root.dataset.vt).toBeUndefined();
  });

  it("opens a theme change from the pressed button", () => {
    transition("theme", jest.fn(), { x: 40, y: 20 });
    expect(root.style.getPropertyValue("--vx")).toBe("40px");
    expect(root.style.getPropertyValue("--vy")).toBe("20px");
  });

  it("does not leave a rejected transition unhandled", async () => {
    const failed = Promise.reject(new Error("skipped"));
    start.mockReturnValueOnce({ ready: failed, finished: failed, updateCallbackDone: failed });
    transition("route", jest.fn());
    await new Promise((r) => setTimeout(r));
    expect(root.dataset.vt).toBeUndefined();
  });
});
