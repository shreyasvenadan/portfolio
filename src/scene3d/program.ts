// The scenes behind the program pages (RMIT and the two Apple programs), in
// the island's cel-shaded, ink-outlined style, each with its logo in the
// middle:
//
// - rmit (Melbourne): Swanston Street outside RMIT, Building 22 on the corner
//   with the Green Brain on its roof and RMIT's sign on it, Storey Hall and
//   its annex beside it, trams going by under the wires, students on the
//   footpath, and the city's towers behind.
// - academy (Bali): the Academy's reception, the BINUS University and Apple
//   Developer Academy sign on the wall under a lit cove, the reception desk
//   in front of it, potted palms in the corners, and every now and then
//   students walking across the room.
// - institute (Jakarta): the room on graduation day, two big screens side by
//   side on a light oak wall showing the day's slide, and graduates walking
//   across in front.
//
// On wide screens the sign sits on the left with the page's text on the
// right; on narrow ones it's at the top and the text scrolls up over it.
import * as THREE from 'three'
import { Character, type Cut, type Look as Style } from './character'
import { cloud, palm } from './models'
import { inked, jitter, outlineUniforms, plain, ramp, seeded, toon } from './toon'

export type ProgramScene = { dispose(): void; time(): number }
type Kind = 'academy' | 'institute' | 'rmit'

type Look = { top: string; low: string; hemi: string; ground: string; sun: string; light: number; ambient: number }
const LOOKS: Record<Kind, { day: Look; night: Look }> = {
  rmit: {
    day: { top: '#86b3d6', low: '#ebe4d8', hemi: '#fff6ea', ground: '#8a857c', sun: '#fff3dc', light: 1.45, ambient: 1.3 },
    night: { top: '#0f1433', low: '#3a3f78', hemi: '#8a96d0', ground: '#22283a', sun: '#d8deff', light: 0.8, ambient: 0.75 },
  },
  academy: {
    day: { top: '#f0a865', low: '#fbe2b4', hemi: '#fffaf0', ground: '#c9b89c', sun: '#fff1dc', light: 1.1, ambient: 1.6 },
    night: { top: '#141b40', low: '#3d4a86', hemi: '#f3e6d0', ground: '#6e6458', sun: '#ffe2b8', light: 0.7, ambient: 1.1 },
  },
  institute: {
    day: { top: '#e9e6e0', low: '#f4f2ee', hemi: '#fffaf2', ground: '#8a8580', sun: '#fff4e6', light: 1.0, ambient: 1.6 },
    night: { top: '#141b40', low: '#3d4a86', hemi: '#efe4d2', ground: '#5a5650', sun: '#ffe6c4', light: 0.65, ambient: 1.05 },
  },
}

// Where the camera stands and looks, per scene.
// The Institute's lens is wider, so the wall can stand close behind the
// tables in front and still fit.
const FRAME: Record<Kind, { fov: number; at: THREE.Vector3; look: THREE.Vector3; atNarrow: THREE.Vector3; lookNarrow: THREE.Vector3 }> = {
  rmit: { fov: 30, at: new THREE.Vector3(14.5, 4.5, 46), look: new THREE.Vector3(0.8, 9, -4), atNarrow: new THREE.Vector3(15, 7, 84), lookNarrow: new THREE.Vector3(1, 9.5, -4) },
  academy: { fov: 30, at: new THREE.Vector3(0, 2.5, 15), look: new THREE.Vector3(0, 2.45, -3), atNarrow: new THREE.Vector3(0, 2.6, 26), lookNarrow: new THREE.Vector3(0, 2.2, -3) },
  institute: { fov: 45, at: new THREE.Vector3(0, 1.9, 18.9), look: new THREE.Vector3(0, 2.3, 4.1), atNarrow: new THREE.Vector3(0, 2.1, 32.6), lookNarrow: new THREE.Vector3(0, 2.0, 4.1) },
}

type Animate = (t: number) => void

export function createProgramScene(
  canvas: HTMLCanvasElement,
  { kind, still, night, onReady, from = 0 }: { kind: Kind; still: boolean; night: boolean; onReady?: () => void; from?: number },
): ProgramScene {
  const look = LOOKS[kind][night ? 'night' : 'day']
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  const scene = new THREE.Scene()
  // Haze over the city; the other two are indoors.
  if (kind === 'rmit') scene.fog = new THREE.Fog(look.low, 60, 260)
  const camera = new THREE.PerspectiveCamera(FRAME[kind].fov, 1, 0.5, 1200)
  const animations: Animate[] = []

  // --- sky
  scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 16),
      new THREE.ShaderMaterial({
        uniforms: { top: { value: new THREE.Color(look.top) }, low: { value: new THREE.Color(look.low) } },
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 top;
          uniform vec3 low;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y * 3.2, 0.0, 1.0);
            gl_FragColor = vec4(mix(low, top, pow(h, 0.8)), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    ),
  )
  const disc = new THREE.Mesh(new THREE.CircleGeometry(7, 32), new THREE.MeshBasicMaterial({ color: night ? '#eef0ff' : '#ffe08a', fog: false }))
  disc.position.set(kind === 'academy' ? 40 : -34, night ? 34 : 16, -160)
  scene.add(disc)
  const clouds: THREE.Group[] = []
  for (const [x, y, z, s, seed] of [
    [-30, 17, -110, 2.6, 1],
    [14, 22, -120, 3.2, 2],
    [52, 15, -130, 2.8, 3],
  ]) {
    const c = cloud(seed)
    c.position.set(x, y, z)
    c.scale.setScalar(s)
    c.userData.x = x
    scene.add(c)
    clouds.push(c)
  }
  animations.push((t) => clouds.forEach((c) => (c.position.x = c.userData.x + t * 0.25)))

  // --- light
  scene.add(new THREE.HemisphereLight(look.hemi, look.ground, look.ambient))
  const sun = new THREE.DirectionalLight(look.sun, look.light)
  // Indoors, the light falls from high in front, so things' shadows land
  // behind them; outdoors, the sun's off to one side.
  if (kind === 'rmit') sun.position.set(night ? 4 : -9, night ? 18 : 14, night ? 8 : 8)
  else sun.position.set(-3, 9, 10)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, far: 80 })
  scene.add(sun)

  // --- the scene, with its logo; still scenes redraw when an image arrives
  const redraw = () => still && requestAnimationFrame(tick)
  if (kind === 'academy') academyRoom(scene, night, animations, redraw)
  else if (kind === 'institute') instituteRoom(scene, night, animations)
  else melbourne(scene, night, animations, redraw)

  // --- framing: the sign on the left (or at the top), the text beside (or below)
  const frame = FRAME[kind]
  let size = { w: 0, h: 0 }
  let wide = true
  function resize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h || (w === size.w && h === size.h)) return
    size = { w, h }
    renderer.setSize(w, h, false)
    outlineUniforms.resolution.value.set(w, h)
    wide = w >= 768
    // Drawn as if in the middle of a bigger frame, of which we see the part
    // that puts the sign `fx` across and `fy` down the window.
    const fx = wide ? 0.21 : 0.5
    const fy = wide ? 0.5 : 0.3
    const fullW = 2 * w * (1 - fx)
    const fullH = 2 * h * (1 - fy)
    camera.aspect = fullW / fullH
    camera.setViewOffset(fullW, fullH, fullW - w, fullH - h, w, h)
    camera.updateProjectionMatrix()
  }

  // The cursor, as -0.5..0.5 across and down the window, and the camera's
  // eased follow of it, as on the landing page.
  const pointer = new THREE.Vector2(0, 0)
  const eased = new THREE.Vector2(0, 0)
  const move = (e: PointerEvent) => pointer.set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5)
  window.addEventListener('pointermove', move)

  // --- the loop
  let last = performance.now()
  let t = 0
  let raf = 0
  // Starting part way through (`from` seconds in, where a scene this one is
  // replacing had got to): run everything up to then first, so trams and
  // people are where they were. The timetables are seeded, so they match.
  if (!still)
    for (const step = 0.05; t + step <= Math.min(from, 900); ) {
      t += step
      for (const a of animations) a(t)
    }
  function tick(now: number) {
    resize()
    const dt = still ? 0 : THREE.MathUtils.clamp((now - last) / 1000, 0, 0.05)
    last = now
    t += dt
    // A slow drift of the camera, side to side.
    camera.position.copy(wide ? frame.at : frame.atNarrow)
    camera.position.x += Math.sin(t * 0.12) * 0.6
    camera.position.y += Math.sin(t * 0.09) * 0.15
    // And it swings round a little with the cursor, so the room has depth.
    if (!still) eased.lerp(pointer, 0.04)
    camera.position.x += eased.x * 2.2
    camera.position.y -= eased.y * 0.8
    camera.lookAt(wide ? frame.look : frame.lookNarrow)
    for (const a of animations) a(t)
    renderer.render(scene, camera)
    if (onReady) {
      onReady()
      onReady = undefined
    }
    if (!still) raf = requestAnimationFrame(tick)
  }

  let disposed = false
  renderer
    .compileAsync(scene, camera)
    .catch(() => {})
    .then(() => {
      if (!disposed) raf = requestAnimationFrame(tick)
    })
  const onResize = () => still && requestAnimationFrame(tick)
  window.addEventListener('resize', onResize)

  return {
    // How far into its timeline the scene is, in seconds.
    time: () => t,
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', move)
      renderer.dispose()
    },
  }
}

// How much of the Academy logo image, from the top, is its apple (the
// apple ends at row 93 of 200; the words start at 122).
const APPLE_ROWS = 0.48
// How big the logos are on the reception sign, against filling it.
const LOGO_SCALE = 0.7

// --- The Academy (Bali) ---------------------------------------------------------

