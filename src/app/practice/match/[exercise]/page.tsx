import { MATCH_EXERCISES, getMatchExercise } from "@content/challenges/match";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LazyMatch } from "@/components/practice/LazyModules";

export function generateStaticParams() {
  return MATCH_EXERCISES.map((exercise) => ({ exercise: exercise.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/practice/match/[exercise]">): Promise<Metadata> {
  const { exercise: id } = await params;
  const exercise = getMatchExercise(id);
  if (!exercise) return {};

  return {
    title: exercise.title,
    description: `Reproduce a photograph by working out the settings that made it: ${exercise.title.toLowerCase()}.`,
  };
}

export default async function MatchPage({ params }: PageProps<"/practice/match/[exercise]">) {
  const { exercise: id } = await params;
  const exercise = getMatchExercise(id);
  if (!exercise) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/practice", label: "Practice" },
          { href: `/practice/match/${exercise.id}`, label: exercise.title },
        ]}
      />

      <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">{exercise.title}</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
        Work out what produced the photograph on the left, and reproduce it. More than one set of
        settings will do — what matters is that the result looks the same.
      </p>

      <div className="mt-8">
        <LazyMatch exercise={exercise} />
      </div>
    </div>
  );
}
