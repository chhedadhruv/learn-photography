import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * jsdom does not implement `matchMedia`, which anything reading the OS colour-scheme preference
 * needs — next-themes here, and later the reduced-motion checks in the simulator.
 *
 * The stub reports "no match", so tests see the explicit theme rather than a system preference.
 * Any test that needs a specific media state should override this per-test.
 */
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

afterEach(() => {
  cleanup();
});
