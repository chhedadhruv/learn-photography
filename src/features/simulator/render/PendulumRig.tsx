import type { RefObject } from "react";
import type { Group } from "three";
import { PENDULUM_RIG } from "../scene/pendulum";

/**
 * The rig, in 3D.
 *
 * The backdrop is ruled at a known spacing so the smear has something to be measured against.
 * "Blurred" is a judgement; "smeared across three marks" is an observation, and the second is
 * what teaches a shutter speed.
 */

const RULE_COUNT = 21;

export function PendulumRig({ armRef }: { readonly armRef: RefObject<Group | null> }) {
  const { lengthM, bobRadiusM, bobDistanceM, backdropDistanceM, ruleSpacingM } = PENDULUM_RIG;
  const rules = Array.from(
    { length: RULE_COUNT },
    (_, i) => (i - (RULE_COUNT - 1) / 2) * ruleSpacingM,
  );

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 4, 2]} intensity={1.6} />

      {/* Backdrop, set back from the subject so aperture has something to throw out of focus. */}
      <mesh position={[0, 0, -backdropDistanceM]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#d9d9d9" roughness={1} />
      </mesh>

      {rules.map((x) => (
        <mesh key={x} position={[x, 0, -backdropDistanceM + 0.01]}>
          <planeGeometry args={[0.012, 4.6]} />
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

      <mesh position={[0, PENDULUM_RIG.lengthM, -bobDistanceM]}>
        <boxGeometry args={[0.18, 0.05, 0.05]} />
        <meshStandardMaterial color="#4e4e4e" roughness={0.8} />
      </mesh>
    </>
  );
}
