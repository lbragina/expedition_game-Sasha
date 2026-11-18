import { useEffect, useMemo, useState } from 'react'
import { countryById } from '../data/countries'
import {
  closeSummary,
  expeditionAvailable,
  mentorHelp,
  nextStep,
  spendHint,
  startExpedition,
  submitAnswer,
} from '../game/actions'
import { canSubmit, describeCorrect, emptyDraft } from '../game/answers'
import { getMode, levelOf, rankName } from '../game/progress'
import { questionMap } from '../game/questions'
import { sfx } from '../game/sound'
import { useGame } from '../game/store'
import { t, tObj } from '../i18n'
import { RESOURCE_KEYS, type Confidence, type Draft, type Outcome, type Question, type Session, type SlotKind } from '../types'
import { backupDue, markPrompted } from '../utils/backup'
import AnswerInput from './AnswerInput'
import PinModal from './PinModal'
import Scratchpad from './Scratchpad'
import { SkaterSprite } from './Sprites'

const RES_ICON: Record<string, string> = { wood: '🪵', stone: '🪨', iron: '⛓️', gold: '🥇', diamond: '💎' }

export default function ExpeditionTab({ onBackup }: { onBackup: () => void }) {
  const state = useGame()
  const session = state.session

  if (!session) return <Home />
  if (session.finished) return <Summary session={session} onBackup={onBackup} />
  return <QuestionScreen key={session.id} session={session} />
}

/* ---------------------------------------------------------------- accueil */

