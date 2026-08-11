import * as THREE from "three";
import type { RenderSample } from "./samples";

/**
 * Renders a photograph the way a camera makes one: by summing many instants across the shutter
 * interval, each seen through a different point on the lens opening.
 *
 * One loop therefore produces both effects. Jittering the sample *in time* gives motion blur —
 * the smear exists because the subject genuinely moved while the shutter was open. Jittering it
 * *across the aperture disc* gives depth of field, because rays through different parts of a
 * wide opening only converge at the focus plane. Neither is a post-process approximation, and
 * both fall out of the same physical setup the rubric already models.
 *
 * Averaging happens in linear light, not in sRGB. Averaging gamma-encoded values would make
 * every blurred region come out too dark, which would misrepresent the exposure the lesson is
 * about.
 */

const BLEND_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/** Running average: each sample is folded in with weight 1/(n+1). */
const BLEND_FRAGMENT = /* glsl */ `
  uniform sampler2D tPrevious;
  uniform sampler2D tSample;
  uniform float uWeight;
  varying vec2 vUv;

  void main() {
    vec4 previous = texture2D(tPrevious, vUv);
    vec4 sampled = texture2D(tSample, vUv);
    gl_FragColor = mix(previous, sampled, uWeight);
  }
`;

/**
 * Exposure, clipping, sensor noise and the conversion to display gamma.
 *
 * Highlights clip rather than merely brightening: an overexposed photograph loses detail
 * permanently, and a simulator that just looked "a bit pale" would teach that overexposure is
 * harmless.
 */
const OUTPUT_FRAGMENT = /* glsl */ `
  uniform sampler2D tMap;
  uniform float uGain;
  uniform float uGrain;
  uniform float uSeed;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec3 colour = texture2D(tMap, vUv).rgb * uGain;

    // Sensor noise is strongest in the shadows, which is where high ISO actually shows.
    float luma = dot(colour, vec3(0.2126, 0.7152, 0.0722));
    float shadowWeight = 1.0 - smoothstep(0.0, 0.6, luma);
    float noise = (hash(vUv * 1024.0 + uSeed) - 0.5) * uGrain * (0.35 + shadowWeight);
    colour += noise;

    colour = clamp(colour, 0.0, 1.0);
    gl_FragColor = vec4(pow(colour, vec3(1.0 / 2.2)), 1.0);
  }
`;

export interface AccumulationRequest {
  readonly samples: readonly RenderSample[];
  /** Places the scene at a given instant. Called once per sample, before it is rendered. */
  readonly setSceneTime: (timeOffsetSeconds: number) => void;
  /** Linear multiplier from the exposure error: 2^stops. */
  readonly gain: number;
  /** Noise amplitude, 0 upward. */
  readonly grain: number;
  /** Fixed per capture so the same settings always produce the same grain. */
  readonly noiseSeed: number;
  /** What the lens is focused on, so lens-shifted samples still converge there. */
  readonly focusTarget: THREE.Vector3;
}

/**
 * The index signature is what `THREE.ShaderMaterial` requires; the named members are what makes
 * the uniforms type-safe at the call sites. Declaring both means neither a cast nor a non-null
 * assertion is needed to set a value.
 */
interface BlendUniforms {
  [uniform: string]: THREE.IUniform;
  tPrevious: THREE.IUniform<THREE.Texture | null>;
  tSample: THREE.IUniform<THREE.Texture | null>;
  uWeight: THREE.IUniform<number>;
}

interface OutputUniforms {
  [uniform: string]: THREE.IUniform;
  tMap: THREE.IUniform<THREE.Texture | null>;
  uGain: THREE.IUniform<number>;
  uGrain: THREE.IUniform<number>;
  uSeed: THREE.IUniform<number>;
}

export class AccumulationPipeline {
  private readonly quadScene = new THREE.Scene();
  private readonly quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: THREE.Mesh;

  private readonly blendMaterial: THREE.ShaderMaterial;
  private readonly outputMaterial: THREE.ShaderMaterial;

  // Held directly rather than reached through `material.uniforms`, whose type is a loose index
  // signature that would force a cast at every use.
  private readonly blendUniforms: BlendUniforms = {
    tPrevious: { value: null },
    tSample: { value: null },
    uWeight: { value: 1 },
  };

  private readonly outputUniforms: OutputUniforms = {
    tMap: { value: null },
    uGain: { value: 1 },
    uGrain: { value: 0 },
    uSeed: { value: 0 },
  };

