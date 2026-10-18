// Pull in @testing-library/jest-dom's matcher types (toHaveStyle, etc.) so
// `tsc --noEmit` — which Next runs during the production build — type-checks tests.
import "@testing-library/jest-dom";
