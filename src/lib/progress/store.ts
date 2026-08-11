"use client";

import {
  EMPTY_PROGRESS,
  parseProgress,
  serialiseProgress,
  type ProgressState,
} from "@/lib/sim/progress";

/**
 * The one place progress is read from and written to.
 *
 * Shaped for `useSyncExternalStore`, which demands a snapshot that is referentially stable
 * between changes — returning a freshly parsed object each call would spin React forever. So the
 * parsed value is cached against the raw string and only rebuilt when that string changes.
 *
 * Writes also emit locally: the browser's own `storage` event fires in *other* tabs but not the
 * one that made the change, so without this the page that just recorded a score would not
 * re-render.
 */
const STORAGE_KEY = "learn-photography:progress:v1";

let cachedRaw: string | null = null;
let cachedState: ProgressState = EMPTY_PROGRESS;

const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing and blocked-storage modes throw rather than returning null.
    return null;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToProgress(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) emit();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getProgressSnapshot(): ProgressState {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parseProgress(raw);
  }
  return cachedState;
}

/** The server has no storage, and must return the same object every time. */
export function getProgressServerSnapshot(): ProgressState {
  return EMPTY_PROGRESS;
}

export function writeProgress(state: ProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, serialiseProgress(state));
  } catch {
    // Storage may be full or blocked. Progress is a convenience, not something worth crashing
    // a lesson over — the session continues, it just will not be remembered.
  }
  cachedRaw = serialiseProgress(state);
  cachedState = state;
  emit();
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignored for the same reason as above.
  }
  cachedRaw = null;
  cachedState = EMPTY_PROGRESS;
  emit();
}
