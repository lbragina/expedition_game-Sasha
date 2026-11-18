import { useEffect, useState } from 'react'
import {
  canAfford,
  collectBaseChest,
  demolishCell,
  moveCell,
  observatoryAvailable,
  placeItem,
} from '../game/base'
import {
  BLOCK_IDS,
  BUILDING_IDS,
  COST,
  cellName,
  isBuilding,
  refundOf,
  type Cost,
  type ItemId,
} from '../game/baseData'
import { artToUrl } from '../game/pixel'
import { sfx } from '../game/sound'
import { useGame } from '../game/store'
import { t } from '../i18n'
import type { ResourceKey } from '../types'
import BaseGrid from './BaseGrid'
import Observatory from './Observatory'
import { SkaterSprite, TileIcon } from './Sprites'
import { HallModal, TrophyList } from './Trophies'

const RES_ICON: Record<ResourceKey, string> = { wood: '🪵', stone: '🪨', iron: '⛓️', gold: '🥇', diamond: '💎' }
const ZOOMS = [1, 1.5, 2, 3]

function CostChips({ cost, have }: { cost: Cost; have?: Record<ResourceKey, number> }) {
  return (
    <span className="inline-flex flex-wrap justify-center gap-x-1.5 text-[11px] font-bold">
      {(Object.entries(cost) as [ResourceKey, number][]).map(([k, n]) => (
        <span key={k} className={have && have[k] < n ? 'text-danger' : ''}>
          {RES_ICON[k]}
          {n}
        </span>
      ))}
    </span>
  )
}

