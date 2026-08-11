"use client";

import { useState } from "react";
import { BADGES } from "@/lib/sim/progress";
import { useProgress } from "@/lib/progress/useProgress";

type Notice = { readonly kind: "ok" | "error"; readonly message: string } | null;

/**
 * Totals, badges, and the controls for moving or clearing progress.
 *
 * Everything here is local to the browser, which is worth saying out loud on the page: people
 * reasonably assume a score is stored on a server somewhere, and the honest version affects
 * whether they bother.
 */
export function ProgressPanel() {
  const progress = useProgress();
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const earned = new Set(progress.badges.map((badge) => badge.id));

  return (
    <section aria-labelledby="progress-heading" className="rounded-md border border-rule p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="progress-heading" className="text-lg font-semibold">
          Your progress
        </h2>
        <p className="text-sm text-ink-muted tabular-nums">
          {progress.totalStars} stars · {progress.totalXp} XP
        </p>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {BADGES.map((badge) => {
          const has = earned.has(badge.id);

          return (
            <li
              key={badge.id}
              title={badge.description}
              className={[
                "rounded-full border px-3 py-1 text-xs",
                has ? "border-[var(--color-tungsten)] text-ink" : "border-rule text-ink-faint",
              ].join(" ")}
            >
              <span aria-hidden="true">{has ? "🏅" : "🤍"} </span>
              {badge.name}
              {/* The locked state is in the text, not only in the colour and the emoji. */}
              <span className="sr-only">{has ? " — earned" : " — not yet earned"}</span>
            </li>
          );
        })}
      </ul>

      <details className="mt-5">
        <summary className="cursor-pointer text-sm text-ink-muted">
          Move progress to another device
        </summary>

        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-ink-muted">
            Progress is stored in this browser only — there is no account and nothing is sent
            anywhere. Copy this code to carry it elsewhere, or keep it as a backup before clearing
            your site data.
          </p>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Your code</span>
            <input
              readOnly
              value={progress.exportCode()}
              onFocus={(event) => {
                event.currentTarget.select();
              }}
              className="w-full rounded border border-rule bg-surface-raised px-2 py-1.5 font-mono text-xs"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Paste a code to restore</span>
            <input
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setNotice(null);
              }}
              placeholder="LP1-…"
              className="w-full rounded border border-rule px-2 py-1.5 font-mono text-xs"
            />
          </label>

          <div>
            <button
              type="button"
              onClick={() => {
                if (progress.importCode(code)) {
                  setNotice({ kind: "ok", message: "Progress restored." });
                  setCode("");
                } else {
                  setNotice({
                    kind: "error",
                    message: "That code was not recognised. Nothing has been changed.",
                  });
                }
              }}
              disabled={code.trim().length === 0}
              className="rounded-md border border-rule-strong px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Restore
            </button>
          </div>

          {notice && (
            <p
              role="status"
              className={notice.kind === "ok" ? "text-sm text-ink" : "text-sm text-[#c4402a]"}
            >
              {notice.message}
            </p>
          )}
        </div>
      </details>

      <div className="mt-5 border-t border-rule pt-4">
        {confirmingReset ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-muted">
              Clear every star and badge? This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => {
                progress.reset();
                setConfirmingReset(false);
                setNotice({ kind: "ok", message: "Progress cleared." });
              }}
              className="rounded-md bg-[#c4402a] px-3 py-1.5 text-sm font-medium text-white"
            >
              Yes, clear it
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmingReset(false);
              }}
              className="text-sm text-ink-muted underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setConfirmingReset(true);
            }}
            className="text-sm text-ink-muted underline"
          >
            Reset progress
          </button>
        )}
      </div>
    </section>
  );
}
