import { useState } from 'react'
import { answerObservatory, observatoryAvailable, todaysAstroQuestion } from '../game/base'
import { sfx } from '../game/sound'
import { useGame } from '../game/store'
import { t } from '../i18n'

/** Mini-question d'astronomie : une tentative par jour, 1 diamant si c'est juste. */
export default function Observatory({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const q = todaysAstroQuestion()
  const [picked, setPicked] = useState<number | null>(null)
  const available = picked !== null || observatoryAvailable(s)

  const pick = (i: number) => {
    if (!q || picked !== null) return
    const ok = i === q.answer
    sfx.unlock()
    ok ? sfx.correct() : sfx.wrong()
    if (ok) setTimeout(() => sfx.star(), 250)
    setPicked(i)
    answerObservatory(ok)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3" role="dialog" aria-modal="true">
      <div className="flex max-h-full w-full max-w-md flex-col rounded-lg border-4 border-diamond bg-panel shadow-pixel">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          <h3 className="font-pixel text-lg font-bold text-diamond">🔭 {t('observatory.title')}</h3>
          {!q && <p className="text-sm text-mute">{t('observatory.none')}</p>}
          {q && !available && <p className="text-sm">{t('observatory.done_today')}</p>}
          {q && available && (
            <>
              <p className="text-sm text-mute">{t('observatory.intro')}</p>
              <p className="font-semibold">{q.q}</p>
              <div className="space-y-2">
                {q.options.map((o, i) => {
                  const cls =
                    picked === null ? '' : i === q.answer ? 'opt-right' : i === picked ? 'opt-wrong' : 'opacity-60'
                  return (
                    <button key={i} className={`opt ${cls}`} disabled={picked !== null} onClick={() => pick(i)}>
                      {o}
                    </button>
                  )
                })}
              </div>
              {picked !== null && (
                <div className={`rounded-lg border-2 p-2 text-sm ${picked === q.answer ? 'border-ok' : 'border-danger'}`}>
                  <p className="font-bold">
                    {picked === q.answer ? '✔ ' + t('observatory.correct') : '✘ ' + t('observatory.wrong')}
                  </p>
                  <p className="text-mute">💡 {q.explanation}</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-3 pt-0">
          <button className="btn" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
