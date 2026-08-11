import { ImageResponse } from "next/og";
import {
  APERTURE_BARREL,
  APERTURE_BLADES,
  APERTURE_OPENING,
} from "@/components/brand/apertureGeometry";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icons must be raster and cannot be transparent — iOS composites them onto a home
 * screen of unknown colour, so the mark gets its own dark ground. Generating the PNG from the
 * shared geometry at build time keeps it in sync with the header mark and `icon.svg`, rather
 * than committing an exported binary that silently goes stale.
 *
 * The mark is inline SVG rather than an `<img>` data URI: Satori rasterises inline SVG itself,
 * whereas a data URI is handed to libvips, whose SVG loader fails in this toolchain even for a
 * bare circle.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#171717",
      }}
    >
      <svg
        width="112"
        height="112"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f0f0f0"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={APERTURE_BARREL.cx} cy={APERTURE_BARREL.cy} r={APERTURE_BARREL.r} />
        <path d={APERTURE_OPENING} />
        {APERTURE_BLADES.map((blade) => (
          <path key={blade} d={blade} />
        ))}
      </svg>
    </div>,
    size,
  );
}
