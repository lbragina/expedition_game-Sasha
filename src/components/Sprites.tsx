// Dessins de la base (SVG pixel-art avec un peu de volume) et personnage de Sasha.
import type { CSSProperties, ReactNode } from 'react'
import { isBuilding, type ItemId } from '../game/baseData'
import { ART_SIZE, artToUrl, deckOf, skinOf } from '../game/pixel'
import { useGame } from '../game/store'

/** Petit bruit déterministe : même case → mêmes détails à chaque rendu. */
const noise = (i: number, k: number, m: number) => ((Math.imul(i + 1, 2654435761) ^ Math.imul(k + 7, 40503)) >>> 0) % m

const PIX = { imageRendering: 'pixelated' as const }

/** Bloc « cube » : face du dessus + face avant plus sombre = pseudo-volume. */
function Cube({ x, y, top, front, light, children }: { x: number; y: number; top: string; front: string; light: string; children?: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width="16" height="12" fill={top} />
      <rect x={x} y={y} width="16" height="1" fill={light} />
      <rect x={x} y={y} width="1" height="12" fill={light} opacity="0.6" />
      {children}
      <rect x={x} y={y + 12} width="16" height="4" fill={front} />
      <rect x={x} y={y + 15} width="16" height="1" fill="#000" opacity="0.35" />
    </g>
  )
}

function Dirt({ x, y, i }: { x: number; y: number; i: number }) {
  return (
    <g>
      <rect x={x} y={y} width="16" height="16" fill={(i + Math.floor(i / 12)) % 2 ? '#7a6847' : '#76644a'} />
      {[0, 1, 2].map((k) => (
        <rect key={k} x={x + noise(i, k, 14)} y={y + noise(i, k + 9, 14)} width="2" height="1" fill={k % 2 ? '#8b7855' : '#6a5a3b'} />
      ))}
    </g>
  )
}

function Grass({ x, y, i }: { x: number; y: number; i: number }) {
  return (
    <g>
      <rect x={x} y={y} width="16" height="16" fill={(i + Math.floor(i / 12)) % 2 ? '#4caf50' : '#46a64b'} />
      {[0, 1, 2, 3].map((k) => {
        const bx = x + 1 + noise(i, k, 13)
        const by = y + 1 + noise(i, k + 5, 12)
        return (
          <g key={k}>
            <rect x={bx} y={by} width="1" height="2" fill="#2f8a36" />
            <rect x={bx + 1} y={by + 1} width="1" height="1" fill="#8fd694" />
          </g>
        )
      })}
    </g>
  )
}

function Water({ x, y, i }: { x: number; y: number; i: number }) {
  return (
    <g>
      <rect x={x} y={y} width="16" height="16" fill="#1e6fd0" />
      {[0, 1, 2].map((k) => (
        <rect key={k} x={x + 1 + noise(i, k, 10)} y={y + 2 + k * 5} width="4" height="1" fill="#6bb4f5" opacity="0.8" />
      ))}
    </g>
  )
}

function Chest({ x, y }: { x: number; y: number }) {
  return (
    <g className="animate-sparkle">
      <rect x={x + 3} y={y + 5} width="10" height="8" fill="#8c5f2b" />
      <rect x={x + 3} y={y + 5} width="10" height="3" fill="#b07a3e" />
      <rect x={x + 3} y={y + 8} width="10" height="1" fill="#000" opacity="0.5" />
      <rect x={x + 7} y={y + 5} width="2" height="8" fill="#f5c518" />
      <rect x={x + 7} y={y + 8} width="2" height="2" fill="#fff" />
      <rect x={x + 11} y={y + 2} width="1" height="1" fill="#fff" />
      <rect x={x + 4} y={y + 3} width="1" height="1" fill="#fff3a0" />
    </g>
  )
}
export { Chest as ChestArt }

