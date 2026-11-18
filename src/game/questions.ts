import { BUILT_IN_QUESTIONS } from '../data/questions'
import { CATEGORIES, type Question, type SaveState } from '../types'

/** Banque complète : tâches intégrées + packs importés par le parent (même id → le pack remplace). */
export function allQuestions(state: SaveState): Question[] {
  const map = new Map<string, Question>()
  BUILT_IN_QUESTIONS.forEach((q) => map.set(q.id, q))
  state.customQuestions.forEach((q) => map.set(q.id, q))
  return [...map.values()]
}

export function questionMap(state: SaveState): Map<string, Question> {
  return new Map(allQuestions(state).map((q) => [q.id, q]))
}

const TYPES = ['number', 'choice', 'boolean_explain', 'order', 'highlight']

/** Vérifie la forme d'une tâche (utilisé pour l'import de packs). Renvoie la liste des problèmes. */
export function validateQuestion(q: unknown): string[] {
  const errors: string[] = []
  if (!q || typeof q !== 'object') return ['pas un objet']
  const x = q as Record<string, unknown>
  for (const f of ['id', 'category', 'topic', 'difficulty', 'type', 'prompt', 'answer', 'explanation']) {
    if (x[f] === undefined || x[f] === null || x[f] === '') errors.push(`champ manquant : ${f}`)
  }
  if (errors.length) return errors
  if (!CATEGORIES.includes(x.category as never)) errors.push(`catégorie inconnue : ${String(x.category)}`)
  if (!TYPES.includes(x.type as string)) errors.push(`type inconnu : ${String(x.type)}`)
  const d = Number(x.difficulty)
  if (!(d >= 1 && d <= 10)) errors.push('difficulty doit être entre 1 et 10')
  const opts = x.options
  switch (x.type) {
    case 'number':
      if (Number.isNaN(Number(x.answer))) errors.push('number : answer doit être un nombre')
      break
    case 'choice':
      if (!Array.isArray(opts) || opts.length !== 4) errors.push('choice : 4 options exactement')
      else if (typeof x.answer !== 'number' || x.answer < 0 || x.answer > 3) errors.push('choice : answer = index 0 à 3')
      break
    case 'boolean_explain': {
      const a = x.answer as { value?: unknown; reason?: unknown }
      if (!Array.isArray(opts) || opts.length < 2) errors.push('boolean_explain : au moins 2 raisons dans options')
      else if (typeof a !== 'object' || typeof a.value !== 'boolean' || typeof a.reason !== 'number' || a.reason >= opts.length)
        errors.push('boolean_explain : answer = {value: true/false, reason: index}')
      break
    }
    case 'order':
      if (!Array.isArray(opts) || opts.length !== 4) errors.push('order : 4 cartes dans options (dans le bon ordre)')
      break
    case 'highlight':
      if (!Array.isArray(opts) || opts.length < 2) errors.push('highlight : au moins 2 phrases dans options')
      else if (typeof x.answer !== 'number' || x.answer < 0 || x.answer >= opts.length) errors.push('highlight : answer = index de la phrase')
      break
  }
  return errors
}

/** Normalise une tâche importée (valeurs par défaut pour les champs facultatifs). */
export function normalizeQuestion(q: Record<string, unknown>): Question {
  return {
    lang: 'fr',
    options: null,
    tags: [],
    skill: '',
    ladder: [],
    hints: [],
    image: null,
    ...q,
    difficulty: Number(q.difficulty),
    stars: Number(q.stars ?? 0),
  } as unknown as Question
}
