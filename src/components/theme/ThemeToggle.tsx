"use client";

import { useTheme } from "next-themes";
import { useIsHydrated } from "@/lib/useIsHydrated";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
] as const;

/**
 * Three-state control rather than a binary switch, because "follow my system" is a real
 * preference and a two-way toggle silently discards it.
 *
 * The resolved theme is only known on the client, so until mount the control renders in a
 * neutral, non-interactive state of the same size. That avoids both a hydration mismatch and a
 * layout shift in the header.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsHydrated();

  return (
    <fieldset
      className="flex items-center gap-0 rounded-full border border-rule p-0.5"
      disabled={!mounted}
    >
      <legend className="sr-only">Colour theme</legend>
      {OPTIONS.map((option) => {
        const selected = mounted && theme === option.value;

        return (
          <label
            key={option.value}
            className={[
              "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              "has-focus-visible:outline-2 has-focus-visible:outline-focus",
              "has-focus-visible:outline-offset-2",
              selected
                ? "bg-ink text-surface"
                : "text-ink-muted hover:bg-surface-raised hover:text-ink",
            ].join(" ")}
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={selected}
              onChange={() => {
                setTheme(option.value);
              }}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}