// The sign on the reception wall: a long white panel, the BINUS University
// logo on the left, a thin rule, the Apple Developer Academy logo on the
// right. Drawn on a canvas; `onLoad` redraws once the Apple logo arrives.
function academyPanel(onLoad: () => void) {
  const W = 2048
  // 21:9, like the sign in the room.
  const H = Math.round((W * 9) / 21)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const apple = new Image()
  const draw = () => {
    const c = canvas.getContext('2d')!
    c.fillStyle = '#f7f5f0'
    c.fillRect(0, 0, W, H)
    // The logos are laid out on a 960-high panel; centre that on this one.
    c.save()
    c.translate(0, (H - 960) / 2)

    // Each logo is drawn full size, then shrunk about its own centre, so
    // the panel has plenty of white round them.
    const shrink = (x: number, y: number) => {
      c.save()
      c.translate(x, y)
      c.scale(LOGO_SCALE, LOGO_SCALE)
      c.translate(-x, -y)
    }

    // BINUS: crosshair lines with red dot ends, a grey swoosh round an
    // orange ball, pixels trailing off up and right, then the wordmark.
    // Its ink runs from the pixels' top (cy - 168) to UNIVERSITY's baseline
    // (cy + 420), so cy puts the middle of that on the panel's centre line.
    const cx = 560
    const cy = 480 - 126
    const BINUS_FONT = `900 150px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`
    const UNIVERSITY_FONT = `800 104px 'Helvetica Neue', Arial, sans-serif`
    const ACADEMY_FONT = `600 96px 'Helvetica Neue', Arial, sans-serif`
    const half = (font: string, text: string) => {
      c.font = font
      return c.measureText(text).width / 2
    }

    // Lay the sign out so the four gaps are equal: the edge to BINUS, BINUS
    // to the rule, the rule to the Academy logo, and that logo to the edge.
    // BINUS's ink, about the point it shrinks round (cx + 20): the crosshair's
    // end dots or the words, whichever reach further.
    const binusAt = cx + 20
    const binusWord = half(BINUS_FONT, 'BINUS')
    const universityWord = half(UNIVERSITY_FONT, 'UNIVERSITY')
    const binusL = Math.min(cx - 341, binusAt - binusWord, cx + 70 - universityWord) - binusAt
    const binusR = Math.max(cx + 341, binusAt + binusWord, cx + 70 + universityWord) - binusAt
    // The Academy logo is centred on 1640: the apple or the words, whichever
    // is wider.
    const appleW = apple.complete && apple.naturalWidth ? (300 * apple.naturalWidth) / (apple.naturalHeight * APPLE_ROWS) : 0
    const academyHalf = Math.max(appleW / 2, half(ACADEMY_FONT, 'Developer'), half(ACADEMY_FONT, 'Academy'))
    const RULE = 7
    const binusWidth = (binusR - binusL) * LOGO_SCALE
    const academyWidth = academyHalf * 2 * LOGO_SCALE
    const gap = (W - binusWidth - academyWidth - RULE) / 4
    const binusShift = gap - binusL * LOGO_SCALE - binusAt
    const ruleX = gap + binusWidth + gap
    const academyShift = ruleX + RULE + gap + academyHalf * LOGO_SCALE - 1640

    c.save()
    c.translate(binusShift, 0)
    shrink(binusAt, 480)
    c.strokeStyle = '#2a2a2a'
    c.lineWidth = 6
    c.beginPath()
    c.moveTo(cx - 330, cy)
    c.lineTo(cx + 330, cy)
    c.moveTo(cx - 60, cy - 150)
    c.lineTo(cx - 60, cy + 150)
    c.stroke()
    c.fillStyle = '#b3262a'
    for (const [x, y] of [
      [cx - 330, cy],
      [cx + 330, cy],
      [cx - 60, cy - 150],
      [cx - 60, cy + 150],
    ]) {
      c.beginPath()
      c.arc(x, y, 11, 0, Math.PI * 2)
      c.fill()
    }
    c.save()
    c.translate(cx - 70, cy + 10)
    c.rotate(-0.28)
    const swoosh = c.createLinearGradient(-200, 0, 200, 0)
    swoosh.addColorStop(0, '#5d5d5d')
    swoosh.addColorStop(0.5, '#c9c9c9')
    swoosh.addColorStop(1, '#6d6d6d')
    c.strokeStyle = swoosh
    c.lineWidth = 34
    c.beginPath()
    c.ellipse(0, 0, 200, 90, 0, Math.PI * 0.15, Math.PI * 1.75)
    c.stroke()
    c.restore()
    const orange = c.createRadialGradient(cx - 85, cy - 25, 8, cx - 60, cy, 80)
    orange.addColorStop(0, '#ffc66b')
    orange.addColorStop(1, '#d9801f')
    c.fillStyle = orange
    c.beginPath()
    c.arc(cx - 60, cy, 72, 0, Math.PI * 2)
    c.fill()
    for (let i = 0; i < 26; i++) {
      const col = i % 6
      const row = Math.floor(i / 6)
      if ((i * 7) % 5 === 0) continue
      c.fillStyle = i % 3 ? '#8a8a8a' : '#5a5a5a'
      c.fillRect(cx + 40 + col * 30 + row * 24, cy - 40 - row * 32 - col * 6, 22, 22)
    }
    c.textAlign = 'center'
    c.textBaseline = 'alphabetic'
    c.fillStyle = '#111'
    c.font = BINUS_FONT
    c.fillText('BINUS', cx + 20, cy + 300)
    c.fillStyle = '#1f4f86'
    c.font = UNIVERSITY_FONT
    c.fillText('UNIVERSITY', cx + 70, cy + 420)
    c.restore()
    c.restore()

    // Apple Developer Academy: the logo's apple, then the words, set crisp.
    c.save()
    c.translate(academyShift, 0)
    shrink(1640, 480)
    c.textAlign = 'center'
    if (apple.complete && apple.naturalWidth) {
      // The apple is the top 93 of the logo image's 200 rows; take 96.
      const sw = apple.naturalWidth
      const sh = apple.naturalHeight * APPLE_ROWS
      const dh = 300
      const dw = (dh * sw) / sh
      // Darkened to the sign's near-black.
      const ink = document.createElement('canvas')
      ink.width = Math.ceil(dw)
      ink.height = dh
      const ic = ink.getContext('2d')!
      ic.drawImage(apple, 0, 0, sw, sh, 0, 0, dw, dh)
      ic.globalCompositeOperation = 'source-in'
      ic.fillStyle = '#2b2c30'
      ic.fillRect(0, 0, ink.width, dh)
      c.drawImage(ink, 1640 - dw / 2, 215)
    }
    c.fillStyle = '#2b2c30'
    c.font = ACADEMY_FONT
    c.fillText('Developer', 1640, 620)
    c.fillText('Academy', 1640, 730)
    c.restore()
    c.restore()

    // The rule between them.
    c.fillStyle = '#3a3d44'
    c.fillRect(ruleX, 480 - 280 * LOGO_SCALE, RULE, 560 * LOGO_SCALE)
    c.restore()
    texture.needsUpdate = true
  }
  apple.onload = () => {
    draw()
    onLoad()
  }
  apple.src = `${import.meta.env.BASE_URL}apple-developer-academy-logo.png`
  draw()
  return { texture, aspect: W / H }
}

// A soft warm wash of light down the top of the wall from the cove above.
function wash() {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 128
  const c = canvas.getContext('2d')!
  const g = c.createLinearGradient(0, 0, 0, 128)
  g.addColorStop(0, 'rgba(255, 236, 200, 0.95)')
  g.addColorStop(0.35, 'rgba(255, 236, 200, 0.4)')
  g.addColorStop(1, 'rgba(255, 236, 200, 0)')
  c.fillStyle = g
  c.fillRect(0, 0, 4, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// A tiled surface: a base colour with seams round each tile.
function tiles(base: string, seam: string, width: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const c = canvas.getContext('2d')!
  c.fillStyle = base
  c.fillRect(0, 0, 128, 128)
  c.strokeStyle = seam
  c.lineWidth = width
  c.strokeRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

// The apple from the Academy logo, in white, for the back of an iMac.
function appleBadge(onLoad: () => void) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const image = new Image()
  image.onload = () => {
    const c = canvas.getContext('2d')!
    const sh = image.naturalHeight * APPLE_ROWS
    const dw = (128 * image.naturalWidth) / sh
    c.drawImage(image, 0, 0, image.naturalWidth, sh, 64 - dw / 2, 0, dw, 128)
    c.globalCompositeOperation = 'source-in'
    c.fillStyle = '#f7f7f8'
    c.fillRect(0, 0, 128, 128)
    texture.needsUpdate = true
    onLoad()
  }
  image.src = `${import.meta.env.BASE_URL}apple-developer-academy-logo.png`
  return texture
}

// A 24-inch iMac seen from behind: its back with the apple on it, on its
// stand.
function imac(color: string, badge: THREE.Texture) {
  const group = new THREE.Group()
  const body = toon(color)
  const foot = inked(new THREE.BoxGeometry(0.42, 0.025, 0.32), body, 1.5)
  foot.position.y = 0.0125
  group.add(foot)
  const neck = inked(new THREE.BoxGeometry(0.34, 0.36, 0.03), body, 1.5)
  neck.position.set(0, 0.19, 0.06)
  neck.rotation.x = 0.18
  group.add(neck)
  const back = inked(new THREE.BoxGeometry(1.04, 0.66, 0.04), body, 2)
  back.position.set(0, 0.62, 0)
  group.add(back)
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.17), new THREE.MeshBasicMaterial({ map: badge, transparent: true }))
  logo.position.set(0, 0.64, 0.022)
  group.add(logo)
  return group
}

