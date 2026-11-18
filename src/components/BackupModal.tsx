import { useState } from 'react'
import { t } from '../i18n'
import { markPrompted, saveBackup } from '../utils/backup'

export default function BackupModal({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState<string | null>(null)

  const go = async () => {
    const r = await saveBackup()
    if (r !== 'cancelled') setDone(t(r === 'shared' ? 'backup.thanks_shared' : 'backup.thanks_downloaded'))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <div className="card safe-bottom w-full max-w-md animate-slideup space-y-3">
        <h2 className="font-pixel text-lg font-bold text-gold">🛡️ {t('backup.title')}</h2>
        <p>{t('backup.desc')}</p>
        {done ? (
          <>
            <p className="font-bold text-ok">{done}</p>
            <button className="btn btn-primary" onClick={onClose}>
              {t('common.ok')}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-gold" onClick={go}>
              {t('backup.button')}
            </button>
            <button
              className="btn"
              onClick={() => {
                markPrompted()
                onClose()
              }}
            >
              {t('common.later')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