function Home() {
  const state = useGame()
  const avail = expeditionAvailable(state)
  const mode = getMode(state)
  const fogCount = Object.keys(state.fog).length

  return (
    <div className="space-y-3 pt-3">
      <div className="text-center">
        <h1 className="font-pixel text-2xl font-bold text-gold">{t('app.title')}</h1>
        <p className="text-sm text-mute">{t('app.subtitle')}</p>
      </div>

      <div className="card space-y-2">
        <div className="flex flex-wrap gap-2">
          <span className="chip bg-[#17323a] text-diamond">
            {mode.warmup ? t('expedition.warmup_badge', { day: mode.day }) : t('expedition.adaptive_badge')}
          </span>
          {fogCount > 0 && <span className="chip">☁️ {t('expedition.fog_count', { count: fogCount })}</span>}
        </div>
        <p className="text-sm">{mode.warmup ? t('expedition.intro_warmup') : t('expedition.intro_adaptive')}</p>
      </div>

      <div className="flex items-center justify-center gap-4 text-3xl">
        {RESOURCE_KEYS.map((k) => (
          <div key={k} className="text-center text-base font-bold">
            <div className="text-2xl">{RES_ICON[k]}</div>
            {state.resources[k]}
          </div>
        ))}
      </div>

      {avail ? (
        <button
          className={`btn text-lg ${avail === 'main' ? 'btn-primary' : 'btn-gold'}`}
          onClick={() => {
            sfx.unlock()
            sfx.click()
            startExpedition()
          }}
        >
          {avail === 'main' ? '🧭 ' + t('expedition.start_daily') : '⭐ ' + t('expedition.start_bonus')}
        </button>
      ) : (
        <div className="card text-center font-bold text-ok">✅ {t('expedition.completed_today')}</div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- question */

function QuestionScreen({ session }: { session: Session }) {
  const state = useGame()
  const qMap = useMemo(() => questionMap(state), [state.customQuestions])
  const slot = session.slots[session.index]
  const q = qMap.get(slot.qid) as Question
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(q, session.id))
  const [pad, setPad] = useState(false)
  const [askConf, setAskConf] = useState(false)
  const [pin, setPin] = useState(false)

  // nouvelle étape → nouvelle réponse vierge
  useEffect(() => {
    setDraft(emptyDraft(q, session.id))
    setPad(false)
    setAskConf(false)
  }, [session.index, q.id, session.id])

  const pending = session.pending
  const hints = q.hints ?? []
  const stars = q.stars || 0

  const doSubmit = (conf: Confidence) => {
    setAskConf(false)
    submitAnswer(q, draft, conf)
  }

  const onValidate = () => {
    sfx.unlock()
    if (Math.random() < 0.2) setAskConf(true) // question métacognitive, ~1 tâche sur 5
    else doSubmit(null)
  }

  return (
    <div className="space-y-3 pt-3">
      {/* progression */}
      <div className="flex items-center justify-between text-sm font-bold">
        <span>{t('expedition.question_counter', { current: session.index + 1, total: session.slots.length })}</span>
        <span className="chip text-gold">{t('combo.multiplier', { count: Math.max(1, Math.min(5, session.streak)) })}</span>
      </div>
      <div className="flex gap-1">
        {session.slots.map((_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded border border-black ${
              i < session.index ? 'bg-grass' : i === session.index ? 'bg-gold' : 'bg-panel2'
            }`}
          />
        ))}
      </div>

      {/* carte de la tâche */}
      <div className={`card space-y-3 ${stars ? '!border-gold' : ''}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">{t(`categories.${q.category}`)}</span>
          <KindBadge kind={slot.kind} />
          {stars > 0 && <span className="chip text-gold">{'★'.repeat(stars)}</span>}
        </div>
        <p className="text-lg font-semibold leading-snug">{q.prompt}</p>
        <AnswerInput q={q} draft={draft} onChange={setDraft} reveal={!!pending} />
      </div>

      {!pending && (
        <>
          {session.hintsShown > 0 && (
            <div className="card space-y-2 !border-diamond">
              {hints.slice(0, session.hintsShown).map((h, i) => (
                <p key={i} className="text-sm">
                  <b className="text-diamond">{t(`hints.level_${i + 1}`)} :</b> {h}
                </p>
              ))}
            </div>
          )}
          {session.mentor && <p className="text-center text-sm font-bold text-gold">👩‍🏫 {t('hints.mentor_done')}</p>}

          <div className="grid grid-cols-2 gap-2">
            <button className="btn" onClick={() => setPad((v) => !v)}>
              ✏️ {t('expedition.scratchpad_open')}
            </button>
            <button
              className="btn"
              disabled={state.compass < 1 || session.hintsShown >= hints.length}
              onClick={() => spendHint(hints.length) && sfx.hint()}
            >
              🧭 {t('hints.button', { count: state.compass })}
            </button>
          </div>
          {!session.mentor && (
            <button className="btn text-sm" onClick={() => setPin(true)}>
              👩‍🏫 {t('hints.ask_mentor')}
            </button>
          )}
          <button className="btn btn-primary text-lg" disabled={!canSubmit(draft)} onClick={onValidate}>
            {t('expedition.submit')}
          </button>
        </>
      )}

      {pending && <Feedback q={q} outcome={pending} />}

      <Scratchpad open={pad && !pending} onClose={() => setPad(false)} />
      <div className={pad ? 'h-64' : ''} />

      {askConf && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
          <div className="card safe-bottom w-full max-w-md animate-slideup space-y-2">
            <h3 className="text-center font-pixel text-lg font-bold text-gold">{t('expedition.confidence_title')}</h3>
            <button className="btn btn-primary" onClick={() => doSubmit('high')}>
              💯 {t('expedition.confidence_high')}
            </button>
            <button className="btn" onClick={() => doSubmit('medium')}>
              🙂 {t('expedition.confidence_medium')}
            </button>
            <button className="btn" onClick={() => doSubmit('low')}>
              🎲 {t('expedition.confidence_low')}
            </button>
          </div>
        </div>
      )}
      {pin && (
        <PinModal
          prompt={t('hints.mentor_pin_prompt')}
          onCancel={() => setPin(false)}
          onSuccess={() => {
            mentorHelp()
            setPin(false)
          }}
        />
      )}
    </div>
  )
}

function KindBadge({ kind }: { kind: SlotKind }) {
  const map: Partial<Record<SlotKind, { key: string; icon: string; cls: string }>> = {
    boss: { key: 'expedition.boss_badge', icon: '👹', cls: 'text-danger' },
    chest: { key: 'expedition.chest_badge', icon: '🎁', cls: 'text-gold' },
    fog: { key: 'expedition.fog_badge', icon: '☁️', cls: 'text-mute' },
    ladder: { key: 'expedition.ladder_badge', icon: '🪜', cls: 'text-diamond' },
  }
  const m = map[kind]
  if (!m) return null
  return (
    <span className={`chip ${m.cls}`}>
      {m.icon} {t(m.key)}
    </span>
  )
}

/* ----------------------------------------------------------------- retour */

function Feedback({ q, outcome }: { q: Question; outcome: Outcome }) {
  const state = useGame()
  const lastStep = state.session ? state.session.index === state.session.slots.length - 1 : false

  useEffect(() => {
    if (outcome.correct) {
      sfx.correct()
      if (outcome.trick) sfx.combo(outcome.multiplier + 1)
      if (q.stars > 0) setTimeout(() => sfx.star(), 250)
    } else {
      sfx.wrong()
      if (outcome.fogCreated) setTimeout(() => sfx.fog(), 350)
    }
    if (levelOf(state.xp) > levelOf(state.xp - outcome.xp)) setTimeout(() => sfx.levelUp(), 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome.qid])

  return (
    <div className={`card space-y-2 ${outcome.correct ? '!border-ok' : '!border-danger'}`}>
      <h3 className={`font-pixel text-xl font-bold ${outcome.correct ? 'text-ok' : 'text-danger'}`}>
        {outcome.correct ? '✔ ' + t('expedition.correct_title') : '✘ ' + t('expedition.wrong_title')}
      </h3>

      {outcome.trick && (
        <div className="animate-trick text-center">
          <SkaterSprite size={64} />
          <div className="font-pixel text-2xl font-bold text-gold">{outcome.trick}</div>
          <div className="text-sm font-bold text-gold">{t('combo.multiplier', { count: outcome.multiplier })}</div>
        </div>
      )}

      {!outcome.correct && (
        <>
          {outcome.partial && <p className="text-sm text-gold">{t(`expedition.partial_${outcome.partial}`)}</p>}
          <p className="text-sm">
            <b>{t('expedition.expected')} :</b> {describeCorrect(q)}
          </p>
        </>
      )}
      <p className="text-sm text-mute">💡 {q.explanation}</p>

      {outcome.confidence === 'high' && !outcome.correct && (
        <p className="text-sm text-gold">🔎 {t('expedition.conf_overconfident')}</p>
      )}
      {outcome.confidence === 'low' && outcome.correct && <p className="text-sm text-ok">🔎 {t('expedition.conf_good_intuition')}</p>}
      {outcome.mentor && <p className="text-sm text-gold">👩‍🏫 {t('expedition.mentor_noted')}</p>}

      <div className="flex flex-wrap gap-2 text-sm font-bold">
        {outcome.xp > 0 && <span className="chip text-gold">+{outcome.xp} XP</span>}
        {outcome.resource && (
          <span className="chip">
            {RES_ICON[outcome.resource.key]} +{outcome.resource.amount}
          </span>
        )}
        {outcome.compassGained > 0 && <span className="chip text-diamond">🧭 +{outcome.compassGained}</span>}
      </div>

      {outcome.courageXp > 0 && <p className="text-sm font-bold text-gold">⭐ {t('expedition.courage_bonus', { xp: outcome.courageXp })}</p>}
      {outcome.comboKept && outcome.courageXp === 0 && <p className="text-sm text-gold">🛹 {t('expedition.combo_kept')}</p>}
      {outcome.fogCreated && <p className="text-sm text-mute">☁️ {t('expedition.fog_created')}</p>}
      {outcome.fogCleared && <p className="text-sm font-bold text-ok">☀️ {t('expedition.fog_cleared')}</p>}

      <button className="btn btn-primary" onClick={() => nextStep()}>
        {lastStep ? t('expedition.finish') : t('expedition.next')}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ bilan */

function Summary({ session, onBackup }: { session: Session; onBackup: () => void }) {
  const state = useGame()
  const info = countryById(session.countryId)
  const country = tObj<{ name: string; log: string }>(`countries.${session.countryId}`)
  const level = levelOf(state.xp)
  const leveledUp = level > session.levelBefore

  useEffect(() => {
    if (leveledUp) sfx.levelUp()
    else sfx.star()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-3 pt-3">
      <h2 className="text-center font-pixel text-2xl font-bold text-gold">🏁 {t('summary.title')}</h2>
      <div className="card space-y-2 text-center">
        <div className="text-5xl">{info?.emoji}</div>
        <div className="font-bold">{t('expedition.today_country', { country: country?.name ?? '' })}</div>
        <div className="text-lg font-bold">
          {t('summary.score', { correct: session.correct, total: session.slots.length })}
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-sm font-bold">
          <span className="chip text-gold">+{session.xp} XP</span>
          <span className="chip">{t('summary.best_combo', { count: Math.max(1, Math.min(5, session.maxStreak)) })}</span>
          {Object.entries(session.resources).map(([k, v]) => (
            <span key={k} className="chip">
              {RES_ICON[k]} +{v}
            </span>
          ))}
          {session.compass > 0 && <span className="chip text-diamond">🧭 +{session.compass}</span>}
        </div>
        {leveledUp && (
          <p className="animate-trick font-pixel font-bold text-gold">
            🎉 {t('summary.level_up', { rank: rankName(level) })}
          </p>
        )}
        {state.streak.count > 1 && <p className="text-sm">🔥 {t('hud.streak', { count: state.streak.count })}</p>}
      </div>

      <div className="card space-y-1">
        <h3 className="font-bold text-diamond">📖 {t('map.diary')}</h3>
        <p className="text-sm italic">« {country?.log} »</p>
      </div>

      <button
        className="btn btn-primary"
        onClick={() => {
          const due = backupDue(state)
          closeSummary()
          if (due) {
            markPrompted()
            onBackup()
          }
        }}
      >
        {t('expedition.next')}
      </button>
    </div>
  )
}
