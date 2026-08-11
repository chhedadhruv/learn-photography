import { DIAGNOSE_EXERCISES, getDiagnoseExercise } from "@content/challenges/diagnose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LazyDiagnose } from "@/components/practice/LazyModules";

export function generateStaticParams() {
  return DIAGNOSE_EXERCISES.map((exercise) => ({ exercise: exercise.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/practice/diagnose/[exercise]">): Promise<Metadata> {
  const { exercise: id } = await params;
  const exercise = getDiagnoseExercise(id);
  if (!exercise) return {};

  return {
    title: exercise.title,
    description: `Work out what went wrong with this photograph, then fix it: ${exercise.title.toLowerCase()}`,
  };
}

export default async function DiagnosePage({ params }: PageProps<"/practice/diagnose/[exercise]">) {
  const { exercise: id } = await params;
  const exercise = getDiagnoseExercise(id);
  if (!exercise) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/practice", label: "Practice" },
          { href: `/practice/diagnose/${exercise.id}`, label: exercise.title },
        ]}
      />

      <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">{exercise.title}</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
        Something has gone wrong in this photograph. Work out what, then put it right — knowing
        which control owns a fault is most of knowing how to avoid it.
      </p>

      <div className="mt-8">
        <LazyDiagnose exercise={exercise} />
      </div>
    </div>
  );
}
