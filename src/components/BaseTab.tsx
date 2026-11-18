import { useRef, useState } from 'react'
import { getMode } from '../game/progress'
import { useGame } from '../game/store'
import { t } from '../i18n'
import { RESOURCE_KEYS } from '../types'
import { importBackup } from '../utils/backup'

const ICON: Record<string, string> = { wood: '🪵', stone: '🪨', iron: '⛓️', gold: '🥇', diamond: '💎' }

export default function BaseTab({ onBackup }: { onBackup: () => void }) {
  const s = useGame()
  const mode = getMode(s)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <div className="space-y-3 pt-3">
      <h2 className="font-pixel text-xl font-bold text-gold">🏝️ {t('nav.base')}</h2>

      <div className="card space-y-2">
        <h3 className="font-bold text-diamond">🎒 {t('base.inventory')}</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          {RESOURCE_KEYS.map((k) => (
            <div key={k} className="rounded-lg border-2 border-black bg-panel2 py-2">
              <div className="text-2xl">{ICON[k]}</div>
              <div className="text-lg font-bold">{s.resources[k]}</div>
              <div className="text-[10px] text-mute">{t(`resources.${k}`)}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 text-sm font-bold">
          <span>🧭 {t('resources.compass')} : {s.compass}</span>
          <span>⭐ {t('resources.xp')} : {s.xp}</span>
        </div>
      </div>

      <div className="card space-y-2 opacity-90">
        <h3 className="font-bold">🔒 {t('base.workshop_locked')}</h3>
        <p className="text-sm text-mute">{t('base.workshop_hint')}</p>
        {mode.warmup && (
          <div className="h-3 overflow-hidden rounded border-2 border-black bg-night">
            <div className="h-full bg-gold" style={{ width: `${Math.min(100, (s.daysPlayed.length / 7) * 100)}%` }} />
          </div>
        )}
      </div>

      <div className="card space-y-1">
        <h3 className="font-bold text-gold">🏆 {t('base.hall_of_fame')}</h3>
        <p className="text-sm text-mute">{t('base.hall_empty')}</p>
      </div>

      <div className="card space-y-2">
        <h3 className="font-bold text-diamond">🛡️ {t('backup.title')}</h3>
        <p className="text-sm">{t('backup.desc')}</p>
        <button className="btn btn-gold" onClick={onBackup}>
          {t('backup.button')}
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          {t('backup.import')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            if (!window.confirm(t('backup.import_confirm'))) return
            setMsg((await importBackup(f)) ? t('backup.import_ok') : t('backup.import_fail'))
          }}
        />
        {msg && <p className="text-sm font-bold text-gold">{msg}</p>}
      </div>
    </div>
  )
}
