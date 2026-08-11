import type { ReactNode } from "react";

const VARIANTS = {
  tip: { label: "Tip", border: "border-l-[var(--color-tungsten)]" },
  note: { label: "Note", border: "border-l-[var(--rule-strong)]" },
  warning: { label: "Watch out", border: "border-l-[#c4402a]" },
} as const;

export type CalloutType = keyof typeof VARIANTS;

interface CalloutProps {
  readonly type?: CalloutType;
  readonly children: ReactNode;
}

/**
 * An aside within a lesson. The label is real text rather than an icon, so it carries meaning
 * to a screen reader and does not rely on colour alone to signal what kind of aside it is.
 */
export function Callout({ type = "note", children }: CalloutProps) {
  const variant = VARIANTS[type];

  return (
    <aside className={`my-6 border-l-2 bg-surface-raised py-4 pr-4 pl-5 ${variant.border}`}>
      <p className="m-0 text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase">
        {variant.label}
      </p>
      <div className="mt-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
    </aside>
  );
}