// The Academy's reception: the BINUS and Apple Developer Academy sign on a
// white wall under a lit cove, the reception desk in front of it with two
// iMacs and the receptionist's chair, potted palms in the corners.
function academyRoom(scene: THREE.Scene, night: boolean, animations: Animate[], redraw: () => void) {
  const BACK = -4
  const HALF = 6.5 // half the room's width
  const CEIL = 4.3 // the ceiling
  const COVE = 4.8 // the recess over the back wall the light comes from
  const DEPTH = 40

  // The floor: big stone tiles.
  const floorMap = tiles(night ? '#b7ab98' : '#dcd0bd', night ? '#9d907c' : '#c3b49d', 3)
  floorMap.repeat.set((HALF * 2) / 1.6, DEPTH / 1.6)
  const floor = plain(new THREE.PlaneGeometry(HALF * 2, DEPTH).rotateX(-Math.PI / 2), toon('#ffffff', { map: floorMap }))
  floor.position.z = BACK + DEPTH / 2
  scene.add(floor)

  // The walls, with a dark skirting along their feet.
  const back = plain(new THREE.PlaneGeometry(HALF * 2, COVE), toon('#f2efe9'))
  back.position.set(0, COVE / 2, BACK)
  scene.add(back)
  const skirt = toon('#8a7a66')
  const backSkirt = inked(new THREE.BoxGeometry(HALF * 2, 0.12, 0.03), skirt, 1.5)
  backSkirt.position.set(0, 0.06, BACK + 0.015)
  scene.add(backSkirt)
  // Each side wall has a doorway in it, in line with the band in front of the
  // desk where the students walk: glass double doors standing open, and a
  // short hall beyond, so they come in through one and leave by the other.
  const sideMat = toon('#e9e5dd')
  const D = { z: STUDENT_BAND.mid, w: 2.6, h: 2.6 }
  const doorFrom = D.z - D.w / 2
  const doorTo = D.z + D.w / 2
  const frameMat = toon('#7a6248')
  const glassMat = new THREE.MeshBasicMaterial({ color: night ? '#a9c4cc' : '#d6eef2', transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide })
  const hallWall = toon(night ? '#c9c2b6' : '#efebe3')
  for (const side of [-1, 1]) {
    const piece = (from: number, to: number, bottom: number, top: number) => {
      const wall = plain(new THREE.PlaneGeometry(to - from, top - bottom), sideMat)
      wall.rotation.y = (-side * Math.PI) / 2
      wall.position.set(side * HALF, (bottom + top) / 2, (from + to) / 2)
      scene.add(wall)
    }
    piece(BACK, doorFrom, 0, COVE)
    piece(doorTo, BACK + DEPTH, 0, COVE)
    piece(doorFrom, doorTo, D.h, COVE)
    for (const [from, to] of [
      [BACK, doorFrom],
      [doorTo, BACK + DEPTH],
    ]) {
      const sideSkirt = inked(new THREE.BoxGeometry(0.03, 0.12, to - from), skirt, 1.5)
      sideSkirt.position.set(side * (HALF - 0.015), 0.06, (from + to) / 2)
      scene.add(sideSkirt)
    }
    // The frame: two jambs and a head.
    for (const end of [-1, 1]) {
      const jamb = inked(new THREE.BoxGeometry(0.22, D.h, 0.1), frameMat, 1.5)
      jamb.position.set(side * (HALF + 0.05), D.h / 2, D.z + end * (D.w / 2 + 0.05))
      scene.add(jamb)
    }
    const head = inked(new THREE.BoxGeometry(0.22, 0.1, D.w + 0.2), frameMat, 1.5)
    head.position.set(side * (HALF + 0.05), D.h + 0.05, D.z)
    scene.add(head)
    // The two glass doors, each hinged at its jamb and swung out flat
    // against the hall's walls.
    const LEAF = D.w / 2 - 0.02
    for (const end of [-1, 1]) {
      const door = new THREE.Group()
      const pane = plain(new THREE.PlaneGeometry(LEAF - 0.12, D.h - 0.16), glassMat)
      pane.position.set(LEAF / 2, D.h / 2, 0)
      door.add(pane)
      for (const [w, h, x, y] of [
        [LEAF, 0.07, LEAF / 2, 0.035],
        [LEAF, 0.07, LEAF / 2, D.h - 0.075],
        [0.07, D.h - 0.04, 0.035, D.h / 2],
        [0.07, D.h - 0.04, LEAF - 0.035, D.h / 2],
      ]) {
        const bar = inked(new THREE.BoxGeometry(w, h, 0.05), frameMat, 1.2)
        bar.position.set(x, y, 0)
        door.add(bar)
      }
      const pull = inked(new THREE.BoxGeometry(0.03, 0.5, 0.05), toon('#c9cbce'), 1)
      pull.position.set(LEAF - 0.14, 1.05, 0.05)
      door.add(pull)
      door.position.set(side * (HALF + 0.12), 0, D.z + end * (D.w / 2 - 0.02))
      // Local +x runs from the hinge out to the door's free edge: point it
      // straight out from the room.
      door.rotation.y = side > 0 ? 0 : Math.PI
      door.position.z += end * 0.06
      scene.add(door)
    }
    // The hall beyond: the same floor, pale walls, and the light from outside.
    const HALL = 3.4
    const hallFloor = plain(new THREE.PlaneGeometry(HALL, D.w + 1).rotateX(-Math.PI / 2), toon('#ffffff', { map: floorMap }))
    hallFloor.position.set(side * (HALF + HALL / 2), 0.001, D.z)
    scene.add(hallFloor)
    for (const end of [-1, 1]) {
      const hallSide = plain(new THREE.PlaneGeometry(HALL, COVE), hallWall)
      hallSide.position.set(side * (HALF + HALL / 2), COVE / 2, D.z + end * (D.w / 2 + 0.5))
      hallSide.rotation.y = end > 0 ? Math.PI : 0
      scene.add(hallSide)
    }
    const hallEnd = plain(new THREE.PlaneGeometry(D.w + 1, COVE), hallWall)
    hallEnd.rotation.y = (-side * Math.PI) / 2
    hallEnd.position.set(side * (HALF + HALL), COVE / 2, D.z)
    scene.add(hallEnd)
    const hallCeil = plain(new THREE.PlaneGeometry(HALL, D.w + 1).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: night ? '#b8b1a6' : '#f1eee8' }))
    hallCeil.position.set(side * (HALF + HALL / 2), D.h + 0.4, D.z)
    scene.add(hallCeil)
  }

  // The ceiling: square tiles with downlights set in them, stepping up into
  // a cove over the back wall. Lit by the room's bounce rather than the
  // sun, so it stays pale.
  const ceilMap = tiles('#f1eee8', '#d9d3c9', 3)
  ceilMap.repeat.set((HALF * 2) / 1.2, (DEPTH - 1) / 1.2)
  const ceiling = plain(
    new THREE.PlaneGeometry(HALF * 2, DEPTH - 1).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: ceilMap, color: night ? '#b8b1a6' : '#ffffff' }),
  )
  ceiling.position.set(0, CEIL, BACK + 1 + (DEPTH - 1) / 2)
  scene.add(ceiling)
  const recess = plain(new THREE.PlaneGeometry(HALF * 2, 1).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fff3dc' }))
  recess.position.set(0, COVE, BACK + 0.5)
  scene.add(recess)
  // The lip where the ceiling steps up.
  const lip = inked(new THREE.BoxGeometry(HALF * 2, COVE - CEIL, 0.06), new THREE.MeshBasicMaterial({ color: night ? '#c9c2b6' : '#f4f1eb' }), 2)
  lip.position.set(0, (CEIL + COVE) / 2, BACK + 1)
  lip.castShadow = false
  scene.add(lip)
  const glow = plain(new THREE.PlaneGeometry(HALF * 2, 2.2), new THREE.MeshBasicMaterial({ map: wash(), transparent: true, depthWrite: false }))
  glow.position.set(0, COVE - 1.1, BACK + 0.01)
  scene.add(glow)
  const cove = new THREE.PointLight('#ffe7c4', night ? 9 : 6, 9, 1.4)
  cove.position.set(0, COVE - 0.2, BACK + 0.6)
  scene.add(cove)
  const rim = new THREE.MeshBasicMaterial({ color: '#cfc8bc' })
  const bulb = new THREE.MeshBasicMaterial({ color: '#fffbea' })
  for (const x of [-3.6, 0, 3.6])
    for (const z of [-1.4, 2.6, 6.6, 10.6]) {
      const ring = plain(new THREE.CircleGeometry(0.2, 20).rotateX(Math.PI / 2), rim)
      ring.position.set(x, CEIL - 0.005, z)
      scene.add(ring)
      const light = plain(new THREE.CircleGeometry(0.14, 20).rotateX(Math.PI / 2), bulb)
      light.position.set(x, CEIL - 0.01, z)
      scene.add(light)
    }

  // The sign, standing a little off the wall so it throws a shadow; clear
  // of the ceiling above and the iMacs below.
  const { texture, aspect } = academyPanel(redraw)
  const PW = 3.6
  const PH = PW / aspect
  const PY = 3.05
  const edge = toon('#f7f5f0')
  const face = new THREE.MeshBasicMaterial({ map: texture })
  const panel = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 0.08), [edge, edge, edge, edge, face, edge])
  panel.castShadow = true
  panel.position.set(0, PY, BACK + 0.06)
  scene.add(panel)
  const shadow = plain(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.08 }))
  shadow.position.set(-0.05, PY - 0.07, BACK + 0.01)
  scene.add(shadow)

  // The reception desk: one pale wood all over, a raised counter along its
  // front and a lower work surface behind for the iMacs.
  const desk = new THREE.Group()
  const wood = toon('#dcc6a2')
  const DESK_W = 4.6
  const body = inked(new THREE.BoxGeometry(DESK_W, 1.06, 1.0), wood, 2.5)
  body.position.y = 0.53
  desk.add(body)
  const LEDGE_W = 4.8
  const counter = inked(new THREE.BoxGeometry(LEDGE_W, 0.2, 0.5), wood, 2)
  counter.position.set(0, 1.16, 0.3)
  desk.add(counter)
  // Two silver iMacs facing the receptionists (we see their backs), sunk
  // into the desk so the counter hides their stands. Spaced so the gap
  // between them matches the gap at each end of the counter.
  const badge = appleBadge(redraw)
  const MAC_W = 1.04
  const GAP = (LEDGE_W - 2 * MAC_W) / 3
  // Nudged apart a touch: they sit further back than the counter, so from
  // the camera the gap between them looks narrower than the same gap at the
  // ends.
  const macX = GAP / 2 + MAC_W / 2 + 0.045
  for (const side of [-1, 1]) {
    const mac = imac('#d3d1cc', badge)
    mac.position.set(side * macX, 0.86, -0.15)
    desk.add(mac)
  }
  // A gooseneck microphone between them.
  const black = toon('#1d1f24')
  const micBase = inked(new THREE.CylinderGeometry(0.07, 0.08, 0.04, 12), black, 1.5)
  micBase.position.set(0, 1.08, -0.1)
  desk.add(micBase)
  const neck = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.08, -0.1),
    new THREE.Vector3(0, 1.3, -0.08),
    new THREE.Vector3(0.02, 1.5, 0.02),
    new THREE.Vector3(0.04, 1.58, 0.14),
  ])
  desk.add(inked(new THREE.TubeGeometry(neck, 16, 0.012, 6), black, 1.2))
  const micHead = inked(new THREE.CylinderGeometry(0.025, 0.02, 0.1, 8), black, 1.2)
  micHead.position.set(0.045, 1.6, 0.17)
  micHead.rotation.x = 1.1
  desk.add(micHead)
  // A purple orchid in a white pot at the left end of the counter.
  const orchid = new THREE.Group()
  const pot = inked(new THREE.CylinderGeometry(0.13, 0.1, 0.24, 12), toon('#f4f2ee'), 1.5)
  pot.position.y = 0.12
  orchid.add(pot)
  const stemMat = toon('#4f7a3a')
  for (const [lean, height, seed] of [
    [0.22, 0.75, 0],
    [-0.12, 0.62, 1],
  ]) {
    const stem = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.22, 0),
      new THREE.Vector3(lean * 0.3, 0.22 + height * 0.6, 0.02),
      new THREE.Vector3(lean, 0.22 + height, 0.06),
    ])
    orchid.add(inked(new THREE.TubeGeometry(stem, 10, 0.01, 5), stemMat, 1))
    for (let i = 0; i < 4; i++) {
      const p = stem.getPoint(0.55 + i * 0.15)
      const bloom = inked(new THREE.SphereGeometry(0.06, 8, 6), toon(i % 2 ? '#a0479c' : '#b65bb1'), 1.2)
      bloom.scale.set(1.2, 1, 0.5)
      bloom.position.set(p.x + (i % 2 ? 0.04 : -0.03), p.y - 0.06, p.z + 0.05 + seed * 0.01)
      orchid.add(bloom)
    }
  }
  for (const side of [-1, 1]) {
    const leaf = inked(new THREE.SphereGeometry(0.16, 10, 6), toon('#3f6a32'), 1.2)
    leaf.scale.set(1, 0.18, 0.45)
    leaf.position.set(side * 0.12, 0.26, 0.02)
    leaf.rotation.z = side * -0.3
    orchid.add(leaf)
  }
  orchid.position.set(-2.15, 1.26, 0.3)
  desk.add(orchid)
  desk.position.set(0, 0, BACK + 2.4)
  scene.add(desk)

  // The receptionists' chairs behind it, each straight behind its iMac.
  const mesh = toon('#1d1f24')
  for (const x of [-macX, macX]) {
    const chair = new THREE.Group()
    const backrest = inked(new THREE.CylinderGeometry(0.38, 0.3, 0.8, 20, 1, false), mesh, 2.5)
    backrest.scale.z = 0.25
    backrest.position.y = 1.25
    chair.add(backrest)
    const seat = inked(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 16), mesh, 2)
    seat.position.set(0, 0.75, 0.3)
    chair.add(seat)
    const post = inked(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), toon('#6a6d74'), 1.5)
    post.position.set(0, 0.38, 0.3)
    chair.add(post)
    chair.position.set(x, 0, BACK + 1.1)
    scene.add(chair)
  }

  // Potted palms in the corners, for Bali.
  const crowns: THREE.Group[] = []
  for (const [x, z, h, seed] of [
    [-4.6, BACK + 1.0, 2.6, 1],
    [4.7, BACK + 1.2, 2.9, 2],
  ]) {
    const pot = inked(new THREE.CylinderGeometry(0.42, 0.32, 0.7, 14), toon('#a4673f'), 2)
    pot.position.set(x, 0.35, z)
    scene.add(pot)
    const p = palm(h, 0.25, seed)
    p.group.scale.setScalar(0.55)
    p.group.position.set(x, 0.6, z)
    p.group.rotation.y = x < 0 ? 0.4 : Math.PI - 0.4
    p.nuts.forEach((n) => (n.visible = false))
    scene.add(p.group)
    crowns.push(p.crown)
  }
  // A breeze from the door in the fronds.
  animations.push((t) => crowns.forEach((c, i) => (c.rotation.z = Math.sin(t * 0.7 + i * 2) * 0.04)))

  // A bench along the left wall.
  const bench = inked(new THREE.BoxGeometry(0.6, 0.45, 3), wood, 2)
  bench.position.set(-HALF + 0.35, 0.225, D.z + D.w / 2 + 2.3)
  scene.add(bench)

  // Students coming and going.
  students(scene, animations, HALF)
}

// --- Students crossing the Academy's reception -----------------------------

const SKINS = ['#f1c9a5', '#e8b98f', '#d9a477', '#b97848', '#8d5a35']
const HAIRS: [string, string][] = [
  ['#1b120d', '#33231a'],
  ['#151515', '#2b2b2b'],
  ['#3b2414', '#5a3a22'],
  ['#6b4423', '#8a5a32'],
  ['#a8743f', '#c4904f'],
]
const CUTS: Cut[] = ['curly', 'short', 'long', 'bun', 'buzz']
const TOPS: [string, string][] = [
  ['#e45a3c', '#b8432a'],
  ['#2f62a3', '#234c80'],
  ['#f2c230', '#c99a1c'],
  ['#3c8d5a', '#2c6c44'],
  ['#f6f2ea', '#d9d2c4'],
  ['#8a5bb5', '#6c4593'],
  ['#20242c', '#111418'],
  ['#e98aa6', '#c56a86'],
]
const BOTTOMS = ['#24242a', '#3b4a6b', '#6e6458', '#c9b89c', '#2f3a4f']
const SHOES = ['#1d1d22', '#f4f2ee', '#8a5b3a']

// Where the students walk across the Academy's reception, in front of the
// desk: the doorways in the side walls line up with it.
const STUDENT_BAND = { from: 0.55, to: 2.25, mid: 1.4 }

// The students are built like Shreyas (scene3d/character.ts), each in their
// own style, shrunk to the room.
const STUDENT_SCALE = 0.52

type Student = { me: Character; carrying: boolean }

function student(rand: () => number, tops: [string, string][]): Student {
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const [hair, hairLight] = pick(HAIRS)
  const [top, topDark] = pick(tops)
  const look: Style = {
    skin: pick(SKINS),
    hair,
    hairLight,
    cut: pick(CUTS),
    glasses: rand() < 0.3,
    shirt: rand() < 0.55 ? 'tee' : 'button',
    top,
    topDark,
    bottom: pick(BOTTOMS),
    shoe: pick(SHOES),
    trim: pick(TOPS)[0],
  }
  const me = new Character({ look })
  me.walking = true
  me.focus = 1
  me.root.scale.setScalar(STUDENT_SCALE * (0.94 + rand() * 0.1))
  // Some have a backpack on.
  const carrying = rand() < 0.55
  if (carrying) {
    const pack = inked(new THREE.BoxGeometry(0.72, 0.85, 0.34), toon(pick(TOPS)[1]), 2.5)
    pack.position.set(0, 1.95, -0.5)
    me.hitTarget().add(pack)
    for (const side of [-1, 1]) {
      const strap = inked(new THREE.BoxGeometry(0.08, 0.06, 0.5), toon('#2a2320'), 1.5)
      strap.position.set(side * 0.26, 2.38, -0.15)
      me.hitTarget().add(strap)
    }
  }
  me.root.visible = false
  return { me, carrying }
}

// Every 20 seconds a student (or two together) walks across the room in
// front of the desk, in through the doorway in one side wall and out
// through the other. They start and finish out of sight in the halls beyond.
function students(scene: THREE.Scene, animations: Animate[], half: number) {
  const rand = seeded(31)
  const pool = Array.from({ length: 8 }, () => student(rand, TOPS))
  pool.forEach((s) => scene.add(s.me.root))
  type Walk = { s: Student; dir: number; speed: number; x: number; z: number }
  const walking: Walk[] = []
  const START = half + 2.6
  const ahead = { x: 0, y: 0.1, near: 0 }
  let next = 1.5
  let prev = 0

  const send = (dir: number, z: number, stride: number, lag: number) => {
    const s = pool.find((p) => !p.me.root.visible)
    if (!s) return
    s.me.root.visible = true
    s.me.root.rotation.y = (dir * Math.PI) / 2
    s.me.stride = stride
    // Their feet keep pace with the floor.
    walking.push({ s, dir, speed: stride * 1.7, x: -dir * (START + lag), z })
  }

  animations.push((t) => {
    const dt = t - prev
    prev = t
    if (t >= next) {
      const dir = rand() < 0.5 ? 1 : -1
      // A band just in front of the desk, so they don't block the view of it.
      const { from, to, mid } = STUDENT_BAND
      const z = from + rand() * (to - from)
      const stride = 0.45 + rand() * 0.12
      send(dir, z, stride, 0)
      // Sometimes a friend walks with them, a little behind and to the side
      // with more room (still inside the doorway).
      if (rand() < 0.3) send(dir, z + (z < mid ? 0.5 : -0.5), stride, 0.7)
      next = t + 20
    }
    for (let i = walking.length - 1; i >= 0; i--) {
      const w = walking[i]
      w.x += w.dir * w.speed * dt
      w.s.me.root.position.set(w.x, 0, w.z)
      w.s.me.update(t, ahead, 0, false)
      if (Math.abs(w.x) > START + 1) {
        w.s.me.root.visible = false
        walking.splice(i, 1)
      }
    }
  })
}


