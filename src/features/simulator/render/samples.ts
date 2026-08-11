/**
 * Where and when to take each sample of an exposure.
 *
 * Deterministic by design: a golden-angle spiral over the aperture disc and a stratified sweep
 * across the shutter interval, rather than random jitter. The same settings always produce the
 * same photograph, so a challenge cannot be passed or failed by luck, and the sampling is even
 * enough that 48 samples look smooth where 48 random ones would look speckled.
 */

/** ~137.5°, the angle that packs points on a disc most evenly. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export interface RenderSample {
  readonly timeOffsetSeconds: number;
  readonly lensOffsetXM: number;
  readonly lensOffsetYM: number;
}

export interface SampleRequest {
  readonly count: number;
  /** Exposure duration. Samples are spread across it, centred on zero. */
  readonly shutterSeconds: number;
  /** Physical diameter of the lens opening, metres: focal length ÷ f-number. */
  readonly apertureDiameterM: number;
  /** False for the live viewfinder, which shows depth of field but no motion blur. */
  readonly includeMotion: boolean;
}

export function buildSamples(request: SampleRequest): RenderSample[] {
  const { count, shutterSeconds, apertureDiameterM, includeMotion } = request;
  if (count <= 0) return [];

  const radius = apertureDiameterM / 2;
  const samples: RenderSample[] = [];

  for (let i = 0; i < count; i += 1) {
    // sqrt keeps the points uniform by area rather than crowding the centre.
    const discRadius = Math.sqrt((i + 0.5) / count) * radius;
    const angle = i * GOLDEN_ANGLE;

    // Stratified: sample i sits in the middle of the i-th slice of the exposure.
    const fraction = (i + 0.5) / count - 0.5;

    samples.push({
      timeOffsetSeconds: includeMotion ? fraction * shutterSeconds : 0,
      lensOffsetXM: Math.cos(angle) * discRadius,
      lensOffsetYM: Math.sin(angle) * discRadius,
    });
  }

  return samples;
}

/** Lens opening diameter in metres. A 50mm at f/2 is a 25mm hole. */
export function apertureDiameterM(focalLengthMm: number, fNumber: number): number {
  return focalLengthMm / fNumber / 1000;
}

/**
 * Noise amplitude for an ISO. Zero at base, growing with the square root of the sensitivity,
 * which is how photon shot noise actually scales.
 */
export function grainAmount(iso: number, baseIso = 100): number {
  return 0.025 * (Math.sqrt(iso / baseIso) - 1);
}
