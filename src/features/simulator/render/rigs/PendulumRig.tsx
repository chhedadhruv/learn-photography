import type { RefObject } from "react";
import type { Group } from "three";
import { PENDULUM_RIG, type PendulumRig as RigParams } from "../../scene/pendulum";

/**
 * The rig, in 3D.
 *
 * The backdrop is ruled at a known spacing so the smear has something to be measured against.
 * "Blurred" is a judgement; "smeared across three marks" is an observation, and the second is
 * what teaches a shutter speed.
 */

const RULE_COUNT = 21;

export function PendulumRig({
  armRef,
  rig = PENDULUM_RIG,
}: {
  readonly armRef: RefObject<Group | null>;
  /** Variants push the backdrop further back; the geometry follows the same numbers as the physics. */
  readonly rig?: RigParams;
}) {
  const { lengthM, bobRadiusM, bobDistanceM, backdropDistanceM, ruleSpacingM } = rig;
  const spacing = ruleSpacingM * (backdropDistanceM / 4.5);
  const rules = Array.from({ length: RULE_COUNT }, (_, i) => (i - (RULE_COUNT - 1) / 2) * spacing);

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 4, 2]} intensity={1.6} />

      {/* Backdrop, set back from the subject so aperture has something to throw out of focus. */}
      <mesh position={[0, 0, -backdropDistanceM]}>
        <planeGeometry args={[backdropDistanceM * 2.2, backdropDistanceM * 1.4]} />
        <meshStandardMaterial color="#d9d9d9" roughness={1} />
      </mesh>

      {rules.map((x) => (
        <mesh key={x} position={[x, 0, -backdropDistanceM + 0.01]}>
          <planeGeometry args={[0.012 * (backdropDistanceM / 4.5), backdropDistanceM * 1.3]} />
          <meshStandardMaterial color="#3a3a3a" roughness={1} />
        </mesh>
      ))}

      {/* Pivot sits one arm-length above the bob's rest position. */}
      <group ref={armRef} position={[0, lengthM, -bobDistanceM]}>
        <mesh position={[0, -lengthM / 2, 0]}>
          <cylinderGeometry args={[0.006, 0.006, lengthM, 8]} />
          <meshStandardMaterial color="#8a8a8a" metalness={0.3} roughness={0.6} />
        </mesh>

        <mesh position={[0, -lengthM, 0]}>
          <sphereGeometry args={[bobRadiusM, 32, 24]} />
          <meshStandardMaterial color="#e09a2b" roughness={0.35} metalness={0.1} />
        </mesh>
      </group>

      <mesh position={[0, lengthM, -bobDistanceM]}>
        <boxGeometry args={[0.18, 0.05, 0.05]} />
        <meshStandardMaterial color="#4e4e4e" roughness={0.8} />
      </mesh>
    </>
  );
}
