import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_PROGRESS, recordAttempt } from "@/lib/sim/progress";
import {
  clearProgress,
  getProgressServerSnapshot,
  getProgressSnapshot,
  subscribeToProgress,
  writeProgress,
} from "./store";

beforeEach(() => {
  window.localStorage.clear();
  clearProgress();
});

describe("progress store", () => {
  it("starts empty", () => {
    expect(getProgressSnapshot()).toEqual(EMPTY_PROGRESS);
  });

  it("reads back what it wrote", () => {
    const state = recordAttempt(EMPTY_PROGRESS, "freeze-the-pendulum", 3);
    writeProgress(state);

    expect(getProgressSnapshot()).toEqual(state);
  });

  /**
   * `useSyncExternalStore` re-renders whenever the snapshot's identity changes, so returning a
   * freshly parsed object on every call would loop forever. This is the property that stops it.
   */
  it("returns a referentially stable snapshot between changes", () => {
    writeProgress(recordAttempt(EMPTY_PROGRESS, "a", 1));

    expect(getProgressSnapshot()).toBe(getProgressSnapshot());
  });

  it("returns a new snapshot once something changes", () => {
    writeProgress(recordAttempt(EMPTY_PROGRESS, "a", 1));
    const before = getProgressSnapshot();

    writeProgress(recordAttempt(before, "b", 2));

    expect(getProgressSnapshot()).not.toBe(before);
  });

  it("notifies subscribers on write", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToProgress(listener);

    writeProgress(recordAttempt(EMPTY_PROGRESS, "a", 1));

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    subscribeToProgress(listener)();

    writeProgress(recordAttempt(EMPTY_PROGRESS, "a", 1));

    expect(listener).not.toHaveBeenCalled();
  });

  // The browser fires `storage` in other tabs, not the one that made the change — so a write
  // here must notify locally, and an event from elsewhere must be picked up too.
  it("reacts to a change made in another tab", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToProgress(listener);

    window.dispatchEvent(new StorageEvent("storage", { key: "learn-photography:progress:v1" }));

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("ignores storage events for unrelated keys", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToProgress(listener);

    window.dispatchEvent(new StorageEvent("storage", { key: "something-else" }));

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("clears back to empty", () => {
    writeProgress(recordAttempt(EMPTY_PROGRESS, "a", 3));
    clearProgress();

    expect(getProgressSnapshot()).toEqual(EMPTY_PROGRESS);
  });

  it("reports an empty slate on the server, with a stable identity", () => {
    // Server and first client render must agree, or hydration mismatches.
    expect(getProgressServerSnapshot()).toEqual(EMPTY_PROGRESS);
    expect(getProgressServerSnapshot()).toBe(getProgressServerSnapshot());
  });

  it("survives storage being unavailable", () => {
    // Private browsing and blocked-storage modes throw rather than failing quietly. Progress is
    // a convenience, not something worth crashing a lesson over.
    const blocked = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => {
      writeProgress(recordAttempt(EMPTY_PROGRESS, "a", 1));
    }).not.toThrow();

    blocked.mockRestore();
  });
});
