import type { MeteringExercise } from "@/features/simulator/MeteringTrainer";

/**
 * Metering exercises.
 *
 * Two scenes that fail in opposite directions, because a meter is not confused by backlighting
 * specifically — it is confused by anything that is not mid-grey. One case alone would teach the
 * wrong rule.
 */
export const METERING_EXERCISES: readonly MeteringExercise[] = [
  {
    id: "backlit-figure",
    title: "The face in shadow",
    sceneId: "backlit-portrait",
    brief:
      "The camera is exposing this one. A bright sky fills most of the frame and the figure is in its own shadow — see what the camera makes of that, then get the figure exposed properly.",
    lesson:
      "The meter was averaging a sky four stops brighter than the subject. Measuring a smaller part of the frame fixes the cause; compensation only treats the symptom — and here it cannot reach far enough on its own.",
    aperture: 5.656854249492381,
    iso: 100,
  },
  {
    id: "grey-snow",
    title: "Why is the snow grey?",
    sceneId: "snow-field",
    brief:
      "Nothing is backlit and there is no bright background to blame. The scene is evenly lit, every metering mode agrees — and the photograph is still wrong. Work out why, and fix it.",
    lesson:
      "A meter assumes every scene averages to mid-grey. Snow is not mid-grey, so a camera left alone renders it as dishwater. Changing how much of the frame you measure cannot help when all of it is snow: only telling the camera it is wrong will.",
    aperture: 8,
    iso: 100,
  },
];

export function getMeteringExercise(id: string): MeteringExercise | undefined {
  return METERING_EXERCISES.find((exercise) => exercise.id === id);
}