  private sampleTarget: THREE.WebGLRenderTarget;
  private accumulators: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private front = 0;

  private readonly cameraPosition = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();

  constructor(width: number, height: number) {
    this.sampleTarget = createTarget(width, height);
    this.accumulators = [createTarget(width, height), createTarget(width, height)];

    this.blendMaterial = new THREE.ShaderMaterial({
      vertexShader: BLEND_VERTEX,
      fragmentShader: BLEND_FRAGMENT,
      uniforms: this.blendUniforms,
      depthTest: false,
      depthWrite: false,
    });

    this.outputMaterial = new THREE.ShaderMaterial({
      vertexShader: BLEND_VERTEX,
      fragmentShader: OUTPUT_FRAGMENT,
      uniforms: this.outputUniforms,
      depthTest: false,
      depthWrite: false,
    });

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.blendMaterial);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
  }

  setSize(width: number, height: number): void {
    this.sampleTarget.setSize(width, height);
    this.accumulators[0].setSize(width, height);
    this.accumulators[1].setSize(width, height);
  }

  /** Accumulates every sample, then draws the finished photograph to the canvas. */
  render(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    request: AccumulationRequest,
  ): void {
    const { samples } = request;
    if (samples.length === 0) return;

    this.cameraPosition.copy(camera.position);
    camera.matrixWorld.extractBasis(this.right, this.up, this.forward);

    const previousTarget = renderer.getRenderTarget();

    samples.forEach((sample, index) => {
      request.setSceneTime(sample.timeOffsetSeconds);

      // Shift the eye across the aperture, then re-aim at the focus plane. Points at that
      // distance stay put while everything else swings — which is depth of field.
      camera.position
        .copy(this.cameraPosition)
        .addScaledVector(this.right, sample.lensOffsetXM)
        .addScaledVector(this.up, sample.lensOffsetYM);
      camera.lookAt(request.focusTarget);
      camera.updateMatrixWorld();

      renderer.setRenderTarget(this.sampleTarget);
      renderer.clear();
      renderer.render(scene, camera);

      const source = this.accumulators[this.front];
      const destination = this.accumulators[1 - this.front];
      if (!source || !destination) return;

      this.blendUniforms.tPrevious.value = source.texture;
      this.blendUniforms.tSample.value = this.sampleTarget.texture;
      this.blendUniforms.uWeight.value = 1 / (index + 1);
      this.quad.material = this.blendMaterial;

      renderer.setRenderTarget(destination);
      renderer.render(this.quadScene, this.quadCamera);

      this.front = 1 - this.front;
    });

    camera.position.copy(this.cameraPosition);
    camera.lookAt(request.focusTarget);
    camera.updateMatrixWorld();

    const finished = this.accumulators[this.front];
    if (!finished) return;

    this.outputUniforms.tMap.value = finished.texture;
    this.outputUniforms.uGain.value = request.gain;
    this.outputUniforms.uGrain.value = request.grain;
    this.outputUniforms.uSeed.value = request.noiseSeed;
    this.quad.material = this.outputMaterial;

    renderer.setRenderTarget(previousTarget);
    renderer.render(this.quadScene, this.quadCamera);
  }

  /**
   * Redraws the last accumulated photograph without re-accumulating.
   *
   * After a capture the canvas keeps showing the result, like a camera's review screen. Redoing
   * all 48 samples every frame to display a still image would burn a phone's battery for nothing.
   */
  present(renderer: THREE.WebGLRenderer, gain: number, grain: number, noiseSeed: number): void {
    const finished = this.accumulators[this.front];
    if (!finished) return;

    this.outputUniforms.tMap.value = finished.texture;
    this.outputUniforms.uGain.value = gain;
    this.outputUniforms.uGrain.value = grain;
    this.outputUniforms.uSeed.value = noiseSeed;
    this.quad.material = this.outputMaterial;

    renderer.setRenderTarget(null);
    renderer.render(this.quadScene, this.quadCamera);
  }

  dispose(): void {
    this.sampleTarget.dispose();
    this.accumulators[0].dispose();
    this.accumulators[1].dispose();
    this.blendMaterial.dispose();
    this.outputMaterial.dispose();
    this.quad.geometry.dispose();
  }
}

function createTarget(width: number, height: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(Math.max(1, width), Math.max(1, height), {
    // Half-float keeps highlights above 1.0 so clipping can be simulated rather than baked in
    // by the buffer itself.
    type: THREE.HalfFloatType,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: true,
  });
}
