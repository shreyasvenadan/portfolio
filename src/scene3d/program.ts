// The scenes behind the Apple program pages, in the island's cel-shaded,
// ink-outlined style, each with the program's logo in the middle:
//
// - academy (Bali): the Academy's reception, the BINUS University and Apple
//   Developer Academy sign on the wall under a lit cove, the reception desk
//   in front of it, potted palms in the corners, and every now and then
//   students walking across the room.
// - institute (Jakarta): the sign on a low building's roof, Monas and a
//   skyline behind, traffic going by on the road in front, and the city's
//   windows lit after dark.
//
// On wide screens the sign sits on the left with the page's text on the
// right; on narrow ones it's at the top and the text scrolls up over it.
import * as THREE from 'three'
import { Character, type Cut, type Look as Style } from './character'
import { cloud, palm } from './models'
import { inked, jitter, outlineUniforms, plain, ramp, seeded, toon } from './toon'

export type ProgramScene = { dispose(): void }
type Kind = 'academy' | 'institute'

type Look = { top: string; low: string; hemi: string; ground: string; sun: string; light: number; ambient: number }
const LOOKS: Record<Kind, { day: Look; night: Look }> = {
  academy: {
    day: { top: '#f0a865', low: '#fbe2b4', hemi: '#fffaf0', ground: '#c9b89c', sun: '#fff1dc', light: 1.1, ambient: 1.6 },
    night: { top: '#141b40', low: '#3d4a86', hemi: '#f3e6d0', ground: '#6e6458', sun: '#ffe2b8', light: 0.7, ambient: 1.1 },
  },
  institute: {
    day: { top: '#7fb6d8', low: '#f3dcc0', hemi: '#fff4e4', ground: '#8f8a80', sun: '#fff0d0', light: 1.5, ambient: 1.3 },
    night: { top: '#0f1433', low: '#3a3f78', hemi: '#8a96d0', ground: '#22283a', sun: '#d8deff', light: 0.8, ambient: 0.7 },
  },
}

// Where the camera stands and looks, per scene.
const FRAME: Record<Kind, { at: THREE.Vector3; look: THREE.Vector3; atNarrow: THREE.Vector3; lookNarrow: THREE.Vector3 }> = {
  academy: { at: new THREE.Vector3(0, 2.5, 15), look: new THREE.Vector3(0, 2.45, -3), atNarrow: new THREE.Vector3(0, 2.6, 26), lookNarrow: new THREE.Vector3(0, 2.2, -3) },
  institute: { at: new THREE.Vector3(0, 6.5, 40), look: new THREE.Vector3(-2, 7.6, 0), atNarrow: new THREE.Vector3(-1.5, 8, 56), lookNarrow: new THREE.Vector3(-1.5, 7, 0) },
}

const LOGO = { src: 'apple-developer-institute-logo.png', aspect: 85 / 99 }

type Animate = (t: number) => void

export function createProgramScene(
  canvas: HTMLCanvasElement,
  { kind, still, night, onReady }: { kind: Kind; still: boolean; night: boolean; onReady?: () => void },
): ProgramScene {
  const look = LOOKS[kind][night ? 'night' : 'day']
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  const scene = new THREE.Scene()
  // Haze over the city; the Academy is indoors.
  if (kind === 'institute') scene.fog = new THREE.Fog(look.low, 45, 240)
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 1200)
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
  // Indoors, the light falls from high in front, so the desk's shadow lands behind it.
  if (kind === 'academy') sun.position.set(-3, 9, 10)
  else sun.position.set(night ? 4 : -9, night ? 18 : 12, night ? 8 : 6)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, far: 80 })
  scene.add(sun)

  // --- the scene, with its logo; still scenes redraw when an image arrives
  const redraw = () => still && requestAnimationFrame(tick)
  if (kind === 'academy') academyRoom(scene, night, animations, redraw)
  else jakarta(scene, logoBoard(redraw), night, animations)

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
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', move)
      renderer.dispose()
    },
  }
}

