import { t } from '../i18n'
import type { Draft, Question } from '../types'

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Mélange déterministe (pour que l'ordre reste le même si on recharge la page). */
export function seededPermutation(n: number, seed: string): number[] {
  const perm = Array.from({ length: n }, (_, i) => i)
  let h = hash(seed)
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }
  // l'ordre de départ ne doit jamais être la bonne réponse
  if (perm.every((v, i) => v === i) && n > 1) [perm[0], perm[1]] = [perm[1], perm[0]]
  return perm
}

export function emptyDraft(q: Question, seed: string): Draft {
  switch (q.type) {
    case 'number':
      return { type: 'number', text: '' }
    case 'choice':
      return { type: 'choice', index: null }
    case 'boolean_explain':
      return { type: 'boolean_explain', value: null, reason: null }
    case 'order':
      return { type: 'order', perm: seededPermutation(q.options?.length ?? 4, `${q.id}|${seed}`) }
    case 'highlight':
      return { type: 'highlight', index: null }
  }
}

export function canSubmit(draft: Draft): boolean {
  switch (draft.type) {
    case 'number':
      return parseNumber(draft.text) !== null
    case 'choice':
    case 'highlight':
      return draft.index !== null
    case 'boolean_explain':
      return draft.value !== null && draft.reason !== null
    case 'order':
      return true
  }
}

export function parseNumber(text: string): number | null {
  const cleaned = text.trim().replace(/\s/g, '').replace(',', '.')
  if (cleaned === '' || !/^-?\d*\.?\d+$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export interface Evaluation {
  correct: boolean
  partial: 'value_ok' | 'reason_ok' | null
}

export function evaluate(q: Question, draft: Draft): Evaluation {
  switch (draft.type) {
    case 'number': {
      const n = parseNumber(draft.text)
      return { correct: n !== null && Math.abs(n - Number(q.answer)) < 1e-9, partial: null }
    }
    case 'choice':
    case 'highlight':
      return { correct: draft.index === q.answer, partial: null }
    case 'boolean_explain': {
      const a = q.answer as { value: boolean; reason: number }
      const valueOk = draft.value === a.value
      const reasonOk = draft.reason === a.reason
      return {
        correct: valueOk && reasonOk,
        partial: valueOk && !reasonOk ? 'value_ok' : !valueOk && reasonOk ? 'reason_ok' : null,
      }
    }
    case 'order':
      return { correct: draft.perm.every((v, i) => v === i), partial: null }
  }
}

/** Réponse de l'enfant, en texte (pour le journal et l'espace parent). */
export function describeGiven(q: Question, draft: Draft): string {
  const opts = q.options ?? []
  switch (draft.type) {
    case 'number':
      return draft.text.trim()
    case 'choice':
    case 'highlight':
      return draft.index === null ? '—' : opts[draft.index] ?? '—'
    case 'boolean_explain':
      return `${draft.value ? t('answer.true') : t('answer.false')} — ${draft.reason === null ? '—' : opts[draft.reason] ?? '—'}`
    case 'order':
      return draft.perm.map((i) => opts[i]).join(' → ')
  }
}

/** Bonne réponse, en texte. */
export function describeCorrect(q: Question): string {
  const opts = q.options ?? []
  switch (q.type) {
    case 'number':
      return String(q.answer)
    case 'choice':
    case 'highlight':
      return opts[q.answer as number] ?? ''
    case 'boolean_explain': {
      const a = q.answer as { value: boolean; reason: number }
      return `${a.value ? t('answer.true') : t('answer.false')} — ${opts[a.reason] ?? ''}`
    }
    case 'order':
      return opts.join(' → ')
  }
}
