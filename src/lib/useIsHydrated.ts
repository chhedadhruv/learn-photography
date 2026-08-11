"use client";

import { useSyncExternalStore } from "react";

/** Never resubscribes: the hydration boundary is crossed exactly once and never goes back. */
const unsubscribe = () => undefined;
const subscribe = () => unsubscribe;
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * True once the client has hydrated, false during server render and the first client pass.
 *
 * Preferred over the `useState(false)` + `useEffect(() => setMounted(true))` idiom, which React
 * 19 flags as a cascading render. `useSyncExternalStore` expresses the same thing as what it
 * actually is — a value that differs between server and client — with no effect and no extra
 * render pass.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
