import { useSyncExternalStore } from 'react'
import { CATEGORIES, RESOURCE_KEYS, type Category, type SaveState } from '../types'
import { START_RATING } from './elo'
import { setSoundEnabled } from './sound'

const KEY = 'expedition-save-v1'
const MAX_HISTORY = 3000

export function todayStr(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function defaultState(): SaveState {
  const rating = {} as Record<Category, number>
  CATEGORIES.forEach((c) => (rating[c] = START_RATING))
  const resources = {} as SaveState['resources']
  RESOURCE_KEYS.forEach((k) => (resources[k] = 0))
  return {
    version: 1,
    xp: 0,
    compass: 3,
    resources,
    rating,
    history: [],
    seen: {},
    fog: {},
    expeditionsDone: 0,
    daysPlayed: [],
    today: { date: todayStr(), main: false, bonus: false },
    streak: { count: 0, last: null, freezeWeek: null },
    recent: [],
    visited: [],
    log: [],
    chests: [],
    session: null,
    backup: { lastCount: 0, promptedCount: -1, lastAt: null },
    settings: { sound: true },
    parent: { pin: '1234', warmup: 'auto', offset: 0 },
    customQuestions: [],
    createdAt: Date.now(),
  }
}

/** Complète une sauvegarde ancienne ou importée avec les valeurs par défaut. */
export function normalizeState(raw: unknown): SaveState {
  const base = defaultState()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<SaveState>
  return {
    ...base,
    ...r,
    resources: { ...base.resources, ...(r.resources ?? {}) },
    rating: { ...base.rating, ...(r.rating ?? {}) },
    today: { ...base.today, ...(r.today ?? {}) },
    streak: { ...base.streak, ...(r.streak ?? {}) },
    backup: { ...base.backup, ...(r.backup ?? {}) },
    settings: { ...base.settings, ...(r.settings ?? {}) },
    parent: { ...base.parent, ...(r.parent ?? {}) },
    version: 1,
  }
}

function load(): SaveState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return rollDay(normalizeState(JSON.parse(raw)))
  } catch {
    /* sauvegarde illisible : on repart de zéro */
  }
  return defaultState()
}

/** Nouveau jour → les expéditions du jour sont de nouveau disponibles. */
function rollDay(s: SaveState): SaveState {
  const today = todayStr()
  if (s.today.date !== today) s.today = { date: today, main: false, bonus: false }
  return s
}

let state: SaveState = load()
setSoundEnabled(state.settings.sound)
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* stockage plein ou bloqué */
  }
}

export function getState(): SaveState {
  return state
}

/** Modifie une copie de l'état, puis sauvegarde et prévient l'interface. */
export function update(mutator: (draft: SaveState) => void) {
  const draft = structuredClone(state)
  mutator(draft)
  if (draft.history.length > MAX_HISTORY) draft.history = draft.history.slice(-MAX_HISTORY)
  state = draft
  persist()
  listeners.forEach((l) => l())
}

export function replaceState(next: SaveState) {
  state = rollDay(normalizeState(next))
  setSoundEnabled(state.settings.sound)
  persist()
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useGame(): SaveState {
  return useSyncExternalStore(subscribe, getState, getState)
}

// Le jour peut changer pendant que l'appli reste ouverte.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.today.date !== todayStr()) {
      update((d) => rollDay(d))
    }
  })
}
