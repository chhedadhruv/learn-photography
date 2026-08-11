import { getChallenge, getSceneFor } from "@/lib/challenges/registry";
import { SimulatorLoader } from "@/components/practice/SimulatorLoader";

/**
 * Embeds a practice challenge inside a lesson.
 *
 * Behind a click, not just a dynamic import: an article that nobody interacts with loads zero 3D
 * code and keeps its Lighthouse score, which is the whole reason the renderer was isolated in
 * the first place.
 *
 * An unknown id throws at build time rather than rendering an empty box, so a renamed challenge
 * cannot leave a dead embed in a lesson.
 */
export function LessonSimulator({ challenge: id }: { readonly challenge: string }) {
  const challenge = getChallenge(id);
  if (!challenge) {
    throw new Error(
      `<Simulator challenge="${id}" /> refers to a challenge that does not exist. ` +
        `Check the id, or remove the embed.`,
    );
  }

  const spec = getSceneFor(challenge);

  return (
    <div className="not-prose my-10">
      <SimulatorLoader challenge={challenge} sceneId={spec.id} />
    </div>
  );
}
