"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraSettings } from "@/lib/sim/types";
import { PENDULUM_RIG, angleAt } from "../scene/pendulum";
import { AccumulationPipeline } from "./AccumulationPipeline";
import { PendulumRig } from "./PendulumRig";
import { apertureDiameterM, buildSamples, grainAmount } from "./samples";

export type ViewfinderMode = "live" | "capturing" | "captured";

/** Enough to look smooth without stalling a phone for noticeably long. */
const CAPTURE_SAMPLES = 48;
/** The viewfinder shows depth of field but not motion blur, exactly like an optical finder. */
const LIVE_SAMPLES = 6;

interface RenderLoopProps {
  readonly settings: CameraSettings;
  readonly deviationStops: number;
  readonly mode: ViewfinderMode;
  readonly animate: boolean;
  readonly onCaptured: () => void;
}

function RenderLoop({ settings, deviationStops, mode, animate, onCaptured }: RenderLoopProps) {
  const { gl, scene, camera, size } = useThree();
  const armRef = useRef<THREE.Group>(null);

  const focusTarget = useMemo(() => new THREE.Vector3(0, 0, -PENDULUM_RIG.bobDistanceM), []);

  // Built once and kept for the component's life; resizes go through setSize rather than
  // rebuilding the GPU targets. A lazy useState initialiser is the sanctioned way to construct
  // an expensive object once — a useMemo keyed on size would rebuild them on every resize, and
  // reading a ref during render is not allowed.
  const [pipeline] = useState(() => new AccumulationPipeline(size.width, size.height));

  const state = useRef({ elapsed: 0, captureRequested: false, seed: 0 });

  useEffect(
    () => () => {
      pipeline.dispose();
    },
    [pipeline],
  );
  useEffect(() => {
    pipeline.setSize(size.width, size.height);
  }, [pipeline, size.height, size.width]);

  useEffect(() => {
    if (mode === "capturing") {
      state.current.captureRequested = true;
      state.current.seed = Math.random() * 1000;
    }
  }, [mode]);

  // Priority ≥ 1 hands rendering over to this callback, so the pipeline controls every draw.
  useFrame((_, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const gain = 2 ** deviationStops;
    const grain = grainAmount(settings.iso);
    const diameter = apertureDiameterM(settings.focalLengthMm, settings.aperture);

    if (mode === "captured" && !state.current.captureRequested) {
      pipeline.present(gl, gain, grain, state.current.seed);
      return;
    }

    if (state.current.captureRequested) {
      state.current.captureRequested = false;

      pipeline.render(gl, scene, camera, {
        // Capture is centred on the bottom of the swing, where the pendulum's speed matches the
        // constant-speed figure the rubric grades against.
        samples: buildSamples({
          count: CAPTURE_SAMPLES,
          shutterSeconds: settings.shutterSeconds,
          apertureDiameterM: diameter,
          includeMotion: true,
        }),
        setSceneTime: (offset) => {
          if (armRef.current) armRef.current.rotation.z = angleAt(PENDULUM_RIG, offset);
        },
        gain,
        grain,
        noiseSeed: state.current.seed,
        focusTarget,
      });

      onCaptured();
      return;
    }

    if (animate) state.current.elapsed += delta;

    pipeline.render(gl, scene, camera, {
      samples: buildSamples({
        count: LIVE_SAMPLES,
        shutterSeconds: settings.shutterSeconds,
        apertureDiameterM: diameter,
        includeMotion: false,
      }),
      setSceneTime: () => {
        if (armRef.current)
          armRef.current.rotation.z = angleAt(PENDULUM_RIG, state.current.elapsed);
      },
      gain,
      grain,
      noiseSeed: 0,
      focusTarget,
    });
  }, 1);

  return <PendulumRig armRef={armRef} />;
}

interface ViewfinderProps extends RenderLoopProps {
  readonly focalLengthMm: number;
}

export function Viewfinder({ focalLengthMm, ...loop }: ViewfinderProps) {
  // Vertical field of view for this focal length on full-frame: 2·atan(24 / 2f).
  const fov = (2 * Math.atan(24 / (2 * focalLengthMm)) * 180) / Math.PI;

  return (
    <Canvas
      // 3:2, the full-frame aspect the optics are modelled for. Any other shape would crop the
      // frame the lesson describes.
      style={{ aspectRatio: "3 / 2", width: "100%" }}
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov, position: [0, 0, 0], near: 0.1, far: 100 }}
      // Rendering is driven entirely by the pipeline's useFrame callback.
      flat
    >
      <RenderLoop {...loop} />
    </Canvas>
  );
}
