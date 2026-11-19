// Saison : constantes, valeurs par défaut et règles de points (fonctions « pures » sur un brouillon d'état).
// Les actions qui sauvegardent (réclamer un palier, écrire une récompense…) sont dans season.ts.
import type { Question, ResourceKey, SaveState, SeasonState, Session } from '../types'

export const TIERS = 30
/** Points nécessaires pour monter d'un palier (≈ 130 points par expédition → saison d'environ 6 semaines). */
export const TIER_POINTS = 250
/** Paliers qui ont un vrai cadeau choisi par le parent. */
export const REWARD_TIERS = [5, 10, 15, 20, 25, 30]
export const CHALLENGE_BONUS = 80

export type ChallengeId = 'science' | 'country' | 'combo'
export interface ChallengeDef {
  id: ChallengeId
  target: number
  icon: string
}
export const CHALLENGES: ChallengeDef[] = [
  { id: 'science', target: 4, icon: '🔬' },
  { id: 'country', target: 1, icon: '🗺️' },
  { id: 'combo', target: 1, icon: '🛹' },
]

/** Cadeaux de départ (la maman peut tous les modifier dans l'Espace Parent). Préfixe « Surprise: » = cadeau secret. */
export const DEFAULT_SEASON_PRIZES: Record<string, string> = {
  '5': 'Мама читает тебе на ночь целую неделю',
  '10': 'Идем в кино',
  '15': 'Surprise: Завтрак в кафе вместо утра в школе',
  '20': 'Едем на скалодром!',
  '25': 'Grand Buffet',
  '30': 'Surprise: Выходные за границей!',
}

/** Cadeau secret ? (texte commençant par « Surprise: », sans tenir compte de la casse). `text` = texte sans le préfixe. */
export function parseSecret(raw: string): { secret: boolean; text: string } {
  const m = /^\s*surprise\s*:\s*/i.exec(raw)
  return m ? { secret: true, text: raw.slice(m[0].length).trim() } : { secret: false, text: raw.trim() }
}

export function defaultSeason(): SeasonState {
  return { id: 1, points: 0, granted: 0, claimed: [], rewards: { ...DEFAULT_SEASON_PRIZES }, week: '', progress: {}, done: [] }
}

export function sanitizeSeason(raw: unknown): SeasonState {
  const s = defaultSeason()
  s.rewards = {}
  if (!raw || typeof raw !== 'object') return s
  const r = raw as Partial<SeasonState>
  if (Number.isInteger(r.id) && (r.id as number) >= 1) s.id = r.id as number
  if (typeof r.points === 'number' && r.points >= 0) s.points = Math.min(Math.floor(r.points), TIERS * TIER_POINTS)
  if (typeof r.granted === 'number') s.granted = Math.max(0, Math.min(TIERS, Math.floor(r.granted)))
  if (Array.isArray(r.claimed)) s.claimed = r.claimed.filter((n) => REWARD_TIERS.includes(n))
  if (r.rewards && typeof r.rewards === 'object') {
    for (const [k, v] of Object.entries(r.rewards)) {
      if (REWARD_TIERS.includes(Number(k)) && typeof v === 'string') s.rewards[k] = v.slice(0, 80)
    }
  }
  // Paliers jamais remplis (clé absente) → cadeau par défaut. Un champ vidé exprès par la maman ('') reste vide.
  for (const [k, v] of Object.entries(DEFAULT_SEASON_PRIZES)) if (!(k in s.rewards)) s.rewards[k] = v
  if (typeof r.week === 'string') s.week = r.week
  if (r.progress && typeof r.progress === 'object') {
    for (const c of CHALLENGES) {
      const v = (r.progress as Record<string, unknown>)[c.id]
      if (typeof v === 'number' && v > 0) s.progress[c.id] = Math.min(v, c.target)
    }
  }
  if (Array.isArray(r.done)) s.done = r.done.filter((id) => CHALLENGES.some((c) => c.id === id))
  return s
}

