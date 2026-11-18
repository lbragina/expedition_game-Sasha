import { useEffect, useState } from 'react'
import { getMode, levelOf } from '../game/progress'
import { ROOM2_LEVEL, ROOMS, markCelebrated, pendingCelebrations, roomOpen, saveBlock, saveDeck, saveSkin, type Room } from '../game/workshop'
import { deckOf, skinOf } from '../game/pixel'
import { sfx } from '../game/sound'
import { useGame } from '../game/store'
import { t } from '../i18n'
import PixelEditor from './PixelEditor'
import { ArtImg } from './Sprites'

const ICON: Record<Room, string> = { 1: '🧑‍🎨', 2: '🛹', 3: '🧱' }

/** Atelier ??? : les 3 salles (verrouillées ou ouvertes) + écran de fête à chaque ouverture. */
export default function Workshop() {
  const s = useGame()
  const [editing, setEditing] = useState<Room | null>(null)
  const pending = pendingCelebrations(s)
  const anyOpen = ROOMS.some((r) => roomOpen(s, r))
  const mode = getMode(s)

  return (
    <div className="card space-y-2">
      <h3 className="font-bold">
        {anyOpen ? '🔧 ' + t('workshop.title') : '🔒 ' + t('base.workshop_locked')}
      </h3>
      {!anyOpen && <p className="text-sm text-mute">{t('base.workshop_hint')}</p>}

      <div className="space-y-2">
        {ROOMS.map((room) => {
          const open = roomOpen(s, room)
          return (
            <div key={room} className={`rounded-lg border-2 p-2 ${open ? 'border-gold/70 bg-panel2' : 'border-line bg-night opacity-80'}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border-2 border-black bg-panel text-2xl">
                  {open ? (
                    room === 1 ? (
                      <ArtImg art={skinOf(s.workshop.skin)} kind="skin" style={{ width: 40, height: 40 }} />
                    ) : room === 2 ? (
                      <ArtImg art={deckOf(s.workshop.deck)} kind="deck" style={{ width: 44, height: 16 }} />
                    ) : s.workshop.block ? (
                      <ArtImg art={s.workshop.block} kind="block" style={{ width: 40, height: 40 }} />
                    ) : (
                      ICON[room]
                    )
                  ) : (
                    '🔒'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">
                    {t('workshop.room', { n: room })} · {t(`workshop.room${room}_name`)}
                  </div>
                  <div className="text-xs text-mute">{open ? t(`workshop.room${room}_desc`) : t(`workshop.room${room}_unlock`)}</div>
                </div>
                {open && (
                  <button className="btn btn-gold !min-h-[40px] !w-auto px-3 text-sm" onClick={() => setEditing(room)}>
                    {t('workshop.enter')}
                  </button>
                )}
              </div>
              {!open && room === 1 && (
                <div className="mt-2 h-2.5 overflow-hidden rounded border-2 border-black bg-night">
                  <div className="h-full bg-gold" style={{ width: `${Math.min(100, (s.expeditionsDone / 10) * 100)}%` }} />
                </div>
              )}
              {!open && room === 2 && (
                <div className="mt-2 h-2.5 overflow-hidden rounded border-2 border-black bg-night">
                  <div className="h-full bg-gold" style={{ width: `${Math.min(100, ((levelOf(s.xp) + 1) / ROOM2_LEVEL) * 100)}%` }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {mode.warmup && !s.workshop.parentUnlock && <p className="text-xs text-mute">{t('workshop.warmup_note')}</p>}

      {pending.length > 0 && editing === null && (
        <Celebration
          room={pending[0]}
          onClose={() => markCelebrated(pending[0])}
          onEnter={() => {
            markCelebrated(pending[0])
            setEditing(pending[0])
          }}
        />
      )}

      {editing === 1 && (
        <PixelEditor
          kind="skin"
          title={'🧑‍🎨 ' + t('workshop.room1_name')}
          hint={t('workshop.room1_hint')}
          initial={skinOf(s.workshop.skin)}
          requirePixels
          onSave={(art) => {
            saveSkin(art)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {editing === 2 && (
        <PixelEditor
          kind="deck"
          title={'🛹 ' + t('workshop.room2_name')}
          hint={t('workshop.room2_hint')}
          initial={deckOf(s.workshop.deck)}
          requirePixels
          onSave={(art) => {
            saveDeck(art)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {editing === 3 && <BlockRoom onClose={() => setEditing(null)} />}
    </div>
  )
}

function BlockRoom({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const [name, setName] = useState(s.workshop.blockName)
  return (
    <PixelEditor
      kind="block"
      title={'🧱 ' + t('workshop.room3_name')}
      hint={t('workshop.room3_hint')}
      initial={s.workshop.block}
      requirePixels
      extra={
        <label className="block text-sm">
          {t('workshop.block_name')}
          <input
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('workshop.block_name_placeholder')}
            className="mt-1 w-full rounded-lg border-4 border-line bg-night p-2"
          />
        </label>
      }
      onSave={(art) => {
        saveBlock(art, name)
        onClose()
      }}
      onClose={onClose}
    />
  )
}

/** Écran de fête : confettis pixel + fanfare à l'ouverture d'une salle. */
function Celebration({ room, onClose, onEnter }: { room: Room; onClose: () => void; onEnter: () => void }) {
  useEffect(() => {
    sfx.levelUp()
    const id = setTimeout(() => sfx.star(), 700)
    return () => clearTimeout(id)
  }, [room])

  const COLORS = ['#f5c518', '#4de2e0', '#ef5350', '#66d17a', '#ff80ab', '#2979ff']
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black/85 p-4" role="dialog" aria-modal="true">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 block"
          style={{
            left: `${(i * 29) % 100}%`,
            width: 8 + (i % 3) * 3,
            height: 8 + (i % 3) * 3,
            background: COLORS[i % COLORS.length],
            animationDelay: `${(i % 9) * 0.25}s`,
            animationDuration: `${2.6 + (i % 5) * 0.5}s`,
          }}
        />
      ))}
      <div className="relative w-full max-w-sm animate-trick space-y-3 rounded-lg border-4 border-gold bg-panel p-5 text-center shadow-pixel">
        <div className="text-6xl">{ICON[room]}</div>
        <h2 className="font-pixel text-2xl font-bold leading-snug text-gold">{t('workshop.celebrate_title')}</h2>
        <p className="font-bold text-diamond">
          {t('workshop.room', { n: room })} · {t(`workshop.room${room}_name`)}
        </p>
        <p className="text-sm">{t(`workshop.room${room}_celebrate`)}</p>
        <button className="btn btn-primary text-lg" onClick={onEnter}>
          {t('workshop.celebrate_enter')}
        </button>
        <button className="btn" onClick={onClose}>
          {t('common.later')}
        </button>
      </div>
    </div>
  )
}
