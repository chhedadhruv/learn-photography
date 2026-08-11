import { DEPTH_ROW_RIG } from "../../scene/depthRow";

/**
 * Markers receding from the camera, each staggered sideways so the nearer ones do not hide the
 * ones behind, and each labelled by a stack of bands that becomes unreadable as it softens.
 *
 * The bands matter: a plain block just gets blurry, while fine detail visibly dissolves. It is
 * the difference between seeing that something is out of focus and seeing how far out.
 */
export function DepthRowRig() {
  const { markerDistancesM, markerWidthM, markerHeightM, lateralStepM } = DEPTH_ROW_RIG;

  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight position={[3, 5, 2]} intensity={1.7} />

      {/* Ground plane, giving the recession something to sit on. */}
      <mesh position={[0, -0.42, -7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#9a9a9a" roughness={1} />
      </mesh>

      <mesh position={[0, 2, -20]}>
        <planeGeometry args={[60, 24]} />
        <meshStandardMaterial color="#cfcfcf" roughness={1} />
      </mesh>

      {markerDistancesM.map((distance, index) => {
        const x = (index - 1) * lateralStepM;

        return (
          <group key={distance} position={[x, 0, -distance]}>
            <mesh>
              <boxGeometry args={[markerWidthM, markerHeightM, 0.03]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
            </mesh>

            {/* Fine bands: detail that dissolves progressively rather than simply blurring. */}
            {[0.12, 0.04, -0.04, -0.12].map((offsetY) => (
              <mesh key={offsetY} position={[0, offsetY, 0.02]}>
                <boxGeometry args={[markerWidthM * 0.72, 0.022, 0.01]} />
                <meshStandardMaterial color="#242424" roughness={0.9} />
              </mesh>
            ))}

            {/* A tungsten cap on the focused marker's neighbours helps judge relative softness. */}
            <mesh position={[0, markerHeightM / 2 + 0.03, 0]}>
              <boxGeometry args={[markerWidthM, 0.04, 0.03]} />
              <meshStandardMaterial color={index === 1 ? "#e09a2b" : "#6a6a6a"} roughness={0.6} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
