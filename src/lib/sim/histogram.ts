/**
 * Luminance histogram and clipping analysis.
 *
 * Pure: it takes pixels and returns numbers, so it can be tested without a GPU. The shape of the
 * curve matters far less than its ends — a histogram exists to warn you that detail has been
 * lost, and lost detail cannot be recovered afterwards.
 */

export interface Histogram {
  /** Counts per bin, dark to bright. */
  readonly bins: readonly number[];
  readonly total: number;
  /** Fraction of the frame at pure white, 0–1. */
  readonly clippedHighlights: number;
  /** Fraction of the frame at pure black, 0–1. */
  readonly clippedShadows: number;
  /** Mean luminance, 0–1. */
  readonly meanLuminance: number;
}

export const DEFAULT_BIN_COUNT = 64;

/** Anything at or above this is white with nothing left in it; likewise below for black. */
const HIGHLIGHT_CLIP = 254;
const SHADOW_CLIP = 1;

export const EMPTY_HISTOGRAM: Histogram = {
  bins: Array.from({ length: DEFAULT_BIN_COUNT }, () => 0),
  total: 0,
  clippedHighlights: 0,
  clippedShadows: 0,
  meanLuminance: 0,
};

/**
 * Rec. 709 luminance weights — green dominates because human vision does. A naive average of the
 * three channels would report a saturated blue as far brighter than it looks.
 */
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** `pixels` is RGBA, 8 bits per channel, as read back from the canvas. */
export function buildHistogram(
  pixels: Uint8Array | Uint8ClampedArray,
  binCount: number = DEFAULT_BIN_COUNT,
): Histogram {
  const bins = Array.from({ length: binCount }, () => 0);
  let clippedHighlights = 0;
  let clippedShadows = 0;
  let sum = 0;
  let total = 0;

  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;

    const value = luminance(r, g, b);
    const bin = Math.min(binCount - 1, Math.floor((value / 256) * binCount));
    bins[bin] = (bins[bin] ?? 0) + 1;

    if (r >= HIGHLIGHT_CLIP && g >= HIGHLIGHT_CLIP && b >= HIGHLIGHT_CLIP) clippedHighlights += 1;
    if (r <= SHADOW_CLIP && g <= SHADOW_CLIP && b <= SHADOW_CLIP) clippedShadows += 1;

    sum += value;
    total += 1;
  }

  return {
    bins,
    total,
    clippedHighlights: total === 0 ? 0 : clippedHighlights / total,
    clippedShadows: total === 0 ? 0 : clippedShadows / total,
    meanLuminance: total === 0 ? 0 : sum / total / 255,
  };
}

/** Below this, a handful of clipped pixels is a specular highlight rather than a mistake. */
const CLIP_CONCERN = 0.005;

export interface ClippingVerdict {
  readonly highlightsLost: boolean;
  readonly shadowsLost: boolean;
  readonly message: string;
}

export function readClipping(histogram: Histogram): ClippingVerdict {
  const highlightsLost = histogram.clippedHighlights > CLIP_CONCERN;
  const shadowsLost = histogram.clippedShadows > CLIP_CONCERN;

  const percent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;

  if (highlightsLost && shadowsLost) {
    return {
      highlightsLost,
      shadowsLost,
      message: `Clipped at both ends — ${percent(histogram.clippedHighlights)} pure white and ${percent(histogram.clippedShadows)} pure black. The scene holds more range than the sensor can.`,
    };
  }
  if (highlightsLost) {
    return {
      highlightsLost,
      shadowsLost,
      message: `${percent(histogram.clippedHighlights)} of the frame is pure white, with no detail left in it. Let in less light.`,
    };
  }
  if (shadowsLost) {
    return {
      highlightsLost,
      shadowsLost,
      message: `${percent(histogram.clippedShadows)} of the frame is pure black, with no detail left in it. Let in more light.`,
    };
  }
  return {
    highlightsLost,
    shadowsLost,
    message: "Nothing is clipped — detail survives throughout.",
  };
}

/**
 * Plain-language reading of the curve, for anyone who cannot see it.
 *
 * A histogram is a picture of a picture, so without this the sandbox would hand screen-reader
 * users an unlabelled chart of an image they also cannot see.
 */
export function describeHistogram(histogram: Histogram): string {
  if (histogram.total === 0) return "No image yet.";

  const tone =
    histogram.meanLuminance < 0.25
      ? "The image is mostly dark tones"
      : histogram.meanLuminance > 0.7
        ? "The image is mostly bright tones"
        : "The image sits mostly in the mid-tones";

  return `${tone}. ${readClipping(histogram).message}`;
}