/** Plateau 12×12 : choisir une case, confirmer, poser / démolir / déplacer. */
export default function BaseBuilder() {
  const s = useGame()
  const [zoomIdx, setZoomIdx] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [tool, setTool] = useState<ItemId | null>(null)
  const [moving, setMoving] = useState<number | null>(null)
  const [palTab, setPalTab] = useState<'blocks' | 'buildings'>('blocks')
  const [msg, setMsg] = useState<string | null>(null)
  const [obsOpen, setObsOpen] = useState(false)
  const [hallOpen, setHallOpen] = useState(false)

  useEffect(() => {
    if (!msg) return
    const id = setTimeout(() => setMsg(null), 2600)
    return () => clearTimeout(id)
  }, [msg])

  const cells = s.base.cells
  const name = (id: string) => (id === 'custom' ? s.workshop.blockName || t('base.items.custom') : t(`base.items.${id}`))
  const customUrl = s.workshop.block ? artToUrl(s.workshop.block, 'block') : undefined
  const selItem = sel !== null ? (cells[sel] as ItemId | '') : ''
  const alertObs = cells.includes('observatory') && observatoryAvailable(s)

  const onTap = (i: number) => {
    sfx.unlock()
    if (s.base.chest?.cell === i) {
      collectBaseChest()
      sfx.chest()
      setMsg(t('base.chest_found'))
      return
    }
    sfx.click()
    setSel(i)
  }

  const place = () => {
    if (sel === null || !tool) return
    const r = placeItem(sel, tool)
    if (r === 'ok') {
      sfx.build()
      if (isBuilding(tool)) setTool(null)
    } else setMsg(t(`base.err_${r}`))
  }

  const demolish = () => {
    if (sel === null || !selItem) return
    if (isBuilding(selItem) && !window.confirm(t('base.confirm_demolish', { name: name(selItem) }))) return
    const back = demolishCell(sel)
    sfx.demolish()
    const text = (Object.entries(back) as [ResourceKey, number][]).map(([k, n]) => `${RES_ICON[k]}+${n}`).join(' ')
    setMsg(text ? t('base.refunded', { res: text }) : null)
  }

  const moveHere = () => {
    if (sel === null || moving === null) return
    if (moveCell(moving, sel)) {
      sfx.build()
      setMoving(null)
    }
  }

  const items = palTab === 'blocks' ? BLOCK_IDS : BUILDING_IDS

  return (
    <>
      <div className="card space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-diamond">🏝️ {t('base.my_island')}</h3>
          <div className="flex items-center gap-1">
            <button
              className="btn !min-h-[44px] !w-11 !px-0 text-xl"
              aria-label={t('base.zoom_out')}
              disabled={zoomIdx === 0}
              onClick={() => setZoomIdx((z) => Math.max(0, z - 1))}
            >
              −
            </button>
            <span className="w-10 text-center text-xs font-bold text-mute">×{ZOOMS[zoomIdx]}</span>
            <button
              className="btn !min-h-[44px] !w-11 !px-0 text-xl"
              aria-label={t('base.zoom_in')}
              disabled={zoomIdx === ZOOMS.length - 1}
              onClick={() => setZoomIdx((z) => Math.min(ZOOMS.length - 1, z + 1))}
            >
              +
            </button>
          </div>
        </div>

        <BaseGrid
          state={s}
          selected={sel}
          movingFrom={moving}
          zoom={ZOOMS[zoomIdx]}
          alertObservatory={alertObs}
          onTap={onTap}
        />

        {msg && <p className="animate-trick rounded-lg border-2 border-gold bg-night p-2 text-center text-sm font-bold text-gold">{msg}</p>}

        {/* panneau de confirmation */}
        <div className="space-y-2 rounded-lg border-2 border-diamond/60 bg-night p-2">
          {sel === null && <p className="text-sm text-mute">{t('base.select_hint')}</p>}

          {sel !== null && (
            <p className="text-sm font-bold">
              📍 {t('base.cell', { cell: cellName(sel) })} ·{' '}
              <span className="text-diamond">{selItem ? name(selItem) : t('base.free_ground')}</span>
            </p>
          )}

          {sel !== null && selItem === '' && moving !== null && (
            <>
              <p className="text-xs text-mute">{t('base.moving', { name: name(cells[moving]) })}</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn" onClick={() => setMoving(null)}>
                  {t('common.cancel')}
                </button>
                <button className="btn btn-gold" onClick={moveHere}>
                  {t('base.move_here')}
                </button>
              </div>
            </>
          )}

          {sel !== null && selItem === '' && moving === null && (
            <>
              {!tool && <p className="text-xs text-mute">{t('base.pick_tool')}</p>}
              {tool && (
                <button
                  className="btn btn-primary"
                  disabled={!canAfford(s.resources, tool)}
                  onClick={place}
                >
                  <span>🔨 {t('base.place', { name: name(tool) })}</span>
                  <CostChips cost={COST[tool]} have={s.resources} />
                </button>
              )}
            </>
          )}

          {sel !== null && selItem !== '' && (
            <>
              {isBuilding(selItem) && <p className="text-xs text-mute">{t(`base.desc.${selItem}`)}</p>}
              {moving !== null && <p className="text-xs text-mute">{t('base.moving_pick')}</p>}
              <div className="grid grid-cols-2 gap-2">
                {selItem === 'observatory' && (
                  <button className="btn btn-gold col-span-2" onClick={() => setObsOpen(true)}>
                    🔭 {t('base.open_observatory')} {alertObs && '❗'}
                  </button>
                )}
                {selItem === 'hall' && (
                  <button className="btn btn-gold col-span-2" onClick={() => setHallOpen(true)}>
                    🏆 {t('base.open_hall')}
                  </button>
                )}
                <button
                  className="btn"
                  onClick={() => {
                    setMoving(sel)
                  }}
                >
                  <span>↔️ {t('base.move')}</span>
                </button>
                <button className="btn btn-danger" onClick={demolish}>
                  <span>🧨 {t('base.demolish')}</span>
                  {Object.keys(refundOf(selItem)).length > 0 && <CostChips cost={refundOf(selItem)} />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* boîte à blocs */}
        <div className="grid grid-cols-2 gap-2">
          {(['blocks', 'buildings'] as const).map((tab) => (
            <button key={tab} className={`btn !min-h-[40px] text-sm ${palTab === tab ? 'btn-gold' : ''}`} onClick={() => setPalTab(tab)}>
              {t(`base.tab_${tab}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {items.map((id) => {
            const built = isBuilding(id) && cells.includes(id)
            const locked = id === 'custom' && !s.workshop.block
            const poor = !canAfford(s.resources, id)
            return (
              <button
                key={id}
                disabled={built}
                onClick={() => {
                  sfx.click()
                  setTool(id)
                  setMoving(null)
                  if (locked) setMsg(t('base.err_noart'))
                }}
                className={`flex flex-col items-center justify-end gap-0.5 rounded-lg border-4 bg-panel2 p-1 ${
                  tool === id ? 'border-diamond' : 'border-black'
                } ${built || locked ? 'opacity-40' : poor ? 'opacity-75' : ''}`}
              >
                <TileIcon id={id} size={40} customUrl={customUrl} />
                <span className="w-full truncate text-center text-[10px] font-bold leading-tight">{name(id)}</span>
                {built ? <span className="text-[10px] text-mute">{t('base.built')}</span> : <CostChips cost={COST[id]} have={s.resources} />}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3 rounded-lg border-2 border-line bg-panel2 p-2">
          <SkaterSprite size={40} flip={false} />
          <p className="text-xs text-mute">{t('base.explorer_note')}</p>
        </div>
      </div>

      {obsOpen && <Observatory onClose={() => setObsOpen(false)} />}
      {hallOpen && <HallModal onClose={() => setHallOpen(false)} />}
    </>
  )
}

/** Carte « Salle des Trophées » : visible dans la base, la vitrine s'ouvre une fois la salle construite. */
export function HallCard() {
  const s = useGame()
  const built = s.base.cells.includes('hall')
  const count = Object.keys(s.base.trophies).length
  return (
    <div className="card space-y-2">
      <h3 className="font-bold text-gold">🏆 {t('base.hall_of_fame')}</h3>
      {built ? (
        <TrophyList />
      ) : (
        <p className="text-sm text-mute">{count > 0 ? t('base.hall_locked', { count }) : t('base.hall_build_hint')}</p>
      )}
    </div>
  )
}
