import { useState } from 'react'
import { useGame } from '../game/store'
import { t } from '../i18n'

/** Clavier PIN réutilisé pour le mentor et pour l'Espace Parent. */
export default function PinModal({
  prompt,
  onSuccess,
  onCancel,
}: {
  prompt: string
  onSuccess: () => void
  onCancel?: () => void
}) {
  const pin = useGame().parent.pin
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const press = (d: string) => {
    if (value.length >= 4) return
    const next = value + d
    setValue(next)
    setError(false)
    if (next.length === 4) {
      if (next === pin) onSuccess()
      else {
        setError(true)
        setTimeout(() => setValue(''), 350)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center">
      <div className="card safe-bottom w-full max-w-md animate-slideup space-y-3">
        <p className="text-center font-bold">{prompt}</p>
        <div className={`flex justify-center gap-3 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-5 w-5 rounded border-2 border-black ${i < value.length ? (error ? 'bg-danger' : 'bg-gold') : 'bg-night'}`}
            />
          ))}
        </div>
        {error && <p className="text-center text-sm text-danger">{t('pin.wrong')}</p>}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} className="btn" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button className="btn" onClick={() => setValue((v) => v.slice(0, -1))}>
            ⌫
          </button>
          <button className="btn" onClick={() => press('0')}>
            0
          </button>
          {onCancel ? (
            <button className="btn" onClick={onCancel}>
              {t('common.cancel')}
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  )
}
