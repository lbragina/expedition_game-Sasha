import { COUNTRIES } from '../data/countries'
import { tList } from '../i18n'
import {
  RESOURCE_KEYS,
  type Confidence,
  type Draft,
  type Outcome,
  type Question,
  type ResourceKey,
  type SaveState,
} from '../types'
import { describeGiven, evaluate } from './answers'
import { updateRating } from './elo'
import { getMode, levelOf } from './progress'
import { buildSlots } from './selection'
import { getState, todayStr, update } from './store'

const STAR_MULT = [1, 3, 5, 10]

export function resourceFor(difficulty: number): ResourceKey {
  if (difficulty <= 3) return 'wood'
  if (difficulty <= 5) return 'stone'
  if (difficulty <= 7) return 'iron'
  if (difficulty <= 9) return 'gold'
  return 'diamond'
}

/** Une expédition principale par jour, puis autant d'expéditions bonus que Sasha veut (plus de blocage jusqu'à demain). */
export function expeditionAvailable(state: SaveState): 'main' | 'bonus' {
  return state.today.main ? 'bonus' : 'main'
}

export function startExpedition() {
  update((d) => {
    const kind = expeditionAvailable(d)
    if (d.session) return
    const mode = getMode(d)
    const unvisited = COUNTRIES.filter((c) => !d.visited.includes(c.id))
    const country = unvisited.length ? unvisited[0] : COUNTRIES[d.expeditionsDone % COUNTRIES.length]
    d.session = {
      id: `${Date.now()}`,
      kind,
      date: todayStr(),
      slots: buildSlots(d),
      index: 0,
      streak: 0,
      maxStreak: 0,
      xp: 0,
      correct: 0,
      resources: {},
      compass: 0,
      outcomes: [],
      pending: null,
      hintsShown: 0,
      mentor: false,
      countryId: country.id,
      // « 2 expéditions = 1 pays » : le pays s'ouvre à la fin de chaque expédition paire
      opensCountry: (d.expeditionsDone + 1) % 2 === 0,
      levelBefore: levelOf(d.xp),
      warmup: mode.warmup,
      finished: false,
    }
  })
}

/** Dépense une boussole pour révéler le niveau d'indice suivant. */
export function spendHint(maxLevel: number): boolean {
  const s = getState()
  if (!s.session || s.session.pending || s.compass < 1 || s.session.hintsShown >= maxLevel) return false
  update((d) => {
    d.compass -= 1
    d.session!.hintsShown += 1
  })
  return true
}

/** Le mentor (maman) a validé l'aide avec le PIN : la tâche est marquée « à discuter ». */
export function mentorHelp() {
  update((d) => {
    if (d.session) d.session.mentor = true
  })
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T12:00:00').getTime()
  const db = new Date(b + 'T12:00:00').getTime()
  return Math.round((db - da) / 86400000)
}

