import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LazySandbox } from "@/components/practice/LazyModules";

export const metadata: Metadata = {
  title: "Sandbox",
  description:
    "Free play with a camera: change shutter speed, aperture and ISO across seven scenes and watch the histogram respond. No goals, no score.",
};

export default function SandboxPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/practice", label: "Practice" },
          { href: "/practice/sandbox", label: "Sandbox" },
        ]}
      />

      <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Sandbox</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
        No goal and no score. Turn a dial, watch what happens, and read the histogram as you go — it
        is the instrument that tells you when detail has been lost for good.
      </p>

      <div className="mt-8">
        <LazySandbox initialSceneId="pendulum" />
      </div>
    </div>
  );
}
