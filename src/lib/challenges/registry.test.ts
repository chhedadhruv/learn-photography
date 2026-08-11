import { describe, expect, it } from "vitest";
import { evaluateExposure } from "@/lib/sim/exposure";
import { canReachCorrectExposure, startingSettings, subjectEv100 } from "@/lib/sim/meter";
import { score } from "@/lib/sim/scoring";
import { APERTURES, ISOS, SHUTTER_SPEEDS } from "@/lib/sim/values";
import type { CameraSettings } from "@/lib/sim/types";
import { CHALLENGES, getSceneFor } from "./registry";

/**
 * Properties every challenge must hold, checked for all of them at once.
 *
 * These are the two ways a challenge fails a player without anyone noticing: it can be
 * impossible, or it can already be solved when they arrive. Both would be found by a frustrated
 * or a bored beginner rather than by CI, so they are asserted here.
 */
describe.each(CHALLENGES.map((challenge) => [challenge.id, challenge] as const))(
  "challenge: %s",
  (_id, challenge) => {
    const { scene, focalLengthMm } = getSceneFor(challenge);
    const request = {
      scene,
      unlocked: challenge.unlocked,
      focalLengthMm,
      focusDistanceM: scene.subjectDistanceM,
    };

    it("has a starting setup", () => {
      expect(startingSettings(request, challenge.startOffsetStops)).not.toBeNull();
    });

    it("does not open on the answer", () => {
      const start = startingSettings(request, challenge.startOffsetStops);
      expect(start).not.toBeNull();
      if (!start) return;

      const opening = score({ settings: start, scene, goals: challenge.goals });

      // Pressing capture without touching anything must not score full marks.
      expect(opening.stars).toBeLessThan(3);
    });

    it("opens visibly wrong, so the meter shows which way to go", () => {
      const start = startingSettings(request, challenge.startOffsetStops);
      if (!start) return;

      const exposure = evaluateExposure(start, subjectEv100(scene));
      expect(Math.abs(exposure.deviationStops)).toBeGreaterThanOrEqual(1);
    });

    it("is solvable: some setting of the unlocked controls scores three stars", () => {
      const start = startingSettings(request, challenge.startOffsetStops);
      if (!start) return;

      // Sweep every combination the player can actually reach.
      const shutters = challenge.unlocked.includes("shutter")
        ? SHUTTER_SPEEDS
        : [start.shutterSeconds];
      const apertures = challenge.unlocked.includes("aperture") ? APERTURES : [start.aperture];
      const isos = challenge.unlocked.includes("iso") ? ISOS : [start.iso];

      let best = 0;
      for (const shutterSeconds of shutters) {
        for (const aperture of apertures) {
          for (const iso of isos) {
            const candidate: CameraSettings = { ...start, shutterSeconds, aperture, iso };
            best = Math.max(
              best,
              score({ settings: candidate, scene, goals: challenge.goals }).stars,
            );
          }
        }
      }

      expect(best, "no reachable setting earns three stars").toBe(3);
    });

    it("leaves the locked controls able to expose correctly", () => {
      const start = startingSettings(request, challenge.startOffsetStops);
      if (!start) return;

      expect(canReachCorrectExposure(start, challenge.unlocked, subjectEv100(scene))).toBe(true);
    });

    it("only unlocks controls the player is told about", () => {
      expect(challenge.unlocked.length).toBeGreaterThan(0);
    });
  },
);