function isoWeek(date: string): string {
  const d = new Date(date + 'T12:00:00')
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day + 3)
  const first = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d.getTime() - first.getTime()) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${week}`
}

export function submitAnswer(q: Question, draft: Draft, confidence: Confidence) {
  update((d) => {
    const s = d.session
    if (!s || s.pending) return
    const slot = s.slots[s.index]
    const { correct, partial } = evaluate(q, draft)
    const stars = q.stars || 0
    const safe = stars > 0 || slot.kind === 'chest' // erreur sans perte de combo
    const mentor = s.mentor
    const tricks = tList('combo.tricks')

    let xp = 0
    let multiplier = 1
    let trick: string | null = null
    let comboKept = false
    let courageXp = 0
    let resource: Outcome['resource'] = null
    let compassGained = 0

    if (correct) {
      const prevMax = s.maxStreak
      if (!mentor) {
        s.streak += 1
        s.maxStreak = Math.max(s.maxStreak, s.streak)
        if (s.streak >= 2) trick = tricks[Math.min(s.streak - 2, tricks.length - 1)] ?? null
        if (prevMax < 5 && s.streak >= 5) compassGained += 1
      }
      multiplier = mentor ? 1 : Math.min(5, s.streak)
      xp = 10 * q.difficulty * multiplier * STAR_MULT[Math.min(3, stars)]
      resource = { key: resourceFor(q.difficulty), amount: multiplier >= 3 ? 2 : 1 }
      s.correct += 1
    } else if (safe) {
      comboKept = s.streak > 0
      if (stars > 0) courageXp = Math.round(5 * q.difficulty)
    } else {
      s.streak = 0
    }

    // --- brouillard et lesenkis ---------------------------------------------
    let fogCreated = false
    let fogCleared = false
    if (slot.kind === 'ladder' && slot.fogFor) {
      const f = d.fog[slot.fogFor]
      if (correct && f && !f.done.includes(q.id)) f.done.push(q.id)
    } else if (slot.kind === 'fog') {
      const f = d.fog[q.id]
      if (correct) {
        delete d.fog[q.id]
        fogCleared = true
      } else if (f) {
        f.attempts += 1
        if (f.attempts >= 3) delete d.fog[q.id] // le parent en parlera avec lui
        else f.done = []
      }
    } else if (!correct && q.difficulty >= 4 && !d.fog[q.id] && Object.keys(d.fog).length < 3) {
      d.fog[q.id] = {
        steps: (q.ladder ?? []).slice(0, 2),
        done: [],
        created: Date.now(),
        attempts: 0,
        category: q.category,
        topic: q.topic,
      }
      fogCreated = true
    }

    // --- Elo caché (pas de changement si le mentor a aidé) -------------------
    if (!mentor) {
      let actual = correct ? Math.max(0.4, 1 - 0.2 * s.hintsShown) : partial ? 0.2 : 0
      if (correct && confidence === 'low') actual *= 0.7
      d.rating[q.category] = updateRating(d.rating[q.category], q.difficulty, actual)
    }

    // --- récompenses -------------------------------------------------------
    const gainedXp = xp + courageXp
    d.xp += gainedXp
    s.xp += gainedXp
    if (resource) {
      d.resources[resource.key] += resource.amount
      s.resources[resource.key] = (s.resources[resource.key] ?? 0) + resource.amount
    }
    d.compass += compassGained
    s.compass += compassGained

    // trophée pour chaque tâche étoilée réussie (sans l'aide du mentor)
    if (correct && stars > 0 && !mentor) {
      const n = Math.min(3, stars)
      const prev = d.base.trophies[q.id]
      if (!prev || prev.stars < n) d.base.trophies[q.id] = { stars: n, category: q.category, date: s.date }
    }

    const given = describeGiven(q, draft)
    d.history.push({
      qid: q.id,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      correct,
      confidence,
      hints: s.hintsShown,
      mentor,
      given,
      at: Date.now(),
      date: s.date,
      sessionId: s.id,
    })
    const seen = d.seen[q.id] ?? { right: 0, wrong: 0, last: 0 }
    if (correct) seen.right += 1
    else seen.wrong += 1
    seen.last = Date.now()
    d.seen[q.id] = seen

    const outcome: Outcome = {
      qid: q.id,
      kind: slot.kind,
      correct,
      partial,
      xp: gainedXp,
      multiplier,
      trick,
      comboKept,
      courageXp,
      resource,
      compassGained,
      fogCreated,
      fogCleared,
      hints: s.hintsShown,
      mentor,
      confidence,
      given,
    }
    s.pending = outcome
    s.outcomes.push(outcome)
  })
}

function finishSession(d: SaveState) {
  const s = d.session!
  s.finished = true
  s.pending = null
  d.expeditionsDone += 1
  if (s.date === d.today.date) {
    if (s.kind === 'main') d.today.main = true
    else d.today.bonus = true
  }
  if (!d.daysPlayed.includes(s.date)) d.daysPlayed.push(s.date)
  d.recent.push({ date: s.date, correct: s.correct, total: s.slots.length })
  d.recent = d.recent.slice(-20)

  // série de jours, avec « gel » d'un jour manqué par semaine
  if (d.streak.last !== s.date) {
    const gap = d.streak.last ? dayDiff(d.streak.last, s.date) : 0
    if (!d.streak.last || gap > 2) d.streak.count = 1
    else if (gap === 1) d.streak.count += 1
    else if (gap === 2 && d.streak.freezeWeek !== isoWeek(s.date)) {
      d.streak.count += 1
      d.streak.freezeWeek = isoWeek(s.date)
    } else d.streak.count = 1
    d.streak.last = s.date
    if (d.streak.count > 0 && d.streak.count % 3 === 0) {
      d.compass += 1
      s.compass += 1
    }
  }

  // nouvelle destination (une expédition sur deux) + coffre caché sur la carte
  const alreadyVisited = d.visited.includes(s.countryId)
  if (!alreadyVisited && (s.opensCountry ?? true)) {
    d.visited.push(s.countryId)
    d.chests.push({
      countryId: s.countryId,
      x: (Math.random() - 0.5) * 36,
      y: (Math.random() - 0.5) * 24,
      found: false,
    })
  }
  // le journal du capitaine s'écrit quand le pays est ouvert (ou revisité) — pas pendant l'expédition « énigme »
  if (d.visited.includes(s.countryId)) {
    d.log.push({ date: s.date, countryId: s.countryId, correct: s.correct, total: s.slots.length, kind: s.kind })
  }
}

/** Énigme du récapitulatif (expédition impaire) : on note seulement le résultat, sans XP ni effet sur le niveau. */
export function answerRiddle(qid: string, correct: boolean) {
  update((d) => {
    const seen = d.seen[qid] ?? { right: 0, wrong: 0, last: 0 }
    if (correct) seen.right += 1
    else seen.wrong += 1
    seen.last = Date.now()
    d.seen[qid] = seen
  })
}

export function nextStep() {
  update((d) => {
    const s = d.session
    if (!s || !s.pending) return
    s.pending = null
    s.index += 1
    s.hintsShown = 0
    s.mentor = false
    if (s.index >= s.slots.length) finishSession(d)
  })
}

export function closeSummary() {
  update((d) => {
    d.session = null
  })
}

export function findChest(index: number) {
  update((d) => {
    const c = d.chests[index]
    if (!c || c.found) return
    c.found = true
    d.compass += 1
  })
}

export function markDiscussed(at: number, value: boolean) {
  update((d) => {
    const h = d.history.find((x) => x.at === at)
    if (h) h.discussed = value
  })
}

export { RESOURCE_KEYS }