// People coming into the Institute's room through the door, `door` (its
// middle, at floor level, in the right-hand wall): they walk in, go and look
// at the screens for a bit, then walk back out the way they came.
function visitors(scene: THREE.Scene, animations: Animate[], door: THREE.Vector3, back: number, tops: [string, string][]) {
  const rand = seeded(31)
  const pool = Array.from({ length: 6 }, () => student(rand, tops))
  pool.forEach((s) => scene.add(s.me.root))
  type Visit = { s: Student; path: THREE.Vector3[]; speed: number; stride: number; wait: number; pausedFor: number }
  const visits: Visit[] = []
  const outside = door.clone().add(new THREE.Vector3(2.2, 0, 0))
  const inside = door.clone().add(new THREE.Vector3(-0.9, 0, 0))
  const ahead = { x: 0, y: 0.1, near: 0 }
  const step = new THREE.Vector3()
  let next = 1.5
  let prev = 0

  // `beside` shifts the whole walk sideways, so a friend walks next to them
  // rather than inside them.
  const send = (spot: THREE.Vector3, lag: number, beside = 0) => {
    const s = pool.find((p) => !p.me.root.visible)
    if (!s) return
    s.me.root.visible = true
    const out = outside.clone().add(new THREE.Vector3(lag, 0, beside))
    const inn = inside.clone().add(new THREE.Vector3(0, 0, beside))
    s.me.root.position.copy(out)
    const stride = 0.45 + rand() * 0.12
    // In through the door, over to the spot, a while looking at the screens,
    // then back out.
    visits.push({ s, path: [out, inn, spot, inn.clone(), out.clone()], speed: stride * 1.7, stride, wait: 2 + rand() * 3, pausedFor: -1 })
  }

  animations.push((t) => {
    const dt = t - prev
    prev = t
    if (t >= next) {
      const spot = new THREE.Vector3(-3.5 + rand() * 6, 0, back + 1.5 + rand() * 1.8)
      send(spot, 0)
      // Sometimes a friend comes too, a little behind, and stands beside them.
      if (rand() < 0.3) send(spot.clone().add(new THREE.Vector3(0.6, 0, 0.45)), 0.8, 0.35)
      next = t + 16
    }
    for (let i = visits.length - 1; i >= 0; i--) {
      const v = visits[i]
      const me = v.s.me
      const pos = me.root.position
      if (v.pausedFor >= 0) {
        // Standing, facing the screens.
        v.pausedFor += dt
        me.stride = 0
        me.root.rotation.y = Math.PI
        if (v.pausedFor >= v.wait) v.pausedFor = -1
      } else {
        step.subVectors(v.path[1], pos)
        const left = step.length()
        const move = v.speed * dt
        me.stride = v.stride
        if (left > 1e-3) me.root.rotation.y = Math.atan2(step.x, step.z)
        if (left <= move) {
          pos.copy(v.path[1])
          v.path.shift()
          // At the spot by the screens (the middle of the walk), stop a while.
          if (v.path.length === 3) v.pausedFor = 0
        } else pos.addScaledVector(step, move / left)
      }
      me.update(t, ahead, 0, false)
      if (v.path.length < 2) {
        me.root.visible = false
        visits.splice(i, 1)
      }
    }
  })
}

// --- The Institute (Jakarta) -------------------------------------------------

// The slide on the two screens at graduation, drawn across both: the
// Institute's name and "Graduation's Day" on each, a big target in the
// middle split by the seam, and part of another at each outer edge.
const SLIDE = { w: 4096, h: 1152 }
const INDIGO = '#2b5fe3'
const SKY = '#8cc0f5'
const NAVY = '#1c2446'

// One target, centred at (x, y) with radius r, turned by `turn` radians.
function target(c: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number) {
  c.save()
  c.translate(x, y)
  c.rotate(turn)
  const disc = (radius: number, color: string) => {
    c.fillStyle = color
    c.beginPath()
    c.arc(0, 0, radius * r, 0, Math.PI * 2)
    c.fill()
  }
  // The thick outer ring, then thin indigo rings on light blue.
  disc(1, INDIGO)
  disc(0.8, SKY)
  for (const ring of [0.74, 0.66, 0.58]) {
    c.strokeStyle = INDIGO
    c.lineWidth = r * 0.032
    c.beginPath()
    c.arc(0, 0, ring * r, 0, Math.PI * 2)
    c.stroke()
  }
  // Wedges over the rings: dotted purple on one side, orange and yellow on
  // the other.
  const wedge = (from: number, to: number, fill: () => void) => {
    c.save()
    c.beginPath()
    c.arc(0, 0, 0.8 * r, from, to)
    c.arc(0, 0, 0.48 * r, to, from, true)
    c.closePath()
    c.clip()
    fill()
    c.restore()
  }
  wedge(Math.PI * 0.82, Math.PI * 1.2, () => {
    c.fillStyle = '#9fb0f6'
    c.fillRect(-r, -r, 2 * r, 2 * r)
    c.fillStyle = '#4f63e6'
    const step = r * 0.045
    for (let i = -r; i < r; i += step)
      for (let j = -r; j < r; j += step) {
        c.beginPath()
        c.arc(i + ((Math.round(j / step) % 2) * step) / 2, j, step * 0.26, 0, Math.PI * 2)
        c.fill()
      }
  })
  wedge(-0.16, 0.02, () => {
    c.fillStyle = '#f46a1f'
    c.fillRect(-r, -r, 2 * r, 2 * r)
  })
  wedge(0.02, 0.62, () => {
    c.fillStyle = '#f7c31e'
    c.fillRect(-r, -r, 2 * r, 2 * r)
  })
  // The bullseye: white, orange, yellow.
  disc(0.47, '#ffffff')
  disc(0.36, '#f46a1f')
  disc(0.19, '#f7c31e')
  c.restore()
}

// The words on one screen, centred on x.
function slideWords(c: CanvasRenderingContext2D, x: number) {
  const SANS = `'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif`
  c.fillStyle = NAVY
  c.textBaseline = 'alphabetic'
  c.font = `700 150px ${SANS}`
  const title = c.measureText("Graduation’s").width
  const left = x - title / 2
  c.textAlign = 'center'
  c.fillText('Graduation’s', x, 610)
  c.fillText('Day', x, 760)
  // The kicker over the title, from its left edge.
  c.textAlign = 'left'
  c.font = `600 40px ${SANS}`
  const bold = 'Apple Developer Institute '
  c.fillText(bold, left + 6, 380)
  const bw = c.measureText(bold).width
  c.font = `400 40px ${SANS}`
  c.fillText('for Entrepreneurship', left + 6 + bw, 380)
  // The time, with a clock.
  const cx = left + title * 0.48
  c.strokeStyle = NAVY
  c.lineWidth = 5
  c.beginPath()
  c.arc(cx, 930, 26, 0, Math.PI * 2)
  c.moveTo(cx, 914)
  c.lineTo(cx, 931)
  c.lineTo(cx + 11, 931)
  c.stroke()
  c.font = `500 38px ${SANS}`
  c.fillText('08:30 - 20:00 WIB', cx + 50, 944)
}

function graduationSlide() {
  const { w: W, h: H } = SLIDE
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')!
  const bg = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.6)
  bg.addColorStop(0, '#e2effb')
  bg.addColorStop(1, '#c9def4')
  c.fillStyle = bg
  c.fillRect(0, 0, W, H)
  target(c, W / 2, H / 2, H * 0.49, 0)
  target(c, -H * 0.22, H * 0.47, H * 0.47, Math.PI * 0.9)
  target(c, W + H * 0.22, H * 0.47, H * 0.47, Math.PI * 0.05)
  slideWords(c, 860)
  slideWords(c, W - 860)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

