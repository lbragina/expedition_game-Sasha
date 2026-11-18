import { CELLS, GRID, cellCol, cellRow } from '../game/baseData'
import { artToUrl, deckOf, skinOf } from '../game/pixel'
import { ChestArt, Tile } from './Sprites'
import type { SaveState } from '../types'

const PAD_TOP = 24 // place au-dessus pour les constructions hautes

export default function BaseGrid({
  state,
  selected,
  movingFrom,
  zoom,
  alertObservatory,
  onTap,
}: {
  state: SaveState
  selected: number | null
  movingFrom: number | null
  zoom: number
  alertObservatory: boolean
  onTap: (cell: number) => void
}) {
  const { cells, chest } = state.base
  const customUrl = state.workshop.block ? artToUrl(state.workshop.block, 'block') : undefined
  const skinUrl = artToUrl(skinOf(state.workshop.skin), 'skin')
  const deckUrl = artToUrl(deckOf(state.workshop.deck), 'deck')

  const rows = Array.from({ length: GRID }, (_, r) => r)

  return (
    <div className="max-h-[62vh] overflow-auto rounded-lg border-4 border-black bg-[#0b1d33]" style={{ WebkitOverflowScrolling: 'touch' }}>
      <svg
        viewBox={`0 ${-PAD_TOP} ${GRID * 16} ${GRID * 16 + PAD_TOP}`}
        style={{ width: `${zoom * 100}%`, display: 'block' }}
        shapeRendering="crispEdges"
        role="img"
      >
        {/* de haut en bas : les constructions hautes recouvrent la rangée du dessus */}
        {rows.map((r) => (
          <g key={r}>
            {Array.from({ length: GRID }, (_, c) => {
              const i = r * GRID + c
              return (
                <g key={i}>
                  <Tile id={cells[i]} index={i} x={c * 16} y={r * 16} customUrl={customUrl} alert={alertObservatory} />
                  {cells[i] === 'ramp' && (
                    <g transform={`translate(${c * 16 + 3} ${r * 16 + 3})`}>
                      <g className="animate-skater">
                        <image href={skinUrl} x="0" y="0" width="8" height="8" style={{ imageRendering: 'pixelated' }} />
                        <g className="animate-skater-deck">
                          <image href={deckUrl} x="-0.5" y="7.4" width="9" height="3.4" style={{ imageRendering: 'pixelated' }} />
                        </g>
                      </g>
                    </g>
                  )}
                  {chest?.cell === i && <ChestArt x={c * 16} y={r * 16} />}
                </g>
              )
            })}
          </g>
        ))}

        {/* sélection (au-dessus de tout) */}
        {selected !== null && (
          <rect
            x={cellCol(selected) * 16 + 0.5}
            y={cellRow(selected) * 16 + 0.5}
            width="15"
            height="15"
            fill="none"
            stroke="#4de2e0"
            strokeWidth="1.4"
            strokeDasharray="3 1.5"
            className="animate-sparkle"
          />
        )}
        {movingFrom !== null && (
          <rect
            x={cellCol(movingFrom) * 16 + 0.5}
            y={cellRow(movingFrom) * 16 + 0.5}
            width="15"
            height="15"
            fill="#f5c518"
            fillOpacity="0.25"
            stroke="#f5c518"
            strokeWidth="1.2"
          />
        )}

        {/* zones tactiles */}
        {Array.from({ length: CELLS }, (_, i) => (
          <rect
            key={i}
            x={cellCol(i) * 16}
            y={cellRow(i) * 16}
            width="16"
            height="16"
            fill="transparent"
            onClick={() => onTap(i)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </svg>
    </div>
  )
}
