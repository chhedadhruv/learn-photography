import { DIAGNOSE_EXERCISES } from "@content/challenges/diagnose";
import { describe, expect, it } from "vitest";
import { getSceneSpec } from "@/features/simulator/scene";
import { faultsPresent, getFault } from "@/lib/sim/faults";
import type { CameraSettings } from "@/lib/sim/types";

/**
 * The property that makes these exercises worth doing: the photograph must actually suffer from
 * the fault the answer key names.
 *
 * The image is generated from these settings by the same physics that decides `faultsPresent`,
 * so if the two ever disagree the exercise is teaching someone to see something that is not
 * there. That would be worse than not having the exercise at all.
 */
describe.each(DIAGNOSE_EXERCISES.map((exercise) => [exercise.id, exercise] as const))(
  "diagnose: %s",
  (_id, exercise) => {
    const spec = getSceneSpec(exercise.sceneId);

    const settings = (): CameraSettings => ({
      ...exercise.settings,
      focalLengthMm: spec?.focalLengthMm ?? 50,
      focusDistanceM: spec?.focusDistanceM ?? 3,
    });

    it("names a scene that exists", () => {
      expect(spec, `unknown scene "${exercise.sceneId}"`).toBeDefined();
    });

    it("actually suffers from the fault it claims", () => {
      if (!spec) return;

      expect(
        faultsPresent(settings(), spec.scene),
        `the settings do not produce "${exercise.answer}"`,
      ).toContain(exercise.answer);
    });

    it("does not suffer from any of its own distractors", () => {
      if (!spec) return;
      const present = faultsPresent(settings(), spec.scene);

      // A distractor that is also true makes the question unanswerable.
      for (const distractor of exercise.distractors) {
        expect(present, `"${distractor}" is also present`).not.toContain(distractor);
      }
    });

    it("offers a real fault as the answer and as every distractor", () => {
      expect(getFault(exercise.answer)).toBeDefined();
      for (const distractor of exercise.distractors) {
        expect(getFault(distractor), distractor).toBeDefined();
      }
    });

    it("does not list its answer among the distractors", () => {
      expect(exercise.distractors).not.toContain(exercise.answer);
    });

    it("offers enough choices to be a real question", () => {
      expect(exercise.distractors.length).toBeGreaterThanOrEqual(2);
    });
  },
);

describe("the diagnose set as a whole", () => {
  it("gives every exercise a unique id", () => {
    expect(new Set(DIAGNOSE_EXERCISES.map((e) => e.id)).size).toBe(DIAGNOSE_EXERCISES.length);
  });

  it("covers more than one kind of fault", () => {
    expect(new Set(DIAGNOSE_EXERCISES.map((e) => e.answer)).size).toBeGreaterThan(2);
  });
});
