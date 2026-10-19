// The sea, as light sees it. three.js's fog is swapped for one that knows
// where the surface is: anything under it is tinted by the water between it
// and the eye, a colour that darkens with depth, and sunlight fades on things
// the deeper they sit. It works from either side of the surface, so the camera
// can dive straight through it. Things that glow (material.defines.GLOW) keep
// their own light; the sky (NO_HAZE) skips the haze over the land.
import * as THREE from 'three'

const STOPS = 6

// Shared by every material (see the hook at the bottom), so setting them once
// a frame reaches the whole scene. Colours are in the output (sRGB) space, as
// three.js applies fog after converting colour.
export const waterUniforms = {
  // World heights of the colour stops, top to bottom, and the water's colour
  // and how much sunlight is left at each.
  wStopY: { value: new Float32Array(STOPS) },
  wStopC: { value: Array.from({ length: STOPS }, () => new THREE.Vector3()) },
  wLight: { value: new Float32Array(STOPS) },
  // How quickly the water hides things, per unit of distance through it.
  wClarity: { value: 0.02 },
  wViewInverse: { value: new THREE.Matrix4() },
}

THREE.ShaderChunk.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogWorld;
  uniform mat4 wViewInverse;
#endif`

THREE.ShaderChunk.fog_vertex = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWorld = ( wViewInverse * vec4( mvPosition.xyz, 1.0 ) ).xyz;
#endif`

THREE.ShaderChunk.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogWorld;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
  uniform float wStopY[ ${STOPS} ];
  uniform vec3 wStopC[ ${STOPS} ];
  uniform float wLight[ ${STOPS} ];
  uniform float wClarity;
  // The water's colour at a height, and the light left there.
  vec3 waterAt( float y, out float light ) {
    vec3 c = wStopC[ 0 ];
    light = wLight[ 0 ];
    for ( int i = 1; i < ${STOPS}; i ++ ) {
      float f = clamp( ( wStopY[ i - 1 ] - y ) / max( wStopY[ i - 1 ] - wStopY[ i ], 0.001 ), 0.0, 1.0 );
      c = mix( c, wStopC[ i ], f );
      light = mix( light, wLight[ i ], f );
    }
    return c;
  }
#endif`

THREE.ShaderChunk.fog_fragment = /* glsl */ `
#ifdef USE_FOG
  {
    vec3 wRay = vFogWorld - cameraPosition;
    float wDist = length( wRay );
    vec3 wDir = wRay / max( wDist, 0.0001 );
    float wLit;
    #ifndef GLOW
      // Sunlight fades with depth.
      if ( vFogWorld.y < 0.0 ) {
        waterAt( vFogWorld.y, wLit );
        gl_FragColor.rgb *= wLit;
      }
    #endif
    // How much of the line of sight runs through water.
    bool wUnder = cameraPosition.y < 0.0;
    float wWet = wUnder
      ? ( vFogWorld.y > 0.0 ? - cameraPosition.y / max( wDir.y, 0.0001 ) : wDist )
      : ( vFogWorld.y < 0.0 ? - vFogWorld.y / max( - wDir.y, 0.0001 ) : 0.0 );
    wWet = min( wWet, wDist );
    // Under water, the water round the eye (lighter looking up, darker down);
    // from above, the water the thing is sitting in.
    vec3 wWater = waterAt( wUnder ? cameraPosition.y + wDir.y * min( wDist, 14.0 ) : vFogWorld.y * 0.5, wLit );
    gl_FragColor.rgb = mix( gl_FragColor.rgb, wWater, 1.0 - exp( - wWet * wClarity ) );
    #ifndef NO_HAZE
      // The haze over the land and the open sea, seen from above the water.
      if ( ! wUnder ) {
        #ifdef FOG_EXP2
          float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
        #else
          float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
        #endif
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
      }
    #endif
  }
#endif`

// Every material is handed the water's uniforms as it's compiled. The objects
// are shared, not copied, so one update reaches them all.
THREE.Material.prototype.onBeforeCompile = function (shader) {
  Object.assign(shader.uniforms, waterUniforms)
}

// The water's colours from the surface down, by day and by night, as depths
// in the page's world (src/lib/world.ts), and how much light reaches them.
export const WATER_DEPTHS = [100, 170, 250, 340, 420, 500]
const DAY = ['#2b93a6', '#1f7497', '#16507c', '#0d2d52', '#07162c', '#040a16']
const NIGHT = ['#173e60', '#143559', '#0f2a4b', '#0a1d3c', '#06122a', '#040a16']
const LIGHT = [1, 0.96, 0.88, 0.78, 0.68, 0.6]
const NIGHT_LIGHT = [0.64, 0.62, 0.6, 0.56, 0.52, 0.5]

const day = DAY.map((c) => new THREE.Color(c))
const night = NIGHT.map((c) => new THREE.Color(c))
const tmp = new THREE.Color()

// Sets the water for this frame: `heights` are the world heights of the
// stops; `dark` is how far into night it is.
export function setWater(heights: number[], dark: number, camera: THREE.Camera) {
  const u = waterUniforms
  for (let i = 0; i < STOPS; i++) {
    u.wStopY.value[i] = heights[i]
    tmp.copy(day[i]).lerp(night[i], dark)
    // Stored as sRGB, to match the colour the fog is mixed into.
    tmp.convertLinearToSRGB()
    u.wStopC.value[i].set(tmp.r, tmp.g, tmp.b)
    u.wLight.value[i] = THREE.MathUtils.lerp(LIGHT[i], NIGHT_LIGHT[i], dark)
  }
  u.wViewInverse.value.copy(camera.matrixWorld)
  // The water gets murkier the deeper the camera goes.
  u.wClarity.value = 0.02 + 0.016 * THREE.MathUtils.clamp(-camera.position.y / 40, 0, 1)
}

// The water's colour at a stop, for things drawn outside the shaders.
export function waterColor(i: number, dark: number) {
  return day[i].clone().lerp(night[i], dark)
}