function House({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x + 8} cy={y + 15} rx="7.5" ry="1.4" fill="#000" opacity="0.3" />
      <rect x={x + 11} y={y} width="2" height="5" fill="#6b7076" />
      <rect x={x + 2} y={y + 6} width="12" height="9" fill="#b07a3e" />
      <rect x={x + 2} y={y + 9} width="12" height="1" fill="#8c5f2b" />
      <rect x={x + 2} y={y + 12} width="12" height="1" fill="#8c5f2b" />
      <polygon points={`${x},${y + 7} ${x + 8},${y - 2} ${x + 16},${y + 7}`} fill="#c62828" />
      <polygon points={`${x},${y + 7} ${x + 8},${y - 2} ${x + 8},${y + 7}`} fill="#e05050" />
      <rect x={x + 6.5} y={y + 10} width="3" height="5" fill="#5b3a1a" />
      <rect x={x + 3.5} y={y + 8.5} width="2.5" height="2.5" fill="#cfe9ff" />
      <rect x={x + 10} y={y + 8.5} width="2.5" height="2.5" fill="#cfe9ff" />
    </g>
  )
}

function Tower({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x + 8} cy={y + 15} rx="6.5" ry="1.4" fill="#000" opacity="0.3" />
      <rect x={x + 4} y={y - 10} width="8" height="25" fill="#9aa0a6" />
      <rect x={x + 9.5} y={y - 10} width="2.5" height="25" fill="#7d8388" />
      <rect x={x + 3} y={y - 13} width="2" height="3" fill="#9aa0a6" />
      <rect x={x + 7} y={y - 13} width="2" height="3" fill="#9aa0a6" />
      <rect x={x + 11} y={y - 13} width="2" height="3" fill="#7d8388" />
      <rect x={x + 7} y={y - 5} width="2" height="4" fill="#1b2030" />
      <rect x={x + 7} y={y + 3} width="2" height="4" fill="#1b2030" />
      <rect x={x + 6.5} y={y + 10} width="3" height="5" fill="#5b3a1a" />
      <rect x={x + 8} y={y - 21} width="1" height="8" fill="#5b3a1a" />
      <polygon points={`${x + 9},${y - 21} ${x + 14},${y - 19} ${x + 9},${y - 17}`} fill="#ef5350" />
    </g>
  )
}

function Ramp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x + 8} cy={y + 15} rx="7.5" ry="1.2" fill="#000" opacity="0.3" />
      <path d={`M${x + 1} ${y + 14.5} Q${x + 12} ${y + 14} ${x + 15} ${y + 2} L${x + 15} ${y + 14.5} Z`} fill="#b07a3e" />
      <path d={`M${x + 1} ${y + 14.5} Q${x + 12} ${y + 14} ${x + 15} ${y + 2}`} fill="none" stroke="#e0b070" strokeWidth="1" />
      <rect x={x + 14} y={y + 1.5} width="2" height="2" fill="#d8d8e0" />
      <rect x={x + 1} y={y + 14} width="14" height="1.5" fill="#7a5226" />
    </g>
  )
}

function Observatory({ x, y, alert }: { x: number; y: number; alert?: boolean }) {
  return (
    <g>
      <ellipse cx={x + 8} cy={y + 15} rx="7.5" ry="1.4" fill="#000" opacity="0.3" />
      <rect x={x + 2} y={y + 8} width="12" height="7" fill="#9aa0a6" />
      <rect x={x + 2} y={y + 8} width="12" height="1" fill="#c3c8cc" />
      <path d={`M${x + 3} ${y + 8} A5 6.5 0 0 1 ${x + 13} ${y + 8} Z`} fill="#e8eef8" />
      <path d={`M${x + 8} ${y + 8} A5 6.5 0 0 1 ${x + 13} ${y + 8} Z`} fill="#c3cfe6" />
      <rect x={x + 7.2} y={y + 2} width="1.6" height="5.5" fill="#1b2030" />
      <line x1={x + 8} y1={y + 6} x2={x + 13.5} y2={y} stroke="#4de2e0" strokeWidth="1.6" />
      <rect x={x + 6.5} y={y + 11} width="3" height="4" fill="#3a4466" />
      {alert && (
        <g className="animate-sparkle">
          <circle cx={x + 13} cy={y - 3} r="3.4" fill="#f5c518" stroke="#000" strokeWidth="0.6" />
          <text x={x + 13} y={y - 1.4} fontSize="5" fontWeight="bold" textAnchor="middle" fill="#000">
            ?
          </text>
        </g>
      )}
    </g>
  )
}

