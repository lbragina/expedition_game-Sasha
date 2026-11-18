import { levelProgress, rankName } from '../game/progress'
import { sfx } from '../game/sound'
import { update, useGame } from '../game/store'
import { t } from '../i18n'

export default function Hud({ onHelp }: { onHelp: () => void }) {
  const s = useGame()
  const lp = levelProgress(s.xp)
  return (
    <header className="safe-top border-b-4 border-line bg-panel px-3 pb-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-pixel text-sm font-bold text-gold">
            {t('hud.level', { n: lp.level + 1 })} · {rankName(lp.level)}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          {s.streak.count > 0 && <span className="chip">🔥 {s.streak.count}</span>}
          <span className="chip text-diamond">🧭 {s.compass}</span>
          <button aria-label={t('welcome.help_button')} className="chip px-2.5 font-pixel text-gold" onClick={onHelp}>
            ?
          </button>
          <button
            aria-label={s.settings.sound ? t('common.sound_on') : t('common.sound_off')}
            className="chip"
            onClick={() => {
              sfx.unlock()
              update((d) => {
                d.settings.sound = !d.settings.sound
              })
            }}
          >
            {s.settings.sound ? '🔊' : '🔇'}
          </button>
        </div>
      </div>
      <div className="mt-1.5 h-3 overflow-hidden rounded border-2 border-black bg-night">
        <div className="h-full bg-grass transition-all" style={{ width: `${lp.pct}%` }} />
      </div>
      <div className="mt-0.5 text-right text-[10px] text-mute">
        {lp.next === null ? t('hud.max_level') : t('hud.xp_next', { xp: s.xp, next: lp.next })}
      </div>
    </header>
  )
}
