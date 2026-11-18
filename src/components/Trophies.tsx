import { trophyList } from '../game/base'
import { useGame } from '../game/store'
import { t } from '../i18n'

const STARS = ['', '★', '★★', '★★★']
const CUP = ['', '🥉', '🥈', '🏆']

/** Vitrine : un trophée par tâche étoilée résolue. */
export function TrophyList() {
  const s = useGame()
  const list = trophyList(s)
  if (list.length === 0) return <p className="text-sm text-mute">{t('base.hall_empty')}</p>
  return (
    <div className="grid grid-cols-3 gap-2">
      {list.map((x) => (
        <div key={x.qid} className="rounded-lg border-2 border-gold/60 bg-panel2 p-2 text-center">
          <div className="text-3xl">{CUP[x.stars]}</div>
          <div className="font-bold text-gold">{STARS[x.stars]}</div>
          <div className="text-[10px] leading-tight text-mute">{t(`categories.${x.category}`)}</div>
          <div className="text-[10px] text-mute">{x.date}</div>
        </div>
      ))}
    </div>
  )
}

export function HallModal({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const count = Object.keys(s.base.trophies).length
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3" role="dialog" aria-modal="true">
      <div className="flex max-h-full w-full max-w-md flex-col rounded-lg border-4 border-gold bg-panel shadow-pixel">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          <h3 className="font-pixel text-lg font-bold text-gold">🏆 {t('base.hall_of_fame')}</h3>
          <p className="text-sm text-mute">{t('base.hall_count', { count })}</p>
          <TrophyList />
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
