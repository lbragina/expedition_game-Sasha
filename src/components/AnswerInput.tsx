import { t } from '../i18n'
import type { Draft, Question } from '../types'

interface Props {
  q: Question
  draft: Draft
  onChange: (d: Draft) => void
  /** après validation : affiche juste/faux */
  reveal: boolean
}

const LETTERS = ['A', 'B', 'C', 'D']

export default function AnswerInput({ q, draft, onChange, reveal }: Props) {
  const opts = q.options ?? []

  if (draft.type === 'number') {
    return (
      <input
        autoFocus={false}
        disabled={reveal}
        value={draft.text}
        onChange={(e) => onChange({ type: 'number', text: e.target.value })}
        inputMode="decimal"
        enterKeyHint="done"
        placeholder={t('expedition.input_placeholder')}
        className="w-full rounded-lg border-4 border-line bg-night px-4 py-3 text-center font-pixel text-3xl font-bold text-gold outline-none focus:border-diamond"
      />
    )
  }

  if (draft.type === 'choice') {
    return (
      <div className="space-y-2">
        {opts.map((o, i) => {
          const cls = reveal
            ? i === q.answer
              ? 'opt-right'
              : draft.index === i
                ? 'opt-wrong'
                : ''
            : draft.index === i
              ? 'opt-selected'
              : ''
          return (
            <button key={i} disabled={reveal} className={`opt ${cls}`} onClick={() => onChange({ type: 'choice', index: i })}>
              <span className="chip">{LETTERS[i]}</span>
              <span>{o}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (draft.type === 'boolean_explain') {
    const a = q.answer as { value: boolean; reason: number }
    const valueCls = (v: boolean) =>
      reveal ? (v === a.value ? 'opt-right' : draft.value === v ? 'opt-wrong' : '') : draft.value === v ? 'opt-selected' : ''
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              disabled={reveal}
              className={`opt justify-center font-bold ${valueCls(v)}`}
              onClick={() => onChange({ ...draft, value: v })}
            >
              {v ? '✔ ' + t('answer.true') : '✘ ' + t('answer.false')}
            </button>
          ))}
        </div>
        {draft.value !== null && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-mute">{t('answer.why')}</p>
            {opts.map((o, i) => {
              const cls = reveal
                ? i === a.reason
                  ? 'opt-right'
                  : draft.reason === i
                    ? 'opt-wrong'
                    : ''
                : draft.reason === i
                  ? 'opt-selected'
                  : ''
              return (
                <button key={i} disabled={reveal} className={`opt text-sm ${cls}`} onClick={() => onChange({ ...draft, reason: i })}>
                  <span className="chip">{LETTERS[i] ?? i + 1}</span>
                  <span>{o}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (draft.type === 'order') {
    const move = (pos: number, dir: -1 | 1) => {
      const target = pos + dir
      if (target < 0 || target >= draft.perm.length) return
      const perm = [...draft.perm]
      ;[perm[pos], perm[target]] = [perm[target], perm[pos]]
      onChange({ type: 'order', perm })
    }
    return (
      <div className="space-y-2">
        <p className="text-sm text-mute">{t('answer.order_help')}</p>
        {draft.perm.map((orig, pos) => {
          const cls = reveal ? (orig === pos ? 'opt-right' : 'opt-wrong') : ''
          return (
            <div key={orig} className={`opt text-sm ${cls}`}>
              <span className="chip">{pos + 1}</span>
              <span className="flex-1">{opts[orig]}</span>
              {!reveal && (
                <span className="flex flex-col gap-1">
                  <button aria-label="up" className="chip px-3 py-1 disabled:opacity-30" disabled={pos === 0} onClick={() => move(pos, -1)}>
                    ▲
                  </button>
                  <button
                    aria-label="down"
                    className="chip px-3 py-1 disabled:opacity-30"
                    disabled={pos === draft.perm.length - 1}
                    onClick={() => move(pos, 1)}
                  >
                    ▼
                  </button>
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // highlight
  return (
    <div>
      <p className="mb-2 text-sm text-mute">{t('answer.highlight_help')}</p>
      <p className="rounded-lg border-4 border-line bg-panel2 p-3 leading-8">
        {opts.map((o, i) => {
          const cls = reveal
            ? i === q.answer
              ? 'bg-ok/40 ring-2 ring-ok'
              : draft.index === i
                ? 'bg-danger/40 ring-2 ring-danger'
                : ''
            : draft.index === i
              ? 'bg-gold/50 ring-2 ring-gold'
              : 'active:bg-gold/20'
          return (
            <span key={i}>
              <button disabled={reveal} className={`rounded px-1 text-left ${cls}`} onClick={() => onChange({ type: 'highlight', index: i })}>
                {o}
              </button>{' '}
            </span>
          )
        })}
      </p>
    </div>
  )
}
