import { useMemo, useRef, useState } from 'react'
import { markDiscussed } from '../game/actions'
import { describeCorrect } from '../game/answers'
import { targetDifficulty } from '../game/elo'
import { getMode } from '../game/progress'
import { buildPrompt } from '../game/prompt'
import { normalizeQuestion, questionMap, validateQuestion } from '../game/questions'
import { update, useGame } from '../game/store'
import { t } from '../i18n'
import { CATEGORIES } from '../types'
import PinModal from './PinModal'

type Range = 'week' | 'month' | 'all'

export default function ParentTab({ onLeave }: { onLeave: () => void }) {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) {
    return (
      <div className="pt-6 text-center">
        <h2 className="font-pixel text-xl font-bold text-gold">🔒 {t('parent.title')}</h2>
        <PinModal prompt={t('parent.enter_pin')} onSuccess={() => setUnlocked(true)} onCancel={onLeave} />
      </div>
    )
  }
  return <ParentPanel />
}

function ParentPanel() {
  const s = useGame()
  const [range, setRange] = useState<Range>('week')
  const [copied, setCopied] = useState(false)
  const [importMsg, setImportMsg] = useState<string[]>([])
  const [newPin, setNewPin] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const qMap = useMemo(() => questionMap(s), [s.customQuestions])
  const mode = getMode(s)
  const prompt = useMemo(() => buildPrompt(s), [s.history.length, s.rating, s.customQuestions])

  const since = range === 'week' ? Date.now() - 7 * 864e5 : range === 'month' ? Date.now() - 30 * 864e5 : 0
  const items = s.history.filter((h) => h.at >= since)

  const errors = [...s.history].reverse().filter((h) => !h.correct).slice(0, 40)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      const ta = document.getElementById('prompt-area') as HTMLTextAreaElement | null
      ta?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const importPack = async (file: File) => {
    const messages: string[] = []
    try {
      const data = JSON.parse(await file.text())
      const arr: unknown[] = Array.isArray(data) ? data : []
      if (!Array.isArray(data)) throw new Error(t('parent.import_not_array'))
      const good: ReturnType<typeof normalizeQuestion>[] = []
      arr.forEach((q, i) => {
        const errs = validateQuestion(q)
        if (errs.length) messages.push(`#${i + 1} (${(q as { id?: string })?.id ?? '?'}) : ${errs.join(' ; ')}`)
        else good.push(normalizeQuestion(q as Record<string, unknown>))
      })
      if (good.length) {
        update((d) => {
          const byId = new Map(d.customQuestions.map((q) => [q.id, q]))
          good.forEach((q) => byId.set(q.id, q))
          d.customQuestions = [...byId.values()]
        })
      }
      messages.unshift(t('parent.import_result', { ok: good.length, bad: arr.length - good.length }))
    } catch (e) {
      messages.push(t('parent.import_error') + ' ' + (e as Error).message)
    }
    setImportMsg(messages)
  }

  return (
    <div className="space-y-3 pt-3">
      <h2 className="font-pixel text-xl font-bold text-gold">👩‍🏫 {t('parent.title')}</h2>

      {/* statistiques */}
      <div className="card space-y-2">
        <h3 className="font-bold text-diamond">{t('parent.stats_title')}</h3>
        <div className="grid grid-cols-3 gap-1">
          {(['week', 'month', 'all'] as Range[]).map((r) => (
            <button key={r} className={`btn !min-h-[36px] text-xs ${range === r ? 'btn-gold' : ''}`} onClick={() => setRange(r)}>
              {t(`parent.range_${r}`)}
            </button>
          ))}
        </div>
        <p className="text-xs text-mute">{t('parent.stats_help')}</p>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-mute">
            <tr>
              <th>{t('parent.col_category')}</th>
              <th>{t('parent.col_tasks')}</th>
              <th>{t('parent.col_success')}</th>
              <th>{t('parent.col_level')}</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((c) => {
              const list = items.filter((h) => h.category === c)
              const ok = list.filter((h) => h.correct).length
              return (
                <tr key={c} className="border-t border-line">
                  <td className="py-1">{t(`categories.${c}`)}</td>
                  <td>{list.length}</td>
                  <td>{list.length ? `${Math.round((ok / list.length) * 100)} %` : '—'}</td>
                  <td>{targetDifficulty(s.rating[c]).toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="text-xs text-mute">
          {t('parent.calibration', {
            over: items.filter((h) => h.confidence === 'high' && !h.correct).length,
            intuition: items.filter((h) => h.confidence === 'low' && h.correct).length,
            mentor: items.filter((h) => h.mentor).length,
          })}
        </p>
      </div>

      {/* erreurs */}
      <div className="card space-y-2">
        <h3 className="font-bold text-diamond">💬 {t('parent.discuss_title')}</h3>
        {errors.length === 0 && <p className="text-sm text-mute">{t('parent.no_errors')}</p>}
        {errors.map((h) => {
          const q = qMap.get(h.qid)
          return (
            <div key={h.at} className={`rounded-lg border-2 border-line p-2 text-sm ${h.discussed ? 'opacity-50' : ''}`}>
              <div className="text-xs text-mute">
                {h.date} · {t(`categories.${h.category}`)} · {h.qid}
              </div>
              <p className="font-semibold">{q?.prompt ?? h.qid}</p>
              <p className="text-danger">✘ {h.given || '—'}</p>
              {q && <p className="text-ok">✔ {describeCorrect(q)}</p>}
              {q && <p className="text-xs text-mute">💡 {q.explanation}</p>}
              <label className="mt-1 flex items-center gap-2 text-xs">
                <input type="checkbox" checked={!!h.discussed} onChange={(e) => markDiscussed(h.at, e.target.checked)} />
                {t('parent.discussed')}
              </label>
            </div>
          )
        })}
      </div>

      {/* réglages */}
      <div className="card space-y-2">
        <h3 className="font-bold text-diamond">⚙️ {t('parent.settings')}</h3>
        <label className="block text-sm">
          {t('parent.warmup_toggle')}{' '}
          <span className="text-mute">({mode.warmup ? t('parent.warmup_now_on') : t('parent.warmup_now_off')})</span>
          <select
            className="mt-1 w-full rounded-lg border-4 border-line bg-night p-2"
            value={s.parent.warmup}
            onChange={(e) =>
              update((d) => {
                d.parent.warmup = e.target.value as 'auto' | 'on' | 'off'
              })
            }
          >
            <option value="auto">{t('parent.warmup_auto')}</option>
            <option value="on">{t('parent.warmup_on')}</option>
            <option value="off">{t('parent.warmup_off')}</option>
          </select>
        </label>
        <label className="block text-sm">
          {t('parent.difficulty_offset')} : <b>{s.parent.offset > 0 ? `+${s.parent.offset}` : s.parent.offset}</b>
          <input
            type="range"
            min={-2}
            max={2}
            step={1}
            className="w-full"
            value={s.parent.offset}
            onChange={(e) =>
              update((d) => {
                d.parent.offset = Number(e.target.value)
              })
            }
          />
        </label>
        <label className="block text-sm">
          {t('parent.change_pin')}
          <div className="mt-1 flex gap-2">
            <input
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              placeholder="••••"
              className="w-24 rounded-lg border-4 border-line bg-night p-2 text-center"
            />
            <button
              className="btn !min-h-[40px]"
              disabled={newPin.length !== 4}
              onClick={() => {
                update((d) => {
                  d.parent.pin = newPin
                })
                setNewPin('')
              }}
            >
              {t('common.save')}
            </button>
          </div>
        </label>
      </div>

      {/* nouvelles tâches */}
      <div className="card space-y-2">
        <h3 className="font-bold text-diamond">📦 {t('parent.import_title')}</h3>
        <p className="text-sm text-mute">{t('parent.bank_size', { count: qMap.size, custom: s.customQuestions.length })}</p>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          {t('parent.import_questions')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void importPack(f)
          }}
        />
        {importMsg.map((m, i) => (
          <p key={i} className="text-xs">
            {m}
          </p>
        ))}
        <button className="btn btn-gold" onClick={copy}>
          {copied ? '✔ ' + t('common.copied') : '📋 ' + t('parent.generate_prompt')}
        </button>
        <textarea id="prompt-area" readOnly value={prompt} className="h-40 w-full rounded-lg border-4 border-line bg-night p-2 text-xs" />
      </div>
    </div>
  )
}
