"use client";

import { useCallback, useState } from "react";
import { describePhotograph } from "@/lib/sim/describe";
import { evaluateExposure } from "@/lib/sim/exposure";
import { subjectEv100, type ControlName } from "@/lib/sim/meter";
import { buildHistogram, EMPTY_HISTOGRAM, type Histogram } from "@/lib/sim/histogram";
import type { CameraSettings } from "@/lib/sim/types";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Controls } from "./Controls";
import { ExposureMeter } from "./ExposureMeter";
import { HistogramView } from "./HistogramView";
import { getSceneSpec, SCENE_SPECS } from "./scene";
import { Viewfinder, type ViewfinderMode } from "./render/Viewfinder";

const ALL_CONTROLS: readonly ControlName[] = ["shutter", "aperture", "iso"];

/**
 * Free play. No goals, no score, no stars.
 *
 * The point is a place to turn a dial and watch what happens without being told you are wrong —
 * which is how most people actually learn a camera. The histogram is here rather than in the
 * graded challenges for the same reason: it is an instrument to read, not a test to pass.
 */
export function Sandbox({ initialSceneId }: { readonly initialSceneId: string }) {
  const reducedMotion = usePrefersReducedMotion();

  const [sceneId, setSceneId] = useState(initialSceneId);
  const spec = getSceneSpec(sceneId) ?? SCENE_SPECS[0];

  const [settings, setSettings] = useState<CameraSettings>(() => ({
    shutterSeconds: 1 / 128,
    aperture: 5.656854249492381,
    iso: 100,
    focalLengthMm: spec?.focalLengthMm ?? 50,
    focusDistanceM: spec?.focusDistanceM ?? 3,
  }));

  const [mode, setMode] = useState<ViewfinderMode>("live");
  const [histogram, setHistogram] = useState<Histogram>(EMPTY_HISTOGRAM);

  const handleChange = useCallback((control: ControlName, value: number) => {
    setSettings((previous) => ({
      ...previous,
      ...(control === "shutter" ? { shutterSeconds: value } : {}),
      ...(control === "aperture" ? { aperture: value } : {}),
      ...(control === "iso" ? { iso: value } : {}),
    }));
  }, []);

  const handleHistogram = useCallback((pixels: Uint8Array) => {
    setHistogram(buildHistogram(pixels));
  }, []);

  const handleSceneChange = useCallback((nextId: string) => {
    const next = getSceneSpec(nextId);
    if (!next) return;

    setSceneId(nextId);
    // Focal length and focus belong to the scene, not the photographer, at this stage.
    setSettings((previous) => ({
      ...previous,
      focalLengthMm: next.focalLengthMm,
      focusDistanceM: next.focusDistanceM,
    }));
    setMode("live");
  }, []);

  if (!spec) return null;

  const exposure = evaluateExposure(settings, subjectEv100(spec.scene));

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div className="rounded-md bg-[var(--color-zone-5)] p-4 sm:p-6">
          <Viewfinder
            spec={spec}
            settings={settings}
            deviationStops={exposure.deviationStops}
            mode={mode}
            animate={mode === "live" && !reducedMotion}
            onCaptured={() => {
              setMode("captured");
            }}
            onHistogram={handleHistogram}
          />
        </div>

        <p aria-live="polite" className="sr-only">
          {describePhotograph(settings, spec.scene)}
        </p>
      </div>

      <div className="flex w-full flex-col gap-5 lg:w-80">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Scene</span>
          <select
            value={sceneId}
            onChange={(event) => {
              handleSceneChange(event.target.value);
            }}
            className="rounded-md border border-rule bg-surface px-2 py-1.5 text-sm"
          >
            {SCENE_SPECS.map((option) => (
              <option key={option.id} value={option.id}>
                {SCENE_LABELS[option.id] ?? option.id}
              </option>
            ))}
          </select>
        </label>

        <Controls
          shutterSeconds={settings.shutterSeconds}
          aperture={settings.aperture}
          iso={settings.iso}
          unlocked={ALL_CONTROLS}
          onChange={handleChange}
          disabled={false}
        />

        <ExposureMeter deviationStops={exposure.deviationStops} />
        <HistogramView histogram={histogram} />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("capturing");
            }}
            disabled={mode !== "live"}
            className="flex-1 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-surface disabled:opacity-60"
          >
            {mode === "capturing" ? "Exposing…" : "Capture"}
          </button>
          {mode === "captured" && (
            <button
              type="button"
              onClick={() => {
                setMode("live");
              }}
              className="rounded-md border border-rule-strong px-4 py-2.5 text-sm font-medium"
            >
              Back to live
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const SCENE_LABELS: Readonly<Record<string, string>> = {
  pendulum: "Pendulum · bright daylight",
  "pendulum-dusk": "Pendulum · failing light",
  "pendulum-deep": "Pendulum · distant backdrop",
  "depth-row": "Depth row · bright",
  "depth-row-overcast": "Depth row · overcast",
  "dim-interior": "Still life · window light",
  "dim-interior-evening": "Still life · evening",
};
