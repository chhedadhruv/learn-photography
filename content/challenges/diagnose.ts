import type { FaultId } from "@/lib/sim/faults";

/**
 * Diagnose-the-mistake exercises.
 *
 * Each names a scene, the settings that produce the flawed photograph, and the fault those
 * settings genuinely cause. `diagnose.test.ts` checks that last claim against the physics, so an
 * exercise cannot ship with a picture that disagrees with its own answer.
 *
 * The distractors are chosen to be plausible rather than absurd: telling subject motion from
 * camera shake is a real diagnostic skill, and offering "wrong lens cap" as an alternative would
 * teach nothing.
 */
export interface DiagnoseExercise {
  readonly id: string;
  readonly title: string;
  readonly sceneId: string;
  readonly settings: {
    readonly shutterSeconds: number;
    readonly aperture: number;
    readonly iso: number;
  };
  /** The moment in the scene's cycle the flawed shot was taken at. */
  readonly captureTimeSeconds: number;
  readonly answer: FaultId;
  readonly distractors: readonly FaultId[];
  /** Which control the player must then move to cure it. */
  readonly fixWith: "shutter" | "aperture" | "iso";
}

export const DIAGNOSE_EXERCISES: readonly DiagnoseExercise[] = [
  {
    id: "smeared-runner",
    title: "Why is the bob a streak?",
    sceneId: "pendulum",
    // Correct exposure here is 1/500; this is three stops slow, and the bob smears badly.
    settings: { shutterSeconds: 1 / 64, aperture: 5.656854249492381, iso: 100 },
    captureTimeSeconds: 0,
    answer: "subject-motion",
    distractors: ["camera-shake", "too-shallow", "underexposed"],
    fixWith: "shutter",
  },
  {
    id: "muddy-shadows",
    title: "Why has the still life gone dark?",
    sceneId: "dim-interior",
    // Three stops under: the room is dim and the sensitivity was never raised to meet it.
    settings: { shutterSeconds: 1 / 64, aperture: 5.656854249492381, iso: 200 },
    captureTimeSeconds: 0,
    answer: "underexposed",
    distractors: ["camera-shake", "noisy", "too-shallow"],
    fixWith: "iso",
  },
  {
    id: "only-one-marker",
    title: "Why is only one marker sharp?",
    sceneId: "depth-row",
    // Wide open on an 85mm: the band of sharpness is a sliver.
    settings: { shutterSeconds: 1 / 4096, aperture: 1.4142135623730951, iso: 100 },
    captureTimeSeconds: 0,
    answer: "too-shallow",
    distractors: ["subject-motion", "camera-shake", "overexposed"],
    fixWith: "aperture",
  },
  {
    id: "washed-out",
    title: "Why has this gone white?",
    // A still scene on purpose. Overexposing the pendulum with a slow shutter would smear the
    // bob too, making two of the four answers correct and the question unanswerable.
    sceneId: "depth-row",
    // Three stops over, bought with sensitivity rather than time so nothing else changes.
    settings: { shutterSeconds: 1 / 256, aperture: 5.656854249492381, iso: 800 },
    captureTimeSeconds: 0,
    answer: "overexposed",
    distractors: ["underexposed", "noisy", "subject-motion"],
    fixWith: "shutter",
  },
];

export function getDiagnoseExercise(id: string): DiagnoseExercise | undefined {
  return DIAGNOSE_EXERCISES.find((exercise) => exercise.id === id);
}
