import { DIM_INTERIOR_RIG } from "../../scene/dimInterior";

/**
 * A still life on a table, lit from one side by a window.
 *
 * Deliberately dark and low in contrast: noise shows in the shadows, so a scene that is mostly
 * shadow is the one where the cost of a high ISO is visible rather than theoretical.
 */
export function DimInteriorRig() {
  const { subjectDistanceM, wallDistanceM, objects } = DIM_INTERIOR_RIG;

  return (
    <>
      {/* Low ambient with a single soft key from the left: window light, not a studio. */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 2, 1]} intensity={1.15} />

      <mesh position={[0, 0, -wallDistanceM]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#5a5550" roughness={1} />
      </mesh>

      <mesh position={[0, -0.2, -subjectDistanceM]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#6b5c4a" roughness={0.85} />
      </mesh>

      {objects.map(([offsetX, height]) => (
        <mesh
          key={`${offsetX.toString()}-${height.toString()}`}
          position={[offsetX, -0.2 + height / 2, -subjectDistanceM]}
        >
          <cylinderGeometry args={[0.055, 0.07, height, 24]} />
          <meshStandardMaterial color="#c9c2b6" roughness={0.55} />
        </mesh>
      ))}

      {/* A bright edge so there is something for highlights to clip against if overexposed. */}
      <mesh position={[-1.1, 0.35, -wallDistanceM + 0.05]}>
        <planeGeometry args={[0.5, 1.4]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff6e6" emissiveIntensity={0.8} />
      </mesh>
    </>
  );
}
