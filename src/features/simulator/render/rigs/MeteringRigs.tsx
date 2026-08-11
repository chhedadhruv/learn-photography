/**
 * Rigs for the two metering scenes.
 *
 * Both are lit to match the luminances the physics declares, so the meter's error is visible in
 * the picture rather than only in the numbers. The backlit figure is deliberately plain — a
 * silhouette against a blazing sky is the shape of the problem, and detail in it would only
 * distract from the fact that there is none.
 */

export function BacklitPortraitRig() {
  return (
    <>
      {/* Almost no fill: the figure is in its own shadow, which is what makes it four stops
          darker than the sky behind it. */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[0, 3, -8]} intensity={0.6} />

      {/* A blown-out sky filling most of the frame. Emissive so it stays bright through the
          exposure gain rather than being lit into brightness. */}
      <mesh position={[0, 1, -40]}>
        <planeGeometry args={[120, 70]} />
        <meshStandardMaterial color="#ffffff" emissive="#fdf7ea" emissiveIntensity={1.6} />
      </mesh>

      <mesh position={[0, -2.2, -12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#4a4a44" roughness={1} />
      </mesh>

      {/* The figure: head, body, and nothing else worth seeing. */}
      <group position={[0, -0.25, -3]}>
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.13, 24, 18]} />
          <meshStandardMaterial color="#4b4139" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.16, 0.44, 8, 20]} />
          <meshStandardMaterial color="#3d3630" roughness={0.95} />
        </mesh>
      </group>
    </>
  );
}

export function SnowFieldRig() {
  return (
    <>
      {/* Bright, flat and even — no bright background to blame, which is the whole point. */}
      <ambientLight intensity={1.9} />
      <directionalLight position={[-4, 6, 3]} intensity={1.5} />

      <mesh position={[0, -0.9, -18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 90]} />
        <meshStandardMaterial color="#f2f2f0" roughness={1} />
      </mesh>

      <mesh position={[0, 6, -60]}>
        <planeGeometry args={[160, 40]} />
        <meshStandardMaterial color="#e8ecef" roughness={1} />
      </mesh>

      {/* Fence posts receding, so there is some detail to lose if the snow is left grey. */}
      {[6, 9, 13, 18, 25].map((distance, index) => (
        <mesh key={distance} position={[(index - 2) * 0.9, -0.45, -distance]}>
          <boxGeometry args={[0.09, 0.9, 0.09]} />
          <meshStandardMaterial color="#6b5f52" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}
