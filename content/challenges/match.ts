import type { MatchExercise } from "@/features/simulator/MatchThePhoto";

/**
 * Match-the-photo exercises.
 *
 * Each target is a photograph with a distinct *look* rather than a distinct exposure — the
 * comparison grades brightness, movement, background and noise separately, so reaching the same
 * look by a different route counts as a match. That is the lesson: there is no single correct
 * combination, only a result you either got or did not.
 */
export const MATCH_EXERCISES: readonly MatchExercise[] = [
  {
    id: "frozen-and-open",
    title: "Frozen, with a soft backdrop",
    sceneId: "pendulum-deep",
    // Wide open and fast: the bob is sharp and the distant backdrop has fallen away.
    target: { shutterSeconds: 1 / 2048, aperture: 2, iso: 400 },
    targetTimeSeconds: 0,
    start: { shutterSeconds: 1 / 64, aperture: 11.313708498984761, iso: 100 },
  },
  {
    id: "deep-and-still",
    title: "Sharp from front to back",
    sceneId: "depth-row",
    // Stopped well down: every marker readable.
    target: { shutterSeconds: 1 / 32, aperture: 16, iso: 100 },
    targetTimeSeconds: 0,
    start: { shutterSeconds: 1 / 1024, aperture: 2, iso: 100 },
  },
  {
    id: "trail-of-movement",
    title: "A trail of movement",
    sceneId: "pendulum-dusk",
    // Slow enough that the bob draws a line across the rules.
    target: { shutterSeconds: 1 / 16, aperture: 5.656854249492381, iso: 100 },
    targetTimeSeconds: 0,
    start: { shutterSeconds: 1 / 1024, aperture: 1.4142135623730951, iso: 400 },
  },
];

export function getMatchExercise(id: string): MatchExercise | undefined {
  return MATCH_EXERCISES.find((exercise) => exercise.id === id);
}
