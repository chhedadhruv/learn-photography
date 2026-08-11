"use client";

import { useCallback, useMemo, useState } from "react";
import type { Challenge } from "@/lib/challenges/types";
import { describePhotograph } from "@/lib/sim/describe";
import { evaluateExposure } from "@/lib/sim/exposure";
import { subjectEv100, type ControlName } from "@/lib/sim/meter";
import { setUpChallenge } from "@/lib/challenges/setup";
import { score, type ScoreResult } from "@/lib/sim/scoring";
import type { CameraSettings, Scene } from "@/lib/sim/types";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Controls } from "./Controls";
import { ExposureMeter } from "./ExposureMeter";
import { ResultPanel } from "./ResultPanel";
import { Viewfinder, type ViewfinderMode } from "./render/Viewfinder";
import { getSceneSpec } from "./scene";
import type { SceneSpec } from "./scene/types";

interface SimulatorProps {
  readonly challenge: Challenge;
  readonly sceneId: string;
  readonly onScored?: ((stars: number) => void) | undefined;
}

/**
 * Resolves the scene before any hooks run.
 *
 * The spec holds functions, which cannot be serialised across the server/client boundary, so the
 * page sends an id and the lookup happens here. It is a separate component because a conditional
 * `throw` ahead of hooks would break the rules of hooks — and the React Compiler says so.
 */
export function Simulator({ challenge, sceneId, onScored }: SimulatorProps) {
  const spec = getSceneSpec(sceneId);
  if (!spec) throw new Error(`Unknown scene "${sceneId}".`);

  return <SimulatorForScene challenge={challenge} spec={spec} onScored={onScored} />;
}

interface SimulatorForSceneProps {
  readonly challenge: Challenge;
  readonly spec: SceneSpec;
  // Explicitly `| undefined`: with exactOptionalPropertyTypes, forwarding an absent optional
  // prop is not the same as omitting it.
  readonly onScored?: ((stars: number) => void) | undefined;
}

interface Captured {
  readonly scene: Scene;
  readonly result: ScoreResult;
  readonly caughtSlow: boolean;
}

function SimulatorForScene({ challenge, spec, onScored }: SimulatorForSceneProps) {
  const reducedMotion = usePrefersReducedMotion();
  const { scene } = spec;

  /**
   * Locked controls take the automatic values from the search that proves the level is winnable.
   * The unlocked ones deliberately start wrong — opening on the answer would mean pressing
   * capture scores full marks and teaches nothing.
   */
  const initial = useMemo<CameraSettings>(() => {
    const setup = setUpChallenge(challenge, spec);

    return (
      setup?.start ?? {
        shutterSeconds: 1 / 128,
        aperture: 5.656854249492381,
        iso: 100,
        focalLengthMm: spec.focalLengthMm,
        focusDistanceM: spec.focusDistanceM,
      }
    );
  }, [challenge, spec]);

  const [settings, setSettings] = useState<CameraSettings>(initial);
  const [mode, setMode] = useState<ViewfinderMode>("live");
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
   * The scene is re-derived for that moment: a moving subject's speed depends on where it was in
   * its cycle, so grading a shot taken at a slow point against the peak speed would report blur
   * that is not in the photograph. `effectiveSpeedMps` is the constant speed that produces
   * exactly the smear that was rendered.
   */
  const handleCaptured = useCallback(
    (captureTimeSeconds: number) => {
      const speed = spec.effectiveSpeedMps(settings.shutterSeconds, captureTimeSeconds);
      const capturedScene: Scene = { ...scene, subjectSpeedMps: speed };

      const scored = score({ settings, scene: capturedScene, goals: challenge.goals });

      setCaptured({
        scene: capturedScene,
        result: scored,
        // Catching a moving subject at the slow end of its travel freezes it without a fast
        // shutter. That is a real photograph and a real skill, but it is not the lesson.
        caughtSlow:
          spec.animated && spec.speedFraction(settings.shutterSeconds, captureTimeSeconds) < 0.4,
      });
      setMode("captured");
      onScored?.(scored.stars);
    },
    [challenge.goals, onScored, scene, settings, spec],
  );

  const handleRetake = useCallback(() => {
    setCaptured(null);
    setMode("live");
  }, []);

  // Before a capture, describe the live scene; afterwards, the photograph actually taken.
  const description = describePhotograph(settings, captured?.scene ?? scene);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        {/* Framed in Zone V, true 18% grey. A photograph judged against white or black reads as
            the wrong exposure — this is the neutral a photographer evaluates against. */}
        <div className="rounded-md bg-[var(--color-zone-5)] p-4 sm:p-6">
          <Viewfinder
            spec={spec}
            settings={settings}
            deviationStops={exposure.deviationStops}
            mode={mode}
            animate={mode === "live" && !reducedMotion}
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
                ? "You caught the subject where it is barely moving. That is a legitimate way to get a sharp shot — but try again as it passes through the middle, where shutter speed is what decides it."
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