// Light oak: tall panels with fine seams between them and a little grain.
// Drawn for a surface `width` by `height`; `shade` darkens it (the inside of
// the screens' recess sits in shadow).
function oak(width: number, height: number, night: boolean, shade = 0) {
  const PX = 160 // pixels to a unit
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(4, Math.round(width * PX))
  canvas.height = Math.max(4, Math.round(height * PX))
  const c = canvas.getContext('2d')!
  const rand = seeded(41 + Math.round(width * 10))
  const PANEL = 0.9
  const tones = night ? ['#b49d7c', '#ac9574', '#b9a283'] : ['#dcc3a0', '#d6bd98', '#e0c8a6']
  const panels = Math.ceil(width / PANEL / 2) * 2 + 2
  const x0 = canvas.width / 2 - (panels / 2) * PANEL * PX
  for (let i = 0; i < panels; i++) {
    const x = x0 + i * PANEL * PX
    c.fillStyle = tones[Math.floor(rand() * tones.length)]
    c.fillRect(x, 0, PANEL * PX, canvas.height)
    // Grain: faint streaks down the panel.
    c.globalAlpha = 0.07
    c.fillStyle = '#7a5a36'
    for (let g = 0; g < 16; g++) c.fillRect(x + rand() * PANEL * PX, 0, 1 + rand() * 2, canvas.height)
    c.globalAlpha = 1
    c.fillStyle = night ? '#9a8566' : '#c2a47e'
    c.fillRect(x - 1, 0, 2, canvas.height)
  }
  if (shade) {
    c.fillStyle = `rgba(60, 40, 20, ${shade})`
    c.fillRect(0, 0, canvas.width, canvas.height)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

// Loop-pile carpet: a grey flecked with lighter and darker fibres, and a
// faint seam round each big carpet tile. One texture is one tile.
function carpet(night: boolean) {
  const S = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = S
  const c = canvas.getContext('2d')!
  const rand = seeded(73)
  c.fillStyle = night ? '#6c6d71' : '#9c9da1'
  c.fillRect(0, 0, S, S)
  const flecks = night ? ['#5a5b5f', '#7d7e82', '#4e4f53', '#87888c'] : ['#86878b', '#b3b4b8', '#77787c', '#c2c3c6']
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = flecks[Math.floor(rand() * flecks.length)]
    c.fillRect(rand() * S, rand() * S, 1 + rand() * 1.5, 1 + rand() * 1.5)
  }
  c.strokeStyle = night ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.07)'
  c.lineWidth = 2
  c.strokeRect(0, 0, S, S)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

// The open ceiling: expanded-metal mesh, the ducts dark behind it.
function mesh(night: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const c = canvas.getContext('2d')!
  c.fillStyle = night ? '#55575c' : '#8d9095'
  c.fillRect(0, 0, 64, 64)
  c.strokeStyle = night ? '#8a8c90' : '#c9cbce'
  c.lineWidth = 5
  c.beginPath()
  for (const [x0, y0, x1, y1] of [
    [0, 32, 32, 0],
    [32, 0, 64, 32],
    [64, 32, 32, 64],
    [32, 64, 0, 32],
  ]) {
    c.moveTo(x0, y0)
    c.lineTo(x1, y1)
  }
  c.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

// A big oak table, its top flush with a cable box let into it.
function table(w: number, d: number) {
  const group = new THREE.Group()
  const wood = toon('#d9b98a')
  const top = inked(new THREE.BoxGeometry(w, 0.06, d), wood, 2)
  top.position.y = 0.75
  group.add(top)
  const box = plain(new THREE.PlaneGeometry(0.9, 0.3).rotateX(-Math.PI / 2), toon('#c9a676'))
  box.position.set(0, 0.781, -d * 0.15)
  group.add(box)
  for (const x of [-w / 2 + 0.3, w / 2 - 0.3]) {
    const leg = inked(new THREE.BoxGeometry(0.08, 0.72, d * 0.8), toon('#3a3b40'), 1.5)
    leg.position.set(x, 0.36, 0)
    group.add(leg)
  }
  return group
}

// An office chair facing -z (towards the table): a black mesh back and
// seat on a post, on a five-spoked base.
function officeChair() {
  const chair = new THREE.Group()
  const black = toon('#1d1f24')
  const metal = toon('#6a6d74')
  const seat = inked(new THREE.BoxGeometry(0.5, 0.08, 0.48), black, 2)
  seat.position.y = 0.48
  chair.add(seat)
  const back = inked(new THREE.CylinderGeometry(0.3, 0.26, 0.55, 20, 1, true, -Math.PI / 2, Math.PI), black, 2)
  back.scale.z = 0.35
  back.position.set(0, 0.84, 0.2)
  chair.add(back)
  for (const side of [-1, 1]) {
    const upright = inked(new THREE.BoxGeometry(0.03, 0.4, 0.03), metal, 1.2)
    upright.position.set(side * 0.2, 0.62, 0.24)
    chair.add(upright)
  }
  const post = inked(new THREE.CylinderGeometry(0.03, 0.03, 0.36, 8), metal, 1.2)
  post.position.y = 0.26
  chair.add(post)
  for (let i = 0; i < 5; i++) {
    const spoke = inked(new THREE.BoxGeometry(0.04, 0.03, 0.3), metal, 1.2)
    const a = (i / 5) * Math.PI * 2
    spoke.position.set(Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15)
    spoke.rotation.y = a
    chair.add(spoke)
  }
  return chair
}

// The Institute's room on graduation day: an oak-panelled wall with a tall
// recess in it, two big screens side by side in the recess showing the day's
// slide, a black speaker column either side, a lectern off to the right,
// a white bulkhead along the top of the wall, and an open mesh ceiling with
// lines of light across it. Two oak tables in front, and graduates (mostly
// in the team's black tees) crossing the room now and then.
function instituteRoom(scene: THREE.Scene, night: boolean, animations: Animate[]) {
  const BACK = 4.1 // close behind the tables
  const HALF = 7
  const WALL = 3.75 // where the oak stops and the bulkhead starts
  const CEIL = 4.5
  const DEPTH = 50

  // The screens, and the recess they sit in.
  const SCREEN_W = 3.6
  const SCREEN_H = (SCREEN_W * SLIDE.h) / (SLIDE.w / 2)
  const SCREEN_Y = 1.25 // the screens' bottom edge
  const SEAM = 0.05
  const NICHE_HALF = SCREEN_W + 0.7
  const NICHE_TOP = SCREEN_Y + SCREEN_H + 0.25
  const NICHE_DEEP = 0.3
  const RECESS = BACK - NICHE_DEEP

  // The floor: grey carpet, in tiles a metre across.
  const floorMap = carpet(night)
  floorMap.repeat.set(HALF * 2, DEPTH)
  const floor = plain(new THREE.PlaneGeometry(HALF * 2, DEPTH).rotateX(-Math.PI / 2), toon('#ffffff', { map: floorMap }))
  floor.position.z = BACK + DEPTH / 2 - NICHE_DEEP
  scene.add(floor)

  // The back wall, built round the recess: either side of it, and over it.
  const oakPlane = (w: number, h: number, x: number, y: number, z: number, shade = 0) => {
    const p = plain(new THREE.PlaneGeometry(w, h), toon('#ffffff', { map: oak(w, h, night, shade) }))
    p.position.set(x, y, z)
    scene.add(p)
    return p
  }
  const sideW = HALF - NICHE_HALF
  for (const side of [-1, 1]) oakPlane(sideW, WALL, side * (NICHE_HALF + sideW / 2), WALL / 2, BACK)
  oakPlane(NICHE_HALF * 2, WALL - NICHE_TOP, 0, (NICHE_TOP + WALL) / 2, BACK)
  // The recess: its back in shadow, oak sides and top round it.
  oakPlane(NICHE_HALF * 2, NICHE_TOP, 0, NICHE_TOP / 2, RECESS, 0.12)
  for (const side of [-1, 1]) {
    const jamb = oakPlane(NICHE_DEEP, NICHE_TOP, side * NICHE_HALF, NICHE_TOP / 2, BACK - NICHE_DEEP / 2)
    jamb.rotation.y = (-side * Math.PI) / 2
  }
  const head = oakPlane(NICHE_HALF * 2, NICHE_DEEP, 0, NICHE_TOP, BACK - NICHE_DEEP / 2, 0.2)
  head.rotation.x = Math.PI / 2
  // A thin dark line round the recess's mouth, where it meets the wall.
  const edge = new THREE.MeshBasicMaterial({ color: night ? '#6f5d46' : '#a88a64' })
  for (const side of [-1, 1]) {
    const line = plain(new THREE.PlaneGeometry(0.03, NICHE_TOP), edge)
    line.position.set(side * NICHE_HALF, NICHE_TOP / 2, BACK + 0.002)
    scene.add(line)
  }
  const lintel = plain(new THREE.PlaneGeometry(NICHE_HALF * 2, 0.03), edge)
  lintel.position.set(0, NICHE_TOP, BACK + 0.002)
  scene.add(lintel)

  // The skirting, and the side walls.
  const skirt = toon('#5d5248')
  const sideWall = toon(night ? '#c9c4bb' : '#ebe8e2')
  // The side walls go up to the mesh ceiling, which sits a little above CEIL.
  const TOP = CEIL + 0.35
  const hallWall = toon(night ? '#a9a49b' : '#cfc9be')
  for (const side of [-1, 1]) {
    const s = inked(new THREE.BoxGeometry(sideW, 0.08, 0.02), skirt, 1)
    s.position.set(side * (NICHE_HALF + sideW / 2), 0.04, BACK + 0.01)
    scene.add(s)
    if (side < 0) {
      const wall = plain(new THREE.PlaneGeometry(DEPTH, TOP), sideWall)
      wall.rotation.y = Math.PI / 2
      wall.position.set(-HALF, TOP / 2, BACK + DEPTH / 2)
      scene.add(wall)
    }
  }

  // The right-hand wall, with a doorway in it near the back, an oak door
  // swung open into the corridor beyond, and the corridor itself.
  const DOOR_Z = BACK + 2.4
  const DOOR_W = 1.1
  const DOOR_H = 2.3
  const rightWall = (from: number, to: number, bottom: number, top: number) => {
    const piece = plain(new THREE.PlaneGeometry(to - from, top - bottom), sideWall)
    piece.rotation.y = -Math.PI / 2
    piece.position.set(HALF, (bottom + top) / 2, (from + to) / 2)
    scene.add(piece)
  }
  rightWall(BACK, DOOR_Z - DOOR_W / 2, 0, TOP)
  rightWall(DOOR_Z + DOOR_W / 2, BACK + DEPTH, 0, TOP)
  rightWall(DOOR_Z - DOOR_W / 2, DOOR_Z + DOOR_W / 2, DOOR_H, TOP)
  const doorFrame = toon('#3a3b40')
  for (const dz of [-1, 1]) {
    const jamb = inked(new THREE.BoxGeometry(0.2, DOOR_H, 0.06), doorFrame, 1.5)
    jamb.position.set(HALF + 0.05, DOOR_H / 2, DOOR_Z + dz * (DOOR_W / 2 + 0.03))
    scene.add(jamb)
  }
  const doorHead = inked(new THREE.BoxGeometry(0.2, 0.06, DOOR_W + 0.12), doorFrame, 1.5)
  doorHead.position.set(HALF + 0.05, DOOR_H + 0.03, DOOR_Z)
  scene.add(doorHead)
  // The door, hinged at the front edge of the doorway and opened outwards.
  const leaf = inked(new THREE.BoxGeometry(0.05, DOOR_H - 0.04, DOOR_W - 0.04), toon('#d6b78a'), 2)
  leaf.position.set(HALF + 0.1 + (DOOR_W - 0.04) / 2, DOOR_H / 2, DOOR_Z + DOOR_W / 2 - 0.03)
  leaf.rotation.y = Math.PI / 2
  scene.add(leaf)
  const handle = inked(new THREE.BoxGeometry(0.03, 0.03, 0.22), toon('#c9cbce'), 1)
  handle.position.set(HALF + 0.9, 1.05, DOOR_Z + DOOR_W / 2 - 0.1)
  scene.add(handle)
  // The corridor: carpet, pale walls, a light.
  const HALL = 3.2
  const hallFloor = plain(new THREE.PlaneGeometry(HALL, 4).rotateX(-Math.PI / 2), toon('#ffffff', { map: carpet(night) }))
  hallFloor.position.set(HALF + HALL / 2, 0.001, DOOR_Z)
  scene.add(hallFloor)
  const hallEnd = plain(new THREE.PlaneGeometry(4, CEIL), hallWall)
  hallEnd.rotation.y = -Math.PI / 2
  hallEnd.position.set(HALF + HALL, CEIL / 2, DOOR_Z)
  scene.add(hallEnd)
  for (const dz of [-2, 2]) {
    const hallSide = plain(new THREE.PlaneGeometry(HALL, CEIL), hallWall)
    hallSide.position.set(HALF + HALL / 2, CEIL / 2, DOOR_Z + dz)
    if (dz > 0) hallSide.rotation.y = Math.PI
    scene.add(hallSide)
  }
  const hallCeil = plain(new THREE.PlaneGeometry(HALL, 4).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: night ? '#b8b3aa' : '#f1eee8' }))
  hallCeil.position.set(HALF + HALL / 2, CEIL, DOOR_Z)
  scene.add(hallCeil)

  // The white bulkhead along the top of the wall, with a long air vent in it.
  const white = new THREE.MeshBasicMaterial({ color: night ? '#c7c3bc' : '#f3f2ef' })
  const BULK = 0.7
  const bulkhead = inked(new THREE.BoxGeometry(HALF * 2, CEIL + 0.35 - WALL, BULK), white, 2)
  bulkhead.position.set(0, (WALL + CEIL + 0.35) / 2, BACK + BULK / 2)
  bulkhead.castShadow = false
  scene.add(bulkhead)
  const slot = new THREE.MeshBasicMaterial({ color: '#6c6e72' })
  for (const x of [-3.6, 3.6]) {
    const vent = plain(new THREE.PlaneGeometry(3.4, 0.05), slot)
    vent.position.set(x, WALL + 0.22, BACK + BULK + 0.002)
    scene.add(vent)
  }

  // The open ceiling: mesh, with lines of light set in it in a big grid.
  const meshMap = mesh(night)
  meshMap.repeat.set((HALF * 2) / 0.35, DEPTH / 0.35)
  const ceiling = plain(new THREE.PlaneGeometry(HALF * 2, DEPTH).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ map: meshMap }))
  ceiling.position.set(0, CEIL + 0.3, BACK + DEPTH / 2)
  scene.add(ceiling)
  const strip = new THREE.MeshBasicMaterial({ color: '#fdfdfb' })
  const frameMat = new THREE.MeshBasicMaterial({ color: night ? '#9a9890' : '#d8d6d0' })
  for (const x of [-4.2, 0, 4.2]) {
    const along = plain(new THREE.BoxGeometry(0.07, 0.04, DEPTH), strip)
    along.position.set(x, CEIL + 0.27, BACK + DEPTH / 2)
    scene.add(along)
  }
  for (const z of [BACK + BULK + 0.6, BACK + 6.2, BACK + 11.4, BACK + 16.6]) {
    const across = plain(new THREE.BoxGeometry(HALF * 2, 0.04, 0.07), strip)
    across.position.set(0, CEIL + 0.27, z)
    scene.add(across)
    // The grid's frame beside each line.
    const beam = plain(new THREE.BoxGeometry(HALF * 2, 0.1, 0.16), frameMat)
    beam.position.set(0, CEIL + 0.33, z + 0.12)
    scene.add(beam)
  }

  // The two screens in thin black bezels, the slide running across both with
  // the seam between them.
  const bezel = toon('#111215')
  const BEZEL = 0.04
  const cy = SCREEN_Y + SCREEN_H / 2
  for (const side of [-1, 1]) {
    const frame = inked(new THREE.BoxGeometry(SCREEN_W + BEZEL * 2, SCREEN_H + BEZEL * 2, 0.08), bezel, 2)
    frame.position.set(side * (SCREEN_W / 2 + SEAM / 2), cy, RECESS + 0.06)
    scene.add(frame)
  }
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(SCREEN_W * 2 + SEAM, SCREEN_H),
    new THREE.MeshBasicMaterial({ map: graduationSlide(), color: night ? '#f2f2f2' : '#ffffff' }),
  )
  face.position.set(0, cy, RECESS + 0.101)
  scene.add(face)
  const seamBar = plain(new THREE.PlaneGeometry(SEAM + BEZEL, SCREEN_H + BEZEL * 2), new THREE.MeshBasicMaterial({ color: '#111215' }))
  seamBar.position.set(0, cy, RECESS + 0.102)
  scene.add(seamBar)
  // A tall black speaker column either side.
  for (const side of [-1, 1]) {
    const speaker = inked(new THREE.BoxGeometry(0.24, SCREEN_H * 0.95, 0.14), toon('#1a1b1f'), 2)
    speaker.position.set(side * (SCREEN_W + SEAM / 2 + 0.36), cy - 0.02, RECESS + 0.08)
    scene.add(speaker)
  }
  // The screens light the room in front of them a little.
  const glow = new THREE.PointLight('#e2ecff', night ? 6 : 3, 7, 1.4)
  glow.position.set(0, cy, BACK + 1.2)
  scene.add(glow)

  // An oak lectern off to the right, its top rounded over at the front.
  const lectern = new THREE.Group()
  const lecternWood = toon('#d9b98a')
  const stand = inked(new THREE.BoxGeometry(0.75, 1.05, 0.55), lecternWood, 2)
  stand.position.y = 0.525
  lectern.add(stand)
  const lip = inked(new THREE.CylinderGeometry(0.12, 0.12, 0.75, 16, 1, false, 0, Math.PI), lecternWood, 2)
  lip.rotation.z = Math.PI / 2
  lip.position.set(0, 1.05, 0.155)
  lectern.add(lip)
  const slope = inked(new THREE.BoxGeometry(0.75, 0.04, 0.45), lecternWood, 1.5)
  slope.position.set(0, 1.12, -0.06)
  slope.rotation.x = 0.2
  lectern.add(slope)
  lectern.position.set(NICHE_HALF + 0.9, 0, BACK + 0.9)
  lectern.rotation.y = -0.25
  scene.add(lectern)

  // Two big tables in front, end to end.
  for (const side of [-1, 1]) {
    const t = table(3.6, 1.5)
    t.position.set(side * 1.85, 0, 13.6)
    scene.add(t)
  }
  // Chairs pulled up on our side of them, each turned a little.
  const turn = seeded(57)
  for (const x of [-2.6, -0.65, 0.65, 2.6]) {
    const chair = officeChair()
    chair.position.set(x + (turn() - 0.5) * 0.2, 0, 14.8 + turn() * 0.2)
    chair.rotation.y = (turn() - 0.5) * 0.4
    scene.add(chair)
  }

  // Graduates coming in through the door, most in the team's black tees.
  visitors(scene, animations, new THREE.Vector3(HALF, 0, DOOR_Z), BACK, [...Array(5).fill(['#1d1f24', '#111317']), ...TOPS])
}

