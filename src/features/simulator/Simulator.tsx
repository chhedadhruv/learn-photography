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
import { PENDULUM_RIG, effectiveSpeedMps, speedFraction } from "./scene/pendulum";
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
  interface Captured {
    readonly scene: Scene;
    readonly result: ScoreResult;
    readonly caughtSlow: boolean;
  }

  const [captured, setCaptured] = useState<Captured | null>(null);

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

  /**
   * Fired once the accumulation has finished, carrying the instant the exposure was centred on.
   *
   * The scene is re-derived for that moment: the bob's speed depends on where it was in its
   * swing, so grading a shot taken near the turning point against the peak speed would report a
   * blur that is not in the photograph. `effectiveSpeedMps` is the constant speed that produces
   * exactly the smear that was rendered, which keeps what is graded identical to what is drawn.
   */
  const handleCaptured = useCallback(
    (captureTimeSeconds: number) => {
      const speed = effectiveSpeedMps(PENDULUM_RIG, settings.shutterSeconds, captureTimeSeconds);
      const capturedScene: Scene = { ...scene, subjectSpeedMps: speed };

      const scored = score({ settings, scene: capturedScene, goals: challenge.goals });

      setCaptured({
        scene: capturedScene,
        result: scored,
        // Catching the bob at the end of its swing freezes it without a fast shutter. That is a
        // real photograph and a real skill, but it is not the lesson, so the critique says so.
        caughtSlow: speedFraction(PENDULUM_RIG, settings.shutterSeconds, captureTimeSeconds) < 0.4,
      });
      setMode("captured");
      onScored?.(scored.stars);
    },
    [challenge.goals, onScored, scene, settings],
  );

  const handleRetake = useCallback(() => {
    setCaptured(null);
    setMode("live");
  }, []);

  // Before a capture, describe the live scene at the bob's peak speed; afterwards, describe the
  // photograph that was actually taken.
  const description = describePhotograph(settings, captured?.scene ?? scene);

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

        {mode === "captured" && captured ? (
          <ResultPanel
            result={captured.result}
            description={description}
            note={
              captured.caughtSlow
                ? "You caught the bob near the end of its swing, where it is barely moving. That is a legitimate way to get a sharp shot — but try again as it passes through the centre, where shutter speed is what decides it."
                : undefined
            }
            onRetake={handleRetake}
          />
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
