import "@testing-library/jest-dom";

// jsdom has no structuredClone, which the design panels use to copy a layout
// before editing it. Without this, any test that changes a control throws —
// and the panels themselves would go untested.
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}
