"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Challenge } from "@/lib/challenges/types";
import type { Scene } from "@/lib/sim/types";

/**
 * The gate that keeps three.js out of everything except the pages that need it.
 *
 * The renderer is behind a dynamic import *and* behind a click. An article that embeds a
 * simulator therefore loads zero 3D code unless a reader chooses to use it, which is what lets
 * lesson pages stay fast while practice pages are as heavy as they need to be.
 */
const Simulator = dynamic(
  () => import("@/features/simulator/Simulator").then((module) => module.Simulator),
  {
    ssr: false,
    loading: () => <Skeleton label="Loading the camera…" />,
  },
);

interface SimulatorLoaderProps {
  readonly challenge: Challenge;
  readonly scene: Scene;
  readonly focalLengthMm: number;
  /** Start loaded, for a dedicated practice page where the simulator is the whole point. */
  readonly autoStart?: boolean;
}

export function SimulatorLoader({
  challenge,
  scene,
  focalLengthMm,
  autoStart = false,
}: SimulatorLoaderProps) {
  const [started, setStarted] = useState(autoStart);

  if (!started) {
    return (
      <div className="rounded-md border border-rule p-6 text-center">
        <h3 className="text-lg font-semibold">{challenge.title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
          {challenge.brief}
        </p>
        <button
          type="button"
          onClick={() => {
            setStarted(true);
          }}
          className="mt-5 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-surface"
        >
          Try it
        </button>
        <p className="mt-3 text-xs text-ink-faint">Loads an interactive 3D camera simulator.</p>
      </div>
    );
  }

  return <Simulator challenge={challenge} scene={scene} focalLengthMm={focalLengthMm} />;
}

function Skeleton({ label }: { readonly label: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-md bg-[var(--color-zone-5)]"
      style={{ aspectRatio: "3 / 2" }}
    >
      <p className="text-sm text-white/80">{label}</p>
    </div>
  );
}
