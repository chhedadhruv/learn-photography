"use client";

import type { ControlName } from "@/lib/sim/meter";
import {
  APERTURES,
  ISOS,
  SHUTTER_SPEEDS,
  describeShutter,
  formatAperture,
  formatIso,
  formatShutter,
  indexOfValue,
} from "@/lib/sim/values";

interface ControlsProps {
  readonly shutterSeconds: number;
  readonly aperture: number;
  readonly iso: number;
  readonly unlocked: readonly ControlName[];
  readonly onChange: (control: ControlName, value: number) => void;
  readonly disabled: boolean;
}

/**
 * Locked controls stay visible with their automatic value shown, rather than being hidden. The
 * point of a level that locks ISO is not that ISO has ceased to exist — it is that the camera
 * is choosing it for you, and seeing what it chose is half the lesson.
 */
export function Controls({
  shutterSeconds,
  aperture,
  iso,
  unlocked,
  onChange,
  disabled,
}: ControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <ControlRow
        name="shutter"
        label="Shutter speed"
        value={formatShutter(shutterSeconds)}
        spoken={describeShutter(shutterSeconds)}
        hint="How long the sensor is exposed. Faster freezes movement."
        ladder={SHUTTER_SPEEDS}
        current={shutterSeconds}
        unlocked={unlocked.includes("shutter")}
        disabled={disabled}
        onChange={onChange}
      />
      <ControlRow
        name="aperture"
        label="Aperture"
        value={formatAperture(aperture)}
        spoken={`f ${formatAperture(aperture).slice(2)}`}
        hint="How wide the lens opens. Wider blurs the background."
        ladder={APERTURES}
        current={aperture}
        unlocked={unlocked.includes("aperture")}
        disabled={disabled}
        onChange={onChange}
      />
      <ControlRow
        name="iso"
        label="ISO"
        value={formatIso(iso)}
        spoken={formatIso(iso)}
        hint="Sensor sensitivity. Higher brightens, but adds noise."
        ladder={ISOS}
        current={iso}
        unlocked={unlocked.includes("iso")}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}

interface ControlRowProps {
  readonly name: ControlName;
  readonly label: string;
  readonly value: string;
  readonly spoken: string;
  readonly hint: string;
  readonly ladder: readonly number[];
  readonly current: number;
  readonly unlocked: boolean;
  readonly disabled: boolean;
  readonly onChange: (control: ControlName, value: number) => void;
}

function ControlRow({
  name,
  label,
  value,
  spoken,
  hint,
  ladder,
  current,
  unlocked,
  disabled,
  onChange,
}: ControlRowProps) {
  const index = indexOfValue(ladder, current);
  const inputId = `control-${name}`;

  return (
    <div className={unlocked ? undefined : "opacity-60"}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <span className="font-mono text-sm tabular-nums">
          {value}
          {unlocked ? null : <span className="ml-2 text-xs text-ink-faint">set for you</span>}
        </span>
      </div>

      {/* A real range input, so it is keyboard-operable and announced correctly, rather than a
          div with pointer handlers. */}
      <input
        id={inputId}
        type="range"
        min={0}
        max={ladder.length - 1}
        step={1}
        value={index}
        disabled={!unlocked || disabled}
        aria-valuetext={spoken}
        aria-describedby={`${inputId}-hint`}
        onChange={(event) => {
          const next = ladder[Number(event.target.value)];
          if (next !== undefined) onChange(name, next);
        }}
        className="mt-2 w-full accent-accent disabled:cursor-not-allowed"
      />

      <p id={`${inputId}-hint`} className="mt-1 text-xs text-ink-faint">
        {hint}
      </p>
    </div>
  );
}
