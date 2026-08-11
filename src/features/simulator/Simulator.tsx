"use client";

import { useCallback, useMemo, useState } from "react";
import { describePhotograph } from "@/lib/sim/describe";
import { evaluateExposure } from "@/lib/sim/exposure";
import { autoFillLockedControls, subjectEv100, type ControlName } from "@/lib/sim/meter";
import { score, type ScoreResult } from "@/lib/sim/scoring";
import type { CameraSettings, Scene } from "@/lib/sim/types";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { Challenge } from "@/lib/challenges/types";
import { Controls } from "./Controls";
import { ExposureMeter } from "./ExposureMeter";
import { ResultPanel } from "./ResultPanel";
import { Viewfinder, type ViewfinderMode } from "./render/Viewfinder";

interface SimulatorProps {
  readonly challenge: Challenge;
  readonly scene: Scene;
  readonly focalLengthMm: number;
  readonly onScored?: (stars: number) => void;
}

export function Simulator({ challenge, scene, focalLengthMm, onScored }: SimulatorProps) {
  const reducedMotion = usePrefersReducedMotion();

  /**
   * Locked controls are chosen by the same search that guarantees the unlocked ones can still
   * reach a correct exposure, so the level is winnable by construction rather than by luck.
   */
  const initial = useMemo<CameraSettings>(() => {
    const auto = autoFillLockedControls({
      scene,
      unlocked: challenge.unlocked,
      focalLengthMm,
      focusDistanceM: scene.subjectDistanceM,
    });

    return (
      auto ?? {
        shutterSeconds: 1 / 128,
        aperture: 5.656854249492381,
        iso: 100,
        focalLengthMm,
        focusDistanceM: scene.subjectDistanceM,
      }
    );
  }, [challenge.unlocked, focalLengthMm, scene]);

  const [settings, setSettings] = useState<CameraSettings>(initial);
  const [mode, setMode] = useState<ViewfinderMode>("live");
  const [result, setResult] = useState<ScoreResult | null>(null);

  const exposure = evaluateExposure(settings, subjectEv100(scene));

  const handleChange = useCallback((control: ControlName, value: number) => {
    setSettings((previous) => ({
      ...previous,
      ...(control === "shutter" ? { shutterSeconds: value } : {}),
      ...(control === "aperture" ? { aperture: value } : {}),
      ...(control === "iso" ? { iso: value } : {}),
    }));
  }, []);

  const handleCapture = useCallback(() => {
    setMode("capturing");
  }, []);

  /** Fired once the accumulation has finished, so the score matches the frame on screen. */
  const handleCaptured = useCallback(() => {
    const scored = score({ settings, scene, goals: challenge.goals });
    setResult(scored);
    setMode("captured");
    onScored?.(scored.stars);
  }, [challenge.goals, onScored, scene, settings]);

  const handleRetake = useCallback(() => {
    setResult(null);
    setMode("live");
  }, []);

  const description = describePhotograph(settings, scene);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        {/* Framed in Zone V, true 18% grey. A photograph judged against white or black reads as
            the wrong exposure — this is the neutral a photographer evaluates against. */}
        <div className="rounded-md bg-[var(--color-zone-5)] p-4 sm:p-6">
          <Viewfinder
            settings={settings}
            deviationStops={exposure.deviationStops}
            mode={mode}
            animate={mode === "live" && !reducedMotion}
            focalLengthMm={focalLengthMm}
            onCaptured={handleCaptured}
          />
        </div>

        {/* The canvas is invisible to assistive tech, so the same information is published as
            text. Not a fallback — for some readers it is the photograph. */}
        <p aria-live="polite" className="sr-only">
          {mode === "captured" ? `Photograph taken. ${description}` : ""}
        </p>
      </div>

      <div className="flex w-full flex-col gap-5 lg:w-80">
        <div>
          <h3 className="text-lg font-semibold">{challenge.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{challenge.brief}</p>
        </div>

        <Controls
          shutterSeconds={settings.shutterSeconds}
          aperture={settings.aperture}
          iso={settings.iso}
          unlocked={challenge.unlocked}
          onChange={handleChange}
          disabled={mode !== "live"}
        />

        <ExposureMeter deviationStops={exposure.deviationStops} />

        {mode === "captured" && result ? (
          <ResultPanel result={result} description={description} onRetake={handleRetake} />
        ) : (
          <>
            <button
              type="button"
              onClick={handleCapture}
              disabled={mode !== "live"}
              className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-surface disabled:opacity-60"
            >
              {mode === "capturing" ? "Exposing…" : "Capture"}
            </button>
            <details className="text-sm">
              <summary className="cursor-pointer text-ink-muted">Hint</summary>
              <p className="mt-2 leading-relaxed text-ink-muted">{challenge.hint}</p>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
