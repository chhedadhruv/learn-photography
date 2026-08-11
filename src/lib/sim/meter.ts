import { evaluateExposure, requiredEv } from "./exposure";
import { APERTURES, ISOS, SHUTTER_SPEEDS, nearestValue } from "./values";
import type { CameraSettings, Scene } from "./types";

/**
 * Light metering, and the automatic choices the camera makes for controls a level has locked.
 */

export const METERING_MODES = ["average", "centre-weighted", "spot"] as const;
export type MeteringMode = (typeof METERING_MODES)[number];

export const METERING_LABELS: Record<MeteringMode, string> = {
  average: "Average",
  "centre-weighted": "Centre-weighted",
  spot: "Spot",
};

/**
 * What the camera's meter reads, as EV at ISO 100.
 *
 * Averaged in the luminance domain rather than in EV. EV is logarithmic, and averaging logs
 * would understate a bright background — which is exactly the error that makes backlit subjects
 * come out dark, so getting it wrong here would hide the phenomenon the lessons teach.
 */
export function meterScene(scene: Scene, mode: MeteringMode): number {
  const weighted = scene.regions.map((region) => {
    const weight =
      mode === "spot"
        ? region.inCentre
          ? region.frameShare
          : 0
        : mode === "centre-weighted"
          ? region.frameShare * (region.inCentre ? 4 : 1)
          : region.frameShare;

    return { luminance: 2 ** region.ev100, weight };
  });

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) return subjectEv100(scene);

  const meanLuminance =
    weighted.reduce((sum, entry) => sum + entry.luminance * entry.weight, 0) / totalWeight;

  return Math.log2(meanLuminance);
}

/** The brightness a correct exposure should be judged against: the subject's own. */
export function subjectEv100(scene: Scene): number {
  const subject = scene.regions.find((region) => region.isSubject);
  if (subject) return subject.ev100;

  const first = scene.regions[0];
  return first?.ev100 ?? 12;
}

export type ControlName = "shutter" | "aperture" | "iso";

/**
 * Apertures ordered by how sensible an automatic choice they are: mid-range first, because a
 * camera left to itself avoids both the softness of wide open and the diffraction of f/22.
 */
const AUTO_APERTURE_PREFERENCE = [5.6, 8, 4, 11, 2.8, 16, 2, 22, 1.4] as const;

export interface AutoFillRequest {
  readonly scene: Scene;
  /** Controls the player operates. Everything else is chosen here. */
  readonly unlocked: readonly ControlName[];
  readonly focalLengthMm: number;
  readonly focusDistanceM: number;
  /** Grade exposure against this. Defaults to the subject's brightness. */
  readonly targetEv100?: number;
}

/**
 * Chooses values for the controls a level has locked.
 *
 * The guarantee that matters: whatever is left unlocked must be able to reach a correct
 * exposure. A level that hands the player a shutter dial and an aperture that makes every rung
 * wrong is unwinnable, and the player would rightly blame themselves. So candidates are searched
 * and only a combination that leaves a solvable exposure is returned.
 *
 * Returns `null` when no combination works, which is how the build-time solvability check
 * catches an impossible challenge before a reader meets it.
 */
export function autoFillLockedControls(request: AutoFillRequest): CameraSettings | null {
  const { scene, unlocked, focalLengthMm, focusDistanceM } = request;
  const targetEv100 = request.targetEv100 ?? subjectEv100(scene);

  const isUnlocked = (control: ControlName) => unlocked.includes(control);

  const isoCandidates = isUnlocked("iso") ? [100] : ISOS;
  const apertureCandidates = isUnlocked("aperture") ? [5.6] : AUTO_APERTURE_PREFERENCE;

  for (const iso of isoCandidates) {
    for (const aperture of apertureCandidates) {
      const target = requiredEv(targetEv100, iso);

      // Ideal shutter for this aperture and ISO, before snapping to the ladder.
      const idealShutter = aperture ** 2 / 2 ** target;

      const settings: CameraSettings = {
        shutterSeconds: nearestValue(SHUTTER_SPEEDS, idealShutter),
        aperture,
        iso,
        focalLengthMm,
        focusDistanceM,
      };

      if (canReachCorrectExposure(settings, unlocked, targetEv100)) return settings;
    }
  }

  return null;
}

/**
 * Moves the controls the player operates away from the answer, so there is something to solve.
 *
 * `autoFillLockedControls` computes a correct setup in order to prove the level is winnable —
 * but starting the player on it means pressing capture immediately scores full marks and teaches
 * nothing. The locked controls keep their automatic values; the unlocked ones are pushed
 * `offsetStops` away from correct.
 *
 * The offset is towards overexposure, so every symptom points the same way: the meter sits right
 * of centre, the picture is too bright, and — because a slow shutter is what let the extra light
 * in — the subject is smeared too. One correction fixes all three, which is the lesson.
 */
export function offsetUnlockedControls(
  settings: CameraSettings,
  unlocked: readonly ControlName[],
  offsetStops: number,
): CameraSettings {
  const shifted = { ...settings };

  if (unlocked.includes("shutter")) {
    // A longer exposure admits more light: multiply the duration.
    shifted.shutterSeconds = nearestValue(
      SHUTTER_SPEEDS,
      settings.shutterSeconds * 2 ** offsetStops,
    );
  }
  if (unlocked.includes("aperture")) {
    // A smaller f-number is a wider opening: divide by √2 per stop.
    shifted.aperture = nearestValue(APERTURES, settings.aperture / Math.SQRT2 ** offsetStops);
  }
  if (unlocked.includes("iso")) {
    shifted.iso = nearestValue(ISOS, settings.iso * 2 ** offsetStops);
  }

  return shifted;
}

/**
 * The settings a challenge opens on: automatic values for the locked controls, and the unlocked
 * ones deliberately wrong.
 *
 * Returns `null` when the level has no solvable setup at all, which is what the build-time check
 * uses to reject an impossible challenge.
 */
export function startingSettings(request: AutoFillRequest, offsetStops = 3): CameraSettings | null {
  const solved = autoFillLockedControls(request);
  if (!solved) return null;

  const targetEv100 = request.targetEv100 ?? subjectEv100(request.scene);

  for (const attempt of [offsetStops, -offsetStops, offsetStops - 1, 1 - offsetStops]) {
    const candidate = offsetUnlockedControls(solved, request.unlocked, attempt);

    // Clamping against the end of a ladder can land back on the answer. If it has, try the
    // other direction rather than opening on a solved challenge.
    if (evaluateExposure(candidate, targetEv100).verdict !== "correct") return candidate;
  }

  return solved;
}

/**
 * Whether some combination of the unlocked controls exposes correctly, holding the locked ones
 * fixed. With nothing unlocked, the settings themselves must already be right.
 */
export function canReachCorrectExposure(
  settings: CameraSettings,
  unlocked: readonly ControlName[],
  targetEv100: number,
): boolean {
  const shutters = unlocked.includes("shutter") ? SHUTTER_SPEEDS : [settings.shutterSeconds];
  const apertures = unlocked.includes("aperture") ? APERTURES : [settings.aperture];
  const isos = unlocked.includes("iso") ? ISOS : [settings.iso];

  for (const shutterSeconds of shutters) {
    for (const aperture of apertures) {
      for (const iso of isos) {
        const candidate: CameraSettings = { ...settings, shutterSeconds, aperture, iso };
        if (evaluateExposure(candidate, targetEv100).verdict === "correct") return true;
      }
    }
  }

  return false;
}