// --- RMIT (Melbourne) ----------------------------------------------------------

// Facade textures for the city's towers: `wall`, the windows in the day, and
// `lit`, which windows glow after dark.
function facade(base: string, glass: string, seed: number) {
  const rand = seeded(seed)
  const make = () => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    return c
  }
  const wall = make()
  const lit = make()
  const w = wall.getContext('2d')!
  const l = lit.getContext('2d')!
  w.fillStyle = base
  w.fillRect(0, 0, 64, 64)
  l.fillStyle = '#000'
  l.fillRect(0, 0, 64, 64)
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      w.fillStyle = glass
      w.fillRect(x * 16 + 3, y * 16 + 4, 10, 9)
      if (rand() < 0.55) {
        l.fillStyle = rand() < 0.7 ? '#ffd88a' : '#cfe6ff'
        l.fillRect(x * 16 + 3, y * 16 + 4, 10, 9)
      }
    }
  const tex = (canvas: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.magFilter = THREE.NearestFilter
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  }
  return { wall: tex(wall), lit: tex(lit) }
}

const PALETTE: [string, string][] = [
  ['#c9d3dc', '#4d6a86'],
  ['#e6ddcb', '#5a6f84'],
  ['#9fb4c4', '#2f4b66'],
  ['#d7c7b0', '#4a5e74'],
  ['#b8c9c2', '#365a5e'],
  ['#8e959e', '#2c3a4a'],
]

// A tower of offices, its windows lit at night.
function tower(w: number, h: number, d: number, i: number, night: boolean) {
  const [base, glass] = PALETTE[i % PALETTE.length]
  const { wall, lit } = facade(base, glass, i + 3)
  const side = (span: number) => {
    const map = wall.clone()
    map.repeat.set(Math.max(1, Math.round(span / 1.6)), Math.max(1, Math.round(h / 1.6)))
    const extra: THREE.MeshToonMaterialParameters = { map }
    if (night) {
      const glow = lit.clone()
      glow.repeat.copy(map.repeat)
      Object.assign(extra, { emissive: '#ffffff', emissiveMap: glow, emissiveIntensity: 0.9 })
    }
    return new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: ramp, ...extra })
  }
  const roof = toon(night ? '#3a3f55' : '#8f98a3')
  const zSide = side(w)
  const xSide = side(d)
  return inked(new THREE.BoxGeometry(w, h, d), [xSide, xSide, roof, roof, zSide, zSide] as unknown as THREE.Material, 2)
}

// Storey Hall's annex: its facade a tiling of green and purple rhombuses with
// pale joints, after the Penrose tiling on the real one on Swanston Street.
function rhombusFacade(night: boolean, greens = ['#2f9a55', '#3cb06a', '#25804a', '#8cc84b'], purples = ['#6e3596', '#843fae', '#55286f'], mix = 0.55) {
  const S = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = S
  const c = canvas.getContext('2d')!
  const rand = seeded(88)
  c.fillStyle = night ? '#b9b2a2' : '#e9e2d0'
  c.fillRect(0, 0, S, S)
  const W = 64
  const H = 40
  for (let row = -1; row < S / H + 1; row++)
    for (let col = -1; col < S / W + 1; col++) {
      const x = col * W + (row % 2 ? W / 2 : 0)
      const y = row * H
      // Each cell split into two rhombuses, thin and fat, coloured apart.
      const shapes: [number[][], boolean][] = [
        [[[x, y + H / 2], [x + W / 2, y], [x + W, y + H / 2], [x + W / 2, y + H]], true],
        [[[x + W / 2, y], [x + W * 0.75, y + H / 2], [x + W / 2, y + H], [x + W * 0.25, y + H / 2]], false],
      ]
      for (const [pts, fat] of shapes) {
        const set = rand() < mix ? greens : purples
        c.fillStyle = set[Math.floor(rand() * set.length)]
        c.beginPath()
        pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)))
        c.closePath()
        c.fill()
        c.strokeStyle = night ? '#cfc8b8' : '#f4efe2'
        c.lineWidth = fat ? 3 : 2
        c.stroke()
      }
    }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

// Storey Hall itself: sandstone, three storeys of tall arched windows with a
// cornice between each, and a parapet along the top.
function sandstone(night: boolean) {
  const W = 256
  const H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')!
  c.fillStyle = night ? '#b9a682' : '#e3cf9f'
  c.fillRect(0, 0, W, H)
  // Courses of stone.
  c.fillStyle = night ? '#a8956f' : '#d4bf8c'
  for (let y = 0; y < H; y += 16) c.fillRect(0, y, W, 2)
  const glass = night ? '#f1cf86' : '#3a4a5a'
  for (let floor = 0; floor < 3; floor++) {
    const top = 40 + floor * 160
    // Cornice under the floor above.
    c.fillStyle = night ? '#cdb991' : '#efe0b8'
    c.fillRect(0, top - 22, W, 12)
    for (let i = 0; i < 3; i++) {
      const x = 30 + i * 74
      c.fillStyle = night ? '#8c7a56' : '#bca677'
      c.beginPath()
      c.roundRect(x - 6, top - 6, 56, 112, [28, 28, 0, 0])
      c.fill()
      c.fillStyle = glass
      c.beginPath()
      c.roundRect(x, top, 44, 100, [22, 22, 0, 0])
      c.fill()
      c.fillStyle = night ? '#c9a45e' : '#26333f'
      c.fillRect(x + 21, top + 8, 2, 92)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

// The tall black sign that sticks out from Building 22, RMIT's logo running
// up it in white; `onLoad` redraws once the image arrives.
function bladeSign(onLoad: () => void) {
  // The same shape as the sign (1.5 by 4.8), at a good resolution.
  const W = 400
  const H = 1280
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')!
  c.fillStyle = '#121214'
  c.fillRect(0, 0, W, H)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const logo = new Image()
  logo.onload = () => {
    // Turned to read upwards, as on the real one, and fitted inside the
    // sign with a margin all round.
    const aspect = logo.naturalWidth / logo.naturalHeight
    const w = Math.min(H * 0.82, W * 0.72 * aspect)
    const h = w / aspect
    c.save()
    c.translate(W / 2, H / 2)
    c.rotate(-Math.PI / 2)
    c.drawImage(logo, -w / 2, -h / 2, w, h)
    c.restore()
    texture.needsUpdate = true
    onLoad()
  }
  logo.src = `${import.meta.env.BASE_URL}rmit-logo-light.png`
  return texture
}

// Building 22's walls: red brick with cream bands between the floors, cream
// pilasters at the ends, white-framed windows (arched along the top floor)
// over a black shopfront. `w` and `h` in metres, the texture 48px to one.
const BRICK = { ground: 3.4, floors: [3.4, 6.8, 10.2], cornice: 13.2 }
function brickFacade(w: number, h: number, night: boolean, seed: number) {
  const PX = 48
  const W = Math.round(w * PX)
  const H = Math.round(h * PX)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')!
  const rand = seeded(seed)
  const y = (m: number) => H - m * PX
  const cream = night ? '#c9bea6' : '#eee4cc'
  c.fillStyle = night ? '#6e3328' : '#a8452f'
  c.fillRect(0, 0, W, H)
  // Courses of brick.
  c.fillStyle = night ? '#5f2c23' : '#953b28'
  for (let r = 0; r < H; r += 6) c.fillRect(0, r, W, 1)
  // The bays and their windows.
  const bays = Math.max(2, Math.round(w / 2.6))
  const bay = w / bays
  BRICK.floors.forEach((floor, f) => {
    const top = f === 2
    for (let b = 0; b < bays; b++) {
      const cx = (b + 0.5) * bay * PX
      const ww = 1.05 * PX
      const wh = (top ? 2.0 : 2.1) * PX
      const wy = y(floor + 0.7) - wh
      // Sill and lintel in cream.
      c.fillStyle = cream
      c.fillRect(cx - ww / 2 - 6, y(floor + 0.7), ww + 12, 7)
      if (!top) c.fillRect(cx - ww / 2 - 4, wy - 12, ww + 8, 10)
      c.fillStyle = '#f6f3ea'
      c.beginPath()
      c.roundRect(cx - ww / 2 - 4, wy - 4, ww + 8, wh + 4, top ? [ww / 2 + 4, ww / 2 + 4, 0, 0] : 0)
      c.fill()
      c.fillStyle = night ? (rand() < 0.5 ? '#f3d28a' : '#2a3040') : rand() < 0.2 ? '#5d7186' : '#3a4a5a'
      c.beginPath()
      c.roundRect(cx - ww / 2, wy, ww, wh, top ? [ww / 2, ww / 2, 0, 0] : 0)
      c.fill()
      c.fillStyle = '#f6f3ea'
      c.fillRect(cx - 2, wy + (top ? ww / 2 : 0), 4, wh - (top ? ww / 2 : 0))
      c.fillRect(cx - ww / 2, wy + wh * 0.55, ww, 4)
    }
  })
  // Bands under each floor, the cornice, and the coping on the parapet.
  c.fillStyle = cream
  for (const m of BRICK.floors.slice(1)) c.fillRect(0, y(m + 0.1), W, 0.3 * PX)
  c.fillRect(0, y(BRICK.cornice + 0.55), W, 0.55 * PX)
  c.fillRect(0, 0, W, 0.18 * PX)
  // Cream pilasters at the corners, with quoins.
  for (const x of [0, W - 0.45 * PX]) {
    c.fillRect(x, 0, 0.45 * PX, y(BRICK.ground))
  }
  c.fillStyle = night ? '#b3a88f' : '#ddd1b4'
  for (let m = BRICK.ground; m < BRICK.cornice; m += 0.6) {
    c.fillRect(0, y(m + 0.25), 0.45 * PX, 2)
    c.fillRect(W - 0.45 * PX, y(m + 0.25), 0.45 * PX, 2)
  }
  // The black shopfront along the street.
  c.fillStyle = '#17181c'
  c.fillRect(0, y(BRICK.ground), W, BRICK.ground * PX)
  for (let x = 0.4; x < w - 1.2; x += 2.2) {
    c.fillStyle = night ? '#e9c77e' : '#2f4b66'
    c.fillRect(x * PX + 6, y(2.8), 1.9 * PX - 12, 2.6 * PX)
    c.fillStyle = night ? '#f6dc9e' : '#4d6a86'
    c.fillRect(x * PX + 6, y(2.8), 1.9 * PX - 12, 0.3 * PX)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

// The State Library's long front: pale grey stone, rusticated along the
// ground floor, tall windows under little pediments above, pilasters
// between, and a balustrade along the top. `w` and `h` in metres.
function classicalFacade(w: number, h: number, night: boolean) {
  const PX = 32
  const W = Math.round(w * PX)
  const H = Math.round(h * PX)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')!
  const stone = night ? '#a7a294' : '#d8d3c3'
  const shade = night ? '#8f8a7d' : '#c2bca9'
  const light = night ? '#bdb8a9' : '#ece8da'
  const glass = night ? '#f1cf86' : '#3a4a5a'
  c.fillStyle = stone
  c.fillRect(0, 0, W, H)
  const y = (m: number) => H - m * PX
  // Rusticated ground floor.
  c.fillStyle = shade
  for (let m = 0.5; m < 4.4; m += 0.55) c.fillRect(0, y(m), W, 3)
  c.fillStyle = light
  c.fillRect(0, y(4.6), W, 0.3 * PX)
  // A balustrade and cornice on top.
  c.fillRect(0, y(h - 0.6), W, 0.35 * PX)
  c.fillStyle = shade
  for (let x = 6; x < W; x += 14) c.fillRect(x, y(h - 0.15), 5, 0.4 * PX)
  // Bays, leaving the middle clear for the portico.
  const bays = Math.round(w / 2.6)
  const bay = W / bays
  for (let b = 0; b < bays; b++) {
    const cx = (b + 0.5) * bay
    if (Math.abs(cx - W / 2) < 7.5 * PX) continue
    c.fillStyle = shade
    c.fillRect(b * bay, y(h - 0.6), 0.25 * PX, (h - 5.2) * PX)
    // Upper window with its pediment.
    const ww = 1.1 * PX
    c.fillStyle = light
    c.beginPath()
    c.moveTo(cx - ww / 2 - 8, y(9.4))
    c.lineTo(cx, y(10.1))
    c.lineTo(cx + ww / 2 + 8, y(9.4))
    c.closePath()
    c.fill()
    c.fillRect(cx - ww / 2 - 5, y(9.35), ww + 10, (9.35 - 5.6) * PX)
    c.fillStyle = glass
    c.fillRect(cx - ww / 2, y(9.2), ww, 3.4 * PX)
    c.fillStyle = light
    c.fillRect(cx - 2, y(9.2), 4, 3.4 * PX)
    // Ground-floor window, arched.
    c.fillStyle = glass
    c.beginPath()
    c.roundRect(cx - ww / 2, y(3.8), ww, 2.8 * PX, [ww / 2, ww / 2, 0, 0])
    c.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

// A lumpy green blob, for the Green Brain and its canopy.
function blob(r: number, seed: number, night: boolean) {
  const rand = seeded(seed)
  const shades = night ? ['#4f9e58', '#3f8f4c', '#5daa60'] : ['#6ccb6c', '#56b95e', '#83d878']
  return inked(jitter(new THREE.IcosahedronGeometry(r, 3), r * 0.14, seed), toon(shades[Math.floor(rand() * shades.length)]), 2.5)
}

// A Melbourne tram: three white sections with a green band low down, joined
// by dark bellows, a pantograph on the middle one up to the wire, and the
// route on an amber sign at each end. It runs along +x; its middle is x = 0.
function tram(night: boolean) {
  const group = new THREE.Group()
  const white = toon('#f3f2ee')
  const green = toon('#3a9a4c')
  const dark = toon('#1f2a36')
  const grey = toon('#6d727a')
  const WIDTH = 2.6
  const sections = [6.4, 4.2, 6.4]
  const GAP = 0.35
  const total = sections.reduce((a, b) => a + b) + GAP * 2
  let x = -total / 2
  sections.forEach((len, i) => {
    const mid = x + len / 2
    const skirt = inked(new THREE.BoxGeometry(len, 0.35, WIDTH - 0.1), grey, 1.5)
    skirt.position.set(mid, 0.35, 0)
    group.add(skirt)
    const band = inked(new THREE.BoxGeometry(len, 0.75, WIDTH), green, 2)
    band.position.set(mid, 0.9, 0)
    group.add(band)
    const body = inked(new THREE.BoxGeometry(len, 1.9, WIDTH), white, 2)
    body.position.set(mid, 2.22, 0)
    group.add(body)
    // The windows: a dark band down each side, the glass a touch proud.
    const glass = new THREE.Mesh(new THREE.BoxGeometry(len - 0.5, 1.0, WIDTH + 0.04), night ? toon('#f3d690', { emissive: '#6b5420' }) : dark)
    glass.position.set(mid, 2.3, 0)
    group.add(glass)
    for (let p = 1; p < Math.round(len / 1.4); p++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, WIDTH + 0.06), white)
      post.position.set(x + 0.25 + (p * (len - 0.5)) / Math.round(len / 1.4), 2.3, 0)
      group.add(post)
    }
    const roof = inked(new THREE.BoxGeometry(len - 0.2, 0.25, WIDTH - 0.3), toon('#d9dbde'), 1.5)
    roof.position.set(mid, 3.28, 0)
    group.add(roof)
    if (i === 1) {
      // The pantograph: a diamond of arms up to a bar on the wire.
      const arm = toon('#2b2f36')
      for (const [lean, y] of [
        [0.5, 3.75],
        [-0.5, 4.45],
      ]) {
        const a = inked(new THREE.BoxGeometry(0.05, 0.9, 0.05), arm, 1)
        a.position.set(mid, y, 0)
        a.rotation.z = lean
        group.add(a)
      }
      const bar = inked(new THREE.BoxGeometry(0.1, 0.06, 1.2), arm, 1)
      bar.position.set(mid, 4.85, 0)
      group.add(bar)
    }
    x += len
    if (i < 2) {
      const bellows = new THREE.Mesh(new THREE.BoxGeometry(GAP, 2.6, WIDTH - 0.3), dark)
      bellows.position.set(x + GAP / 2, 1.95, 0)
      group.add(bellows)
      x += GAP
    }
  })
  // The cab windows and route signs at each end.
  const route = document.createElement('canvas')
  route.width = 256
  route.height = 48
  const rc = route.getContext('2d')!
  rc.fillStyle = '#16130e'
  rc.fillRect(0, 0, 256, 48)
  rc.fillStyle = '#ffb21c'
  rc.font = `700 34px 'Helvetica Neue', Arial, sans-serif`
  rc.textBaseline = 'middle'
  rc.fillText('1   East Coburg', 14, 26)
  const routeTex = new THREE.CanvasTexture(route)
  routeTex.colorSpace = THREE.SRGBColorSpace
  for (const end of [-1, 1]) {
    const cab = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH - 0.5, 1.1), dark)
    cab.position.set(end * (total / 2 + 0.01), 2.25, 0)
    cab.rotation.y = (end * Math.PI) / 2
    group.add(cab)
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.3), new THREE.MeshBasicMaterial({ map: routeTex }))
    sign.position.set(end * (total / 2 + 0.02), 3.0, 0)
    sign.rotation.y = (end * Math.PI) / 2
    group.add(sign)
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.3), new THREE.MeshBasicMaterial({ color: night ? '#fff1c0' : '#e8e2d4' }))
    for (const z of [-0.9, 0.9]) {
      const l = lamp.clone()
      l.position.set(end * (total / 2 + 0.02), 0.95, z)
      group.add(l)
    }
  }
  group.userData.length = total
  return group
}

