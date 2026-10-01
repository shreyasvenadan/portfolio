// Little synthesized sound effects, so there are no audio files to load. The
// audio context is created on first use, which is always inside a click.
let ctx: AudioContext | null = null
const audio = () => (ctx ??= new AudioContext())

// A long, low ship's horn, muffled because the ship is underwater.
export function shipHorn() {
  const a = audio()
  const t = a.currentTime
  const out = a.createGain()
  out.gain.setValueAtTime(0, t)
  out.gain.linearRampToValueAtTime(0.32, t + 0.25)
  out.gain.setValueAtTime(0.32, t + 2)
  out.gain.exponentialRampToValueAtTime(0.001, t + 2.9)
  const muffle = a.createBiquadFilter()
  muffle.type = 'lowpass'
  muffle.frequency.value = 520
  muffle.Q.value = 4
  muffle.connect(out).connect(a.destination)
  // Two slightly detuned reedy tones a fifth apart, sagging in pitch as they start.
  for (const [freq, detune] of [
    [87, -6],
    [87, 6],
    [130.5, 0],
  ]) {
    const osc = a.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq * 1.04, t)
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.3)
    osc.detune.value = detune
    osc.connect(muffle)
    osc.start(t)
    osc.stop(t + 3)
  }
}

// A dull thud: a quick low drop in pitch plus a puff of filtered noise.
export function thud() {
  const a = audio()
  const t = a.currentTime
  const out = a.createGain()
  out.gain.setValueAtTime(0.5, t)
  out.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
  out.connect(a.destination)
  const osc = a.createOscillator()
  osc.frequency.setValueAtTime(160, t)
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.2)
  osc.connect(out)
  osc.start(t)
  osc.stop(t + 0.3)
  const noise = a.createBufferSource()
  noise.buffer = a.createBuffer(1, a.sampleRate * 0.1, a.sampleRate)
  const data = noise.buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const lowpass = a.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 700
  noise.connect(lowpass).connect(out)
  noise.start(t)
}

// An electric zap: one of three recorded zaps (public/sounds), picked at
// random and played in full. The files are fetched up front so the first zap
// isn't late, and decoded on first use. Resolves with the clip's length in
// seconds once it starts, so the lightning can be sized to match.
const ZAP_FILES = [1, 2, 3].map((n) => fetch(`${import.meta.env.BASE_URL}sounds/zap-${n}.mp3`).then((r) => r.arrayBuffer()))
let zaps: Promise<AudioBuffer[]> | null = null

export async function zapSound() {
  const a = audio()
  zaps ??= Promise.all(ZAP_FILES.map(async (file) => a.decodeAudioData(await file)))
  const buffers = await zaps
  const src = a.createBufferSource()
  src.buffer = buffers[Math.floor(Math.random() * buffers.length)]
  const out = a.createGain()
  out.gain.value = 0.7
  src.connect(out).connect(a.destination)
  src.start()
  return src.buffer.duration
}

// Poking a diver: the Minecraft "oof" (public/sounds/oof.mp3), fetched up
// front and decoded on first use like the zaps.
const OOF_FILE = fetch(`${import.meta.env.BASE_URL}sounds/oof.mp3`).then((r) => r.arrayBuffer())
let oofBuffer: Promise<AudioBuffer> | null = null

export async function oof() {
  const a = audio()
  oofBuffer ??= OOF_FILE.then((file) => a.decodeAudioData(file))
  const src = a.createBufferSource()
  src.buffer = await oofBuffer
  const out = a.createGain()
  out.gain.value = 0.8
  src.connect(out).connect(a.destination)
  src.start()
}

