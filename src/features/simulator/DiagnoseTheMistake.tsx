"use client";

import type { DiagnoseExercise } from "@content/challenges/diagnose";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { evaluateExposure } from "@/lib/sim/exposure";
import { FAULTS, getFault, isFixed, type FaultId } from "@/lib/sim/faults";
import { subjectEv100, type ControlName } from "@/lib/sim/meter";
import type { CameraSettings } from "@/lib/sim/types";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Controls } from "./Controls";
import { ExposureMeter } from "./ExposureMeter";
import { getSceneSpec } from "./scene";
import { Viewfinder, type StillRequest, type ViewfinderMode } from "./render/Viewfinder";

type Stage = "diagnosing" | "fixing" | "fixed";

/**
 * Two steps: name what went wrong, then cure it.
 *
 * Naming the fault is the diagnostic skill; correcting it proves you know which control owns it.
 * The flawed photograph is generated from settings that genuinely cause the fault, so the picture
 * can never disagree with its own answer — `diagnose.test.ts` holds that to account.
 */
export function DiagnoseTheMistake({ exercise }: { readonly exercise: DiagnoseExercise }) {
  const reducedMotion = usePrefersReducedMotion();
  const spec = getSceneSpec(exercise.sceneId);

  const [flawedImage, setFlawedImage] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("diagnosing");
  const [chosen, setChosen] = useState<FaultId | null>(null);
  const [mode, setMode] = useState<ViewfinderMode>("live");

  const flawedSettings = useMemo<CameraSettings>(
    () => ({
      ...exercise.settings,
      focalLengthMm: spec?.focalLengthMm ?? 50,
      focusDistanceM: spec?.focusDistanceM ?? 3,
    }),
    [exercise.settings, spec],
  );

  const [settings, setSettings] = useState<CameraSettings>(flawedSettings);

  const handleChange = useCallback((control: ControlName, value: number) => {
    setSettings((previous) => ({
      ...previous,
      ...(control === "shutter" ? { shutterSeconds: value } : {}),
      ...(control === "aperture" ? { aperture: value } : {}),
      ...(control === "iso" ? { iso: value } : {}),
    }));
  }, []);

  if (!spec) return null;

  const options = [exercise.answer, ...exercise.distractors];
  // Ordered by the canonical fault list rather than shuffled, so the answer's position is not a
  // tell and the order is the same every visit.
  const orderedOptions = FAULTS.filter((fault) => options.includes(fault.id)).map((f) => f.id);

  const exposure = evaluateExposure(settings, subjectEv100(spec.scene));
  const flawedExposure = evaluateExposure(flawedSettings, subjectEv100(spec.scene));
  const cured = isFixed(exercise.answer, settings, spec.scene);
  const answer = getFault(exercise.answer);

  const still: StillRequest | null = flawedImage
    ? null
    : {
        id: `${exercise.id}-flawed`,
        settings: flawedSettings,
        deviationStops: flawedExposure.deviationStops,
        timeSeconds: exercise.captureTimeSeconds,
      };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div className="rounded-md bg-[var(--color-zone-5)] p-4 sm:p-6">
          {/* One canvas. It renders the flawed shot once, then becomes the live view used for
              the fix — so the "before" is a still and the "after" is something you control. */}
          <div className={stage === "diagnosing" ? "hidden" : undefined}>
            <Viewfinder
              spec={spec}
              settings={settings}
              deviationStops={exposure.deviationStops}
              mode={mode}
              animate={mode === "live" && !reducedMotion && stage !== "diagnosing"}
              onCaptured={() => {
                setMode("captured");
              }}
              still={still}
              onStill={setFlawedImage}
            />
          </div>

          {stage === "diagnosing" &&
            (flawedImage ? (
              <Image
                src={flawedImage}
                alt="A photograph with something wrong with it. Work out what."
                width={900}
                height={600}
                unoptimized
                className="h-auto w-full rounded"
              />
            ) : (
              <div style={{ aspectRatio: "3 / 2" }} className="grid place-items-center">
                <span className="text-sm text-white/80">Developing…</span>
              </div>
            ))}
        </div>

        {/* The flawed image is invisible to assistive tech, so the fault is also available as
            text once it has been named — never before, or the question answers itself. */}
        <p aria-live="polite" className="sr-only">
          {stage !== "diagnosing" && answer ? answer.explanation : ""}
        </p>
      </div>

      <div className="flex w-full flex-col gap-5 lg:w-80">
        <h3 className="text-lg font-semibold">{exercise.title}</h3>

        {stage === "diagnosing" ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm text-ink-muted">What went wrong here?</legend>

            {orderedOptions.map((id) => {
              const fault = getFault(id);
              if (!fault) return null;

              return (
                <label
                  key={id}
                  className="flex cursor-pointer items-start gap-2.5 rounded-md border border-rule p-3 text-sm has-checked:border-rule-strong has-checked:bg-surface-raised"
                >
                  <input
                    type="radio"
                    name="fault"
                    value={id}
                    checked={chosen === id}
                    onChange={() => {
                      setChosen(id);
                    }}
                    className="mt-0.5 accent-accent"
                  />
                  <span>{fault.label}</span>
                </label>
              );
            })}

            <button
              type="button"
              disabled={chosen === null}
              onClick={() => {
                setStage("fixing");
              }}
              className="mt-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-surface disabled:opacity-60"
            >
              Check my answer
            </button>
          </fieldset>
        ) : (
          <>
            <div
              className={[
                "rounded-md border-l-2 py-3 pr-3 pl-4 text-sm leading-relaxed",
                chosen === exercise.answer
                  ? "border-l-[#2f7d32] bg-surface-raised"
                  : "border-l-[#c4402a] bg-surface-raised",
              ].join(" ")}
            >
              <p className="font-medium">
                {chosen === exercise.answer
                  ? "Right."
                  : `Not quite — it was ${answer?.label.toLowerCase() ?? "something else"}.`}
              </p>
              <p className="mt-1.5 text-ink-muted">{answer?.explanation}</p>
              <p className="mt-1.5 text-ink-muted">
                <span className="font-medium text-ink">Fix it with:</span> {answer?.control}
              </p>
            </div>

            <Controls
              shutterSeconds={settings.shutterSeconds}
              aperture={settings.aperture}
              iso={settings.iso}
              unlocked={[exercise.fixWith]}
              onChange={handleChange}
              disabled={mode !== "live"}
            />

            <ExposureMeter deviationStops={exposure.deviationStops} />

            <p role="status" className={cured ? "text-sm text-ink" : "text-sm text-ink-muted"}>
              {cured
                ? "That has cured it — the fault is gone."
                : "Still there. Keep moving the control until the fault clears."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
