// Données pures de la base (aucune dépendance au store → pas de cycle d'import).
import type { BaseState, ResourceKey, WorkshopState } from '../types'
import { cleanArt } from './pixel'

export const GRID = 12
export const CELLS = GRID * GRID

export const BLOCK_IDS = ['grass', 'wood', 'stone', 'iron', 'gold', 'diamond', 'water', 'custom'] as const
export const BUILDING_IDS = ['house', 'tower', 'ramp', 'observatory', 'hall'] as const
export type BlockId = (typeof BLOCK_IDS)[number]
export type BuildingId = (typeof BUILDING_IDS)[number]
export type ItemId = BlockId | BuildingId
export const ALL_ITEMS: readonly string[] = [...BLOCK_IDS, ...BUILDING_IDS]

export const isBuilding = (id: string): id is BuildingId => (BUILDING_IDS as readonly string[]).includes(id)
export const isItem = (id: unknown): id is ItemId => typeof id === 'string' && ALL_ITEMS.includes(id)

export type Cost = Partial<Record<ResourceKey, number>>

export const COST: Record<ItemId, Cost> = {
  grass: { wood: 2 },
  wood: { wood: 2 },
  stone: { stone: 2 },
  iron: { iron: 2 },
  gold: { gold: 2 },
  diamond: { diamond: 2 },
  water: { stone: 2 },
  custom: { wood: 2, stone: 2 },
  house: { wood: 8, stone: 4 },
  tower: { stone: 10, iron: 3 },
  ramp: { wood: 8, iron: 3 },
  observatory: { iron: 5, gold: 3 },
  hall: { gold: 4, diamond: 1 },
}

/** Démolir rend la moitié (arrondie à l'inférieur) de chaque ressource. */
export function refundOf(id: ItemId): Cost {
  const out: Cost = {}
  ;(Object.entries(COST[id]) as [ResourceKey, number][]).forEach(([k, n]) => {
    const back = Math.floor(n / 2)
    if (back > 0) out[k] = back
  })
  return out
}

export const cellCol = (i: number) => i % GRID
export const cellRow = (i: number) => Math.floor(i / GRID)
/** « C4 » : colonne en lettre, rangée en chiffre. */
export const cellName = (i: number) => `${String.fromCharCode(65 + cellCol(i))}${cellRow(i) + 1}`

export function defaultBase(): BaseState {
  return {
    cells: Array(CELLS).fill(''),
    observatoryDay: null,
    chest: null,
    chestAt: 0,
    mapChestAt: 0,
    trophies: {},
  }
}

export function defaultWorkshop(): WorkshopState {
  return { parentUnlock: false, celebrated: [], skin: '', deck: '', block: '', blockName: '' }
}

/** Réparation d'une base importée ou ancienne : on garde ce qui est valide, le reste prend la valeur par défaut. */
export function sanitizeBase(raw: unknown): BaseState {
  const base = defaultBase()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<BaseState>
  if (Array.isArray(r.cells) && r.cells.length === CELLS) {
    base.cells = r.cells.map((c) => (isItem(c) ? c : ''))
  }
  if (typeof r.observatoryDay === 'string') base.observatoryDay = r.observatoryDay
  if (r.chest && typeof r.chest.cell === 'number' && r.chest.cell >= 0 && r.chest.cell < CELLS) {
    base.chest = { cell: Math.floor(r.chest.cell) }
  }
  if (typeof r.chestAt === 'number') base.chestAt = r.chestAt
  if (typeof r.mapChestAt === 'number') base.mapChestAt = r.mapChestAt
  if (r.trophies && typeof r.trophies === 'object') {
    for (const [qid, t] of Object.entries(r.trophies)) {
      if (t && typeof t === 'object' && [1, 2, 3].includes(t.stars) && typeof t.date === 'string') {
        base.trophies[qid] = { stars: t.stars, category: t.category, date: t.date }
      }
    }
  }
  return base
}

export function sanitizeWorkshop(raw: unknown): WorkshopState {
  const w = defaultWorkshop()
  if (!raw || typeof raw !== 'object') return w
  const r = raw as Partial<WorkshopState>
  w.parentUnlock = r.parentUnlock === true
  if (Array.isArray(r.celebrated)) w.celebrated = r.celebrated.filter((n) => n === 1 || n === 2 || n === 3)
  w.skin = cleanArt(r.skin, 'skin')
  w.deck = cleanArt(r.deck, 'deck')
  w.block = cleanArt(r.block, 'block')
  w.blockName = typeof r.blockName === 'string' ? r.blockName.slice(0, 16) : ''
  return w
}