// A plane going down: a bang, then a whistle falling in pitch for `seconds`.
export function planeCrash(seconds: number) {
  thud()
  const a = audio()
  const t = a.currentTime
  const out = a.createGain()
  out.gain.setValueAtTime(0, t)
  out.gain.linearRampToValueAtTime(0.12, t + 0.1)
  out.gain.setValueAtTime(0.12, t + seconds - 0.1)
  out.gain.linearRampToValueAtTime(0, t + seconds)
  out.connect(a.destination)
  const osc = a.createOscillator()
  osc.frequency.setValueAtTime(1500, t)
  osc.frequency.exponentialRampToValueAtTime(350, t + seconds)
  osc.connect(out)
  osc.start(t)
  osc.stop(t + seconds)
}

// Something hitting the water: a burst of noise, darkening as it fades.
export function splash() {
  const a = audio()
  const t = a.currentTime
  const out = a.createGain()
  out.gain.setValueAtTime(0.45, t)
  out.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
  out.connect(a.destination)
  const noise = a.createBufferSource()
  noise.buffer = a.createBuffer(1, a.sampleRate * 0.9, a.sampleRate)
  const data = noise.buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const lowpass = a.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.setValueAtTime(3000, t)
  lowpass.frequency.exponentialRampToValueAtTime(300, t + 0.9)
  noise.connect(lowpass).connect(out)
  noise.start(t)
}

// A cannonball striking timber: a deep boom under a sharp splintering crack.
export function cannonHit() {
  const a = audio()
  const t = a.currentTime
  const out = a.createGain()
  out.gain.setValueAtTime(0.6, t)
  out.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
  out.connect(a.destination)
  const boom = a.createOscillator()
  boom.frequency.setValueAtTime(130, t)
  boom.frequency.exponentialRampToValueAtTime(38, t + 0.5)
  boom.connect(out)
  boom.start(t)
  boom.stop(t + 0.7)
  const crack = a.createBufferSource()
  crack.buffer = a.createBuffer(1, a.sampleRate * 0.25, a.sampleRate)
  const data = crack.buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
  const bandpass = a.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 1800
  bandpass.Q.value = 0.8
  crack.connect(bandpass).connect(out)
  crack.start(t)
}

// A ship going down: a splash, then a low wooden groan sagging for `seconds`.
export function sinkingShip(seconds: number) {
  splash()
  const a = audio()
  const t = a.currentTime
  const out = a.createGain()
  out.gain.setValueAtTime(0, t)
  out.gain.linearRampToValueAtTime(0.18, t + 0.4)
  out.gain.setValueAtTime(0.18, t + seconds * 0.6)
  out.gain.linearRampToValueAtTime(0, t + seconds)
  const muffle = a.createBiquadFilter()
  muffle.type = 'lowpass'
  muffle.frequency.value = 320
  muffle.connect(out).connect(a.destination)
  for (const detune of [-8, 8]) {
    const osc = a.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(72, t)
    osc.frequency.exponentialRampToValueAtTime(42, t + seconds)
    osc.detune.value = detune
    osc.connect(muffle)
    osc.start(t)
    osc.stop(t + seconds)
  }
}

// Glass smashing: a bright crash of noise, then a scatter of tinkling shards.
export function glassBreak() {
  const a = audio()
  const t = a.currentTime
  const crash = a.createBufferSource()
  crash.buffer = a.createBuffer(1, a.sampleRate * 0.35, a.sampleRate)
  const data = crash.buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
  const highpass = a.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 2500
  const crashGain = a.createGain()
  crashGain.gain.value = 0.5
  crash.connect(highpass).connect(crashGain).connect(a.destination)
  crash.start(t)
  for (let i = 0; i < 7; i++) {
    const at = t + 0.03 + Math.random() * 0.3
    const ring = a.createOscillator()
    ring.frequency.value = 2500 + Math.random() * 3500
    const env = a.createGain()
    env.gain.setValueAtTime(0.1, at)
    env.gain.exponentialRampToValueAtTime(0.001, at + 0.12 + Math.random() * 0.2)
    ring.connect(env).connect(a.destination)
    ring.start(at)
    ring.stop(at + 0.4)
  }
}