function Hall({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x + 8} cy={y + 15} rx="7.5" ry="1.4" fill="#000" opacity="0.3" />
      <rect x={x + 1} y={y + 12} width="14" height="3" fill="#d8d8e0" />
      {[3, 7, 11].map((dx) => (
        <rect key={dx} x={x + dx} y={y + 4} width="2" height="8" fill="#f2f2f7" />
      ))}
      <rect x={x + 1} y={y + 3} width="14" height="1.5" fill="#d8d8e0" />
      <polygon points={`${x},${y + 3.5} ${x + 8},${y - 3} ${x + 16},${y + 3.5}`} fill="#f5c518" />
      <rect x={x + 6} y={y - 9} width="4" height="3" fill="#f5c518" />
      <rect x={x + 7.4} y={y - 6} width="1.2" height="2" fill="#f5c518" />
      <rect x={x + 6} y={y - 4.2} width="4" height="1" fill="#b08d0c" />
      <rect x={x + 5} y={y - 9} width="1" height="2" fill="#f5c518" />
      <rect x={x + 10} y={y - 9} width="1" height="2" fill="#f5c518" />
    </g>
  )
}

/** Une case de la base (x, y = coin haut-gauche dans le repère SVG, 16 unités par case). */
export function Tile({
  id,
  index,
  x,
  y,
  customUrl,
  alert,
}: {
  id: string
  index: number
  x: number
  y: number
  customUrl?: string
  alert?: boolean
}) {
  switch (id as ItemId | '') {
    case '':
      return <Dirt x={x} y={y} i={index} />
    case 'grass':
      return <Grass x={x} y={y} i={index} />
    case 'water':
      return <Water x={x} y={y} i={index} />
    case 'wood':
      return (
        <Cube x={x} y={y} top="#b07a3e" front="#7a5226" light="#d29a58">
          <rect x={x} y={y + 4} width="16" height="1" fill="#8c5f2b" />
          <rect x={x} y={y + 8} width="16" height="1" fill="#8c5f2b" />
          <rect x={x + 5 + noise(index, 1, 6)} y={y} width="1" height="4" fill="#8c5f2b" />
          <rect x={x + 3 + noise(index, 2, 8)} y={y + 4} width="1" height="4" fill="#8c5f2b" />
        </Cube>
      )
    case 'stone':
      return (
        <Cube x={x} y={y} top="#9aa0a6" front="#6b7076" light="#c3c8cc">
          <rect x={x + 2} y={y + 3} width="3" height="2" fill="#7d8388" />
          <rect x={x + 9} y={y + 6} width="4" height="2" fill="#7d8388" />
          <rect x={x + 8} y={y + 2} width="2" height="1" fill="#b8bdc2" />
        </Cube>
      )
    case 'iron':
      return (
        <Cube x={x} y={y} top="#d8d8e0" front="#9a9aa6" light="#fff">
          <rect x={x + 1} y={y + 1.5} width="2" height="2" fill="#9a9aa6" />
          <rect x={x + 13} y={y + 1.5} width="2" height="2" fill="#9a9aa6" />
          <rect x={x + 1} y={y + 8} width="2" height="2" fill="#9a9aa6" />
          <rect x={x + 13} y={y + 8} width="2" height="2" fill="#9a9aa6" />
          <rect x={x + 6} y={y + 4} width="4" height="4" fill="#b5b5c2" />
        </Cube>
      )
    case 'gold':
      return (
        <Cube x={x} y={y} top="#f5c518" front="#b08d0c" light="#fff3a0">
          <rect x={x + 3} y={y + 3} width="4" height="1" fill="#fff3a0" />
          <rect x={x + 3} y={y + 4} width="1" height="2" fill="#fff3a0" />
          <rect x={x + 10} y={y + 7} width="3" height="1" fill="#d9a800" />
        </Cube>
      )
    case 'diamond':
      return (
        <Cube x={x} y={y} top="#4de2e0" front="#2b9c9a" light="#b8fffd">
          <polygon points={`${x + 8},${y + 2} ${x + 12},${y + 6} ${x + 8},${y + 10} ${x + 4},${y + 6}`} fill="#b8fffd" opacity="0.8" />
          <polygon points={`${x + 8},${y + 2} ${x + 12},${y + 6} ${x + 8},${y + 6}`} fill="#fff" opacity="0.7" />
        </Cube>
      )
    case 'custom':
      return (
        <g>
          {customUrl ? (
            <image href={customUrl} x={x} y={y} width="16" height="16" style={PIX} preserveAspectRatio="none" />
          ) : (
            <rect x={x} y={y} width="16" height="16" fill="#9c27b0" />
          )}
          <rect x={x} y={y + 13} width="16" height="3" fill="#000" opacity="0.35" />
          <rect x={x} y={y} width="16" height="1" fill="#fff" opacity="0.5" />
        </g>
      )
    case 'house':
      return (
        <g>
          <Grass x={x} y={y} i={index} />
          <House x={x} y={y} />
        </g>
      )
    case 'tower':
      return (
        <g>
          <Grass x={x} y={y} i={index} />
          <Tower x={x} y={y} />
        </g>
      )
    case 'ramp':
      return (
        <g>
          <Grass x={x} y={y} i={index} />
          <Ramp x={x} y={y} />
        </g>
      )
    case 'observatory':
      return (
        <g>
          <Grass x={x} y={y} i={index} />
          <Observatory x={x} y={y} alert={alert} />
        </g>
      )
    case 'hall':
      return (
        <g>
          <Grass x={x} y={y} i={index} />
          <Hall x={x} y={y} />
        </g>
      )
    default:
      return <Dirt x={x} y={y} i={index} />
  }
}

