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

// An electric zap lasting `seconds`: a harsh mains-style buzz under sharp
// crackles of high noise, one each time the lightning redraws.
export function zapSound(seconds: number) {
  const a = audio()
  const t = a.currentTime
  const out = a.createGain()
  out.gain.setValueAtTime(0, t)
  out.gain.linearRampToValueAtTime(0.28, t + 0.01)
  out.gain.setValueAtTime(0.28, t + seconds * 0.7)
  out.gain.exponentialRampToValueAtTime(0.001, t + seconds)
  out.connect(a.destination)

  // Buzz: two detuned square waves, brightened by a resonant filter.
  const buzzFilter = a.createBiquadFilter()
  buzzFilter.type = 'bandpass'
  buzzFilter.frequency.value = 1400
  buzzFilter.Q.value = 1.5
  const buzzGain = a.createGain()
  buzzGain.gain.value = 0.6
  buzzFilter.connect(buzzGain).connect(out)
  for (const freq of [110, 117]) {
    const osc = a.createOscillator()
    osc.type = 'square'
    osc.frequency.value = freq
    osc.connect(buzzFilter)
    osc.start(t)
    osc.stop(t + seconds)
  }

  // Crackles: short bursts of high-passed noise every 80ms or so.
  const crackle = a.createBuffer(1, a.sampleRate * 0.05, a.sampleRate)
  const data = crackle.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2
  const highpass = a.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 2500
  highpass.connect(out)
  for (let at = 0; at < seconds - 0.05; at += 0.06 + Math.random() * 0.04) {
    const burst = a.createBufferSource()
    burst.buffer = crackle
    burst.playbackRate.value = 0.7 + Math.random() * 0.8
    burst.connect(highpass)
    burst.start(t + at)
  }
}
