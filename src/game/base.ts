// Actions de la base : poser, démolir, déplacer, coffres, observatoire.
import { tObj } from '../i18n'
import { RESOURCE_KEYS, type ResourceKey, type SaveState } from '../types'
import { CELLS, COST, GRID, isBuilding, refundOf, type ItemId } from './baseData'
import { hasPixels } from './pixel'
import { getState, todayStr, update } from './store'

export type PlaceResult = 'ok' | 'occupied' | 'poor' | 'unique' | 'noart'

export function canAfford(res: SaveState['resources'], id: ItemId): boolean {
  return (Object.entries(COST[id]) as [ResourceKey, number][]).every(([k, n]) => res[k] >= n)
}

export function placeItem(cell: number, id: ItemId): PlaceResult {
  const s = getState()
  if (s.base.cells[cell] !== '') return 'occupied'
  if (isBuilding(id) && s.base.cells.includes(id)) return 'unique'
  if (id === 'custom' && !hasPixels(s.workshop.block)) return 'noart'
  if (!canAfford(s.resources, id)) return 'poor'
  update((d) => {
    ;(Object.entries(COST[id]) as [ResourceKey, number][]).forEach(([k, n]) => (d.resources[k] -= n))
    d.base.cells[cell] = id
  })
  return 'ok'
}

/** Démolit la case et rend la moitié des ressources. Renvoie ce qui a été rendu. */
export function demolishCell(cell: number): Partial<Record<ResourceKey, number>> {
  const id = getState().base.cells[cell] as ItemId | ''
  if (!id) return {}
  const back = refundOf(id)
  update((d) => {
    ;(Object.entries(back) as [ResourceKey, number][]).forEach(([k, n]) => (d.resources[k] += n))
    d.base.cells[cell] = ''
  })
  return back
}

/** Déplacer = gratuit (la case d'arrivée doit être libre). */
export function moveCell(from: number, to: number): boolean {
  const s = getState()
  if (from === to || !s.base.cells[from] || s.base.cells[to] !== '') return false
  update((d) => {
    d.base.cells[to] = d.base.cells[from]
    d.base.cells[from] = ''
    if (d.base.chest?.cell === to) d.base.chest = null
  })
  return true
}

/* ------------------------------------------------------------- Observatoire */

export interface AstroQuestion {
  q: string
  options: string[]
  answer: number
  explanation: string
}

export function astroQuestions(): AstroQuestion[] {
  return tObj<AstroQuestion[]>('astronomy.questions') ?? []
}

export function observatoryAvailable(s: SaveState): boolean {
  return s.base.observatoryDay !== todayStr()
}

/** Question du jour : la même toute la journée, différente chaque jour. */
export function todaysAstroQuestion(date = todayStr()): AstroQuestion | null {
  const list = astroQuestions()
  if (!list.length) return null
  const day = Math.floor(new Date(date + 'T12:00:00').getTime() / 86400000)
  return list[day % list.length]
}

/** Une seule tentative par jour ; 1 diamant si la réponse est bonne. */
export function answerObservatory(correct: boolean) {
  update((d) => {
    if (d.base.observatoryDay === todayStr()) return
    d.base.observatoryDay = todayStr()
    if (correct) d.resources.diamond += 1
  })
}

/* ----------------------------------------------------------------- Coffres */

const HOUR = 3600 * 1000

export function collectBaseChest() {
  update((d) => {
    if (!d.base.chest) return
    d.base.chest = null
    d.compass += 1
  })
}

/**
 * Fait apparaître de temps en temps un petit coffre : sur la carte (près d'un pays visité) ou sur la base (case libre).
 * Appelé à l'ouverture des onglets Carte / Base, puis toutes les minutes. N'écrit rien si rien ne change.
 */
export function rollChests() {
  const s = getState()
  const now = Date.now()
  const mapDue = s.visited.length > 0 && now - s.base.mapChestAt > 4 * HOUR && !s.chests.some((c) => !c.found)
  const baseDue = !s.base.chest && now - s.base.chestAt > 3 * HOUR
  if (!mapDue && !baseDue) return
  update((d) => {
    if (mapDue) {
      d.base.mapChestAt = now
      if (Math.random() < 0.7) {
        const id = d.visited[Math.floor(Math.random() * d.visited.length)]
        const sign = () => (Math.random() < 0.5 ? -1 : 1)
        d.chests.push({
          countryId: id,
          x: sign() * (11 + Math.random() * 10),
          y: sign() * (8 + Math.random() * 8),
          found: false,
        })
      }
    }
    if (baseDue) {
      d.base.chestAt = now
      const free = d.base.cells.map((c, i) => (c === '' ? i : -1)).filter((i) => i >= 0)
      if (free.length && Math.random() < 0.7) d.base.chest = { cell: free[Math.floor(Math.random() * free.length)] }
    }
  })
}

/* ----------------------------------------------------------------- Trophées */

export interface TrophyItem {
  qid: string
  stars: number
  category: string
  date: string
}

export function trophyList(s: SaveState): TrophyItem[] {
  return Object.entries(s.base.trophies)
    .map(([qid, t]) => ({ qid, ...t }))
    .sort((a, b) => b.stars - a.stars || b.date.localeCompare(a.date))
}

export { CELLS, GRID, RESOURCE_KEYS }
