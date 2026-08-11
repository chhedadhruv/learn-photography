"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraSettings } from "@/lib/sim/types";
import type { SceneSpec } from "../scene/types";
import { AccumulationPipeline } from "./AccumulationPipeline";
import { getRig } from "./rigs";
import { apertureDiameterM, buildSamples, grainAmount } from "./samples";

export type ViewfinderMode = "live" | "capturing" | "captured";

/**
 * A one-off render of some other settings, used to produce the target in match-the-photo and the
 * flawed shot in diagnose-the-mistake. Changing `id` triggers it; the canvas returns to live view
 * on the next frame.
 */
export interface StillRequest {
  readonly id: string;
  readonly settings: CameraSettings;
  readonly deviationStops: number;
  readonly timeSeconds: number;
}

/** Enough to look smooth without stalling a phone for noticeably long. */
const CAPTURE_SAMPLES = 48;
/** The viewfinder shows depth of field but not motion blur, exactly like an optical finder. */
const LIVE_SAMPLES = 6;

interface RenderLoopProps {
  readonly spec: SceneSpec;
  readonly settings: CameraSettings;
  readonly deviationStops: number;
  readonly mode: ViewfinderMode;
  readonly animate: boolean;
  /** Reports the instant the exposure was centred on, so grading follows the same moment. */
  readonly onCaptured: (captureTimeSeconds: number) => void;
  /** Supplied only by the sandbox; sampling costs a GPU stall, so it is opt-in. */
  readonly onHistogram?: ((pixels: Uint8Array) => void) | undefined;
  readonly still?: StillRequest | null | undefined;
  readonly onStill?: ((dataUrl: string) => void) | undefined;
}

/** One sample every N frames: often enough to feel live, rare enough not to stall the GPU. */
const HISTOGRAM_INTERVAL_FRAMES = 8;

function RenderLoop({
  spec,
  settings,
  deviationStops,
  mode,
  animate,
  onCaptured,
  onHistogram,
  still,
  onStill,
}: RenderLoopProps) {
  const { gl, scene, camera, size } = useThree();
  const armRef = useRef<THREE.Group>(null);
  const rig = useMemo(() => getRig(spec.id), [spec.id]);

  const focusTarget = useMemo(
    () => new THREE.Vector3(0, 0, -spec.focusDistanceM),
    [spec.focusDistanceM],
  );

  // Built once and kept for the component's life; resizes go through setSize rather than
  // rebuilding the GPU targets.
  const [pipeline] = useState(() => new AccumulationPipeline(size.width, size.height));

  const state = useRef({ elapsed: 0, captureRequested: false, seed: 0, frame: 0, stillId: "" });

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

    // A still is rendered once and handed back as an image, then the canvas resumes live view.
    if (still && still.id !== state.current.stillId) {
      state.current.stillId = still.id;

      const stillDiameter = apertureDiameterM(
        still.settings.focalLengthMm,
        still.settings.aperture,
      );

      pipeline.render(gl, scene, camera, {
        samples: buildSamples({
          count: CAPTURE_SAMPLES,
          shutterSeconds: still.settings.shutterSeconds,
          apertureDiameterM: stillDiameter,
          includeMotion: spec.animated,
        }),
        setSceneTime: (offset) => {
          rig.setTime(armRef, still.timeSeconds + offset);
        },
        gain: 2 ** still.deviationStops,
        grain: grainAmount(still.settings.iso),
        noiseSeed: 1,
        focusTarget,
      });

      onStill?.(gl.domElement.toDataURL("image/png"));
      return;
    }

    if (mode === "captured" && !state.current.captureRequested) {
      pipeline.present(gl, gain, grain, state.current.seed);
      sampleHistogram();
      return;
    }

    if (state.current.captureRequested) {
      state.current.captureRequested = false;

      // The exposure is centred on the moment the button was pressed, not on a fixed point in
      // the scene's cycle. Anything else makes the shutter button a formality.
      const captureTime = state.current.elapsed;

      pipeline.render(gl, scene, camera, {
        samples: buildSamples({
          count: CAPTURE_SAMPLES,
          shutterSeconds: settings.shutterSeconds,
          apertureDiameterM: diameter,
          includeMotion: spec.animated,
        }),
        setSceneTime: (offset) => {
          rig.setTime(armRef, captureTime + offset);
        },
        gain,
        grain,
        noiseSeed: state.current.seed,
        focusTarget,
      });

      onCaptured(captureTime);
      sampleHistogram();
      return;
    }

    if (animate && spec.animated) state.current.elapsed += delta;

    pipeline.render(gl, scene, camera, {
      samples: buildSamples({
        count: LIVE_SAMPLES,
        shutterSeconds: settings.shutterSeconds,
        apertureDiameterM: diameter,
        includeMotion: false,
      }),
      setSceneTime: () => {
        rig.setTime(armRef, state.current.elapsed);
      },
      gain,
      grain,
      noiseSeed: 0,
      focusTarget,
    });

    sampleHistogram();

    function sampleHistogram() {
      if (!onHistogram) return;
      state.current.frame += 1;
      if (state.current.frame % HISTOGRAM_INTERVAL_FRAMES !== 0) return;

      const pixels = pipeline.readPixels(gl, gain, grain, state.current.seed);
      if (pixels) onHistogram(pixels);
    }
  }, 1);

  const Rig = rig.Component;
  return <Rig armRef={armRef} />;
}

export function Viewfinder(props: RenderLoopProps) {
  // Vertical field of view for this focal length on full-frame: 2·atan(24 / 2f).
  const fov = (2 * Math.atan(24 / (2 * props.settings.focalLengthMm)) * 180) / Math.PI;

  return (
    <Canvas
      // 3:2, the full-frame aspect the optics are modelled for. Any other shape would crop the
      // frame the lesson describes.
      style={{ aspectRatio: "3 / 2", width: "100%" }}
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov, position: [0, 0, 0], near: 0.1, far: 100 }}
      flat
    >
      <RenderLoop {...props} />
    </Canvas>
  );
}
