import { useEffect, useState } from 'react'
import BackupModal from './components/BackupModal'
import BaseTab from './components/BaseTab'
import ExpeditionTab from './components/ExpeditionTab'
import Hud from './components/Hud'
import MapTab from './components/MapTab'
import ParentTab from './components/ParentTab'
import SeasonTab from './components/SeasonTab'
import { setSoundEnabled, sfx } from './game/sound'
import { getState, useGame } from './game/store'
import { countriesLeft, packNeeded } from './game/countries'
import { claimableTiers } from './game/seasonData'
import { pendingCelebrations } from './game/workshop'
import WelcomeModal, { shouldShowWelcome } from './components/WelcomeModal'
import { t } from './i18n'

type Tab = 'expedition' | 'map' | 'base' | 'pass' | 'parent'
const TABS: { id: Tab; icon: string }[] = [
  { id: 'expedition', icon: '🧭' },
  { id: 'map', icon: '🗺️' },
  { id: 'base', icon: '🏝️' },
  { id: 'pass', icon: '🏅' },
  { id: 'parent', icon: '🔒' },
]

export default function App() {
  const state = useGame()
  const [tab, setTab] = useState<Tab>('expedition')
  const [backupOpen, setBackupOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(() => shouldShowWelcome(getState().expeditionsDone))

  useEffect(() => setSoundEnabled(state.settings.sound), [state.settings.sound])

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-night">
      <Hud onHelp={() => setWelcomeOpen(true)} />
      <main className="flex-1 overflow-y-auto px-3 pb-4">
        {tab === 'expedition' && <ExpeditionTab onBackup={() => setBackupOpen(true)} />}
        {tab === 'map' && <MapTab />}
        {tab === 'base' && <BaseTab onBackup={() => setBackupOpen(true)} />}
        {tab === 'pass' && <SeasonTab />}
        {tab === 'parent' && <ParentTab onLeave={() => setTab('expedition')} />}
      </main>
      <nav className="safe-bottom grid grid-cols-5 gap-1 border-t-4 border-line bg-panel px-2 pt-1">
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
            <span className="relative text-xl leading-6">
              {x.icon}
              {x.id === 'map' && tab !== 'map' && packNeeded(state) && (
                <span className="absolute -right-2 -top-1 min-w-[16px] rounded-full border border-black bg-gold px-1 text-center text-[10px] font-bold leading-4 text-black">
                  {countriesLeft(state)}
                </span>
              )}
              {x.id === 'pass' && tab !== 'pass' && claimableTiers(state).length > 0 && (
                <span className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-black bg-gold" />
              )}
              {x.id === 'base' && tab !== 'base' && pendingCelebrations(state).length > 0 && (
                <span className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-black bg-danger" />
              )}
            </span>
            {t(`nav.${x.id}`)}
          </button>
        ))}
      </nav>
      {backupOpen && <BackupModal onClose={() => setBackupOpen(false)} />}
      {welcomeOpen && <WelcomeModal onClose={() => setWelcomeOpen(false)} />}
    </div>
  )
}
