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
