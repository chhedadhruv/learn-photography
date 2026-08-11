import { describe, expect, it } from "vitest";
import {
  backgroundBlurPx,
  circleOfConfusionMm,
  depthOfField,
  hyperfocalDistanceM,
  isAcceptablySharp,
} from "./optics";
import { FULL_FRAME, type CameraSettings } from "./types";
import { APERTURES, nearestValue } from "./values";

const f = (printed: number) => nearestValue(APERTURES, printed);

const settings = (overrides: Partial<CameraSettings> = {}): CameraSettings => ({
  shutterSeconds: 1 / 128,
  aperture: f(2.8),
  iso: 100,
  focalLengthMm: 50,
  focusDistanceM: 3,
  ...overrides,
});

describe("circleOfConfusionMm", () => {
  it("is zero at the focus distance", () => {
    expect(circleOfConfusionMm(50, 2.8, 3, 3)).toBe(0);
  });

  it("grows the further behind the focus plane a point sits", () => {
    const near = circleOfConfusionMm(50, 2.8, 3, 5);
    const far = circleOfConfusionMm(50, 2.8, 3, 20);

    expect(far).toBeGreaterThan(near);
  });

  it("roughly doubles when the aperture opens two stops", () => {
    const wide = circleOfConfusionMm(50, f(2.8), 3, 10);
    const narrow = circleOfConfusionMm(50, f(5.6), 3, 10);

    expect(wide / narrow).toBeCloseTo(2, 1);
  });

  it("grows with the square of focal length at a fixed distance", () => {
    const short = circleOfConfusionMm(50, 2.8, 3, 10);
    const long = circleOfConfusionMm(100, 2.8, 3, 10);

    // Doubling focal length quadruples f², partly offset by the (S₁ − f) term.
    expect(long).toBeGreaterThan(short * 3);
  });

  it("is symmetric in blur either side of focus, in absolute distance terms", () => {
    const behind = circleOfConfusionMm(50, 2.8, 3, 4);
    const inFront = circleOfConfusionMm(50, 2.8, 3, 2);

    // Not equal — foreground blurs faster — but both non-zero and finite.
    expect(behind).toBeGreaterThan(0);
    expect(inFront).toBeGreaterThan(0);
  });

  it("returns zero rather than a negative when focused inside the focal length", () => {
    expect(circleOfConfusionMm(50, 2.8, 0.01, 10)).toBe(0);
  });
});

describe("isAcceptablySharp", () => {
  it("calls the focus plane itself sharp", () => {
    expect(isAcceptablySharp(settings(), 3, FULL_FRAME)).toBe(true);
  });

  it("calls a distant background unsharp when wide open", () => {
    expect(isAcceptablySharp(settings({ aperture: f(1.4) }), 50, FULL_FRAME)).toBe(false);
  });

  it("brings a mid-distance background into focus when stopped down", () => {
    // A 50mm at f/22 focused at 3m has a far limit around 12m, so 10m falls inside it — but 50m
    // does not, which is why stopping down is not a substitute for focusing.
    expect(isAcceptablySharp(settings({ aperture: f(22) }), 10, FULL_FRAME)).toBe(true);
    expect(isAcceptablySharp(settings({ aperture: f(22) }), 50, FULL_FRAME)).toBe(false);
  });
});

describe("backgroundBlurPx", () => {
  it("gives more blur at a wider aperture", () => {
    const wide = backgroundBlurPx(settings({ aperture: f(1.4) }), 20, FULL_FRAME, 1200);
    const narrow = backgroundBlurPx(settings({ aperture: f(16) }), 20, FULL_FRAME, 1200);

    expect(wide).toBeGreaterThan(narrow);
  });

  it("scales with the rendered image width, since blur is judged in pixels", () => {
    const small = backgroundBlurPx(settings(), 20, FULL_FRAME, 600);
    const large = backgroundBlurPx(settings(), 20, FULL_FRAME, 1200);

    expect(large).toBeCloseTo(small * 2, 6);
  });
});

describe("hyperfocalDistanceM", () => {
  it("matches the standard figure for a 50mm at f/8 on full-frame", () => {
    // 50²/(8 × 0.029) + 50 ≈ 10827mm ≈ 10.8m
    expect(hyperfocalDistanceM(50, 8, FULL_FRAME)).toBeCloseTo(10.8, 1);
  });

  it("comes closer as the aperture is stopped down", () => {
    expect(hyperfocalDistanceM(50, 16, FULL_FRAME)).toBeLessThan(
      hyperfocalDistanceM(50, 4, FULL_FRAME),
    );
  });
});

describe("depthOfField", () => {
  it("reaches infinity when focused at the hyperfocal distance", () => {
    const h = hyperfocalDistanceM(50, 8, FULL_FRAME);
    const result = depthOfField(settings({ aperture: 8, focusDistanceM: h + 0.1 }), FULL_FRAME);

    expect(result.farM).toBe(Number.POSITIVE_INFINITY);
  });

  it("brackets the focus distance", () => {
    const result = depthOfField(settings({ aperture: f(5.6), focusDistanceM: 3 }), FULL_FRAME);

    expect(result.nearM).toBeLessThan(3);
    expect(result.farM).toBeGreaterThan(3);
  });

  it("is shallower wide open than stopped down", () => {
    const wide = depthOfField(settings({ aperture: f(1.4) }), FULL_FRAME);
    const narrow = depthOfField(settings({ aperture: f(11) }), FULL_FRAME);

    expect(wide.farM - wide.nearM).toBeLessThan(narrow.farM - narrow.nearM);
  });
});
