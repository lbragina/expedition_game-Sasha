import { useEffect, useState } from 'react'
import BackupModal from './components/BackupModal'
import BaseTab from './components/BaseTab'
import ExpeditionTab from './components/ExpeditionTab'
import Hud from './components/Hud'
import MapTab from './components/MapTab'
import ParentTab from './components/ParentTab'
import { setSoundEnabled, sfx } from './game/sound'
import { useGame } from './game/store'
import { t } from './i18n'

type Tab = 'expedition' | 'map' | 'base' | 'parent'
const TABS: { id: Tab; icon: string }[] = [
  { id: 'expedition', icon: '🧭' },
  { id: 'map', icon: '🗺️' },
  { id: 'base', icon: '🏝️' },
  { id: 'parent', icon: '🔒' },
]

export default function App() {
  const state = useGame()
  const [tab, setTab] = useState<Tab>('expedition')
  const [backupOpen, setBackupOpen] = useState(false)

  useEffect(() => setSoundEnabled(state.settings.sound), [state.settings.sound])

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-night">
      <Hud />
      <main className="flex-1 overflow-y-auto px-3 pb-4">
        {tab === 'expedition' && <ExpeditionTab onBackup={() => setBackupOpen(true)} />}
        {tab === 'map' && <MapTab />}
        {tab === 'base' && <BaseTab onBackup={() => setBackupOpen(true)} />}
        {tab === 'parent' && <ParentTab onLeave={() => setTab('expedition')} />}
      </main>
      <nav className="safe-bottom grid grid-cols-4 gap-1 border-t-4 border-line bg-panel px-2 pt-1">
        {TABS.map((x) => (
          <button
            key={x.id}
            onClick={() => {
              sfx.unlock()
              sfx.click()
              setTab(x.id)
            }}
            className={`flex flex-col items-center rounded-lg py-1 text-[11px] font-bold ${
              tab === x.id ? 'bg-panel2 text-gold' : 'text-mute'
            }`}
          >
            <span className="text-xl leading-6">{x.icon}</span>
            {t(`nav.${x.id}`)}
          </button>
        ))}
      </nav>
      {backupOpen && <BackupModal onClose={() => setBackupOpen(false)} />}
    </div>
  )
}
