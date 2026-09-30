import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing'
import { DepthOfFieldEffect, Effect } from 'postprocessing'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Uniform, Vector2 } from 'three'
import { focusPoint } from './focus'

// Ordered (Bayer) dithering into a limited palette, plus salt-and-pepper grain.
// Rendered at low resolution and upscaled with hard pixels, this gives the scene
// a crunchy, hand-made indie-game look instead of a clean WebGL one.
const gritShader = /* glsl */ `
  uniform float levels;
  uniform float speckle;

  float bayer4(vec2 p) {
    ivec2 i = ivec2(mod(p, 4.0));
    int index = i.x + i.y * 4;
    int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
    return float(m[index]) / 16.0;
  }

  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 px = floor(uv * resolution);
    vec3 c = inputColor.rgb;

    // Posterise with a dither pattern so gradients break into visible bands.
    // Mixing in a little hash noise stops the pattern forming visible columns.
    c += (mix(bayer4(px), hash(px + 91.7), 0.4) - 0.5) / levels;
    c = floor(c * levels + 0.5) / levels;

    // Salt-and-pepper grain that holds still and re-rolls every 2 seconds.
    float n = hash(px + floor(time * 0.5) * 17.0);
    if (n > 1.0 - speckle) c *= 0.35;
    else if (n < speckle * 0.6) c = mix(c, vec3(0.97, 0.95, 0.88), 0.55);

    outputColor = vec4(clamp(c, 0.0, 1.0), inputColor.a);
  }
`

class GritEffect extends Effect {
  constructor() {
    super('GritEffect', gritShader, {
      uniforms: new Map([
        ['levels', new Uniform(20)],
        ['speckle', new Uniform(0.022)],
      ]),
    })
  }
}

function Grit() {
  const effect = useMemo(() => new GritEffect(), [])
  return <primitive object={effect} dispose={null} />
}

export default function Effects() {
  const aberration = useMemo(() => new Vector2(0.0018, 0.0012), [])
  const dof = useRef<DepthOfFieldEffect>(null)
  // Follow the camera rig's focus point so focus changes with the scroll position.
  useFrame(() => void dof.current?.target?.copy(focusPoint))
  return (
    <EffectComposer multisampling={0}>
      <DepthOfField ref={dof} target={focusPoint} worldFocusRange={0.45} bokehScale={8} />
      <Bloom intensity={0.7} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
      <ChromaticAberration offset={aberration} radialModulation modulationOffset={0.25} />
      <Vignette offset={0.25} darkness={0.45} />
      <Grit />
    </EffectComposer>
  )
}
