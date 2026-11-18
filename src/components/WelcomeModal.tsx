import { sfx } from '../game/sound'
import { t } from '../i18n'

const FLAG = 'hasSeenWelcome'

/** Premier lancement : aucune expédition terminée et pas de drapeau hasSeenWelcome. */
export function shouldShowWelcome(expeditionsDone: number): boolean {
  if (expeditionsDone > 0) return false
  try {
    return localStorage.getItem(FLAG) !== 'true'
  } catch {
    return true
  }
}

export function markWelcomeSeen() {
  try {
    localStorage.setItem(FLAG, 'true')
  } catch {
    /* stockage bloqué : on réaffichera la fenêtre au prochain lancement */
  }
}

const RULES = [
  { icon: '🛹', key: 'rule_combo' },
  { icon: '⭐', key: 'rule_star' },
  { icon: '🔒', key: 'rule_workshop' },
] as const

export default function WelcomeModal({ onClose }: { onClose: () => void }) {
  const start = () => {
    sfx.unlock()
    sfx.click()
    markWelcomeSeen()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3" role="dialog" aria-modal="true">
      <div className="flex max-h-full w-full max-w-md animate-trick flex-col rounded-lg border-4 border-gold bg-panel shadow-pixel">
        {/* liseré intérieur façon cadre pixel */}
        <div className="m-1 flex min-h-0 flex-1 flex-col rounded border-4 border-black bg-panel">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <h2 className="text-center font-pixel text-xl font-bold leading-snug text-gold">🧭 {t('welcome.title')}</h2>
            <p>{t('welcome.mission')}</p>
            <p className="font-bold text-diamond">{t('welcome.rules_title')}</p>
            <ul className="space-y-2">
              {RULES.map((r) => (
                <li key={r.key} className="flex gap-2 rounded-lg border-2 border-black bg-panel2 p-2 text-sm">
                  <span className="text-xl leading-6">{r.icon}</span>
                  <span>
                    <b className="text-gold">{t(`welcome.${r.key}_title`)}</b> : {t(`welcome.${r.key}`)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="rounded-lg border-2 border-gold/60 bg-night p-3 text-center text-sm italic text-gold">
              {t('welcome.signature')}
            </p>
          </div>
          <div className="p-3 pt-0">
            <button className="btn btn-primary text-lg" onClick={start}>
              {t('welcome.start')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
