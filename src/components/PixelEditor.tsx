import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ART_SIZE, PALETTE, blankArt, floodFill, hasPixels, type ArtKind } from '../game/pixel'
import { sfx } from '../game/sound'
import { t } from '../i18n'
import { ArtImg } from './Sprites'

type Tool = 'pencil' | 'eraser' | 'fill'
const CELL = 20 // pixels de canvas par pixel de dessin
const TOOLS: { id: Tool; icon: string }[] = [
  { id: 'pencil', icon: '✏️' },
  { id: 'eraser', icon: '🧽' },
  { id: 'fill', icon: '🪣' },
]

/** Éditeur de pixel art plein écran : palette de 16 couleurs, crayon, gomme, remplissage, annuler, effacer. */
export default function PixelEditor({
  kind,
  title,
  hint,
  initial,
  requirePixels = false,
  extra,
  canSave = true,
  onSave,
  onClose,
}: {
  kind: ArtKind
  title: string
  hint: string
  initial: string
  requirePixels?: boolean
  extra?: ReactNode
  canSave?: boolean
  onSave: (art: string) => void
  onClose: () => void
}) {
  const { w, h } = ART_SIZE[kind]
  const [cells, setCells] = useState<string[]>(() => (initial || blankArt(kind)).split(''))
  const [tool, setTool] = useState<Tool>('pencil')
  const [color, setColor] = useState('2')
  const [undo, setUndo] = useState<string[][]>([])
  const ref = useRef<HTMLCanvasElement>(null)
  const live = useRef(cells)
  const drawing = useRef<number | null>(null)
  live.current = cells

  // dessin du canvas : damier (transparent) + pixels + grille
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = cells[y * w + x]
        ctx.fillStyle = (x + y) % 2 ? '#4a5170' : '#3d4361'
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
        if (ch !== '.') {
          ctx.fillStyle = PALETTE[parseInt(ch, 16)]
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
        }
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x <= w; x++) {
      ctx.moveTo(x * CELL + 0.5, 0)
      ctx.lineTo(x * CELL + 0.5, h * CELL)
    }
    for (let y = 0; y <= h; y++) {
      ctx.moveTo(0, y * CELL + 0.5)
      ctx.lineTo(w * CELL, y * CELL + 0.5)
    }
    ctx.stroke()
  }, [cells, w, h])

  const cellAt = (e: React.PointerEvent): number => {
    const r = ref.current!.getBoundingClientRect()
    const x = Math.max(0, Math.min(w - 1, Math.floor(((e.clientX - r.left) / r.width) * w)))
    const y = Math.max(0, Math.min(h - 1, Math.floor(((e.clientY - r.top) / r.height) * h)))
    return y * w + x
  }

  const paint = (from: number, to: number) => {
    const next = live.current.slice()
    const ch = tool === 'eraser' ? '.' : color
    const [x0, y0, x1, y1] = [from % w, Math.floor(from / w), to % w, Math.floor(to / w)]
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let k = 0; k <= steps; k++) {
      const x = Math.round(x0 + ((x1 - x0) * k) / steps)
      const y = Math.round(y0 + ((y1 - y0) * k) / steps)
      next[y * w + x] = ch
    }
    live.current = next
    setCells(next)
  }

  const down = (e: React.PointerEvent) => {
    sfx.unlock()
    ref.current!.setPointerCapture(e.pointerId)
    const i = cellAt(e)
    setUndo((u) => [...u.slice(-29), live.current])
    if (tool === 'fill') {
      const next = floodFill(live.current, w, h, i % w, Math.floor(i / w), color)
      live.current = next
      setCells(next)
      sfx.click()
      return
    }
    drawing.current = i
    paint(i, i)
  }
  const move = (e: React.PointerEvent) => {
    if (drawing.current === null) return
    const i = cellAt(e)
    if (i !== drawing.current) {
      paint(drawing.current, i)
      drawing.current = i
    }
  }
  const up = () => {
    drawing.current = null
  }

  const art = cells.join('')
  const empty = !hasPixels(art)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-night" role="dialog" aria-modal="true">
      <div className="safe-top safe-bottom mx-auto max-w-md space-y-3 px-3 pb-4">
        <h2 className="pt-2 font-pixel text-xl font-bold text-gold">{title}</h2>
        <p className="text-sm text-mute">{hint}</p>

        <canvas
          ref={ref}
          width={w * CELL}
          height={h * CELL}
          className="pixel w-full rounded-lg border-4 border-black"
          style={{ aspectRatio: `${w} / ${h}`, maxHeight: '52vh', margin: '0 auto', display: 'block', imageRendering: 'pixelated' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />

        <div className="grid grid-cols-8 gap-1" role="radiogroup" aria-label={t('editor.palette')}>
          {PALETTE.map((hex, i) => {
            const ch = i.toString(16)
            return (
              <button
                key={ch}
                role="radio"
                aria-checked={color === ch && tool !== 'eraser'}
                aria-label={hex}
                onClick={() => {
                  setColor(ch)
                  if (tool === 'eraser') setTool('pencil')
                  sfx.click()
                }}
                className={`aspect-square rounded border-4 ${color === ch && tool !== 'eraser' ? 'scale-110 border-white' : 'border-black'}`}
                style={{ background: hex }}
              />
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TOOLS.map((x) => (
            <button key={x.id} className={`btn !min-h-[44px] !px-1 text-sm ${tool === x.id ? 'btn-gold' : ''}`} onClick={() => setTool(x.id)}>
              {x.icon} {t(`editor.tool_${x.id}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn !min-h-[44px] text-sm"
            disabled={!undo.length}
            onClick={() => {
              const prev = undo[undo.length - 1]
              if (!prev) return
              setUndo((u) => u.slice(0, -1))
              setCells(prev)
            }}
          >
            ↩️ {t('editor.undo')}
          </button>
          <button
            className="btn !min-h-[44px] text-sm"
            onClick={() => {
              if (!hasPixels(art) || !window.confirm(t('editor.clear_confirm'))) return
              setUndo((u) => [...u.slice(-29), live.current])
              setCells(blankArt(kind).split(''))
            }}
          >
            🗑️ {t('editor.clear')}
          </button>
        </div>

        <div className="card flex items-center justify-around !p-3">
          <span className="text-xs text-mute">{t('editor.preview')}</span>
          <ArtImg art={art} kind={kind} style={{ width: w * 4, height: h * 4 }} />
          <ArtImg art={art} kind={kind} style={{ width: w * 2, height: h * 2 }} />
          {kind === 'block' && (
            <span className="grid grid-cols-2" style={{ width: w * 3 }}>
              {[0, 1, 2, 3].map((k) => (
                <ArtImg key={k} art={art} kind={kind} style={{ width: w * 1.5, height: h * 1.5 }} />
              ))}
            </span>
          )}
        </div>

        {extra}

        <div className="grid grid-cols-2 gap-2">
          <button className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-primary"
            disabled={!canSave || (requirePixels && empty)}
            onClick={() => {
              sfx.star()
              onSave(art)
            }}
          >
            ✔ {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