export function isoWeek(date: string): string {
  const d = new Date(date + 'T12:00:00')
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day + 3)
  const first = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d.getTime() - first.getTime()) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${week}`
}

/** Nombre de jours avant le prochain lundi (nouveaux défis). */
export function daysToMonday(date: string): number {
  const day = (new Date(date + 'T12:00:00').getDay() + 6) % 7 // lundi = 0
  return 7 - day
}

/** Nouvelle semaine → les défis repartent de zéro. */
export function ensureWeek(season: SeasonState, date: string) {
  const week = isoWeek(date)
  if (season.week !== week) {
    season.week = week
    season.progress = {}
    season.done = []
  }
}

export const tierOf = (points: number) => Math.min(TIERS, Math.floor(points / TIER_POINTS))

/** Petit cadeau du jeu à chaque palier (boussole ou ressources). */
export function tierGift(tier: number): { compass?: number; resource?: { key: ResourceKey; amount: number } } {
  if (tier % 5 === 0) return { compass: 2 }
  if (tier % 3 === 0) return { compass: 1 }
  const keys: ResourceKey[] = ['wood', 'stone', 'iron', 'gold', 'diamond']
  const amounts = [8, 6, 4, 3, 2]
  const i = Math.min(4, Math.floor((tier - 1) / 6))
  return { resource: { key: keys[i], amount: amounts[i] } }
}

function grantTiers(d: SaveState) {
  const s = d.season
  const reached = tierOf(s.points)
  for (let k = s.granted + 1; k <= reached; k++) {
    const g = tierGift(k)
    if (g.compass) {
      d.compass += g.compass
      if (d.session) d.session.compass += g.compass
    }
    if (g.resource) d.resources[g.resource.key] += g.resource.amount
  }
  s.granted = Math.max(s.granted, reached)
}

export function addSeasonPoints(d: SaveState, n: number) {
  ensureWeek(d.season, d.today.date)
  const before = d.season.points
  d.season.points = Math.min(TIERS * TIER_POINTS, before + n)
  const gained = d.season.points - before
  if (d.session) d.session.seasonPoints = (d.session.seasonPoints ?? 0) + gained
  grantTiers(d)
}

function bump(d: SaveState, id: ChallengeId) {
  ensureWeek(d.season, d.today.date)
  const def = CHALLENGES.find((c) => c.id === id)!
  const s = d.season
  if (s.done.includes(id)) return
  s.progress[id] = (s.progress[id] ?? 0) + 1
  if (s.progress[id] >= def.target) {
    s.done.push(id)
    addSeasonPoints(d, CHALLENGE_BONUS)
  }
}

/** Matières « nouvelles » du Pont : Sciences, Histoire-Géo, questions du journal des pays. */
export const isBridgeQuestion = (q: Question) =>
  q.category === 'science' || (q.category === 'world' && q.topic.startsWith('hg_')) || /^diary2?-/.test(q.id)

/** Points gagnés pour une réponse (appelé par submitAnswer). */
export function seasonOnAnswer(
  d: SaveState,
  q: Question,
  info: { correct: boolean; mentor: boolean; hints: number; streak: number; multiplier: number },
) {
  if (!info.correct) return
  let pts = info.mentor ? 3 : 6
  if (isBridgeQuestion(q)) pts += info.mentor ? 1 : 4
  if (!info.mentor) pts += Math.min(8, Math.max(0, info.multiplier - 1) * 2) // bonus de combo
  addSeasonPoints(d, pts)
  if (!info.mentor && info.hints === 0 && q.category === 'science') bump(d, 'science')
  if (!info.mentor && info.streak === 4) bump(d, 'combo')
}

/** Fin d'expédition : bonus de fin + bonus pays ouvert (appelé par finishSession). */
export function seasonOnFinish(d: SaveState, _s: Session, countryOpened: boolean) {
  addSeasonPoints(d, 30)
  if (countryOpened) {
    addSeasonPoints(d, 40)
    bump(d, 'country')
  }
}

/** Paliers à cadeau réel atteints mais pas encore marqués « reçus ». */
export function claimableTiers(s: SaveState): number[] {
  const reached = tierOf(s.season.points)
  return REWARD_TIERS.filter((t) => t <= reached && !s.season.claimed.includes(t))
}
