"use client";

import dynamic from "next/dynamic";
import type { DiagnoseExercise } from "@content/challenges/diagnose";
import type { MatchExercise } from "@/features/simulator/MatchThePhoto";

/**
 * Lazy entry points for the three-dimensional modules.
 *
 * Same rule as the challenge simulator: three.js loads on demand and never enters the shared
 * bundle, so an article page still costs nothing.
 */
function Skeleton({ label }: { readonly label: string }) {
  return (
    <div
      className="grid place-items-center rounded-md bg-[var(--color-zone-5)]"
      style={{ aspectRatio: "3 / 2" }}
    >
      <p className="text-sm text-white/80">{label}</p>
    </div>
  );
}

export const LazySandbox = dynamic(
  () => import("@/features/simulator/Sandbox").then((m) => m.Sandbox),
  { ssr: false, loading: () => <Skeleton label="Loading the camera…" /> },
);

export const LazyMatch = dynamic(
  () => import("@/features/simulator/MatchThePhoto").then((m) => m.MatchThePhoto),
  { ssr: false, loading: () => <Skeleton label="Developing the target…" /> },
);

export const LazyDiagnose = dynamic(
  () => import("@/features/simulator/DiagnoseTheMistake").then((m) => m.DiagnoseTheMistake),
  { ssr: false, loading: () => <Skeleton label="Developing the photograph…" /> },
);

export type { DiagnoseExercise, MatchExercise };
