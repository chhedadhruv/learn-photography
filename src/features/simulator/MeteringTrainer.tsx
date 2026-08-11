"use client";

import { useCallback, useMemo, useState } from "react";
import { COMPENSATION_STOPS, autoExpose, meterError } from "@/lib/sim/autoExposure";
import { describePhotograph } from "@/lib/sim/describe";
import { evaluateExposure } from "@/lib/sim/exposure";
import {
  METERING_LABELS,
  METERING_MODES,
  correctExposureEv100,
  type MeteringMode,
} from "@/lib/sim/meter";
import { formatAperture, formatIso, formatShutter } from "@/lib/sim/values";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { ExposureMeter } from "./ExposureMeter";
import { getSceneSpec } from "./scene";
import { Viewfinder, type ViewfinderMode } from "./render/Viewfinder";

export interface MeteringExercise {
  readonly id: string;
  readonly title: string;
  readonly sceneId: string;
  readonly brief: string;
  readonly lesson: string;
  readonly aperture: number;
  readonly iso: number;
}

/**
 * The camera exposes; you control how it measures the light.
 *
 * Every other module here is manual, where the meter is only advice. Automatic exposure is the
 * one framing in which a metering error becomes a mistake you can watch happen — which is the
 * entire subject. The two controls are the pair a photographer actually reaches for when a
 * camera gets it wrong: change how it measures, or tell it it is wrong.
 */
export function MeteringTrainer({ exercise }: { readonly exercise: MeteringExercise }) {
  const reducedMotion = usePrefersReducedMotion();
  const spec = getSceneSpec(exercise.sceneId);

  const [meteringMode, setMeteringMode] = useState<MeteringMode>("average");
  const [compensation, setCompensation] = useState(0);
  const [mode, setMode] = useState<ViewfinderMode>("live");

  const auto = useMemo(() => {
    if (!spec) return null;
    return autoExpose({
      scene: spec.scene,
      meteringMode,
      compensationStops: compensation,
      aperture: exercise.aperture,
      iso: exercise.iso,
      focalLengthMm: spec.focalLengthMm,
      focusDistanceM: spec.focusDistanceM,
    });
  }, [compensation, exercise.aperture, exercise.iso, meteringMode, spec]);

  const handleCaptured = useCallback(() => {
    setMode("captured");
  }, []);

  if (!spec || !auto) return null;

  const correctEv = correctExposureEv100(spec.scene);
  const exposure = evaluateExposure(auto.settings, correctEv);
  const error = meterError(spec.scene, meteringMode, correctEv);
  const solved = exposure.verdict === "correct";

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div className="rounded-md bg-[var(--color-zone-5)] p-4 sm:p-6">
          <Viewfinder
            spec={spec}
            settings={auto.settings}
            deviationStops={exposure.deviationStops}
            mode={mode}
            animate={mode === "live" && !reducedMotion}
            onCaptured={handleCaptured}
          />
        </div>

        <p aria-live="polite" className="sr-only">
          {describePhotograph(auto.settings, spec.scene)}
        </p>
      </div>

      <div className="flex w-full flex-col gap-5 lg:w-80">
        <div>
          <h3 className="text-lg font-semibold">{exercise.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{exercise.brief}</p>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Metering mode</legend>
          <p className="mt-1 text-xs text-ink-faint">How much of the frame the camera measures.</p>

          <div className="mt-2 flex flex-col gap-1.5">
            {METERING_MODES.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2.5 rounded-md border border-rule px-3 py-2 text-sm has-checked:border-rule-strong has-checked:bg-surface-raised"
              >
                <input
                  type="radio"
                  name="metering"
                  value={option}
                  checked={meteringMode === option}
                  onChange={() => {
                    setMeteringMode(option);
                    setMode("live");
                  }}
                  className="accent-accent"
                />
                {METERING_LABELS[option]}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="compensation" className="text-sm font-medium">
              Exposure compensation
            </label>
            <span className="font-mono text-sm tabular-nums">
              {compensation > 0 ? "+" : ""}
              {compensation.toString()} EV
            </span>
          </div>

          <input
            id="compensation"
            type="range"
            min={0}
            max={COMPENSATION_STOPS.length - 1}
            step={1}
            value={COMPENSATION_STOPS.indexOf(compensation as (typeof COMPENSATION_STOPS)[number])}
            aria-valuetext={`${compensation > 0 ? "plus " : compensation < 0 ? "minus " : ""}${Math.abs(compensation).toString()} EV`}
            aria-describedby="compensation-hint"
            onChange={(event) => {
              setCompensation(COMPENSATION_STOPS[Number(event.target.value)] ?? 0);
              setMode("live");
            }}
            className="mt-2 w-full accent-accent"
          />
          <p id="compensation-hint" className="mt-1 text-xs text-ink-faint">
            Tells the camera its reading is wrong. Positive makes the photograph brighter.
          </p>
        </div>

        {/* What the camera decided, shown rather than hidden: the point is that these numbers
            follow from the meter's reading, not from anything the player set directly. */}
        <div className="rounded-md border border-rule bg-surface-raised p-3 text-sm">
          <p className="text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase">
            The camera chose
          </p>
          <p className="mt-1.5 font-mono tabular-nums">
            {formatShutter(auto.settings.shutterSeconds)} · {formatAperture(auto.settings.aperture)}{" "}
            · {formatIso(auto.settings.iso)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            Its meter read EV {auto.meteredEv100.toFixed(1)}. The subject needs EV{" "}
            {correctEv.toFixed(1)} — a difference of {Math.abs(error).toFixed(1)} stops
            {error > 0.2
              ? ", so it is reading brighter than the subject"
              : error < -0.2
                ? ", so it is reading darker than the subject"
                : ""}
            .
          </p>
        </div>

        <ExposureMeter deviationStops={exposure.deviationStops} />

        <p role="status" className={solved ? "text-sm text-ink" : "text-sm text-ink-muted"}>
          {solved
            ? `Correct. ${exercise.lesson}`
            : exposure.verdict === "under"
              ? "The subject is still too dark."
              : "The subject is now too bright."}
        </p>
      </div>
    </div>
  );
}
