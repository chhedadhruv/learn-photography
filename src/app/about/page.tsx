import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

const CRUMBS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
];

export const metadata: Metadata = buildMetadata({
  title: "About",
  description:
    "What this site is for, who it is for, and how the camera simulator works — including what it deliberately does not model.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <Breadcrumbs crumbs={CRUMBS} />

      <h1 className="mt-6 text-4xl font-semibold">About</h1>

      <div className="prose mt-8">
        <p>
          {SITE.name} teaches the parts of photography that are easiest to explain badly: what a
          camera is actually doing, and why changing one setting forces you to change another.
        </p>

        <h2>Reading is half of it</h2>
        <p>
          You can read about shutter speed and still not know what 1/60 looks like. So alongside the
          lessons there is a camera simulator: you set the controls, press the shutter, and get back
          both a photograph and a critique of what your settings did to it.
        </p>
        <p>
          It works upward one control at a time — shutter speed alone, then aperture, then ISO, then
          pairs, then everything — because that is the order people actually graduate off automatic
          in. <Link href="/practice">The challenges start here</Link>, and there is a{" "}
          <Link href="/practice/sandbox">sandbox</Link> with no scoring for anyone who would rather
          just turn dials.
        </p>

        <h2>How the simulator works</h2>
        <p>
          The photographs are rendered rather than photographed. Each exposure is built by summing
          many instants across the shutter interval, each seen through a different point on the lens
          opening — which is how a real camera makes one, and why motion blur and depth of field
          both fall out of the same process rather than being added afterwards.
        </p>
        <p>
          The grading uses the same numbers. Exposure, circle of confusion and motion blur are
          calculated from the settings and the scene, not measured off the rendered pixels, so the
          critique cannot disagree with the picture and the result is identical on every machine.
        </p>

        <h2>What it deliberately does not model</h2>
        <ul>
          <li>
            <strong>Third stops.</strong> Real cameras step in thirds; this one steps in whole
            stops, because a third of a stop is nearly invisible and teaches the opposite of the
            intended lesson.
          </li>
          <li>
            <strong>Anything but full-frame.</strong> The optics assume a 36×24mm sensor, which is
            what photography writing generally assumes. On a smaller sensor the same numbers behave
            differently — see <Link href="/glossary/crop-factor">crop factor</Link>.
          </li>
          <li>
            <strong>Real scenes.</strong> The scenes are built from simple geometry, not
            photographs. A ruled backdrop makes blur measurable in a way a real one would not.
          </li>
        </ul>

        <h2>Accessibility</h2>
        <p>
          The simulator is a canvas, which is invisible to a screen reader. Every capture therefore
          also publishes a written description of the resulting photograph, and the written critique
          — not the stars — is the primary feedback for everyone. All controls are real form
          elements and work from the keyboard.
        </p>
        <p>
          If something here does not work with the tools you use, that is a fault worth hearing
          about.
        </p>

        <h2>Who made it</h2>
        <p>
          Built by {SITE.author}. It is a companion to a separate portfolio site — there is no
          gallery of photographs here, only the ones the simulator makes.
        </p>
      </div>
    </div>
  );
}
