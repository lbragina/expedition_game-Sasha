import { t } from '../i18n'
import { CATEGORIES, type SaveState } from '../types'
import { targetDifficulty } from './elo'
import { allQuestions } from './questions'

const SCHEMA = `{
  "id": "math-0142",
  "category": "math | logic | iq | critical | world",
  "topic": "divisibility",
  "difficulty": 4,
  "type": "number | choice | boolean_explain | order | highlight",
  "lang": "fr",
  "prompt": "...",
  "options": null,
  "answer": 12,
  "explanation": "...",
  "tags": ["Kangourou"],
  "skill": "multiples",
  "stars": 0,
  "ladder": ["math-0098", "math-0101"],
  "hints": ["Indice", "Méthode", "Premier pas"],
  "image": null
}`

/** Thèmes les plus faibles : (catégorie, topic) triés par taux de réussite croissant. */
export function weakTopics(state: SaveState, limit = 6) {
  const map = new Map<string, { category: string; topic: string; ok: number; n: number }>()
  state.history
    .filter((h) => !h.mentor)
    .forEach((h) => {
      const k = `${h.category}/${h.topic}`
      const e = map.get(k) ?? { category: h.category, topic: h.topic, ok: 0, n: 0 }
      e.n += 1
      if (h.correct) e.ok += 1
      map.set(k, e)
    })
  return [...map.values()]
    .filter((e) => e.ok / e.n < 0.8)
    .sort((a, b) => a.ok / a.n - b.ok / b.n)
    .slice(0, limit)
}

export function buildPrompt(state: SaveState, count = 20): string {
  const weak = weakTopics(state)
  const questions = allQuestions(state)
  const levels = CATEGORIES.map(
    (c) => `- ${t(`categories.${c}`)} (${c}) : difficulté cible ≈ ${targetDifficulty(state.rating[c]).toFixed(1)}`,
  ).join('\n')
  const weakText = weak.length
    ? weak.map((w) => `- ${w.category} / ${w.topic} : ${Math.round((w.ok / w.n) * 100)} % de réussite (${w.n} essais)`).join('\n')
    : t('parent.prompt_no_weak')
  const ids = CATEGORIES.map((c) => `${c} : ${questions.filter((q) => q.category === c).map((q) => q.id).join(', ') || '—'}`).join('\n')

  return t('parent.prompt_template', { count, levels, weak: weakText, ids, schema: SCHEMA })
}
