export type Category = 'math' | 'logic' | 'iq' | 'critical' | 'world'
export const CATEGORIES: Category[] = ['math', 'logic', 'iq', 'critical', 'world']

export type QType = 'number' | 'choice' | 'boolean_explain' | 'order' | 'highlight'

export interface Question {
  id: string
  category: Category
  topic: string
  difficulty: number
  type: QType
  lang: string
  prompt: string
  /** choice: 4 variantes · boolean_explain: les raisons · order: cartes DANS LE BON ORDRE · highlight: les phrases */
  options: string[] | null
  /** number: nombre · choice/highlight: index · boolean_explain: {value, reason} · order: textes dans le bon ordre */
  answer: number | string | string[] | { value: boolean; reason: number }
  explanation: string
  tags?: string[]
  skill?: string
  stars: number
  ladder?: string[]
  hints?: string[]
  image?: string | null
}

/** Ce que l'enfant est en train de répondre (avant validation) */
export type Draft =
  | { type: 'number'; text: string }
  | { type: 'choice'; index: number | null }
  | { type: 'boolean_explain'; value: boolean | null; reason: number | null }
  | { type: 'order'; perm: number[] } // perm[i] = index (dans options) de la carte affichée à la place i
  | { type: 'highlight'; index: number | null }

export type SlotKind = 'normal' | 'boss' | 'chest' | 'ladder' | 'fog'
export interface Slot {
  qid: string
  kind: SlotKind
  /** pour une étape d'approche : id de la tâche d'origine (zone de brouillard) */
  fogFor?: string
}

export type Confidence = 'high' | 'medium' | 'low' | null
export type ResourceKey = 'wood' | 'stone' | 'iron' | 'gold' | 'diamond'
export const RESOURCE_KEYS: ResourceKey[] = ['wood', 'stone', 'iron', 'gold', 'diamond']

export interface Outcome {
  qid: string
  kind: SlotKind
  correct: boolean
  /** boolean_explain : la valeur était bonne mais pas la raison (ou l'inverse) */
  partial: 'value_ok' | 'reason_ok' | null
  xp: number
  multiplier: number
  trick: string | null
  comboKept: boolean
  courageXp: number
  resource: { key: ResourceKey; amount: number } | null
  compassGained: number
  fogCreated: boolean
  fogCleared: boolean
  hints: number
  mentor: boolean
  confidence: Confidence
  given: string
}

export interface Session {
  id: string
  kind: 'main' | 'bonus'
  date: string
  slots: Slot[]
  index: number
  streak: number
  maxStreak: number
  xp: number
  correct: number
  resources: Partial<Record<ResourceKey, number>>
  compass: number
  outcomes: Outcome[]
  pending: Outcome | null
  hintsShown: number
  mentor: boolean
  countryId: string
  levelBefore: number
  warmup: boolean
  finished: boolean
}

export interface Attempt {
  qid: string
  category: Category
  topic: string
  difficulty: number
  correct: boolean
  confidence: Confidence
  hints: number
  mentor: boolean
  given: string
  at: number
  date: string
  sessionId: string
  discussed?: boolean
}

export interface FogEntry {
  steps: string[]
  done: string[]
  created: number
  attempts: number
  category: Category
  topic: string
}

export interface CaptainLogEntry {
  date: string
  countryId: string
  correct: number
  total: number
  kind: 'main' | 'bonus'
}

export interface Chest {
  countryId: string
  x: number
  y: number
  found: boolean
}

export interface Trophy {
  /** 1 = ★, 2 = ★★, 3 = ★★★ */
  stars: number
  category: Category
  date: string
}

/** La base 12×12 : une case = '' (terre) | un bloc | une construction. */
export interface BaseState {
  cells: string[]
  observatoryDay: string | null
  chest: { cell: number } | null
  chestAt: number
  mapChestAt: number
  trophies: Record<string, Trophy>
}

/** Atelier ??? : dessins 16×16 (une lettre hexadécimale par pixel, « . » = transparent). */
export interface WorkshopState {
  parentUnlock: boolean
  celebrated: number[]
  skin: string
  deck: string
  block: string
  blockName: string
}

export interface SaveState {
  version: 1
  xp: number
  compass: number
  resources: Record<ResourceKey, number>
  rating: Record<Category, number>
  history: Attempt[]
  seen: Record<string, { right: number; wrong: number; last: number }>
  fog: Record<string, FogEntry>
  expeditionsDone: number
  daysPlayed: string[]
  today: { date: string; main: boolean; bonus: boolean }
  streak: { count: number; last: string | null; freezeWeek: string | null }
  recent: { date: string; correct: number; total: number }[]
  visited: string[]
  log: CaptainLogEntry[]
  chests: Chest[]
  session: Session | null
  backup: { lastCount: number; promptedCount: number; lastAt: number | null }
  settings: { sound: boolean }
  parent: { pin: string; warmup: 'auto' | 'on' | 'off'; offset: number }
  customQuestions: Question[]
  base: BaseState
  workshop: WorkshopState
  createdAt: number
}
