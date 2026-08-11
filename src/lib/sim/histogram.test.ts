import { describe, expect, it } from "vitest";
import { DEFAULT_BIN_COUNT, buildHistogram, describeHistogram, readClipping } from "./histogram";

/** Builds an RGBA buffer of `count` pixels, all the same grey. */
const flat = (value: number, count = 100): Uint8Array => {
  const pixels = new Uint8Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    pixels[i * 4] = value;
    pixels[i * 4 + 1] = value;
    pixels[i * 4 + 2] = value;
    pixels[i * 4 + 3] = 255;
  }
  return pixels;
};

describe("buildHistogram", () => {
  it("puts a flat mid-grey in the middle", () => {
    const histogram = buildHistogram(flat(128));
    const peak = histogram.bins.indexOf(Math.max(...histogram.bins));

    expect(peak).toBe(DEFAULT_BIN_COUNT / 2);
    expect(histogram.total).toBe(100);
  });

  it("counts every pixel exactly once", () => {
    const histogram = buildHistogram(flat(60, 250));

    expect(histogram.bins.reduce((sum, bin) => sum + bin, 0)).toBe(250);
  });

  it("weights green most heavily, as human vision does", () => {
    const green = new Uint8Array([0, 255, 0, 255]);
    const blue = new Uint8Array([0, 0, 255, 255]);

    // A naive channel average would call these equally bright.
    expect(buildHistogram(green).meanLuminance).toBeGreaterThan(buildHistogram(blue).meanLuminance);
  });

  it("reports pure white as clipped highlights", () => {
    expect(buildHistogram(flat(255)).clippedHighlights).toBe(1);
    expect(buildHistogram(flat(255)).clippedShadows).toBe(0);
  });

  it("reports pure black as clipped shadows", () => {
    expect(buildHistogram(flat(0)).clippedShadows).toBe(1);
  });

  it("does not call a well-exposed mid-grey clipped at either end", () => {
    const histogram = buildHistogram(flat(128));

    expect(histogram.clippedHighlights).toBe(0);
    expect(histogram.clippedShadows).toBe(0);
  });

  it("handles an empty buffer without dividing by zero", () => {
    const histogram = buildHistogram(new Uint8Array(0));

    expect(histogram.total).toBe(0);
    expect(histogram.meanLuminance).toBe(0);
    expect(histogram.clippedHighlights).toBe(0);
  });
});

describe("readClipping", () => {
  it("ignores a stray clipped pixel, which is a specular highlight not a mistake", () => {
    const pixels = flat(128, 1000);
    // Two pixels of 1000 blown out: a glint off metal, not an exposure error.
    for (const index of [0, 1]) {
      pixels[index * 4] = 255;
      pixels[index * 4 + 1] = 255;
      pixels[index * 4 + 2] = 255;
    }

    expect(readClipping(buildHistogram(pixels)).highlightsLost).toBe(false);
  });

  it("flags widespread highlight clipping and says which way to move", () => {
    const verdict = readClipping(buildHistogram(flat(255)));

    expect(verdict.highlightsLost).toBe(true);
    expect(verdict.message).toContain("less light");
  });

  it("flags crushed shadows and says which way to move", () => {
    const verdict = readClipping(buildHistogram(flat(0)));

    expect(verdict.shadowsLost).toBe(true);
    expect(verdict.message).toContain("more light");
  });

  it("names both ends when the scene exceeds the sensor's range", () => {
    const pixels = new Uint8Array(200 * 4);
    for (let i = 0; i < 100; i += 1) {
      pixels[i * 4] = 255;
      pixels[i * 4 + 1] = 255;
      pixels[i * 4 + 2] = 255;
    }

    const verdict = readClipping(buildHistogram(pixels));
    expect(verdict.highlightsLost).toBe(true);
    expect(verdict.shadowsLost).toBe(true);
  });
});

describe("describeHistogram", () => {
  it("describes a dark frame as dark", () => {
    expect(describeHistogram(buildHistogram(flat(30)))).toContain("mostly dark");
  });

  it("describes a bright frame as bright", () => {
    expect(describeHistogram(buildHistogram(flat(220)))).toContain("mostly bright");
  });

  it("describes a balanced frame as mid-tone", () => {
    expect(describeHistogram(buildHistogram(flat(128)))).toContain("mid-tones");
  });

  it("always includes the clipping verdict", () => {
    expect(describeHistogram(buildHistogram(flat(128)))).toContain("Nothing is clipped");
  });

  it("says so plainly when there is no image", () => {
    expect(describeHistogram(buildHistogram(new Uint8Array(0)))).toBe("No image yet.");
  });
});
