import { describe, expect, it } from "vitest";
import { evaluateExposure } from "@/lib/sim/exposure";
import { subjectEv100 } from "@/lib/sim/meter";
import { score } from "@/lib/sim/scoring";
import type { CameraSettings } from "@/lib/sim/types";
import { APERTURES, ISOS, SHUTTER_SPEEDS } from "@/lib/sim/values";
import { CHALLENGES, getSceneFor } from "./registry";
import { setUpChallenge } from "./setup";

/**
 * Properties every challenge must hold, checked across all of them at once.
 *
 * These are the two ways a challenge fails a player silently: it can be impossible, or it can
 * already be solved when they arrive. Both would be found by a frustrated or a bored beginner
 * rather than by CI.
 *
 * Everything goes through `setUpChallenge`, the same function the simulator uses. A test that
 * rebuilt the starting conditions itself would be verifying a fiction — and did, briefly, which
 * is how five unwinnable challenges nearly got through.
 */
describe.each(CHALLENGES.map((challenge) => [challenge.id, challenge] as const))(
  "challenge: %s",
  (_id, challenge) => {
    const spec = getSceneFor(challenge);
    const setup = setUpChallenge(challenge, spec);

    it("has a starting setup", () => {
      expect(setup).not.toBeNull();
    });

    it("does not open on the answer", () => {
      if (!setup) return;

      const opening = score({ settings: setup.start, scene: spec.scene, goals: challenge.goals });
      expect(opening.stars).toBeLessThan(3);
    });

    it("opens visibly wrong, so the meter shows which way to go", () => {
      if (!setup) return;

      const exposure = evaluateExposure(setup.start, subjectEv100(spec.scene));
      expect(Math.abs(exposure.deviationStops)).toBeGreaterThanOrEqual(1);
    });

    it("is solvable: some reachable setting scores three stars", () => {
      if (!setup) return;

      const shutters = challenge.unlocked.includes("shutter")
        ? SHUTTER_SPEEDS
        : [setup.start.shutterSeconds];
      const apertures = challenge.unlocked.includes("aperture")
        ? APERTURES
        : [setup.start.aperture];
      const isos = challenge.unlocked.includes("iso") ? ISOS : [setup.start.iso];

      let best = 0;
      for (const shutterSeconds of shutters) {
        for (const aperture of apertures) {
          for (const iso of isos) {
            const candidate: CameraSettings = { ...setup.start, shutterSeconds, aperture, iso };
            best = Math.max(
              best,
              score({ settings: candidate, scene: spec.scene, goals: challenge.goals }).stars,
            );
          }
        }
      }

      expect(best, "no reachable setting earns three stars").toBe(3);
    });

    it("only moves the controls it unlocked", () => {
      if (!setup) return;

      // Whatever the player cannot touch must open on the value the answer needs.
      if (!challenge.unlocked.includes("shutter")) {
        expect(setup.start.shutterSeconds).toBe(setup.answer.shutterSeconds);
      }
      if (!challenge.unlocked.includes("aperture")) {
        expect(setup.start.aperture).toBe(setup.answer.aperture);
      }
      if (!challenge.unlocked.includes("iso")) {
        expect(setup.start.iso).toBe(setup.answer.iso);
      }
    });

    it("honours any values the challenge pinned", () => {
      if (!setup || !challenge.locked) return;

      if (challenge.locked.shutterSeconds !== undefined) {
        expect(setup.answer.shutterSeconds).toBeCloseTo(challenge.locked.shutterSeconds, 10);
      }
      if (challenge.locked.aperture !== undefined) {
        expect(setup.answer.aperture).toBeCloseTo(challenge.locked.aperture, 10);
      }
      if (challenge.locked.iso !== undefined) {
        expect(setup.answer.iso).toBe(challenge.locked.iso);
      }
    });
  },
);

describe("the ladder as a whole", () => {
  it("has three challenges at every level from 1 to 5", () => {
    for (let level = 1; level <= 5; level += 1) {
      expect(
        CHALLENGES.filter((challenge) => challenge.level === level),
        `level ${level.toString()}`,
      ).toHaveLength(3);
    }
  });

  it("unlocks one control at level 1 and all three by level 5", () => {
    for (const challenge of CHALLENGES) {
      const expected = challenge.level <= 3 ? 1 : challenge.level === 4 ? 2 : 3;
      expect(challenge.unlocked, challenge.id).toHaveLength(expected);
    }
  });

  it("gives every challenge a unique id", () => {
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(CHALLENGES.length);
  });
});
