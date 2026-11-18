// Sons 8-bit générés avec la Web Audio API (aucun fichier mp3).

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(value: boolean) {
  enabled = value
}

function audio(): AudioContext | null {
  if (!enabled) return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.07,
  slideTo?: number,
) {
  const c = audio()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  const t0 = c.currentTime + start
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, t0 + duration)
  gain.gain.setValueAtTime(volume, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

const NOTE = { C5: 523, E5: 659, G5: 784, C6: 1047, E6: 1319, G6: 1568, A4: 440, F4: 349, C4: 262 }

export const sfx = {
  /** À appeler dans un geste de l'utilisateur pour « réveiller » l'audio sur iPhone */
  unlock() {
    audio()
  },
  click() {
    tone(NOTE.E5, 0, 0.05, 'square', 0.04)
  },
  correct() {
    tone(NOTE.C5, 0, 0.09)
    tone(NOTE.E5, 0.09, 0.09)
    tone(NOTE.G5, 0.18, 0.16)
  },
  wrong() {
    tone(NOTE.A4, 0, 0.12, 'sawtooth', 0.06, 200)
    tone(NOTE.C4, 0.12, 0.22, 'sawtooth', 0.06, 110)
  },
  /** Plus le combo est haut, plus la mélodie monte. */
  combo(level: number) {
    const base = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6]
    const n = Math.min(6, Math.max(2, level))
    for (let i = 0; i < n; i++) tone(base[Math.min(i, base.length - 1)], 0.22 + i * 0.06, 0.07, 'square', 0.05)
  },
  star() {
    ;[NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6].forEach((f, i) => tone(f, i * 0.08, 0.14, 'triangle', 0.08))
  },
  levelUp() {
    ;[NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.G5, NOTE.C6, NOTE.E6].forEach((f, i) =>
      tone(f, i * 0.1, 0.16, 'square', 0.06),
    )
  },
  chest() {
    ;[NOTE.E5, NOTE.G5, NOTE.E6].forEach((f, i) => tone(f, i * 0.07, 0.1, 'triangle', 0.08))
  },
  hint() {
    tone(NOTE.G5, 0, 0.06, 'triangle', 0.06)
    tone(NOTE.C6, 0.07, 0.1, 'triangle', 0.06)
  },
  fog() {
    tone(NOTE.F4, 0, 0.3, 'triangle', 0.05, 200)
  },
}
