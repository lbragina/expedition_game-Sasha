import { CATEGORIES, type Category, type Question, type SaveState, type Slot } from '../types'
import { targetDifficulty } from './elo'
import { difficultyShift, getMode } from './progress'
import { allQuestions } from './questions'

// Ordre d'une expédition : 2 Maths → Logique → QI → Esprit critique → Culture → Boss (ou Coffre)
const REGULAR: Category[] = ['math', 'math', 'logic', 'iq', 'critical', 'world']

function score(q: Question, target: number, cap: number, state: SaveState): number {
  const seen = state.seen[q.id]
  let s = Math.abs(q.difficulty - target)
  if (q.difficulty > cap) s += 3 * (q.difficulty - cap)
  if (seen) {
    if (Date.now() - seen.last < 24 * 3600 * 1000) s += 2 // déjà vue aujourd'hui
    s += seen.right * 0.25
  }
  return s + Math.random() * 0.7
}

function pick(pool: Question[], used: Set<string>, target: number, cap: number, state: SaveState): Question {
  let candidates = pool.filter((q) => !used.has(q.id))
  if (!candidates.length) candidates = pool // banque trop petite : on accepte une répétition
  return candidates.reduce((best, q) => (score(q, target, cap, state) < score(best, target, cap, state) ? q : best))
}

/** Énigmes de pays et questions du journal : elles n'arrivent que par injection ciblée, jamais au hasard. */
const isSpecial = (id: string) => /^(diary2?|riddle)-/.test(id)

export function buildSlots(state: SaveState): Slot[] {
  const everything = allQuestions(state)
  const byId = new Map(everything.map((q) => [q.id, q]))
  const questions = everything.filter((q) => !isSpecial(q.id))
  const mode = getMode(state)
  const shift = difficultyShift(state)
  const used = new Set<string>(Object.keys(state.fog)) // les tâches dans le brouillard reviennent via leur propre mécanisme

  // --- 1. Lesenkis et retours depuis les « zones de brouillard » -----------------
  const injected: Slot[] = []
  let steps = 0
  let returns = 0
  const fogEntries = Object.entries(state.fog).sort((a, b) => a[1].created - b[1].created)
  for (const [origId, f] of fogEntries) {
    const pending = f.steps.filter((id) => !f.done.includes(id) && byId.has(id))
    if (pending.length) {
      for (const id of pending) {
        if (steps >= 2) break
        injected.push({ qid: id, kind: 'ladder', fogFor: origId })
        used.add(id)
        steps++
      }
    } else if (returns < 1 && byId.has(origId)) {
      injected.push({ qid: origId, kind: 'fog' })
      used.add(origId)
      returns++
    }
  }

  // --- 2. Six tâches régulières ------------------------------------------------
  const regular: (Slot | null)[] = REGULAR.map(() => null)
  const replaced = new Set<number>()
  const placed: { slot: Slot; index: number }[] = []
  for (const inj of injected) {
    const cat = byId.get(inj.qid)!.category
    let idx = REGULAR.findIndex((c, i) => c === cat && !replaced.has(i))
    if (idx < 0) idx = REGULAR.map((_, i) => i).reverse().find((i) => !replaced.has(i)) ?? 0
    replaced.add(idx)
    placed.push({ slot: inj, index: idx })
  }

  // --- 2b. Slot « Culture » : énigme ratée à rejouer, sinon questions du journal des pays ouverts ---
  const worldIdx = REGULAR.findIndex((c, i) => c === 'world' && !replaced.has(i))
  if (worldIdx >= 0) {
    const solved = (qid: string) => (state.seen[qid]?.right ?? 0) > 0
    const riddleBack = Object.keys(state.seen).find(
      (qid) =>
        qid.startsWith('riddle-') &&
        !state.visited?.includes(qid.slice(7)) &&
        byId.has(qid) &&
        !used.has(qid) &&
        state.seen[qid].wrong > 0 &&
        !solved(qid),
    )
    // 2) journal : d'abord diary-<pays>, puis diary2-<pays>, jusqu'à la bonne réponse
    const diaryDue = (state.visited ?? [])
      .flatMap((cid) => [`diary-${cid}`, `diary2-${cid}`])
      .find((qid) => byId.has(qid) && !used.has(qid) && !solved(qid))
    const due = riddleBack ?? diaryDue
    if (due) {
      used.add(due)
      regular[worldIdx] = { qid: due, kind: 'normal' }
      replaced.add(worldIdx)
    }
  }

  REGULAR.forEach((cat, i) => {
    if (replaced.has(i)) return
    const pool = questions.filter((q) => q.category === cat)
    let target: number
    let cap: number
    if (mode.warmup) {
      const medium = mode.phase === 2 && (i === 1 || i === 3)
      target = medium ? 4.5 : mode.phase === 1 ? 2 : 2.5
      cap = medium ? 5 : 3
    } else {
      target = targetDifficulty(state.rating[cat]) + shift
      cap = 10
    }
    const q = pick(pool, used, target, cap, state)
    used.add(q.id)
    regular[i] = { qid: q.id, kind: 'normal' }
  })

  // --- 3. Assemblage : les étapes d'approche d'abord, puis le reste ------------
  const ladders = placed.filter((p) => p.slot.kind === 'ladder').map((p) => p.slot)
  placed.filter((p) => p.slot.kind === 'fog').forEach((p) => (regular[p.index] = p.slot))
  const rest = regular.filter((s): s is Slot => s !== null)
  const slots: Slot[] = [...ladders, ...rest]

  // --- 4. Septième tâche : coffre (mise en route) ou boss ----------------------
  if (mode.warmup) {
    const q = pick(questions, used, 5.5, 6, state)
    slots.push({ qid: q.id, kind: 'chest' })
  } else {
    const avg = CATEGORIES.reduce((sum, c) => sum + targetDifficulty(state.rating[c]), 0) / CATEGORIES.length
    const bossTarget = Math.min(10, avg + shift + 2)
    const pool = questions.filter((q) => !used.has(q.id))
    const base = pool.length ? pool : questions
    const q = base.reduce((best, c) =>
      Math.abs(c.difficulty - bossTarget) - c.stars * 0.2 < Math.abs(best.difficulty - bossTarget) - best.stars * 0.2 ? c : best,
    )
    slots.push({ qid: q.id, kind: 'boss' })
  }
  return slots
}