/** Vignette pour la boîte à blocs. */
export function TileIcon({ id, size = 40, customUrl }: { id: string; size?: number; customUrl?: string }) {
  const tall = isBuilding(id)
  return (
    <svg
      viewBox={tall ? '-1 -22 18 39' : '-1 -1 18 18'}
      width={tall ? size * 0.7 : size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden
    >
      <Tile id={id} index={3} x={0} y={0} customUrl={customUrl} />
    </svg>
  )
}

/** Image d'un dessin de Sasha (personnage, planche de skate ou bloc). */
export function ArtImg({ art, kind, className, style }: { art: string; kind: 'skin' | 'deck' | 'block'; className?: string; style?: CSSProperties }) {
  const { w, h } = ART_SIZE[kind]
  return <img src={artToUrl(art, kind)} width={w} height={h} alt="" draggable={false} className={className} style={{ ...PIX, ...style }} />
}

/** Sasha sur son skate (dessins de l'Atelier si dessinés, sinon ceux par défaut). Le skate fait un flip. */
export function SkaterSprite({ size = 64, flip = true }: { size?: number; flip?: boolean }) {
  const w = useGame().workshop
  return (
    <span className="inline-flex flex-col items-center" style={{ width: size }}>
      <ArtImg art={skinOf(w.skin)} kind="skin" style={{ width: size, height: size }} />
      <ArtImg
        art={deckOf(w.deck)}
        kind="deck"
        className={flip ? 'animate-flip' : ''}
        style={{ width: size * 0.9, height: size * 0.9 * (6 / 16), marginTop: -size * 0.04 }}
      />
    </span>
  )
}
