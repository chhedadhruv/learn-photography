"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { evaluateExposure } from "@/lib/sim/exposure";
import { compareToTarget, type MatchResult } from "@/lib/sim/match";
import { subjectEv100, type ControlName } from "@/lib/sim/meter";
import type { CameraSettings } from "@/lib/sim/types";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Controls } from "./Controls";
import { ExposureMeter } from "./ExposureMeter";
import { getSceneSpec } from "./scene";
import { Viewfinder, type StillRequest, type ViewfinderMode } from "./render/Viewfinder";

const ALL_CONTROLS: readonly ControlName[] = ["shutter", "aperture", "iso"];

export interface MatchExercise {
  readonly id: string;
  readonly title: string;
  readonly sceneId: string;
  readonly target: {
    readonly shutterSeconds: number;
    readonly aperture: number;
    readonly iso: number;
  };
  readonly targetTimeSeconds: number;
  readonly start: {
    readonly shutterSeconds: number;
    readonly aperture: number;
    readonly iso: number;
  };
}

/**
 * Reproduce a photograph you are shown.
 *
 * The target is rendered once when the page opens and kept as a still beside the live viewfinder.
 * Seeing both at once is what makes a difference in blur or brightness legible — alternating
 * would show the difference more sharply but hide *what to change*, which is the point here.
 */
export function MatchThePhoto({ exercise }: { readonly exercise: MatchExercise }) {
  const reducedMotion = usePrefersReducedMotion();
  const spec = getSceneSpec(exercise.sceneId);

  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<CameraSettings>(() => ({
    ...exercise.start,
    focalLengthMm: spec?.focalLengthMm ?? 50,
    focusDistanceM: spec?.focusDistanceM ?? 3,
  }));
  const [mode, setMode] = useState<ViewfinderMode>("live");
  const [result, setResult] = useState<MatchResult | null>(null);

  const targetSettings = useMemo<CameraSettings>(
    () => ({
      ...exercise.target,
      focalLengthMm: spec?.focalLengthMm ?? 50,
      focusDistanceM: spec?.focusDistanceM ?? 3,
    }),
    [exercise.target, spec],
  );

  const handleChange = useCallback((control: ControlName, value: number) => {
    setResult(null);
    setSettings((previous) => ({
      ...previous,
      ...(control === "shutter" ? { shutterSeconds: value } : {}),
      ...(control === "aperture" ? { aperture: value } : {}),
      ...(control === "iso" ? { iso: value } : {}),
    }));
  }, []);

  if (!spec) return null;

  const exposure = evaluateExposure(settings, subjectEv100(spec.scene));
  const targetExposure = evaluateExposure(targetSettings, subjectEv100(spec.scene));

  // Rendered once. `id` never changes, so the viewfinder produces it on the first frame and
  // returns to live view immediately afterwards.
  const still: StillRequest | null = targetImage
    ? null
    : {
        id: `${exercise.id}-target`,
        settings: targetSettings,
        deviationStops: targetExposure.deviationStops,
        timeSeconds: exercise.targetTimeSeconds,
      };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <figure className="m-0">
            <figcaption className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase">
              Target
            </figcaption>
            <div className="rounded-md bg-[var(--color-zone-5)] p-2">
              {targetImage ? (
                <Image
                  src={targetImage}
                  alt="The photograph to reproduce."
                  width={600}
                  height={400}
                  unoptimized
                  className="h-auto w-full rounded"
                />
              ) : (
                <div style={{ aspectRatio: "3 / 2" }} className="grid place-items-center">
                  <span className="text-xs text-white/80">Developing…</span>
                </div>
              )}
            </div>
          </figure>

          <figure className="m-0">
            <figcaption className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase">
              Yours
            </figcaption>
            <div className="rounded-md bg-[var(--color-zone-5)] p-2">
              <Viewfinder
                spec={spec}
                settings={settings}
                deviationStops={exposure.deviationStops}
                mode={mode}
                animate={mode === "live" && !reducedMotion && targetImage !== null}
                onCaptured={() => {
                  setResult(compareToTarget(settings, targetSettings, spec.scene));
                  setMode("captured");
                }}
                still={still}
                onStill={setTargetImage}
              />
            </div>
          </figure>
        </div>
      </div>

      <div className="flex w-full flex-col gap-5 lg:w-80">
        <div>
          <h3 className="text-lg font-semibold">{exercise.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Match the photograph on the left. There is more than one way to get there — what matters
            is that the result looks the same.
          </p>
        </div>

        <Controls
          shutterSeconds={settings.shutterSeconds}
          aperture={settings.aperture}
          iso={settings.iso}
          unlocked={ALL_CONTROLS}
          onChange={handleChange}
          disabled={mode !== "live"}
        />

        <ExposureMeter deviationStops={exposure.deviationStops} />

        {result ? (
          <section
            aria-labelledby="match-result"
            className="rounded-md border border-rule bg-surface-raised p-5"
          >
            <h4 id="match-result" className="text-lg font-semibold">
              {result.headline}
            </h4>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm">
              {result.aspects.map((aspect) => (
                <li key={aspect.id} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className={aspect.matched ? "text-[#2f7d32]" : "text-[#c4402a]"}
                  >
                    {aspect.matched ? "✓" : "✗"}
                  </span>
                  <span>
                    <span className="sr-only">
                      {aspect.matched ? "Matched: " : "Not matched: "}
                    </span>
                    <span className="font-medium">{aspect.label}</span>
                    <span className="mt-0.5 block leading-relaxed text-ink-muted">
                      {aspect.note}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setMode("live");
              }}
              className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface"
            >
              Adjust and try again
            </button>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode("capturing");
            }}
            disabled={mode !== "live" || targetImage === null}
            className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-surface disabled:opacity-60"
          >
            {mode === "capturing" ? "Exposing…" : "Capture to compare"}
          </button>
        )}
      </div>
    </div>
  );
}
