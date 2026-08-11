import { ImageResponse } from "next/og";
import { OgCard } from "@/app/opengraph-image";
import { CHALLENGES, getChallenge } from "@/lib/challenges/registry";
import { SITE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE.name;

export function generateStaticParams() {
  return CHALLENGES.map((challenge) => ({ challenge: challenge.id }));
}

export default async function ChallengeOgImage({
  params,
}: {
  params: Promise<{ challenge: string }>;
}) {
  const { challenge: id } = await params;
  const challenge = getChallenge(id);

  return new ImageResponse(
    <OgCard
      eyebrow={challenge ? `Practice · Level ${challenge.level.toString()}` : "Practice"}
      title={challenge?.title ?? SITE.name}
    />,
    size,
  );
}
