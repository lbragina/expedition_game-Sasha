import { useEffect, useRef, useState } from 'react'
import { t } from '../i18n'

const W = 72
const H = 44
const COLORS = ['#f2f2f7', '#f5c518', '#4de2e0', '#ef5350']

/** Brouillon pixel : on dessine au doigt, les « pixels » sont de gros carrés. */
export default function Scratchpad({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const last = useRef<[number, number] | null>(null)
  const [color, setColor] = useState(COLORS[0])
  const [erase, setErase] = useState(false)

  useEffect(() => {
    const c = ref.current
    if (c) {
      c.width = W
      c.height = H
    }
  }, [])

  const cell = (e: React.PointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect()
    return [
      Math.max(0, Math.min(W - 1, Math.floor(((e.clientX - r.left) / r.width) * W))),
      Math.max(0, Math.min(H - 1, Math.floor(((e.clientY - r.top) / r.height) * H))),
    ]
  }

  const plot = (x: number, y: number) => {
    const ctx = ref.current!.getContext('2d')!
    if (erase) ctx.clearRect(x - 1, y - 1, 3, 3)
    else {
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const line = (a: [number, number], b: [number, number]) => {
    let [x0, y0] = a
    const [x1, y1] = b
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      plot(x0, y0)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }

  return (
    <div
      className={`safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t-4 border-gold bg-night/95 px-3 pt-2 transition-transform duration-200 ${
        open ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            aria-label={c}
            onClick={() => {
              setColor(c)
              setErase(false)
            }}
            className={`h-8 w-8 rounded border-4 ${!erase && color === c ? 'border-white' : 'border-black'}`}
            style={{ background: c }}
          />
        ))}
        <button className={`chip h-8 ${erase ? 'border-white' : ''}`} onClick={() => setErase((v) => !v)}>
          ⌫
        </button>
        <button className="chip ml-auto h-8" onClick={() => ref.current!.getContext('2d')!.clearRect(0, 0, W, H)}>
          {t('expedition.scratchpad_clear')}
        </button>
        <button className="chip h-8" onClick={onClose}>
          ▼
        </button>
      </div>
      <canvas
        ref={ref}
        className="pixel mb-2 w-full rounded-lg border-4 border-line bg-[#0b2a1e]"
        style={{ aspectRatio: `${W} / ${H}` }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          const p = cell(e)
          last.current = p
          plot(p[0], p[1])
        }}
        onPointerMove={(e) => {
          if (!last.current) return
          const p = cell(e)
          line(last.current, p)
          last.current = p
        }}
        onPointerUp={() => (last.current = null)}
        onPointerCancel={() => (last.current = null)}
      />
    </div>
  )
}
