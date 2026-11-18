import { tList } from '../i18n'
import type { SaveState } from '../types'

/** Seuils d'XP pour chaque grade (ranks dans fr.json). Les niveaux 1–4 s'obtiennent environ en une semaine. */
export const LEVEL_XP = [0, 600, 2000, 4500, 9000, 16000, 26000]

export function levelOf(xp: number): number {
  let level = 0
  LEVEL_XP.forEach((threshold, i) => {
    if (xp >= threshold) level = i
  })
  return level
}

export function levelProgress(xp: number) {
  const level = levelOf(xp)
  const current = LEVEL_XP[level]
  const next = level + 1 < LEVEL_XP.length ? LEVEL_XP[level + 1] : null
  const pct = next === null ? 100 : Math.round(((xp - current) / (next - current)) * 100)
  return { level, current, next, pct }
}

export function rankName(level: number): string {
  const ranks = tList('ranks')
  return ranks[Math.min(level, ranks.length - 1)] ?? ''
}

/** Taux de réussite sur les n dernières réponses (sans l'aide du mentor). */
export function recentAccuracy(state: SaveState, n = 70): number {
  const items = state.history.filter((h) => !h.mentor).slice(-n)
  if (!items.length) return 0
  return items.filter((h) => h.correct).length / items.length
}

export interface Mode {
  warmup: boolean
  /** 1 = jours 1–7, 2 = jours 8–14 */
  phase: 1 | 2
  /** numéro du jour d'échauffement (pour l'affichage) */
  day: number
}

/**
 * Mode « Mise en route » : jours 1–7 (6 tâches faciles + 1 coffre), jours 8–14 (4 faciles, 2 moyennes + coffre).
 * On passe en mode adaptatif quand les DEUX conditions sont remplies : ≥ 10 expéditions ET ≥ 85 % de réussite.
 * Le parent peut forcer le mode dans son espace.
 */
export function getMode(state: SaveState): Mode {
  const days = state.daysPlayed.length
  const phase: 1 | 2 = days < 7 ? 1 : 2
  const day = days + (state.today.main ? 0 : 1)
  const forced = state.parent.warmup
  if (forced === 'on') return { warmup: true, phase, day }
  if (forced === 'off') return { warmup: false, phase, day }
  const graduated = state.expeditionsDone >= 10 && recentAccuracy(state) >= 0.85
  return { warmup: !graduated, phase, day }
}

/** « Assurance » : 2 expéditions de suite sous 60 % → la difficulté baisse un peu. + réglage manuel du parent. */
export function difficultyShift(state: SaveState): number {
  const last = state.recent.slice(-2)
  const low = last.length === 2 && last.every((r) => r.total > 0 && r.correct / r.total < 0.6)
  return (low ? -1.5 : 0) + state.parent.offset
}
