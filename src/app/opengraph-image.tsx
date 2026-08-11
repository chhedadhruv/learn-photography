import { ImageResponse } from "next/og";
import {
  APERTURE_BARREL,
  APERTURE_BLADES,
  APERTURE_OPENING,
} from "@/components/brand/apertureGeometry";
import { SITE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE.name;

/**
 * The share card for the site as a whole. Per-page cards reuse `OgCard`.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <OgCard title={SITE.name} subtitle="Camera basics, exposure and care for beginners" />,
    size,
  );
}

const ZONES = [
  "#0b0b0b",
  "#171717",
  "#242424",
  "#343434",
  "#4e4e4e",
  "#767676",
  "#a0a0a0",
  "#c4c4c4",
  "#dedede",
  "#f0f0f0",
  "#ffffff",
];

/**
 * A share card carrying the site's own identity: the aperture mark, and the zone ramp along the
 * bottom. Built from the same geometry and the same palette as the site, so a link preview looks
 * like the thing it links to.
 */
export function OgCard({
  title,
  subtitle,
  eyebrow,
}: {
  readonly title: string;
  // Explicitly `| undefined`: with exactOptionalPropertyTypes, forwarding a possibly-absent
  // value is not the same as omitting the prop.
  readonly subtitle?: string | undefined;
  readonly eyebrow?: string | undefined;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // Zone 0. The ramp runs black to white, so on any dark ground its darkest swatch
        // merges with the card — setting the ground to the very end of the scale means one
        // swatch disappears rather than two, and the rest reads as a deliberate ramp.
        background: "#0b0b0b",
        color: "#f0f0f0",
      }}
    >
      {/* Padding lives on the inner rows rather than the container, so the zone ramp can run
          edge to edge. Satori does not honour a negative margin to escape padding. */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "64px 72px 0" }}>
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f0f0f0"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx={APERTURE_BARREL.cx} cy={APERTURE_BARREL.cy} r={APERTURE_BARREL.r} />
          <path d={APERTURE_OPENING} />
          {APERTURE_BLADES.map((blade) => (
            <path key={blade} d={blade} />
          ))}
        </svg>
        <span style={{ fontSize: 30, letterSpacing: -0.5 }}>{SITE.name}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", padding: "0 72px 56px" }}>
        {eyebrow === undefined ? null : (
          <span
            style={{
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#a0a0a0",
              fontFamily: "sans-serif",
              marginBottom: 18,
            }}
          >
            {eyebrow}
          </span>
        )}
        <span style={{ fontSize: 68, lineHeight: 1.1, letterSpacing: -1.5 }}>{title}</span>
        {subtitle === undefined ? null : (
          <span
            style={{
              fontSize: 28,
              color: "#a0a0a0",
              marginTop: 20,
              fontFamily: "sans-serif",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      <div style={{ display: "flex", width: "100%", height: 14 }}>
        {ZONES.map((colour) => (
          <div key={colour} style={{ flex: 1, background: colour }} />
        ))}
      </div>
    </div>
  );
}