// Swanston Street outside RMIT: Building 22 on the corner, Storey Hall's
// annex and Storey Hall beside it, a side street, more of the campus either
// side, tram tracks down the street with the wires over them and a tram
// every so often, students walking along the footpath, and the city's towers
// behind with Eureka's gold crown among them.
function melbourne(scene: THREE.Scene, night: boolean, animations: Animate[], redraw: () => void) {
  const rand = seeded(23)
  const FRONT = -2 // the buildings' fronts
  const ROAD = { from: 3.1, to: 8.7 }
  const TRACKS = [4.7, 7.1]

  // Footpaths and the road, the tram tracks set into it.
  const paving = plain(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), toon(night ? '#5a5a62' : '#bdb6aa'))
  scene.add(paving)
  const road = plain(new THREE.PlaneGeometry(600, ROAD.to - ROAD.from).rotateX(-Math.PI / 2), toon(night ? '#2a2c34' : '#55575f'))
  road.position.set(0, 0.01, (ROAD.from + ROAD.to) / 2)
  scene.add(road)
  // (The near kerb breaks for the side street; see below.)
  for (const [z, from, to] of [
    [ROAD.from, -300, 8.1],
    [ROAD.from, 15.1, 300],
    [ROAD.to, -300, 300],
  ]) {
    const kerb = inked(new THREE.BoxGeometry(to - from, 0.14, 0.22), toon('#d8d2c6'), 1.5)
    kerb.position.set((from + to) / 2, 0.07, z)
    scene.add(kerb)
  }
  const rail = toon('#9a9ca2')
  for (const z of TRACKS) {
    const bed = plain(new THREE.PlaneGeometry(600, 2).rotateX(-Math.PI / 2), toon(night ? '#33353d' : '#64666d'))
    bed.position.set(0, 0.015, z)
    scene.add(bed)
    for (const dz of [-0.72, 0.72]) {
      const r = plain(new THREE.BoxGeometry(600, 0.03, 0.08), rail)
      r.position.set(0, 0.03, z + dz)
      scene.add(r)
    }
  }

  // Building 22 on the corner: red brick and cream, the Green Brain bulging
  // over its roof, a row of green lumps over the shopfront, and the black
  // RMIT sign sticking out from it.
  const B22 = { w: 13, h: 14, d: 12 }
  const front = brickFacade(B22.w, B22.h, night, 5)
  const side = brickFacade(B22.d, B22.h, night, 9)
  const brick = toon(night ? '#6e3328' : '#a8452f')
  const b22 = inked(new THREE.BoxGeometry(B22.w, B22.h, B22.d), [toon('#ffffff', { map: side }), brick, toon('#7a7f88'), brick, toon('#ffffff', { map: front }), brick] as unknown as THREE.Material, 2.5)
  b22.position.set(0, B22.h / 2, FRONT - B22.d / 2)
  scene.add(b22)
  // The Green Brain: lumps piled over the roof, spilling past its edges.
  const brain = new THREE.Group()
  const brand = seeded(41)
  for (let i = 0; i < 34; i++) {
    const r = 1.1 + brand() * 1.2
    const b = blob(r, 100 + i, night)
    const edge = i < 16
    b.position.set(
      (brand() - 0.5) * (B22.w + 1.2),
      B22.h + (edge ? 0.6 : 1.2) + brand() * (edge ? 0.8 : 1.8),
      FRONT - B22.d / 2 + (edge ? B22.d / 2 - 0.2 + brand() * 0.8 : (brand() - 0.5) * B22.d),
    )
    if (edge && i % 3 === 0) b.position.set(B22.w / 2 + 0.2 - brand() * 0.4, b.position.y, FRONT - brand() * B22.d)
    b.scale.set(1.1, 0.8, 1)
    brain.add(b)
  }
  scene.add(brain)
  // The canopy over the shopfront, carried on to the annex.
  for (let i = 0; i < 8; i++) {
    const b = blob(0.6, 300 + i, night)
    b.scale.set(1.7, 0.55, 0.9)
    b.position.set(-B22.w / 2 - 3.2 + i * 1.45, 3.65 + (i % 2) * 0.12, FRONT + 0.55)
    scene.add(b)
  }
  const bladeTex = bladeSign(redraw)
  // On the side wall by the corner, sticking out over the side street with
  // its face to the main street, so it reads straight on.
  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.8, 0.18), [toon('#121214'), toon('#121214'), toon('#121214'), toon('#121214'), new THREE.MeshBasicMaterial({ map: bladeTex }), new THREE.MeshBasicMaterial({ map: bladeTex })])
  blade.castShadow = true
  blade.position.set(B22.w / 2 + 0.75, 9.2, FRONT - 1.6)
  scene.add(blade)

  // Storey Hall's annex to its left: crystals of grey and silver, a little
  // green among them, and the great green bulge of its entrance.
  const ANNEX = { w: 5, h: 12, d: 6 }
  const ANNEX_X = -B22.w / 2 - ANNEX.w / 2 - 0.05
  const tiles = rhombusFacade(night, ['#9aa3a8', '#b9c0c3', '#7f898f', '#d3d8d9'], ['#5fae7c', '#8a9a7a'], 0.85)
  tiles.repeat.set(ANNEX.w / 4, ANNEX.h / 4)
  const plainWall = toon(night ? '#7c8084' : '#b8bec2')
  const annex = inked(new THREE.BoxGeometry(ANNEX.w, ANNEX.h, ANNEX.d), [plainWall, plainWall, toon('#8f98a3'), plainWall, toon('#ffffff', { map: tiles }), plainWall] as unknown as THREE.Material, 2.5)
  annex.position.set(ANNEX_X, ANNEX.h / 2, FRONT - ANNEX.d / 2 - 0.3)
  scene.add(annex)
  const bulge = inked(jitter(new THREE.SphereGeometry(2.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0.25, 7), toon(night ? '#2f8a46' : '#3fbf5a'), 2.5)
  bulge.scale.set(0.95, 1.9, 0.55)
  bulge.position.set(ANNEX_X, 0, FRONT - 0.3)
  scene.add(bulge)

  // Storey Hall to its left, with a parapet and a cornice.
  const HALL = { w: 7, h: 12.5, d: 8 }
  const stone = sandstone(night)
  stone.repeat.set(2, 1)
  stone.wrapS = THREE.RepeatWrapping
  const stoneSide = toon(night ? '#b09e7a' : '#d9c595')
  const hall = inked(new THREE.BoxGeometry(HALL.w, HALL.h, HALL.d), [stoneSide, stoneSide, toon('#8f98a3'), stoneSide, toon('#ffffff', { map: stone }), stoneSide] as unknown as THREE.Material, 2.5)
  const HALL_X = ANNEX_X - (ANNEX.w + HALL.w) / 2 - 0.1
  hall.position.set(HALL_X, HALL.h / 2, FRONT - HALL.d / 2)
  scene.add(hall)
  const cornice = inked(new THREE.BoxGeometry(HALL.w + 0.5, 0.5, 0.6), toon(night ? '#cdb991' : '#efe0b8'), 2)
  cornice.position.set(HALL_X, HALL.h - 0.25, FRONT + 0.1)
  scene.add(cornice)
  // A low gable over the front: a three-sided prism, point up.
  const pediment = inked(new THREE.CylinderGeometry(HALL.w * 0.42, HALL.w * 0.42, 0.6, 3).rotateX(Math.PI / 2).rotateZ(Math.PI), toon(night ? '#cdb991' : '#efe0b8'), 2)
  pediment.scale.set(1, 0.45, 1)
  pediment.position.set(HALL_X, HALL.h + 0.6, FRONT - 0.2)
  scene.add(pediment)

  // The side street round the corner, and another brick building past it.
  const SIDE = { from: B22.w / 2 + 1.6, to: B22.w / 2 + 8.6 }
  const sideRoad = plain(new THREE.PlaneGeometry(SIDE.to - SIDE.from, 120).rotateX(-Math.PI / 2), toon(night ? '#2a2c34' : '#55575f'))
  sideRoad.position.set((SIDE.from + SIDE.to) / 2, 0.012, ROAD.from - 60)
  scene.add(sideRoad)
  for (const x of [SIDE.from, SIDE.to]) {
    const kerb = inked(new THREE.BoxGeometry(0.22, 0.14, 120), toon('#d8d2c6'), 1.5)
    kerb.position.set(x, 0.07, ROAD.from - 60.1)
    scene.add(kerb)
  }
  const inStreet = (x: number) => x > SIDE.from - 0.6 && x < SIDE.to + 0.6

  // Across the side street, the State Library: set back behind its lawn, a
  // portico of six columns under a pediment at the top of the steps, the
  // long stone front either side, and the reading room's green copper dome
  // rising behind.
  const LIB = { x: SIDE.to + 17, front: FRONT - 13, w: 30, h: 12, d: 16 }
  const lawn = plain(new THREE.PlaneGeometry(LIB.w + 4, ROAD.from - 1.4 - LIB.front).rotateX(-Math.PI / 2), toon(night ? '#2f4a30' : '#6fa04f'))
  lawn.position.set(LIB.x, 0.02, (LIB.front + ROAD.from - 1.4) / 2)
  scene.add(lawn)
  const path = plain(new THREE.PlaneGeometry(8, ROAD.from - 1.4 - LIB.front).rotateX(-Math.PI / 2), toon(night ? '#6a665e' : '#d6cfc0'))
  path.position.set(LIB.x, 0.03, lawn.position.z)
  scene.add(path)
  const libFront = classicalFacade(LIB.w, LIB.h, night)
  const stoneMat = toon(night ? '#a7a294' : '#d8d3c3')
  const libRoof = toon(night ? '#4a4e58' : '#8f98a3')
  const library = inked(new THREE.BoxGeometry(LIB.w, LIB.h, LIB.d), [stoneMat, stoneMat, libRoof, stoneMat, toon('#ffffff', { map: libFront }), stoneMat] as unknown as THREE.Material, 2.5)
  library.position.set(LIB.x, LIB.h / 2, LIB.front - LIB.d / 2)
  scene.add(library)
  const paleStone = toon(night ? '#b9b4a5' : '#e9e4d4')
  const PORT = { w: 13, d: 5, base: 1.6, col: 8 }
  const podium = inked(new THREE.BoxGeometry(PORT.w + 1, PORT.base, PORT.d), paleStone, 2)
  podium.position.set(LIB.x, PORT.base / 2, LIB.front + PORT.d / 2)
  scene.add(podium)
  for (let k = 0; k < 3; k++) {
    const step = inked(new THREE.BoxGeometry(PORT.w - 2, PORT.base * (1 - (k + 1) / 4), 0.55), paleStone, 1.5)
    step.position.set(LIB.x, (PORT.base * (1 - (k + 1) / 4)) / 2, LIB.front + PORT.d + 0.275 + k * 0.55)
    scene.add(step)
  }
  for (let k = 0; k < 6; k++) {
    const col = inked(new THREE.CylinderGeometry(0.42, 0.5, PORT.col, 14), paleStone, 2)
    col.position.set(LIB.x - 5 + k * 2, PORT.base + PORT.col / 2, LIB.front + PORT.d - 1)
    scene.add(col)
    const cap = inked(new THREE.BoxGeometry(1.1, 0.35, 1.1), paleStone, 1.5)
    cap.position.set(col.position.x, PORT.base + PORT.col - 0.17, col.position.z)
    scene.add(cap)
  }
  // The dark doorway behind the columns.
  const door = plain(new THREE.PlaneGeometry(3, 5), toon(night ? '#f1d48e' : '#3a3530', night ? { emissive: '#5a4418' } : {}))
  door.position.set(LIB.x, PORT.base + 2.5, LIB.front + 0.02)
  scene.add(door)
  const TOP = PORT.base + PORT.col
  const entablature = inked(new THREE.BoxGeometry(PORT.w + 1, 1.3, PORT.d), paleStone, 2)
  entablature.position.set(LIB.x, TOP + 0.65, LIB.front + PORT.d / 2)
  scene.add(entablature)
  const R = (PORT.w + 1) / Math.sqrt(3)
  const pediment2 = inked(new THREE.CylinderGeometry(R, R, PORT.d, 3).rotateX(Math.PI / 2).rotateZ(Math.PI), paleStone, 2)
  pediment2.scale.set(1, 0.3, 1)
  pediment2.position.set(LIB.x, TOP + 1.3 + (R / 2) * 0.3, LIB.front + PORT.d / 2)
  scene.add(pediment2)
  // The dome: a drum, the copper dome, and the lantern on top.
  const copper = toon(night ? '#4f7f72' : '#86b8a2')
  const DOME = { r: 7, z: LIB.front - LIB.d / 2 - 2 }
  const drum = inked(new THREE.CylinderGeometry(DOME.r, DOME.r, 3, 32), stoneMat, 2.5)
  drum.position.set(LIB.x, LIB.h + 1.5, DOME.z)
  scene.add(drum)
  const dome = inked(new THREE.SphereGeometry(DOME.r, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), copper, 2.5)
  dome.scale.set(1, 0.8, 1)
  dome.position.set(LIB.x, LIB.h + 3, DOME.z)
  scene.add(dome)
  // Ribs down the dome.
  const ribMat = toon(night ? '#3c6358' : '#6a9a86')
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2
    // A quarter ring from the rim up to the top, turned round the dome.
    const rib = plain(new THREE.TorusGeometry(DOME.r + 0.03, 0.07, 4, 24, Math.PI / 2), ribMat)
    rib.rotation.y = a
    rib.scale.set(1, 0.8, 1)
    rib.position.set(LIB.x, LIB.h + 3, DOME.z)
    scene.add(rib)
  }
  const lantern = inked(new THREE.CylinderGeometry(1.1, 1.2, 1.8, 16), night ? toon('#f3d690', { emissive: '#6b5420' }) : stoneMat, 2)
  lantern.position.set(LIB.x, LIB.h + 3 + DOME.r * 0.8 + 0.8, DOME.z)
  scene.add(lantern)
  const cap = inked(new THREE.SphereGeometry(1.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), copper, 2)
  cap.position.set(LIB.x, lantern.position.y + 0.9, DOME.z)
  scene.add(cap)
  if (night) {
    const porchLight = new THREE.SpotLight('#ffe7b8', 60, 22, 0.7, 0.6, 1.5)
    porchLight.position.set(LIB.x, 1, ROAD.from - 2)
    porchLight.target.position.set(LIB.x, 7, LIB.front + 4)
    scene.add(porchLight, porchLight.target)
  }

  // Buildings down both sides of the side street.
  for (const [x, from] of [
    [SIDE.from - 0.8 - 4.5, FRONT - B22.d - 0.3],
    [SIDE.to + 0.8 + 4.5, LIB.front - LIB.d - 0.4],
  ]) {
    let z = from
    let k = 0
    while (z > -105) {
      const d = 6 + rand() * 6
      const h = 9 + rand() * 9 + Math.min(20, -z * 0.2)
      const b = tower(9, h, d, 20 + k++ + (x > 0 ? 7 : 0), night)
      b.position.set(x, h / 2, z - d / 2)
      scene.add(b)
      z -= d + 0.3
    }
  }

  // And one across the far end, closing it off.
  const end = tower(SIDE.to - SIDE.from + 22, 30, 8, 33, night)
  end.position.set((SIDE.from + SIDE.to) / 2, 15, -112)
  scene.add(end)

  // More of the campus along the street, and the towers behind.
  for (const [x, w, h, i] of [
    [HALL_X - HALL.w / 2 - 4.5, 8.5, 14, 1],
    [HALL_X - HALL.w / 2 - 13.5, 9, 19, 4],
  ]) {
    const b = tower(w, h, 8, i, night)
    b.position.set(x, h / 2, FRONT - 4)
    scene.add(b)
  }
  let n = 7
  for (const row of [
    { z: -38, count: 16, hMin: 20, hMax: 38 },
    { z: -64, count: 18, hMin: 28, hMax: 56 },
    { z: -100, count: 20, hMin: 34, hMax: 70 },
  ]) {
    for (let i = 0; i < row.count; i++) {
      const x = -90 + (i / (row.count - 1)) * 180 + (rand() - 0.5) * 4
      const w = 4 + rand() * 4
      const h = row.hMin + rand() * (row.hMax - row.hMin)
      const d = 4 + rand() * 3
      const dz = (rand() - 0.5) * 5
      if (Math.abs(x - (SIDE.from + SIDE.to) / 2) < w / 2 + 4) continue
      const b = tower(w, h, d, n++, night)
      b.position.set(x, h / 2, row.z + dz)
      scene.add(b)
      if (rand() < 0.3) {
        const top = inked(new THREE.BoxGeometry(w * 0.5, 1.4, d * 0.5), toon(night ? '#3a3f55' : '#8f98a3'), 2)
        top.position.set(b.position.x, h + 0.7, b.position.z)
        scene.add(top)
      }
    }
  }
  // Eureka Tower, over to the left: tall and dark, its top in gold with a
  // red stripe down it.
  const EUREKA = { x: -30, z: -120, w: 8, h: 110 }
  const eureka = tower(EUREKA.w, EUREKA.h, EUREKA.w, 5, night)
  eureka.position.set(EUREKA.x, EUREKA.h / 2, EUREKA.z)
  scene.add(eureka)
  const gold = inked(new THREE.BoxGeometry(EUREKA.w + 0.05, 12, EUREKA.w + 0.05), toon('#e2b23a', night ? { emissive: '#6a4c0c' } : {}), 2)
  gold.position.set(EUREKA.x, EUREKA.h - 6, EUREKA.z)
  scene.add(gold)
  const stripe = plain(new THREE.PlaneGeometry(1, EUREKA.h * 0.6), toon('#c3362b'))
  stripe.position.set(EUREKA.x + 1.2, EUREKA.h * 0.62, EUREKA.z + EUREKA.w / 2 + 0.06)
  scene.add(stripe)

  // Poles along both footpaths holding the wires over the tracks.
  const steel = toon('#4c525c')
  const WIRE_Y = 5.4
  // Off the middle, so none stands in front of the sign.
  for (let x = -67.5; x <= 67.5; x += 15) {
    for (const z of [ROAD.from - 0.45, ROAD.to + 0.45]) {
      const pole = inked(new THREE.CylinderGeometry(0.09, 0.12, WIRE_Y + 0.8, 8), steel, 1.5)
      pole.position.set(x, (WIRE_Y + 0.8) / 2, z)
      scene.add(pole)
    }
    const span = plain(new THREE.BoxGeometry(0.03, 0.03, ROAD.to - ROAD.from + 0.8), steel)
    span.position.set(x, WIRE_Y + 0.5, (ROAD.from + ROAD.to) / 2)
    scene.add(span)
  }
  const wire = new THREE.MeshBasicMaterial({ color: '#2a2e35' })
  for (const z of TRACKS) {
    const w = plain(new THREE.BoxGeometry(600, 0.03, 0.03), wire)
    w.position.set(0, WIRE_Y, z)
    scene.add(w)
  }

  // Street trees and lamps along the near footpath.
  for (const x of [-30, -21, -12.5, 4.6, 18.5, 25, 39, 46]) {
    const trunk = inked(new THREE.CylinderGeometry(0.12, 0.16, 2, 6), toon('#6b4a2e'), 1.5)
    trunk.position.set(x, 1, ROAD.from - 0.45)
    scene.add(trunk)
    const crown = inked(jitter(new THREE.IcosahedronGeometry(1.2, 1), 0.25, x * 7), toon(night ? '#2f5a3a' : '#4f8a46'), 2)
    crown.position.set(x, 2.8, ROAD.from - 0.45)
    scene.add(crown)
  }
  for (let x = -31.5; x <= 31.5; x += 9) {
    if (inStreet(x)) continue
    const pole = inked(new THREE.CylinderGeometry(0.05, 0.07, 3.6, 6), steel, 1.5)
    pole.position.set(x, 1.8, ROAD.from - 0.45)
    scene.add(pole)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: night ? '#ffe3a0' : '#e8e2d4' }))
    head.position.set(x, 3.65, ROAD.from - 0.45)
    scene.add(head)
    if (night && Math.abs(x) < 20) {
      const light = new THREE.PointLight('#ffd9a0', 6, 8, 1.5)
      light.position.copy(head.position)
      scene.add(light)
    }
  }
  if (night) {
    const flood = new THREE.SpotLight('#fff1d0', 40, 12, 0.6, 0.6, 1.5)
    flood.position.set(B22.w / 2 + 2.5, 4, FRONT + 3)
    flood.target.position.set(B22.w / 2 + 0.6, 9, FRONT - 1.6)
    scene.add(flood, flood.target)
  }

  // Trams both ways, one line each: they keep left, so those heading right
  // run on the track nearer the campus and those heading left on the far
  // one. Each line has a tram every so often, on its own timetable.
  const SPAN = 40
  for (const [track, dir, first] of [
    [TRACKS[0], 1, 0.5],
    [TRACKS[1], -1, 6],
  ]) {
    const car = tram(night)
    car.visible = false
    scene.add(car)
    let start = first
    let prev = 0
    animations.push((t) => {
      const dt = t - prev
      prev = t
      if (t < start) return
      if (!car.visible) {
        car.visible = true
        car.position.set(-dir * SPAN, 0, track)
      }
      car.position.x += dir * 7 * dt
      if (Math.abs(car.position.x) > SPAN) {
        car.visible = false
        start = t + 6 + rand() * 6
      }
    })
  }

  // Students walking along the footpath in front of the campus.
  students(scene, animations, 26)
}
