import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SimulatorLoader } from "@/components/practice/SimulatorLoader";
import { CHALLENGES, getChallenge, getSceneFor } from "@/lib/challenges/registry";

export function generateStaticParams() {
  return CHALLENGES.map((challenge) => ({ challenge: challenge.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/practice/[challenge]">): Promise<Metadata> {
  const { challenge: id } = await params;
  const challenge = getChallenge(id);
  if (!challenge) return {};

  return { title: challenge.title, description: challenge.brief };
}

export default async function ChallengePage({ params }: PageProps<"/practice/[challenge]">) {
  const { challenge: id } = await params;
  const challenge = getChallenge(id);
  if (!challenge) notFound();

  const { scene, focalLengthMm } = getSceneFor(challenge);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/practice", label: "Practice" },
          { href: `/practice/${challenge.id}`, label: challenge.title },
        ]}
      />

      <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">{challenge.title}</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">{challenge.brief}</p>

      <div className="mt-8">
        {/* The practice page exists to run the simulator, so it loads without a further click. */}
        <SimulatorLoader
          challenge={challenge}
          scene={scene}
          focalLengthMm={focalLengthMm}
          autoStart
        />
      </div>
    </div>
  );
}
