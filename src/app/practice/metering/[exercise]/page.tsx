import { METERING_EXERCISES, getMeteringExercise } from "@content/challenges/metering";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LazyMetering } from "@/components/practice/LazyModules";

export function generateStaticParams() {
  return METERING_EXERCISES.map((exercise) => ({ exercise: exercise.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/practice/metering/[exercise]">): Promise<Metadata> {
  const { exercise: id } = await params;
  const exercise = getMeteringExercise(id);
  if (!exercise) return {};

  return { title: exercise.title, description: exercise.brief };
}

export default async function MeteringPage({ params }: PageProps<"/practice/metering/[exercise]">) {
  const { exercise: id } = await params;
  const exercise = getMeteringExercise(id);
  if (!exercise) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/practice", label: "Practice" },
          { href: `/practice/metering/${exercise.id}`, label: exercise.title },
        ]}
      />

      <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">{exercise.title}</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
        This time the camera decides the exposure. You decide how it measures the light — which is
        the only way to see a meter being fooled, because in manual you would simply set the right
        exposure and never notice.
      </p>

      <div className="mt-8">
        <LazyMetering exercise={exercise} />
      </div>
    </div>
  );
}