// The program's logo on a cream board, framed in wood, facing +z. Its
// bottom edge is at y = 0; `onLoad` redraws once the image arrives.
function logoBoard(onLoad: () => void) {
  const { src, aspect } = LOGO
  const h = 2.6
  const w = h * aspect + 0.5
  const board = new THREE.Group()
  const frame = inked(new THREE.BoxGeometry(w + 0.24, h + 0.24, 0.16), toon('#6b4a2e'), 2.5)
  frame.position.y = (h + 0.24) / 2
  board.add(frame)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: '#fbf7ee' }))
  face.position.set(0, (h + 0.24) / 2, 0.085)
  board.add(face)
  const texture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}${src}`, onLoad)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(h * aspect * 0.86, h * 0.86),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  )
  logo.position.set(0, (h + 0.24) / 2, 0.09)
  board.add(logo)
  board.userData.height = h + 0.24
  board.userData.width = w + 0.24
  return board
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
  for (const side of [-1, 1]) {
    const wall = plain(new THREE.PlaneGeometry(DEPTH, COVE), toon('#e9e5dd'))
    wall.rotation.y = (-side * Math.PI) / 2
    wall.position.set(side * HALF, COVE / 2, BACK + DEPTH / 2)
    scene.add(wall)
    const sideSkirt = inked(new THREE.BoxGeometry(0.03, 0.12, DEPTH), skirt, 1.5)
    sideSkirt.position.set(side * (HALF - 0.015), 0.06, BACK + DEPTH / 2)
    scene.add(sideSkirt)
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
  bench.position.set(-HALF + 0.35, 0.225, BACK + 6)
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

// The students are built like Shreyas (scene3d/character.ts), each in their
// own style, shrunk to the room.
const STUDENT_SCALE = 0.52

type Student = { me: Character; carrying: boolean }

function student(rand: () => number): Student {
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const [hair, hairLight] = pick(HAIRS)
  const [top, topDark] = pick(TOPS)
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
// front of the desk, from one side wall to the other.
function students(scene: THREE.Scene, animations: Animate[], half: number) {
  const rand = seeded(31)
  const pool = Array.from({ length: 8 }, () => student(rand))
  pool.forEach((s) => scene.add(s.me.root))
  type Walk = { s: Student; dir: number; speed: number; x: number; z: number }
  const walking: Walk[] = []
  const START = half - 0.4
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
      const z = 0.3 + rand() * 2.2
      const stride = 0.45 + rand() * 0.12
      send(dir, z, stride, 0)
      // Sometimes a friend walks with them, a little behind and to one side.
      if (rand() < 0.3) send(dir, z + (rand() < 0.5 ? 0.55 : -0.55), stride, 0.7)
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

// --- Jakarta ------------------------------------------------------------------

// Facade textures: `wall`, the windows in the day, and `lit`, which windows
// glow after dark.
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
]

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
  const geo = new THREE.BoxGeometry(w, h, d)
  return inked(geo, [xSide, xSide, roof, roof, zSide, zSide] as unknown as THREE.Material, 2)
}

function jakarta(scene: THREE.Scene, sign: THREE.Group, night: boolean, animations: Animate[]) {
  const rand = seeded(23)

  // Plaza paving, the road in front with its lane markings, a kerb.
  const paving = plain(new THREE.PlaneGeometry(500, 500).rotateX(-Math.PI / 2), toon(night ? '#4a4c5c' : '#c8bfae'))
  scene.add(paving)
  const ROAD_Z = 6.2
  const road = plain(new THREE.PlaneGeometry(500, 4.4).rotateX(-Math.PI / 2), toon(night ? '#24262f' : '#4a4c55'))
  road.position.set(0, 0.01, ROAD_Z)
  scene.add(road)
  const dash = new THREE.MeshBasicMaterial({ color: '#f2c230' })
  for (let x = -80; x <= 80; x += 3) {
    const d = plain(new THREE.PlaneGeometry(1.4, 0.1).rotateX(-Math.PI / 2), dash)
    d.position.set(x, 0.02, ROAD_Z)
    scene.add(d)
  }
  for (const z of [ROAD_Z - 2.3, ROAD_Z + 2.3]) {
    const kerb = inked(new THREE.BoxGeometry(500, 0.16, 0.25), toon('#d8d2c6'), 1.5)
    kerb.position.set(0, 0.08, z)
    scene.add(kerb)
  }

  // The low building the sign stands on.
  const BASE_H = 3.2
  const base = tower(5.2, BASE_H, 4, 1, night)
  base.position.set(0, BASE_H / 2, -1)
  scene.add(base)
  const door = plain(new THREE.PlaneGeometry(1.3, 1.9), toon('#2f4b66'))
  door.position.set(0, 0.95, 1.01)
  scene.add(door)
  const awning = inked(new THREE.BoxGeometry(2.2, 0.12, 0.9), toon('#e45a3c'), 2)
  awning.position.set(0, 2.1, 1.4)
  scene.add(awning)
  // The sign on a steel frame on the roof.
  const steel = toon('#5b6270')
  for (const x of [-0.9, 0.9]) {
    const leg = inked(new THREE.BoxGeometry(0.14, 1.0, 0.14), steel, 2)
    leg.position.set(x, BASE_H + 0.5, -0.6)
    scene.add(leg)
  }
  sign.position.set(0, BASE_H + 0.7, -0.5)
  scene.add(sign)
  if (night) {
    const flood = new THREE.SpotLight('#fff1d0', 30, 8, 0.6, 0.6, 1.5)
    flood.position.set(0, BASE_H + 0.3, 1.8)
    flood.target.position.set(0, BASE_H + 2.2, -0.5)
    scene.add(flood, flood.target)
  }

  // Monas: a square stepped base, the tall obelisk, the gold flame on top.
  const monas = new THREE.Group()
  const marble = toon('#f1ece2')
  const plinth = inked(new THREE.BoxGeometry(7, 0.9, 7), marble, 2.5)
  plinth.position.y = 0.45
  monas.add(plinth)
  // The cup it rises from.
  const cup = inked(new THREE.CylinderGeometry(2.6, 1.6, 1.4, 4, 1), marble, 2.5)
  cup.rotation.y = Math.PI / 4
  cup.position.y = 1.6
  monas.add(cup)
  const shaft = inked(new THREE.CylinderGeometry(0.45, 0.75, 15, 4, 1), marble, 2.5)
  shaft.rotation.y = Math.PI / 4
  shaft.position.y = 2.3 + 7.5
  monas.add(shaft)
  const platform = inked(new THREE.BoxGeometry(1.4, 0.4, 1.4), marble, 2)
  platform.position.y = 17.5
  monas.add(platform)
  const flame = inked(jitter(new THREE.ConeGeometry(0.75, 2.2, 7, 3), 0.18, 9), toon('#f2c230', night ? { emissive: '#7a5600' } : {}), 2.5)
  flame.position.y = 18.8
  monas.add(flame)
  monas.position.set(-6.5, 0, -14)
  scene.add(monas)
  animations.push((t) => (flame.rotation.y = Math.sin(t * 0.6) * 0.2))

  // The skyline: rows of towers behind, kept clear of Monas.
  let n = 0
  for (const row of [
    { z: -26, count: 14, hMin: 8, hMax: 20 },
    { z: -42, count: 16, hMin: 14, hMax: 34 },
    { z: -62, count: 18, hMin: 18, hMax: 44 },
  ]) {
    for (let i = 0; i < row.count; i++) {
      const x = -60 + (i / (row.count - 1)) * 120 + (rand() - 0.5) * 4
      if (Math.abs(x - monas.position.x) < (row.z > -30 ? 7 : 4)) continue
      const w = 3.5 + rand() * 3
      const h = row.hMin + rand() * (row.hMax - row.hMin)
      const d = 3.5 + rand() * 2.5
      const b = tower(w, h, d, n++, night)
      b.position.set(x, h / 2, row.z + (rand() - 0.5) * 5)
      scene.add(b)
      // Some get a spire or a rooftop block.
      if (rand() < 0.35) {
        const top = inked(new THREE.BoxGeometry(w * 0.5, 1.2, d * 0.5), toon(night ? '#3a3f55' : '#8f98a3'), 2)
        top.position.set(b.position.x, h + 0.6, b.position.z)
        scene.add(top)
      } else if (rand() < 0.3) {
        const spire = inked(new THREE.ConeGeometry(0.25, 4, 6), toon('#c9d3dc'), 1.5)
        spire.position.set(b.position.x, h + 2, b.position.z)
        scene.add(spire)
      }
    }
  }
  // Mid-rises either side of the sign's building.
  for (const [x, z, w, h, i] of [
    [7, -5, 4.5, 9, 4],
    [12.5, -8, 4, 13, 0],
    [-13, -9, 4.5, 11, 3],
  ]) {
    const b = tower(w, h, 4, i + 10, night)
    b.position.set(x, h / 2, z)
    scene.add(b)
  }

  // Street trees and lamps along the pavement.
  const LAMP_Z = ROAD_Z - 3
  for (let x = -26; x <= 26; x += 6.5) {
    if (Math.abs(x) < 2) continue
    const trunk = inked(new THREE.CylinderGeometry(0.1, 0.14, 1.4, 6), toon('#6b4a2e'), 1.5)
    trunk.position.set(x, 0.7, LAMP_Z)
    scene.add(trunk)
    const crown = inked(jitter(new THREE.IcosahedronGeometry(0.85, 1), 0.2, x * 7), toon(night ? '#2f5a3a' : '#4f8a46'), 2)
    crown.position.set(x, 1.9, LAMP_Z)
    scene.add(crown)
  }
  for (let x = -29.25; x <= 29.25; x += 6.5) {
    const pole = inked(new THREE.CylinderGeometry(0.05, 0.07, 3.4, 6), steel, 1.5)
    pole.position.set(x, 1.7, LAMP_Z)
    scene.add(pole)
    const arm = inked(new THREE.BoxGeometry(0.08, 0.08, 0.8), steel, 1.5)
    arm.position.set(x, 3.4, LAMP_Z + 0.35)
    scene.add(arm)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: night ? '#ffe3a0' : '#e8e2d4' }))
    head.position.set(x, 3.3, LAMP_Z + 0.7)
    scene.add(head)
    if (night && Math.abs(x) < 16) {
      const light = new THREE.PointLight('#ffd9a0', 5, 7, 1.5)
      light.position.copy(head.position)
      scene.add(light)
    }
  }

  // Traffic: cars both ways, round and round.
  const COLORS = ['#e45a3c', '#f2c230', '#2f6fb3', '#f6f2ea', '#3c8d5a', '#8a5bb5', '#20242c']
  const cars: { car: THREE.Group; dir: number; speed: number }[] = []
  const SPAN = 44
  for (let i = 0; i < 10; i++) {
    const car = new THREE.Group()
    const paint = toon(COLORS[i % COLORS.length])
    const body = inked(new THREE.BoxGeometry(1.7, 0.5, 0.85), paint, 2)
    body.position.y = 0.4
    car.add(body)
    const cabin = inked(new THREE.BoxGeometry(0.95, 0.4, 0.75), toon('#cfe2ee'), 2)
    cabin.position.set(-0.1, 0.85, 0)
    car.add(cabin)
    const wheel = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 10).rotateX(Math.PI / 2)
    for (const [x, z] of [
      [-0.55, 0.42],
      [0.55, 0.42],
      [-0.55, -0.42],
      [0.55, -0.42],
    ]) {
      const w = inked(wheel, toon('#20242c'), 1.5)
      w.position.set(x, 0.17, z)
      car.add(w)
    }
    if (night) {
      for (const z of [-0.28, 0.28]) {
        const light = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.16), new THREE.MeshBasicMaterial({ color: '#fff1c0' }))
        light.position.set(0.86, 0.45, z)
        car.add(light)
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.16), new THREE.MeshBasicMaterial({ color: '#ff4a3a' }))
        tail.position.set(-0.86, 0.45, z)
        car.add(tail)
      }
    }
    const dir = i % 2 ? 1 : -1
    car.rotation.y = dir > 0 ? 0 : Math.PI
    car.position.set(-SPAN + rand() * SPAN * 2, 0, ROAD_Z + (dir > 0 ? 1.1 : -1.1))
    scene.add(car)
    cars.push({ car, dir, speed: 3 + rand() * 2.5 })
  }
  let prev = 0
  animations.push((t) => {
    const dt = t - prev
    prev = t
    for (const c of cars) {
      c.car.position.x += c.dir * c.speed * dt
      if (c.car.position.x > SPAN) c.car.position.x -= SPAN * 2
      if (c.car.position.x < -SPAN) c.car.position.x += SPAN * 2
    }
  })
}
